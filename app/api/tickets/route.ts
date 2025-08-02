import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';
import { hasPermission } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET /api/tickets - Get all tickets
export async function GET(req: NextRequest) {
  try {
    const userRole = req.headers.get('x-user-role');
    const userId = req.headers.get('x-user-id');

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const customer_id = searchParams.get('customer_id') || '';

    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (status) {
      whereClause += ' AND t.status = ?';
      params.push(status);
    }

    if (priority) {
      whereClause += ' AND t.priority = ?';
      params.push(priority);
    }

    if (customer_id) {
      whereClause += ' AND t.customer_id = ?';
      params.push(customer_id);
    }

    // If not CEO, only show assigned tickets
    if (!hasPermission(userRole || '', ['ceo', 'مدیر'])) {
      whereClause += ' AND t.assigned_to = ?';
      params.push(userId);
    }

    const tickets = await executeQuery(`
      SELECT 
        t.*,
        c.name as customer_name,
        u.name as assigned_user_name,
        cb.name as created_by_name
      FROM tickets t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users cb ON t.created_by = cb.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    return NextResponse.json({ success: true, data: tickets });
  } catch (error) {
    console.error('Get tickets API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تیکت‌ها' },
      { status: 500 }
    );
  }
}

// POST /api/tickets - Create new ticket
export async function POST(req: NextRequest) {
  try {
    const currentUserId = req.headers.get('x-user-id');
    const body = await req.json();
    const { customer_id, subject, description, priority, category, assigned_to } = body;

    if (!customer_id || !subject || !description) {
      return NextResponse.json(
        { success: false, message: 'اطلاعات تیکت کامل نیست' },
        { status: 400 }
      );
    }

    const ticketId = uuidv4();

    await executeSingle(`
      INSERT INTO tickets (
        id, customer_id, subject, description, priority, category, 
        assigned_to, created_by, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', NOW())
    `, [ticketId, customer_id, subject, description, priority || 'medium', 
        category, assigned_to || currentUserId, currentUserId]);

    return NextResponse.json({
      success: true,
      message: 'تیکت با موفقیت ایجاد شد'
    });
  } catch (error) {
    console.error('Create ticket API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد تیکت' },
      { status: 500 }
    );
  }
}