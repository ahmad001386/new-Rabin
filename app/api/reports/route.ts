import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeSingle } from '@/lib/database';
import { getUserFromToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { toPersianDate } from '@/lib/utils/date';

// GET /api/reports - Get daily reports
export async function GET(req: NextRequest) {
    try {
      0   // Get token from cookie or Authorization header
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
        const { searchParams } = new URL(req.url);
        const date = searchParams.get('date') || '';
        const user_id = searchParams.get('user_id') || '';

        // Check if user is manager/CEO
        const isManager = ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش'].includes(user.role);

        let whereClause = 'WHERE 1=1';
        const params: any[] = [];

        // If not manager, only show own reports
        if (!isManager) {
            whereClause += ' AND dr.user_id = ?';
            params.push(user.id);
        } else if (user_id) {
            // Manager can filter by specific user
            whereClause += ' AND dr.user_id = ?';
            params.push(user_id);
        }

        if (date) {
            whereClause += ' AND dr.report_date = ?';
            params.push(date);
        }

        const reports = await executeQuery(`
      SELECT 
        dr.*,
        u.name as user_name,
        u.role as user_role
      FROM daily_reports dr
      LEFT JOIN users u ON dr.user_id = u.id
      ${whereClause}
      ORDER BY dr.report_date DESC, dr.created_at DESC
      LIMIT 100
    `, params);

        // Get tasks for each report if completed_tasks exists
        for (let report of reports) {
            if (report.completed_tasks) {
                try {
                    const taskIds = JSON.parse(report.completed_tasks);
                    if (taskIds && taskIds.length > 0) {
                        const tasks = await executeQuery(`
              SELECT id, title, status
              FROM tasks
              WHERE id IN (${taskIds.map(() => '?').join(',')})
            `, taskIds);
                        report.tasks = tasks;
                    }
                } catch (e) {
                    report.tasks = [];
                }
            } else {
                report.tasks = [];
            }
        }

        return NextResponse.json({ success: true, data: reports });
    } catch (error) {
        console.error('Get reports API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در دریافت گزارش‌ها' },
            { status: 500 }
        );
    }
}

// POST /api/reports - Create or update daily report
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

        // Check if user is CEO (CEOs don't need to submit daily reports)
        if (user.role === 'ceo' || user.role === 'مدیر') {
            return NextResponse.json(
                { success: false, message: 'مدیران عامل نیازی به ثبت گزارش روزانه ندارند' },
                { status: 403 }
            );
        }

        const body = await req.json();
        const {
            work_description,
            completed_tasks,
            working_hours,
            challenges,
            achievements,
            report_date
        } = body;

        if (!work_description || !work_description.trim()) {
            return NextResponse.json(
                { success: false, message: 'توضیحات کار انجام شده الزامی است' },
                { status: 400 }
            );
        }

        // Use today's date if not provided, ensure proper date format
        let targetDate = report_date;
        if (!targetDate) {
            targetDate = new Date().toISOString().split('T')[0];
        } else {
            // Validate and normalize the date format
            const dateObj = new Date(targetDate);
            if (isNaN(dateObj.getTime())) {
                return NextResponse.json(
                    { success: false, message: 'فرمت تاریخ نامعتبر است' },
                    { status: 400 }
                );
            }
            targetDate = dateObj.toISOString().split('T')[0];
        }

        const persianDate = toPersianDate(new Date(targetDate));

        // Check if report already exists for this date
        const existingReport = await executeQuery(`
      SELECT id FROM daily_reports 
      WHERE user_id = ? AND report_date = ?
    `, [user.id, targetDate]);

        let reportId;

        if (existingReport.length > 0) {
            // Update existing report
            reportId = existingReport[0].id;

            // Check if it's the same day (allow editing only on the same day)
            const today = new Date().toISOString().split('T')[0];
            if (targetDate !== today) {
                return NextResponse.json(
                    { success: false, message: 'فقط می‌توانید گزارش امروز را ویرایش کنید' },
                    { status: 403 }
                );
            }

            await executeSingle(`
        UPDATE daily_reports 
        SET 
          work_description = ?,
          completed_tasks = ?,
          working_hours = ?,
          challenges = ?,
          achievements = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [
                work_description,
                completed_tasks ? JSON.stringify(completed_tasks) : null,
                working_hours || null,
                challenges || null,
                achievements || null,
                reportId
            ]);

            return NextResponse.json({
                success: true,
                message: 'گزارش روزانه با موفقیت به‌روزرسانی شد',
                data: { id: reportId }
            });
        } else {
            // Create new report
            reportId = uuidv4();

            await executeSingle(`
        INSERT INTO daily_reports (
          id, user_id, report_date, persian_date, work_description,
          completed_tasks, working_hours, challenges, achievements, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
                reportId,
                user.id,
                targetDate,
                persianDate,
                work_description,
                completed_tasks ? JSON.stringify(completed_tasks) : null,
                working_hours || null,
                challenges || null,
                achievements || null
            ]);

            return NextResponse.json({
                success: true,
                message: 'گزارش روزانه با موفقیت ثبت شد',
                data: { id: reportId }
            });
        }
    } catch (error) {
        console.error('Create/Update report API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در ثبت گزارش' },
            { status: 500 }
        );
    }
}

// GET /api/reports/today - Get today's report for current user
export async function PUT(req: NextRequest) {
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

        const today = new Date().toISOString().split('T')[0];

        const todayReport = await executeQuery(`
      SELECT * FROM daily_reports 
      WHERE user_id = ? AND report_date = ?
    `, [userId, today]);

        return NextResponse.json({
            success: true,
            data: todayReport.length > 0 ? todayReport[0] : null
        });
    } catch (error) {
        console.error('Get today report API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در دریافت گزارش امروز' },
            { status: 500 }
        );
    }
}