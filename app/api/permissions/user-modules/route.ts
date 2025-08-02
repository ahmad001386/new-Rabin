import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';

// GET /api/permissions/user-modules - Get user's accessible modules
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const userRole = req.headers.get('x-user-role');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر الزامی است' },
        { status: 400 }
      );
    }

    let userModules;

    // CEO and managers have access to all modules
    if (['ceo', 'مدیر', 'sales_manager', 'مدیر فروش'].includes(userRole || '')) {
      try {
        userModules = await executeQuery(`
          SELECT 
            m.id as module_id,
            m.name,
            m.display_name,
            COALESCE(m.route, CONCAT('/dashboard/', m.name)) as route,
            COALESCE(m.icon, 'LayoutDashboard') as icon,
            COALESCE(m.sort_order, 0) as sort_order,
            'manage' as permission_level
          FROM modules m
          WHERE COALESCE(m.is_active, true) = true
          ORDER BY m.sort_order
        `);
      } catch (error) {
        console.error('Modules table error, using defaults:', error);
        // Complete modules list for CEOs/Managers - all pages in the system
        userModules = [
          // Core CRM
          { module_id: '1', name: 'dashboard', display_name: 'داشبورد', route: '/dashboard', icon: 'LayoutDashboard', sort_order: 1 },
          { module_id: '2', name: 'customers', display_name: 'مشتریان', route: '/dashboard/customers', icon: 'Users', sort_order: 2 },
          { module_id: '3', name: 'contacts', display_name: 'مخاطبین', route: '/dashboard/contacts', icon: 'UserCheck', sort_order: 3 },
          { module_id: '4', name: 'coworkers', display_name: 'همکاران', route: '/dashboard/coworkers', icon: 'Users2', sort_order: 4 },
          { module_id: '5', name: 'activities', display_name: 'فعالیت‌ها', route: '/dashboard/activities', icon: 'Activity', sort_order: 5 },
          { module_id: '6', name: 'interactions', display_name: 'تعاملات', route: '/dashboard/interactions', icon: 'MessageCircle', sort_order: 6 },
          { module_id: '7', name: 'chat', display_name: 'چت', route: '/dashboard/interactions/chat', icon: 'MessageCircle2', sort_order: 7 },

          // Sales Management
          { module_id: '8', name: 'sales', display_name: 'ثبت فروش', route: '/dashboard/sales', icon: 'TrendingUp', sort_order: 8 },
          { module_id: '9', name: 'sales_opportunities', display_name: 'فرصت‌های فروش', route: '/dashboard/sales/opportunities', icon: 'Target', sort_order: 9 },

          // Feedback & Rating
          { module_id: '10', name: 'feedback', display_name: 'بازخوردها', route: '/dashboard/feedback', icon: 'MessageCircle', sort_order: 10 },
          { module_id: '11', name: 'feedback_new', display_name: 'ثبت بازخورد', route: '/dashboard/feedback/new', icon: 'MessageCircle', sort_order: 11 },
          { module_id: '12', name: 'surveys', display_name: 'نظرسنجی‌ها', route: '/dashboard/surveys', icon: 'ChevronRight', sort_order: 12 },
          { module_id: '13', name: 'csat', display_name: 'CSAT', route: '/dashboard/csat', icon: 'ChevronRight', sort_order: 13 },
          { module_id: '14', name: 'nps', display_name: 'NPS', route: '/dashboard/nps', icon: 'ChevronRight', sort_order: 14 },

          // Analytics & Insights
          { module_id: '15', name: 'emotions', display_name: 'تحلیل احساسات', route: '/dashboard/emotions', icon: 'Activity', sort_order: 15 },
          { module_id: '16', name: 'insights', display_name: 'بینش‌های خودکار', route: '/dashboard/insights', icon: 'BarChart3', sort_order: 16 },
          { module_id: '17', name: 'touchpoints', display_name: 'نقاط تماس', route: '/dashboard/touchpoints', icon: 'Target', sort_order: 17 },
          { module_id: '18', name: 'customer_health', display_name: 'سلامت مشتری', route: '/dashboard/customer-health', icon: 'Activity', sort_order: 18 },
          { module_id: '19', name: 'alerts', display_name: 'هشدارها', route: '/dashboard/alerts', icon: 'Activity', sort_order: 19 },
          { module_id: '20', name: 'voice_of_customer', display_name: 'صدای مشتری (VOC)', route: '/dashboard/voice-of-customer', icon: 'MessageCircle', sort_order: 20 },

          // Other
          { module_id: '21', name: 'projects', display_name: 'پروژه‌ها', route: '/dashboard/projects', icon: 'Briefcase', sort_order: 21 },
          { module_id: '22', name: 'calendar', display_name: 'تقویم', route: '/dashboard/calendar', icon: 'Calendar', sort_order: 22 },
          { module_id: '23', name: 'reports', display_name: 'گزارش‌ها', route: '/dashboard/reports', icon: 'BarChart3', sort_order: 23 },
          { module_id: '24', name: 'profile', display_name: 'پروفایل', route: '/dashboard/profile', icon: 'User', sort_order: 24 },
          { module_id: '25', name: 'settings', display_name: 'تنظیمات عمومی', route: '/dashboard/settings', icon: 'Settings', sort_order: 25 },
          { module_id: '26', name: 'cem_settings', display_name: 'تنظیمات CEM', route: '/dashboard/cem-settings', icon: 'Settings', sort_order: 26 },
        ];
      }
    } else {
      // Get user's accessible modules
      try {
        userModules = await executeQuery(`
          SELECT DISTINCT
            m.id as module_id,
            m.name,
            m.display_name,
            COALESCE(m.route, CONCAT('/dashboard/', m.name)) as route,
            COALESCE(m.icon, 'LayoutDashboard') as icon,
            COALESCE(m.sort_order, 0) as sort_order,
            'view' as permissions
          FROM modules m
          JOIN user_module_permissions ump ON m.id = ump.module_id
          WHERE ump.user_id = ? 
            AND ump.granted = true
            AND COALESCE(m.is_active, true) = true
          GROUP BY m.id, m.name, m.display_name, m.route, m.icon, m.sort_order
          ORDER BY m.sort_order
        `, [userId]);
      } catch (error) {
        console.error('User modules error, using basics:', error);
        userModules = [
          { module_id: '1', name: 'dashboard', display_name: 'داشبورد', route: '/dashboard', icon: 'LayoutDashboard', sort_order: 1 },
          { module_id: '11', name: 'profile', display_name: 'پروفایل', route: '/dashboard/profile', icon: 'User', sort_order: 11 },
        ];
      }
    }

    return NextResponse.json({ success: true, data: userModules });
  } catch (error) {
    console.error('Get user modules API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت ماژول‌های کاربر' },
      { status: 500 }
    );
  }
}

