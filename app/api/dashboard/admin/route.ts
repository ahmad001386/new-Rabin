import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getUserFromToken, hasPermission } from '@/lib/auth';

// GET /api/dashboard/admin - Get admin dashboard data
export async function GET(req: NextRequest) {
    try {
        // Get user from token for authorization
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

        // Get current user's role
        const currentUsers = await executeQuery(`
      SELECT id, name, role FROM users WHERE id = ? AND status = 'active'
    `, [userId]);

        if (currentUsers.length === 0) {
            return NextResponse.json(
                { success: false, message: 'کاربر یافت نشد' },
                { status: 404 }
            );
        }

        const currentUser = currentUsers[0];
        const userRole = currentUser.role;

        // Check if user is admin/manager
        const isAdmin = hasPermission(userRole, ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش']);

        // 1. Get team activities (recent activities by coworkers)
        const teamActivities = await executeQuery(`
      SELECT 
        a.id,
        a.type,
        a.title,
        a.description,
        a.start_time,
        a.outcome,
        u.name as performed_by_name,
        c.name as customer_name
      FROM activities a
      LEFT JOIN users u ON a.performed_by = u.id
      LEFT JOIN customers c ON a.customer_id = c.id
      WHERE DATE(a.start_time) = CURDATE()
      ${isAdmin ? '' : `AND a.performed_by = '${userId}'`}
      ORDER BY a.start_time DESC
      LIMIT 10
    `);

        // 2. Get today's schedule (tasks and meetings for today)
        const todaySchedule = await executeQuery(`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.priority,
        t.status,
        t.due_date,
        t.category,
        c.name as customer_name,
        u.name as assigned_by_name,
        GROUP_CONCAT(DISTINCT u2.name SEPARATOR ', ') as assigned_to_names
      FROM tasks t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users u ON t.assigned_by = u.id
      LEFT JOIN task_assignees ta ON t.id = ta.task_id
      LEFT JOIN users u2 ON ta.user_id = u2.id
      WHERE DATE(t.due_date) = CURDATE()
      ${isAdmin ? '' : `AND ta.user_id = '${userId}'`}
      GROUP BY t.id
      ORDER BY t.priority DESC, t.due_date ASC
      LIMIT 10
    `);

        // 3. Get recent customers (last 3 customers)
        const recentCustomers = await executeQuery(`
      SELECT 
        c.id,
        c.name,
        c.email,
        c.phone,
        c.status,
        c.segment,
        c.created_at,
        u.name as assigned_user_name
      FROM customers c
      LEFT JOIN users u ON c.assigned_to = u.id
      ${isAdmin ? '' : `WHERE c.assigned_to = '${userId}'`}
      ORDER BY c.created_at DESC
      LIMIT 3
    `);

        // 4. Get quick access stats
        const quickStats = await executeQuery(`
      SELECT 
        (SELECT COUNT(*) FROM customers WHERE status = 'active' ${isAdmin ? '' : `AND assigned_to = '${userId}'`}) as active_customers,
        (SELECT COUNT(*) FROM tasks WHERE status = 'pending' ${isAdmin ? '' : `AND id IN (SELECT task_id FROM task_assignees WHERE user_id = '${userId}')`}) as pending_tasks,
        (SELECT COUNT(*) FROM deals WHERE stage_id IN (SELECT id FROM pipeline_stages WHERE code != 'closed_won' AND code != 'closed_lost') ${isAdmin ? '' : `AND assigned_to = '${userId}'`}) as active_deals,
        (SELECT COUNT(*) FROM tickets WHERE status IN ('open', 'in_progress') ${isAdmin ? '' : `AND assigned_to = '${userId}'`}) as open_tickets
    `);

        // 5. Get user activity report (for admin only)
        let userActivityReport = [];
        if (isAdmin) {
            userActivityReport = await executeQuery(`
        SELECT 
          u.id,
          u.name,
          u.role,
          u.status,
          u.last_active,
          COUNT(DISTINCT a.id) as activities_today,
          COUNT(DISTINCT t.id) as tasks_assigned,
          COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as tasks_completed,
          COUNT(DISTINCT c.id) as customers_assigned
        FROM users u
        LEFT JOIN activities a ON u.id = a.performed_by AND DATE(a.start_time) = CURDATE()
        LEFT JOIN task_assignees ta ON u.id = ta.user_id
        LEFT JOIN tasks t ON ta.task_id = t.id
        LEFT JOIN customers c ON u.id = c.assigned_to
        WHERE u.status = 'active' AND u.role != 'ceo'
        GROUP BY u.id, u.name, u.role, u.status, u.last_active
        ORDER BY activities_today DESC, u.name ASC
        LIMIT 10
      `);
        }

        // 6. Get alerts/notifications
        const alerts = await executeQuery(`
      SELECT 
        'overdue_task' as type,
        CONCAT('وظیفه معوقه: ', t.title) as title,
        CONCAT('وظیفه ', t.title, ' از تاریخ ', DATE_FORMAT(t.due_date, '%Y-%m-%d'), ' معوق شده است') as message,
        'high' as priority,
        t.due_date as created_at
      FROM tasks t
      LEFT JOIN task_assignees ta ON t.id = ta.task_id
      WHERE t.due_date < CURDATE() 
      AND t.status != 'completed'
      ${isAdmin ? '' : `AND ta.user_id = '${userId}'`}
      
      UNION ALL
      
      SELECT 
        'follow_up_needed' as type,
        CONCAT('پیگیری مشتری: ', c.name) as title,
        CONCAT('مشتری ', c.name, ' نیاز به پیگیری دارد') as message,
        'medium' as priority,
        c.updated_at as created_at
      FROM customers c
      WHERE c.status = 'prospect' 
      AND c.updated_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
      ${isAdmin ? '' : `AND c.assigned_to = '${userId}'`}
      
      ORDER BY priority DESC, created_at DESC
      LIMIT 5
    `);

        return NextResponse.json({
            success: true,
            data: {
                currentUser: {
                    id: currentUser.id,
                    name: currentUser.name,
                    role: currentUser.role,
                    isAdmin
                },
                teamActivities,
                todaySchedule,
                recentCustomers,
                quickStats: quickStats[0] || {
                    active_customers: 0,
                    pending_tasks: 0,
                    active_deals: 0,
                    open_tickets: 0
                },
                userActivityReport,
                alerts
            }
        });

    } catch (error) {
        console.error('Get admin dashboard API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در دریافت اطلاعات داشبورد' },
            { status: 500 }
        );
    }
}