import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getUserFromToken } from '@/lib/auth';

// GET /api/auth/permissions - Get current user's accessible modules
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

        // Get user role first
        const userResult = await executeQuery(`
      SELECT role FROM users WHERE id = ?
    `, [userId]);

        if (!userResult || userResult.length === 0) {
            return NextResponse.json(
                { success: false, message: 'کاربر یافت نشد' },
                { status: 404 }
            );
        }

        const userRole = userResult[0].role;

        let userModules;

        // CEO and managers have access to all modules
        if (['ceo', 'مدیر', 'sales_manager', 'مدیر فروش'].includes(userRole)) {
            // For CEOs, return default modules if table doesn't exist yet
            try {
                userModules = await executeQuery(`
          SELECT 
            m.id,
            m.name,
            m.display_name,
            COALESCE(m.route, CONCAT('/dashboard/', m.name)) as route,
            COALESCE(m.icon, 'LayoutDashboard') as icon,
            COALESCE(m.sort_order, 0) as sort_order,
            m.parent_id
          FROM modules m
          WHERE COALESCE(m.is_active, true) = true
          ORDER BY m.sort_order, m.display_name
        `);
            } catch (error) {
                console.error('Modules table might not exist, using defaults:', error);
                // Complete modules list for CEOs - all pages in the system
                userModules = [
                    // Core CRM
                    { id: '1', name: 'dashboard', display_name: 'داشبورد', route: '/dashboard', icon: 'LayoutDashboard', sort_order: 1 },
                    { id: '2', name: 'customers', display_name: 'مشتریان', route: '/dashboard/customers', icon: 'Users', sort_order: 2 },
                    { id: '3', name: 'contacts', display_name: 'مخاطبین', route: '/dashboard/contacts', icon: 'UserCheck', sort_order: 3 },
                    { id: '4', name: 'coworkers', display_name: 'همکاران', route: '/dashboard/coworkers', icon: 'Users2', sort_order: 4 },
                    { id: '5', name: 'activities', display_name: 'فعالیت‌ها', route: '/dashboard/activities', icon: 'Activity', sort_order: 5 },
                    { id: '6', name: 'interactions', display_name: 'تعاملات', route: '/dashboard/interactions', icon: 'MessageCircle', sort_order: 6 },
                    { id: '7', name: 'chat', display_name: 'چت', route: '/dashboard/interactions/chat', icon: 'MessageCircle2', sort_order: 7 },

                    // Sales Management
                    { id: '8', name: 'sales', display_name: 'ثبت فروش', route: '/dashboard/sales', icon: 'TrendingUp', sort_order: 8 },
                    { id: '9', name: 'sales_opportunities', display_name: 'فرصت‌های فروش', route: '/dashboard/sales/opportunities', icon: 'Target', sort_order: 9 },

                    // Feedback & Rating
                    { id: '10', name: 'feedback', display_name: 'بازخوردها', route: '/dashboard/feedback', icon: 'MessageCircle', sort_order: 10 },
                    { id: '11', name: 'feedback_new', display_name: 'ثبت بازخورد', route: '/dashboard/feedback/new', icon: 'MessageCircle', sort_order: 11 },
                    { id: '12', name: 'surveys', display_name: 'نظرسنجی‌ها', route: '/dashboard/surveys', icon: 'ChevronRight', sort_order: 12 },
                    { id: '13', name: 'csat', display_name: 'CSAT', route: '/dashboard/csat', icon: 'ChevronRight', sort_order: 13 },
                    { id: '14', name: 'nps', display_name: 'NPS', route: '/dashboard/nps', icon: 'ChevronRight', sort_order: 14 },

                    // Analytics & Insights
                    { id: '15', name: 'emotions', display_name: 'تحلیل احساسات', route: '/dashboard/emotions', icon: 'Activity', sort_order: 15 },
                    { id: '16', name: 'insights', display_name: 'بینش‌های خودکار', route: '/dashboard/insights', icon: 'BarChart3', sort_order: 16 },
                    { id: '17', name: 'touchpoints', display_name: 'نقاط تماس', route: '/dashboard/touchpoints', icon: 'Target', sort_order: 17 },
                    { id: '18', name: 'customer_health', display_name: 'سلامت مشتری', route: '/dashboard/customer-health', icon: 'Activity', sort_order: 18 },
                    { id: '19', name: 'alerts', display_name: 'هشدارها', route: '/dashboard/alerts', icon: 'Activity', sort_order: 19 },
                    { id: '20', name: 'voice_of_customer', display_name: 'صدای مشتری (VOC)', route: '/dashboard/voice-of-customer', icon: 'MessageCircle', sort_order: 20 },

                    // Other
                    { id: '21', name: 'projects', display_name: 'پروژه‌ها', route: '/dashboard/projects', icon: 'Briefcase', sort_order: 21 },
                    { id: '22', name: 'tasks', display_name: 'وظایف', route: '/dashboard/tasks', icon: 'CheckCircle', sort_order: 22 },
                    { id: '23', name: 'calendar', display_name: 'تقویم', route: '/dashboard/calendar', icon: 'Calendar', sort_order: 23 },
                    { id: '24', name: 'reports', display_name: 'گزارش‌ها', route: '/dashboard/reports', icon: 'BarChart3', sort_order: 24 },
                    { id: '25', name: 'profile', display_name: 'پروفایل', route: '/dashboard/profile', icon: 'User', sort_order: 25 },
                    { id: '26', name: 'settings', display_name: 'تنظیمات عمومی', route: '/dashboard/settings', icon: 'Settings', sort_order: 26 },
                    { id: '27', name: 'cem_settings', display_name: 'تنظیمات CEM', route: '/dashboard/cem-settings', icon: 'Settings', sort_order: 27 },
                ];
            }
        } else {
            // For regular users, get explicitly granted modules
            try {
                userModules = await executeQuery(`
          SELECT DISTINCT
            m.id,
            m.name,
            m.display_name,
            COALESCE(m.route, CONCAT('/dashboard/', m.name)) as route,
            COALESCE(m.icon, 'LayoutDashboard') as icon,
            COALESCE(m.sort_order, 0) as sort_order,
            m.parent_id
          FROM modules m
          JOIN user_module_permissions ump ON m.id = ump.module_id
          WHERE ump.user_id = ? 
            AND ump.granted = true
            AND COALESCE(m.is_active, true) = true
          ORDER BY m.sort_order, m.display_name
        `, [userId]);

                // Always include dashboard, tasks and profile for all users
                const basicModules = await executeQuery(`
          SELECT 
            m.id,
            m.name,
            m.display_name,
            COALESCE(m.route, CONCAT('/dashboard/', m.name)) as route,
            COALESCE(m.icon, 'LayoutDashboard') as icon,
            COALESCE(m.sort_order, 0) as sort_order,
            m.parent_id
          FROM modules m
          WHERE m.name IN ('dashboard', 'tasks', 'profile') 
            AND COALESCE(m.is_active, true) = true
          ORDER BY m.sort_order
        `);

                // Merge and remove duplicates
                const moduleIds = new Set(userModules.map((m: any) => m.id));
                basicModules.forEach((module: any) => {
                    if (!moduleIds.has(module.id)) {
                        userModules.push(module);
                    }
                });
            } catch (error) {
                console.error('Error fetching user modules, using basics:', error);
                // Fallback for regular users when table doesn't exist
                userModules = [
                    { id: '1', name: 'dashboard', display_name: 'داشبورد', route: '/dashboard', icon: 'LayoutDashboard', sort_order: 1 },
                    { id: '22', name: 'tasks', display_name: 'وظایف', route: '/dashboard/tasks', icon: 'CheckCircle', sort_order: 22 },
                    { id: '11', name: 'profile', display_name: 'پروفایل', route: '/dashboard/profile', icon: 'User', sort_order: 11 },
                ];
            }
        }

        return NextResponse.json({
            success: true,
            data: userModules,
            userRole: userRole
        });
    } catch (error) {
        console.error('Get user permissions API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطای سرور داخلی' },
            { status: 500 }
        );
    }
}