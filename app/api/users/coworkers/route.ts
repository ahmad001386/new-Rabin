import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { hasPermission } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const userRole = req.headers.get('x-user-role');

        // بررسی دسترسی
        if (!hasPermission(userRole || '', ['ceo', 'مدیر'])) {
            return NextResponse.json(
                { success: false, message: 'عدم دسترسی' },
                { status: 403 }
            );
        }

        // دریافت لیست همکاران
        const coworkers = await executeQuery(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.created_at,
        u.status
      FROM users u
      WHERE u.status = 'active'
      ORDER BY u.name
    `);

        return NextResponse.json({ success: true, data: coworkers });
    } catch (error) {
        console.error('Error in coworkers API:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در دریافت اطلاعات همکاران' },
            { status: 500 }
        );
    }
}
