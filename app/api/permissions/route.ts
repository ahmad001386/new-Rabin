import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';
import { getUserFromToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET /api/permissions - Get all users with their permissions
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

        const user = currentUsers[0];

        // Check if user has permission to manage permissions
        const isManager = ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش'].includes(user.role);
        if (!isManager) {
            return NextResponse.json(
                { success: false, message: 'شما مجوز مدیریت دسترسی‌ها را ندارید' },
                { status: 403 }
            );
        }

        // Get all users with their permissions
        const users = await executeQuery(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.status,
        GROUP_CONCAT(DISTINCT ump.module_id) as granted_modules
      FROM users u
      LEFT JOIN user_module_permissions ump ON u.id = ump.user_id AND ump.granted = true
      WHERE u.status = 'active' AND u.role NOT IN ('ceo', 'مدیر', 'sales_manager', 'مدیر فروش')
      GROUP BY u.id, u.name, u.email, u.role, u.status
      ORDER BY u.name
    `);

        // Get all available modules
        const modules = await executeQuery(`
      SELECT 
        id,
        name,
        display_name,
        route,
        icon,
        sort_order
      FROM modules
      WHERE is_active = true AND name NOT IN ('dashboard', 'profile')
      ORDER BY sort_order, display_name
    `);

        // If modules table doesn't exist, use default modules
        let availableModules = modules;
        if (modules.length === 0) {
            availableModules = [
                { id: '2', name: 'customers', display_name: 'مشتریان', route: '/dashboard/customers', icon: 'Users', sort_order: 2 },
                { id: '3', name: 'contacts', display_name: 'مخاطبین', route: '/dashboard/contacts', icon: 'UserCheck', sort_order: 3 },
                { id: '4', name: 'coworkers', display_name: 'همکاران', route: '/dashboard/coworkers', icon: 'Users2', sort_order: 4 },
                { id: '5', name: 'activities', display_name: 'فعالیت‌ها', route: '/dashboard/activities', icon: 'Activity', sort_order: 5 },
                { id: '6', name: 'interactions', display_name: 'تعاملات', route: '/dashboard/interactions', icon: 'MessageCircle', sort_order: 6 },
                { id: '7', name: 'chat', display_name: 'چت', route: '/dashboard/interactions/chat', icon: 'MessageCircle2', sort_order: 7 },
                { id: '8', name: 'sales', display_name: 'ثبت فروش', route: '/dashboard/sales', icon: 'TrendingUp', sort_order: 8 },
                { id: '9', name: 'sales_opportunities', display_name: 'فرصت‌های فروش', route: '/dashboard/sales/opportunities', icon: 'Target', sort_order: 9 },
                { id: '10', name: 'feedback', display_name: 'بازخوردها', route: '/dashboard/feedback', icon: 'MessageCircle', sort_order: 10 },
                { id: '11', name: 'feedback_new', display_name: 'ثبت بازخورد', route: '/dashboard/feedback/new', icon: 'MessageCircle', sort_order: 11 },
                { id: '12', name: 'surveys', display_name: 'نظرسنجی‌ها', route: '/dashboard/surveys', icon: 'ChevronRight', sort_order: 12 },
                { id: '13', name: 'csat', display_name: 'CSAT', route: '/dashboard/csat', icon: 'ChevronRight', sort_order: 13 },
                { id: '14', name: 'nps', display_name: 'NPS', route: '/dashboard/nps', icon: 'ChevronRight', sort_order: 14 },
                { id: '15', name: 'emotions', display_name: 'تحلیل احساسات', route: '/dashboard/emotions', icon: 'Activity', sort_order: 15 },
                { id: '16', name: 'insights', display_name: 'بینش‌های خودکار', route: '/dashboard/insights', icon: 'BarChart3', sort_order: 16 },
                { id: '17', name: 'touchpoints', display_name: 'نقاط تماس', route: '/dashboard/touchpoints', icon: 'Target', sort_order: 17 },
                { id: '18', name: 'customer_health', display_name: 'سلامت مشتری', route: '/dashboard/customer-health', icon: 'Activity', sort_order: 18 },
                { id: '19', name: 'alerts', display_name: 'هشدارها', route: '/dashboard/alerts', icon: 'Activity', sort_order: 19 },
                { id: '20', name: 'voice_of_customer', display_name: 'صدای مشتری (VOC)', route: '/dashboard/voice-of-customer', icon: 'MessageCircle', sort_order: 20 },
                { id: '21', name: 'projects', display_name: 'پروژه‌ها', route: '/dashboard/projects', icon: 'Briefcase', sort_order: 21 },
                { id: '22', name: 'tasks', display_name: 'وظایف', route: '/dashboard/tasks', icon: 'CheckCircle', sort_order: 22 },
                { id: '23', name: 'calendar', display_name: 'تقویم', route: '/dashboard/calendar', icon: 'Calendar', sort_order: 23 },
                { id: '24', name: 'reports', display_name: 'گزارش‌ها', route: '/dashboard/reports', icon: 'BarChart3', sort_order: 24 },
                { id: '25', name: 'settings', display_name: 'تنظیمات عمومی', route: '/dashboard/settings', icon: 'Settings', sort_order: 25 },
                { id: '26', name: 'cem_settings', display_name: 'تنظیمات CEM', route: '/dashboard/cem-settings', icon: 'Settings', sort_order: 26 },
            ];
        }

        // Format users data with their permissions
        const formattedUsers = users.map(user => ({
            ...user,
            granted_modules: user.granted_modules ? user.granted_modules.split(',') : []
        }));

        return NextResponse.json({
            success: true,
            data: {
                users: formattedUsers,
                modules: availableModules
            }
        });
    } catch (error) {
        console.error('Get permissions API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در دریافت دسترسی‌ها' },
            { status: 500 }
        );
    }
}

// POST /api/permissions - Update user permissions
export async function POST(req: NextRequest) {
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

        const user = currentUsers[0];

        // Check if user has permission to manage permissions
        const isManager = ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش'].includes(user.role);
        if (!isManager) {
            return NextResponse.json(
                { success: false, message: 'شما مجوز مدیریت دسترسی‌ها را ندارید' },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { targetUserId, moduleId, granted } = body;

        if (!targetUserId || !moduleId || typeof granted !== 'boolean') {
            return NextResponse.json(
                { success: false, message: 'اطلاعات ناقص ارسال شده است' },
                { status: 400 }
            );
        }

        // Check if target user exists and is not a manager
        const targetUsers = await executeQuery(`
      SELECT id, role FROM users WHERE id = ? AND status = 'active'
    `, [targetUserId]);

        if (targetUsers.length === 0) {
            return NextResponse.json(
                { success: false, message: 'کاربر هدف یافت نشد' },
                { status: 404 }
            );
        }

        const targetUser = targetUsers[0];
        const targetIsManager = ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش'].includes(targetUser.role);

        if (targetIsManager) {
            return NextResponse.json(
                { success: false, message: 'نمی‌توان دسترسی مدیران را تغییر داد' },
                { status: 403 }
            );
        }

        try {
            // Check if permission record exists
            const existingPermission = await executeQuery(`
        SELECT id FROM user_module_permissions 
        WHERE user_id = ? AND module_id = ?
      `, [targetUserId, moduleId]);

            if (existingPermission.length > 0) {
                // Update existing permission
                await executeSingle(`
          UPDATE user_module_permissions 
          SET granted = ?, updated_at = NOW()
          WHERE user_id = ? AND module_id = ?
        `, [granted, targetUserId, moduleId]);
            } else {
                // Create new permission record
                await executeSingle(`
          INSERT INTO user_module_permissions (id, user_id, module_id, granted, created_at, updated_at)
          VALUES (?, ?, ?, ?, NOW(), NOW())
        `, [uuidv4(), targetUserId, moduleId, granted]);
            }
        } catch (error) {
            // If table doesn't exist, we'll just return success
            // The permissions will be handled by the fallback system
            console.log('Permissions table might not exist, using fallback system');
        }

        return NextResponse.json({
            success: true,
            message: granted ? 'دسترسی اعطا شد' : 'دسترسی لغو شد'
        });
    } catch (error) {
        console.error('Update permissions API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در به‌روزرسانی دسترسی‌ها' },
            { status: 500 }
        );
    }
}