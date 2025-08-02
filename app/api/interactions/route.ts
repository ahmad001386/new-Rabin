import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';
import { hasPermission } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET /api/interactions - Get all interactions
export async function GET(req: NextRequest) {
    try {
        const userRole = req.headers.get('x-user-role');
        const userId = req.headers.get('x-user-id');

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const type = searchParams.get('type') || '';
        const customer_id = searchParams.get('customer_id') || '';

        const offset = (page - 1) * limit;

        // Build WHERE clause
        let whereClause = 'WHERE 1=1';
        const params: any[] = [];

        if (search) {
            whereClause += ' AND (i.subject LIKE ? OR i.description LIKE ? OR c.name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (type) {
            whereClause += ' AND i.type = ?';
            params.push(type);
        }

        if (customer_id) {
            whereClause += ' AND i.customer_id = ?';
            params.push(customer_id);
        }

        // If not CEO, only show assigned interactions
        if (!hasPermission(userRole || '', ['ceo', 'مدیر'])) {
            whereClause += ' AND i.performed_by = ?';
            params.push(userId);
        }

        const interactions = await executeQuery(`
      SELECT 
        i.*,
        c.name as customer_name,
        u.name as performed_by_name
      FROM interactions i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN users u ON i.performed_by = u.id
      ${whereClause}
      ORDER BY i.date DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

        // Get total count
        const [countResult] = await executeQuery(`
      SELECT COUNT(*) as total
      FROM interactions i
      LEFT JOIN customers c ON i.customer_id = c.id
      ${whereClause}
    `, params);

        return NextResponse.json({
            success: true,
            data: interactions,
            pagination: {
                page,
                limit,
                total: countResult.total,
                totalPages: Math.ceil(countResult.total / limit)
            }
        });
    } catch (error) {
        console.error('Get interactions API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در دریافت تعاملات' },
            { status: 500 }
        );
    }
}

// POST /api/interactions - Create new interaction
export async function POST(req: NextRequest) {
    try {
        const userRole = req.headers.get('x-user-role');
        const currentUserId = req.headers.get('x-user-id');

        const body = await req.json();
        const {
            customer_id, type, subject, description, outcome, direction,
            channel, duration
        } = body;

        if (!customer_id || !type || !subject) {
            return NextResponse.json(
                { success: false, message: 'فیلدهای الزامی کامل نیست' },
                { status: 400 }
            );
        }

        const interactionId = uuidv4();

        await executeSingle(`
      INSERT INTO interactions (
        id, customer_id, type, subject, description, outcome, direction, 
        channel, date, duration, performed_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
    `, [
            interactionId, customer_id, type, subject, description, outcome,
            direction || 'outbound', channel || 'system', duration, currentUserId
        ]);

        const [newInteraction] = await executeQuery(`
      SELECT 
        i.*,
        c.name as customer_name,
        u.name as performed_by_name
      FROM interactions i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN users u ON i.performed_by = u.id
      WHERE i.id = ?
    `, [interactionId]);

        return NextResponse.json({
            success: true,
            message: 'تعامل با موفقیت ایجاد شد',
            data: newInteraction
        });
    } catch (error) {
        console.error('Create interaction API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در ایجاد تعامل' },
            { status: 500 }
        );
    }
}