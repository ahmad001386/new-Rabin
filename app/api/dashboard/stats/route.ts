import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { hasPermission } from '@/lib/auth';

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(req: NextRequest) {
  try {
    const userRole = req.headers.get('x-user-role');
    const userId = req.headers.get('x-user-id');

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'month'; // month, quarter, year

    let dateFilter = '';
    switch (period) {
      case 'week':
        dateFilter = 'AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 1 WEEK)';
        break;
      case 'month':
        dateFilter = 'AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
        break;
      case 'quarter':
        dateFilter = 'AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)';
        break;
      case 'year':
        dateFilter = 'AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
        break;
    }

    // Get basic counts
    const [customerStats] = await executeQuery(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_customers,
        COUNT(CASE WHEN status = 'prospect' THEN 1 END) as prospects
      FROM customers 
      WHERE 1=1 ${hasPermission(userRole || '', ['ceo', 'مدیر']) ? '' : `AND assigned_to = '${userId}'`}
    `);

    const [dealStats] = await executeQuery(`
      SELECT 
        COUNT(*) as total_deals,
        SUM(total_value) as total_value,
        AVG(probability) as avg_probability,
        COUNT(CASE WHEN ps.code = 'closed_won' THEN 1 END) as won_deals,
        SUM(CASE WHEN ps.code = 'closed_won' THEN total_value ELSE 0 END) as won_value
      FROM deals d
      LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
      WHERE 1=1 ${hasPermission(userRole || '', ['ceo', 'مدیر']) ? '' : `AND d.assigned_to = '${userId}'`}
      ${dateFilter}
    `);

    const [ticketStats] = await executeQuery(`
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tickets,
        AVG(CASE WHEN resolution_time IS NOT NULL THEN resolution_time END) as avg_resolution_time
      FROM tickets
      WHERE 1=1 ${hasPermission(userRole || '', ['ceo', 'مدیر']) ? '' : `AND assigned_to = '${userId}'`}
      ${dateFilter}
    `);

    const [feedbackStats] = await executeQuery(`
      SELECT 
        COUNT(*) as total_feedback,
        AVG(score) as avg_satisfaction_score,
        COUNT(CASE WHEN type = 'complaint' THEN 1 END) as complaints,
        COUNT(CASE WHEN type = 'praise' THEN 1 END) as praise
      FROM feedback
      WHERE 1=1 ${dateFilter}
    `);

    // Get sales trend data for charts
    const salesTrend = await executeQuery(`
      SELECT 
        DATE_FORMAT(actual_close_date, '%Y-%m') as month,
        SUM(total_value) as revenue,
        COUNT(*) as deals_count
      FROM deals d
      LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
      WHERE ps.code = 'closed_won'
      AND actual_close_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      ${hasPermission(userRole || '', ['ceo', 'مدیر']) ? '' : `AND d.assigned_to = '${userId}'`}
      GROUP BY DATE_FORMAT(actual_close_date, '%Y-%m')
      ORDER BY month
    `);

    // Get recent activities
    const recentActivities = await executeQuery(`
      SELECT 
        a.id,
        a.type,
        a.title,
        a.description,
        a.start_time,
        a.performed_by,
        u.name as performed_by_name,
        c.name as customer_name
      FROM activities a
      LEFT JOIN users u ON a.performed_by = u.id
      LEFT JOIN customers c ON a.customer_id = c.id
      WHERE 1=1 ${hasPermission(userRole || '', ['ceo', 'مدیر']) ? '' : `AND a.performed_by = '${userId}'`}
      ORDER BY a.start_time DESC
      LIMIT 10
    `);

    // Get pipeline overview
    const pipelineOverview = await executeQuery(`
      SELECT 
        ps.name as stage_name,
        ps.code as stage_code,
        ps.stage_order,
        COUNT(d.id) as deals_count,
        SUM(d.total_value) as total_value,
        AVG(d.probability) as avg_probability
      FROM pipeline_stages ps
      LEFT JOIN deals d ON ps.id = d.stage_id
      ${hasPermission(userRole || '', ['ceo', 'مدیر']) ? '' : `AND d.assigned_to = '${userId}'`}
      WHERE ps.is_active = true
      GROUP BY ps.id, ps.name, ps.code, ps.stage_order
      ORDER BY ps.stage_order
    `);

    return NextResponse.json({
      success: true,
      data: {
        customers: customerStats,
        deals: dealStats,
        tickets: ticketStats,
        feedback: feedbackStats,
        salesTrend,
        recentActivities,
        pipelineOverview,
        period
      }
    });
  } catch (error) {
    console.error('Get dashboard stats API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت آمار داشبورد' },
      { status: 500 }
    );
  }
}