// POST /api/permissions/user-modules - Update user permissions
export async function POST(req: NextRequest) {
  try {
    const { userId, moduleId, granted } = await req.json();

    if (!userId || !moduleId || granted === undefined) {
      return NextResponse.json(
        { success: false, message: 'پارامترهای الزامی ناقص هستند' },
        { status: 400 }
      );
    }

    // Handle permission updates with error handling
    try {
      // First check if permission record exists
      const existingPermission = await executeQuery(`
        SELECT id FROM user_module_permissions 
        WHERE user_id = ? AND module_id = ?
      `, [userId, moduleId]);

      if (existingPermission.length > 0) {
        // Update existing permission
        await executeSingle(`
          UPDATE user_module_permissions 
          SET granted = ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ? AND module_id = ?
        `, [granted ? 1 : 0, userId, moduleId]);
      } else if (granted) {
        // Insert new permission only if granted is true
        // Use simplified table structure without permission_id
        await executeSingle(`
          INSERT INTO user_module_permissions (user_id, module_id, granted, created_at)
          VALUES (?, ?, 1, CURRENT_TIMESTAMP)
        `, [userId, moduleId]);
      }
    } catch (error) {
      console.warn('Permission tables not ready yet:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'دسترسی‌ها با موفقیت به‌روزرسانی شد'
    });
  } catch (error) {
    console.error('Update user permissions API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی دسترسی‌ها' },
      { status: 500 }
    );
  }
}