import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';

// GET /api/feedback - Get all feedback
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type') || '';
    const customer_id = searchParams.get('customer_id') || '';

    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (type) {
      whereClause += ' AND f.type = ?';
      params.push(type);
    }

    if (customer_id) {
      whereClause += ' AND f.customer_id = ?';
      params.push(customer_id);
    }

    const feedback = await executeQuery(`
      SELECT 
        f.*,
        c.name as customer_name
      FROM feedback f
      LEFT JOIN customers c ON f.customer_id = c.id
      ${whereClause}
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    return NextResponse.json({ success: true, data: feedback });
  } catch (error) {
    console.error('Get feedback API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت بازخوردها' },
      { status: 500 }
    );
  }
}

// POST /api/feedback - Create new feedback
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customer_id, type, title, comment, score,
      product, channel, category, priority
    } = body;

    if (!customer_id || !type || !comment) {
      return NextResponse.json(
        { success: false, message: 'اطلاعات بازخورد کامل نیست' },
        { status: 400 }
      );
    }

    const feedbackId = uuidv4();

    await executeSingle(`
      INSERT INTO feedback (
        id, customer_id, type, title, comment, score,
        product, channel, category, priority, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    `, [feedbackId, customer_id, type, title, comment, score,
        product, channel || 'website', category, priority || 'medium']);

    return NextResponse.json({
      success: true,
      message: 'بازخورد با موفقیت ایجاد شد'
    });
  } catch (error) {
    console.error('Create feedback API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد بازخورد' },
      { status: 500 }
    );
  }
}