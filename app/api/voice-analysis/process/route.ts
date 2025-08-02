import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getUserFromToken } from '@/lib/auth';

// POST /api/voice-analysis/process - Process voice command
export async function POST(req: NextRequest) {
    try {
        // Get token from cookie or Authorization header
        const token = req.cookies.get('auth-token')?.value ||
            req.headers.get('authorization')?.replace('Bearer ', '');

        console.log('API: Token received:', token ? 'Yes' : 'No');
        console.log('API: Cookie token:', req.cookies.get('auth-token')?.value ? 'Yes' : 'No');
        console.log('API: Header token:', req.headers.get('authorization') ? 'Yes' : 'No');

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'توکن یافت نشد' },
                { status: 401 }
            );
        }

        const userId = await getUserFromToken(token);
        console.log('API: User ID from token:', userId);

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'توکن نامعتبر است' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { text, employeeName } = body;

        if (!text || !employeeName) {
            return NextResponse.json(
                { success: false, message: 'متن و نام همکار الزامی است' },
                { status: 400 }
            );
        }

        // Search for employee by name
        const employees = await executeQuery(`
            SELECT id, name, role 
            FROM users 
            WHERE name LIKE ? AND status = 'active'
            ORDER BY name
            LIMIT 5
        `, [`%${employeeName}%`]);

        if (employees.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    employee_found: false,
                    employee_name: employeeName,
                    text: text
                }
            });
        }

        // Take the first match (you could improve this with better matching logic)
        const employee = employees[0];

        // Get recent reports for this employee (last 7 days)
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const reports = await executeQuery(`
            SELECT 
                dr.*,
                u.name as user_name,
                u.role as user_role
            FROM daily_reports dr
            LEFT JOIN users u ON dr.user_id = u.id
            WHERE dr.user_id = ? 
            AND dr.report_date BETWEEN ? AND ?
            ORDER BY dr.report_date DESC
            LIMIT 10
        `, [employee.id, startDate, endDate]);

        if (reports.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    employee_found: true,
                    employee_name: employee.name,
                    text: text,
                    analysis: `همکار ${employee.name} در 7 روز گذشته هیچ گزارشی ثبت نکرده است.`
                }
            });
        }

        // Get tasks for each report if completed_tasks exists
        for (let report of reports) {
            if (report.completed_tasks) {
                try {
                    const taskIds = JSON.parse(report.completed_tasks);
                    if (taskIds && taskIds.length > 0) {
                        const tasks = await executeQuery(`
                            SELECT id, title, status, description
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

        // Prepare data for AI analysis (similar to reports analyze endpoint)
        const analysisData = {
            user_name: employee.name,
            user_role: employee.role,
            period: {
                start_date: startDate,
                end_date: endDate,
                total_days: reports.length
            },
            reports: reports.map(report => ({
                date: report.report_date,
                persian_date: report.persian_date,
                work_description: report.work_description,
                working_hours: report.working_hours,
                challenges: report.challenges,
                achievements: report.achievements,
                tasks: report.tasks || []
            }))
        };

        // Create analysis prompt
        const analysisPrompt = `
تحلیل گزارشات کاری ${analysisData.user_name} (${analysisData.user_role})

دوره: ${analysisData.period.start_date} تا ${analysisData.period.end_date} (${analysisData.period.total_days} روز)

گزارشات:
${analysisData.reports.map((report, index) => `
روز ${index + 1} (${report.persian_date || report.date}):
- کار انجام شده: ${report.work_description}
- ساعات کاری: ${report.working_hours || 'ثبت نشده'}
- چالش‌ها: ${report.challenges || 'ندارد'}
- دستاوردها: ${report.achievements || 'ندارد'}
- تسک‌ها: ${report.tasks.length > 0 ? report.tasks.map((t: any) => t.title).join('، ') : 'ندارد'}
`).join('\n')}

لطفاً تحلیل کوتاه و مفیدی ارائه دهید شامل:

1. خلاصه عملکرد کلی
2. نقاط قوت اصلی
3. چالش‌های مهم
4. پیشنهادات بهبود
5. ارزیابی کلی (عالی/خوب/متوسط/ضعیف)

پاسخ را به زبان فارسی و کوتاه بنویسید.
        `;

        // Send to AI API
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

            const encodedPrompt = encodeURIComponent(analysisPrompt);
            const aiResponse = await fetch(`https://mine-gpt-alpha.vercel.app/proxy?text=${encodedPrompt}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!aiResponse.ok) {
                throw new Error(`AI API error: ${aiResponse.status}`);
            }

            const aiResult = await aiResponse.json();
            const analysis = aiResult.answer || aiResult.response || aiResult.text || aiResult;

            return NextResponse.json({
                success: true,
                data: {
                    employee_found: true,
                    employee_name: employee.name,
                    employee_role: employee.role,
                    text: text,
                    reports_count: reports.length,
                    analysis: analysis,
                    period: `${startDate} تا ${endDate}`
                }
            });

        } catch (aiError) {
            console.error('AI API error:', aiError);

            // Fallback analysis if AI fails
            const totalHours = reports.reduce((sum, r) => sum + (parseFloat(r.working_hours) || 0), 0);
            const avgHours = reports.filter(r => r.working_hours).length > 0 ?
                (totalHours / reports.filter(r => r.working_hours).length).toFixed(1) : 'نامشخص';
            const challengesCount = reports.filter(r => r.challenges && r.challenges.trim()).length;
            const achievementsCount = reports.filter(r => r.achievements && r.achievements.trim()).length;

            const fallbackAnalysis = `
📊 تحلیل خودکار گزارشات ${employee.name}

⚠️ سرویس تحلیل هوش مصنوعی در دسترس نیست.

📈 خلاصه کلی عملکرد:
در بازه زمانی ${startDate} تا ${endDate}، همکار ${employee.name} تعداد ${reports.length} گزارش روزانه ثبت کرده است.

📊 آمار کلیدی:
- تعداد روزهای گزارش شده: ${reports.length} روز
- مجموع ساعات کاری: ${totalHours} ساعت
- میانگین ساعات کاری روزانه: ${avgHours} ساعت
- تعداد چالش‌های ثبت شده: ${challengesCount} مورد
- تعداد دستاورد‌های ثبت شده: ${achievementsCount} مورد

🎯 ارزیابی اولیه:
${reports.length >= 5 ? '✅ انضباط خوب در گزارش‌دهی' : '⚠️ نیاز به بهبود در گزارش‌دهی'}
${avgHours !== 'نامشخص' && parseFloat(avgHours) >= 8 ? '✅ ساعات کاری مناسب' : '⚠️ نیاز به بررسی ساعات کاری'}
            `;

            return NextResponse.json({
                success: true,
                data: {
                    employee_found: true,
                    employee_name: employee.name,
                    employee_role: employee.role,
                    text: text,
                    reports_count: reports.length,
                    analysis: fallbackAnalysis,
                    period: `${startDate} تا ${endDate}`,
                    ai_error: true
                }
            });
        }

    } catch (error) {
        console.error('Voice analysis API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در پردازش دستور صوتی' },
            { status: 500 }
        );
    }
}