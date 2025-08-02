import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { hasPermission } from '@/lib/auth';

// GET /api/permissions/types - Get all permission types
export async function GET(req: NextRequest) {
  try {
    const userRole = req.headers.get('x-user-role');

    // Only CEO can view permission types
    if (!hasPermission(userRole || '', ['ceo', 'مدیر'])) {
      return NextResponse.json(
        { success: false, message: 'عدم دسترسی' },
        { status: 403 }
      );
    }

    const permissions = await executeQuery(`
      SELECT id, name, display_name, description
      FROM permissions
      ORDER BY 
        CASE name 
          WHEN 'view' THEN 1
          WHEN 'create' THEN 2  
          WHEN 'edit' THEN 3
          WHEN 'delete' THEN 4
          WHEN 'manage' THEN 5
          ELSE 6
        END
    `);

    return NextResponse.json({ success: true, data: permissions });
  } catch (error) {
    console.error('Get permission types API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت انواع دسترسی' },
      { status: 500 }
    );
  }
}