import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { hasPermission } from '@/lib/auth';

// GET /api/permissions/modules - Get all modules
export async function GET(req: NextRequest) {
  try {
    const userRole = req.headers.get('x-user-role');

    // Only CEO and managers can view all modules for permission management  
    if (!userRole || !['ceo', 'مدیر', 'sales_manager', 'مدیر فروش'].includes(userRole)) {
      return NextResponse.json(
        { success: false, message: 'عدم دسترسی - فقط مدیران اجازه دسترسی دارند' },
        { status: 403 }
      );
    }

    let modules;
    try {
      modules = await executeQuery(`
        SELECT 
          m.id,
          m.name,
          m.display_name,
          m.description,
          m.parent_id,
          COALESCE(m.route, CONCAT('/dashboard/', m.name)) as route,
          COALESCE(m.icon, 'LayoutDashboard') as icon,
          COALESCE(m.sort_order, 0) as sort_order,
          COALESCE(m.is_active, true) as is_active,
          parent.display_name as parent_name
        FROM modules m
        LEFT JOIN modules parent ON m.parent_id = parent.id
        WHERE COALESCE(m.is_active, true) = true
        ORDER BY m.sort_order, m.display_name
      `);
    } catch (error) {
      console.error('Modules table might not exist, returning defaults:', error);
      // Complete modules list for CEO to manage - all pages in the system
      modules = [
        // Core CRM
        { id: '1', name: 'dashboard', display_name: 'داشبورد', route: '/dashboard', icon: 'LayoutDashboard', sort_order: 1, is_active: true },
        { id: '2', name: 'customers', display_name: 'مشتریان', route: '/dashboard/customers', icon: 'Users', sort_order: 2, is_active: true },
        { id: '3', name: 'contacts', display_name: 'مخاطبین', route: '/dashboard/contacts', icon: 'UserCheck', sort_order: 3, is_active: true },
        { id: '4', name: 'coworkers', display_name: 'همکاران', route: '/dashboard/coworkers', icon: 'Users2', sort_order: 4, is_active: true },
        { id: '5', name: 'activities', display_name: 'فعالیت‌ها', route: '/dashboard/activities', icon: 'Activity', sort_order: 5, is_active: true },
        { id: '6', name: 'interactions', display_name: 'تعاملات', route: '/dashboard/interactions', icon: 'MessageCircle', sort_order: 6, is_active: true },
        { id: '7', name: 'chat', display_name: 'چت', route: '/dashboard/interactions/chat', icon: 'MessageCircle2', sort_order: 7, is_active: true },

        // Sales Management
        { id: '8', name: 'sales', display_name: 'ثبت فروش', route: '/dashboard/sales', icon: 'TrendingUp', sort_order: 8, is_active: true },
        { id: '9', name: 'sales_opportunities', display_name: 'فرصت‌های فروش', route: '/dashboard/sales/opportunities', icon: 'Target', sort_order: 9, is_active: true },

        // Feedback & Rating
        { id: '10', name: 'feedback', display_name: 'بازخوردها', route: '/dashboard/feedback', icon: 'MessageCircle', sort_order: 10, is_active: true },
        { id: '11', name: 'feedback_new', display_name: 'ثبت بازخورد', route: '/dashboard/feedback/new', icon: 'MessageCircle', sort_order: 11, is_active: true },
        { id: '12', name: 'surveys', display_name: 'نظرسنجی‌ها', route: '/dashboard/surveys', icon: 'ChevronRight', sort_order: 12, is_active: true },
        { id: '13', name: 'csat', display_name: 'CSAT', route: '/dashboard/csat', icon: 'ChevronRight', sort_order: 13, is_active: true },
        { id: '14', name: 'nps', display_name: 'NPS', route: '/dashboard/nps', icon: 'ChevronRight', sort_order: 14, is_active: true },

        // Analytics & Insights
        { id: '15', name: 'emotions', display_name: 'تحلیل احساسات', route: '/dashboard/emotions', icon: 'Activity', sort_order: 15, is_active: true },
        { id: '16', name: 'insights', display_name: 'بینش‌های خودکار', route: '/dashboard/insights', icon: 'BarChart3', sort_order: 16, is_active: true },
        { id: '17', name: 'touchpoints', display_name: 'نقاط تماس', route: '/dashboard/touchpoints', icon: 'Target', sort_order: 17, is_active: true },
        { id: '18', name: 'customer_health', display_name: 'سلامت مشتری', route: '/dashboard/customer-health', icon: 'Activity', sort_order: 18, is_active: true },
        { id: '19', name: 'alerts', display_name: 'هشدارها', route: '/dashboard/alerts', icon: 'Activity', sort_order: 19, is_active: true },
        { id: '20', name: 'voice_of_customer', display_name: 'صدای مشتری (VOC)', route: '/dashboard/voice-of-customer', icon: 'MessageCircle', sort_order: 20, is_active: true },

        // Other
        { id: '21', name: 'projects', display_name: 'پروژه‌ها', route: '/dashboard/projects', icon: 'Briefcase', sort_order: 21, is_active: true },
        { id: '22', name: 'calendar', display_name: 'تقویم', route: '/dashboard/calendar', icon: 'Calendar', sort_order: 22, is_active: true },
        { id: '23', name: 'reports', display_name: 'گزارش‌ها', route: '/dashboard/reports', icon: 'BarChart3', sort_order: 23, is_active: true },
        { id: '24', name: 'profile', display_name: 'پروفایل', route: '/dashboard/profile', icon: 'User', sort_order: 24, is_active: true },
        { id: '25', name: 'settings', display_name: 'تنظیمات عمومی', route: '/dashboard/settings', icon: 'Settings', sort_order: 25, is_active: true },
        { id: '26', name: 'cem_settings', display_name: 'تنظیمات CEM', route: '/dashboard/cem-settings', icon: 'Settings', sort_order: 26, is_active: true },
      ];
    }

    return NextResponse.json({ success: true, data: modules });
  } catch (error) {
    console.error('Get modules API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت ماژول‌ها' },
      { status: 500 }
    );
  }
}