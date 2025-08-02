import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// POST /api/permissions/check - Check if user has specific permission
export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'کاربر شناسایی نشد' },
        { status: 401 }
      );
    }

    // CEO has access to everything
    if (userRole === 'ceo' || userRole === 'مدیر') {
      return NextResponse.json({ success: true, hasPermission: true });
    }

    const body = await req.json();
    const { module_name, permission_name } = body;

    if (!module_name || !permission_name) {
      return NextResponse.json(
        { success: false, message: 'اطلاعات دسترسی کامل نیست' },
        { status: 400 }
      );
    }

    // Check user permission (simplified without permission_id)
    const [result] = await executeQuery(`
      SELECT ump.granted
      FROM user_module_permissions ump
      JOIN modules m ON ump.module_id = m.id
      WHERE ump.user_id = ? 
        AND m.name = ? 
        AND ump.granted = true
      LIMIT 1
    `, [userId, module_name]);

    return NextResponse.json({
      success: true,
      hasPermission: !!result?.granted
    });
  } catch (error) {
    console.error('Check permission API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در بررسی دسترسی' },
      { status: 500 }
    );
  }
}