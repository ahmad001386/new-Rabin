import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getUserFromToken, verifyToken } from '@/lib/auth';

// GET /api/tasks/users - Get all users for task assignment
export async function GET(req: NextRequest) {
    try {
        // Get token from cookie or Authorization header
        const token = req.cookies.get('auth-token')?.value ||
            req.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'توکن یافت نشد' },
                { status: 401 }
            );
        }

        const userId = await getUserFromToken(token);
        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'توکن نامعتبر است' },
                { status: 401 }
            );
        }

        // Get current user info
        const currentUsers = await executeQuery(`
            SELECT id, name, email, role, status 
            FROM users 
            WHERE id = ? AND status = 'active'
        `, [userId]);

        if (currentUsers.length === 0) {
            return NextResponse.json(
                { success: false, message: 'کاربر یافت نشد' },
                { status: 404 }
            );
        }

        const currentUser = currentUsers[0];

        // Check if user has permission to assign tasks (managers only)
        const isManager = ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش'].includes(currentUser.role);
        if (!isManager) {
            return NextResponse.json(
                { success: false, message: 'شما مجوز مشاهده لیست کاربران را ندارید' },
                { status: 403 }
            );
        }

        const users = await executeQuery(`
            SELECT 
                id, name, email, role, avatar, status
            FROM users 
            WHERE status = 'active'
            ORDER BY name ASC
        `);

        return NextResponse.json({ success: true, data: users });
    } catch (error) {
        console.error('Get users API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در دریافت لیست کاربران' },
            { status: 500 }
        );
    }
}