import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';
import { getUserFromToken } from '@/lib/auth';

// دریافت اطلاعات پروفایل
export async function GET(req: NextRequest) {
    try {
        // Get user ID from middleware headers
        const userId = req.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const user = await executeQuery(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.phone,
        u.avatar
      FROM users u
      WHERE u.id = ? AND u.status != 'inactive'
    `, [userId]);

        if (!user || user.length === 0) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: user[0]
        });
    } catch (error) {
        console.error('Error in profile API:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

// به‌روزرسانی اطلاعات پروفایل
export async function POST(req: NextRequest) {
    try {
        // Get user ID from middleware headers
        const userId = req.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { name, phone } = await req.json();

        await executeSingle(`
      UPDATE users
      SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, phone, userId]);

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Error in profile update API:', error);
        return NextResponse.json(
            { success: false, message: 'Error updating profile' },
            { status: 500 }
        );
    }
}
