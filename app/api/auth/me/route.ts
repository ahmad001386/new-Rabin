import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { executeQuery } from '@/lib/database';

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

    const users = await executeQuery(`
      SELECT id, name, email, role, avatar_url as avatar, phone, team, status
      FROM users
      WHERE id = ? AND status != 'inactive'
    `, [userId]);

    if (users && users.length > 0) {
      const user = users[0];
      return NextResponse.json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          phone: user.phone,
          team: user.team,
          status: user.status
        }
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Get current user API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطای سرور داخلی' },
      { status: 500 }
    );
  }
}