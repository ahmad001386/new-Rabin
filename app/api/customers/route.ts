import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';
import { hasPermission } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET /api/customers - Get all customers
export async function GET(req: NextRequest) {
  try {
    const userRole = req.headers.get('x-user-role');
    const userId = req.headers.get('x-user-id');

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const segment = searchParams.get('segment') || '';

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      whereClause += ' AND c.status = ?';
      params.push(status);
    }

    if (segment) {
      whereClause += ' AND c.segment = ?';
      params.push(segment);
    }

    // If not CEO, only show assigned customers
    if (!hasPermission(userRole || '', ['ceo', 'مدیر'])) {
      whereClause += ' AND c.assigned_to = ?';
      params.push(userId);
    }

    const customers = await executeQuery(`
      SELECT 
        c.*,
        u.name as assigned_user_name,
        COUNT(DISTINCT d.id) as total_deals,
        COUNT(DISTINCT t.id) as total_tickets,
        SUM(CASE WHEN ps.code = 'closed_won' THEN d.total_value ELSE 0 END) as won_value
      FROM customers c
      LEFT JOIN users u ON c.assigned_to = u.id
      LEFT JOIN deals d ON c.id = d.customer_id
      LEFT JOIN tickets t ON c.id = t.customer_id
      LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // Get total count
    const [countResult] = await executeQuery(`
      SELECT COUNT(DISTINCT c.id) as total
      FROM customers c
      ${whereClause}
    `, params);

    return NextResponse.json({
      success: true,
      customers: customers,
      data: customers,
      pagination: {
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Get customers API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت مشتریان' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create new customer
export async function POST(req: NextRequest) {
  try {
    const userRole = req.headers.get('x-user-role');
    const currentUserId = req.headers.get('x-user-id');

    const body = await req.json();
    const {
      name, email, phone, website, address, city, state, country,
      industry, company_size, annual_revenue, segment, priority, assigned_to
    } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'نام مشتری الزامی است' },
        { status: 400 }
      );
    }

    const customerId = uuidv4();

    // Simple insert with essential fields only
    await executeSingle(`
      INSERT INTO customers (
        id, name, email, phone, website, address, city, state, country,
        industry, company_size, annual_revenue, segment, priority, assigned_to,
        status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      customerId,
      name,
      email || null,
      phone || null,
      website || null,
      address || null,
      city || null,
      state || null,
      country || 'Iran',
      industry || null,
      company_size || null,
      annual_revenue || null,
      segment || 'small_business',
      priority || 'medium',
      assigned_to || currentUserId,
      'prospect'
    ]);

    const [newCustomer] = await executeQuery(`
      SELECT c.*, u.name as assigned_user_name
      FROM customers c
      LEFT JOIN users u ON c.assigned_to = u.id
      WHERE c.id = ?
    `, [customerId]);

    return NextResponse.json({
      success: true,
      message: 'مشتری با موفقیت ایجاد شد',
      data: newCustomer
    });
  } catch (error) {
    console.error('Create customer API error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      code: (error as any)?.code
    });
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد مشتری', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}