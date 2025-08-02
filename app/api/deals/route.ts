import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';
import { hasPermission } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET /api/deals - Get all deals
export async function GET(req: NextRequest) {
  try {
    const userRole = req.headers.get('x-user-role');
    const userId = req.headers.get('x-user-id');

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const stage = searchParams.get('stage') || '';
    const customer_id = searchParams.get('customer_id') || '';

    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (stage) {
      whereClause += ' AND ps.code = ?';
      params.push(stage);
    }

    if (customer_id) {
      whereClause += ' AND d.customer_id = ?';
      params.push(customer_id);
    }

    // If not CEO, only show assigned deals
    if (!hasPermission(userRole || '', ['ceo', 'مدیر'])) {
      whereClause += ' AND d.assigned_to = ?';
      params.push(userId);
    }

    const deals = await executeQuery(`
      SELECT 
        d.*,
        c.name as customer_name,
        c.segment as customer_segment,
        u.name as assigned_user_name,
        ps.name as stage_name,
        ps.code as stage_code,
        ps.stage_order,
        DATEDIFF(NOW(), d.created_at) as days_in_pipeline
      FROM deals d
      LEFT JOIN customers c ON d.customer_id = c.id
      LEFT JOIN users u ON d.assigned_to = u.id
      LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // Get total count
    const [countResult] = await executeQuery(`
      SELECT COUNT(d.id) as total
      FROM deals d
      LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
      ${whereClause}
    `, params);

    return NextResponse.json({
      success: true,
      deals: deals,
      pagination: {
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Get deals API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت معاملات' },
      { status: 500 }
    );
  }
}

// POST /api/deals - Create new deal
export async function POST(req: NextRequest) {
  try {
    const currentUserId = req.headers.get('x-user-id');

    const body = await req.json();
    const {
      customer_id, title, description, total_value, currency,
      probability, expected_close_date, assigned_to, products
    } = body;

    if (!customer_id || !title || !total_value) {
      return NextResponse.json(
        { success: false, message: 'اطلاعات معامله کامل نیست' },
        { status: 400 }
      );
    }

    // Get default stage (first stage)
    const [defaultStage] = await executeQuery(
      'SELECT id FROM pipeline_stages ORDER BY stage_order LIMIT 1'
    );

    const dealId = uuidv4();

    await executeSingle(`
      INSERT INTO deals (
        id, customer_id, title, description, total_value, currency,
        stage_id, probability, expected_close_date, assigned_to, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      dealId, customer_id, title, description, total_value, currency || 'IRR',
      defaultStage.id, probability || 50, expected_close_date,
      assigned_to || currentUserId
    ]);

    // Add products if provided
    if (products && Array.isArray(products)) {
      for (const product of products) {
        await executeSingle(`
          INSERT INTO deal_products (
            id, deal_id, product_id, quantity, unit_price, discount_percentage, total_price
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          uuidv4(), dealId, product.product_id, product.quantity,
          product.unit_price, product.discount_percentage || 0, product.total_price
        ]);
      }
    }

    // Create initial stage history
    await executeSingle(`
      INSERT INTO deal_stage_history (id, deal_id, stage_id, entered_at, changed_by)
      VALUES (?, ?, ?, NOW(), ?)
    `, [uuidv4(), dealId, defaultStage.id, currentUserId]);

    const [newDeal] = await executeQuery(`
      SELECT 
        d.*,
        c.name as customer_name,
        u.name as assigned_user_name,
        ps.name as stage_name
      FROM deals d
      LEFT JOIN customers c ON d.customer_id = c.id
      LEFT JOIN users u ON d.assigned_to = u.id
      LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
      WHERE d.id = ?
    `, [dealId]);

    return NextResponse.json({
      success: true,
      message: 'معامله با موفقیت ایجاد شد',
      data: newDeal
    });
  } catch (error) {
    console.error('Create deal API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد معامله' },
      { status: 500 }
    );
  }
}