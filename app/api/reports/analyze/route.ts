import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getUserFromToken } from '@/lib/auth';
import moment from 'moment-jalaali';

// POST /api/reports/analyze - Analyze reports with AI
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
        const body = await req.json();
        const { user_id, start_date, end_date } = body;

        // Validation
        if (!user_id || !start_date || !end_date) {
            return NextResponse.json(
                { success: false, message: 'کاربر و بازه زمانی الزامی است' },
                { status: 400 }
            );
        }

        // Check if user is manager/CEO or requesting own reports
        const isManager = ['ceo', 'مدیر', 'sales_manager', 'مدیر فروش'].includes(user.role);

        if (!isManager && user_id !== user.id) {
            return NextResponse.json(
                { success: false, message: 'شما فقط می‌توانید گزارشات خود را تحلیل کنید' },
                { status: 403 }
            );
        }

        // Get user info for the selected user
        const selectedUser = await executeQuery(`
            SELECT name, role FROM users WHERE id = ? AND status = 'active'
        `, [user_id]);

        if (selectedUser.length === 0) {
            return NextResponse.json(
                { success: false, message: 'کاربر انتخاب شده یافت نشد' },
                { status: 404 }
            );
        }

        // Get reports for the specified period
        const reports = await executeQuery(`
            SELECT 
                dr.*,
                u.name as user_name,
                u.role as user_role
            FROM daily_reports dr
            LEFT JOIN users u ON dr.user_id = u.id
            WHERE dr.user_id = ? 
            AND dr.report_date BETWEEN ? AND ?
            ORDER BY dr.report_date ASC
        `, [user_id, start_date, end_date]);

        if (reports.length === 0) {
            return NextResponse.json(
                { success: false, message: 'هیچ گزارشی در بازه زمانی انتخاب شده یافت نشد' },
                { status: 404 }
            );
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

        // Prepare data for AI analysis
        const analysisData = {
            user_name: selectedUser[0].name,
            user_role: selectedUser[0].role,
            period: {
                start_date,
                end_date,
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

            return NextResponse.json({
                success: true,
                data: {
                    user_info: {
                        name: selectedUser[0].name,
                        role: selectedUser[0].role
                    },
                    period: analysisData.period,
                    reports_count: reports.length,
                    analysis: aiResult.answer || aiResult.response || aiResult.text || aiResult,
                    raw_reports: reports
                }
            });

        } catch (aiError) {
            console.error('AI API error:', aiError);

            // Check if it's a timeout error
            if ((aiError as any)?.name === 'AbortError') {
                console.log('AI API request timed out, using fallback analysis');
            }

            // Fallback analysis if AI fails
            const totalHours = reports.reduce((sum, r) => sum + (parseFloat(r.working_hours) || 0), 0);
            const avgHours = reports.filter(r => r.working_hours).length > 0 ?
                (totalHours / reports.filter(r => r.working_hours).length).toFixed(1) : 'نامشخص';
            const challengesCount = reports.filter(r => r.challenges && r.challenges.trim()).length;
            const achievementsCount = reports.filter(r => r.achievements && r.achievements.trim()).length;

            const fallbackAnalysis = `
# 📊 تحلیل خودکار گزارشات ${selectedUser[0].name}

⚠️ **توجه:** سرویس تحلیل هوش مصنوعی در دسترس نیست. این تحلیل بر اساس آمار خام داده‌ها تهیه شده است.

## 📈 خلاصه کلی عملکرد
در بازه زمانی ${start_date} تا ${end_date}، همکار ${selectedUser[0].name} تعداد ${reports.length} گزارش روزانه ثبت کرده است.

## 📊 آمار کلیدی
- **تعداد روزهای گزارش شده:** ${reports.length} روز
- **مجموع ساعات کاری:** ${totalHours} ساعت
- **میانگین ساعات کاری روزانه:** ${avgHours} ساعت
- **تعداد چالش‌های ثبت شده:** ${challengesCount} مورد
- **تعداد دستاورد‌های ثبت شده:** ${achievementsCount} مورد

## 🎯 ارزیابی اولیه
${reports.length >= 20 ? '✅ انضباط بالا در گزارش‌دهی' : reports.length >= 10 ? '⚠️ انضباط متوسط در گزارش‌دهی' : '❌ نیاز به بهبود در گزارش‌دهی'}

${avgHours !== 'نامشخص' && parseFloat(avgHours) >= 8 ? '✅ ساعات کاری مناسب' : avgHours !== 'نامشخص' && parseFloat(avgHours) >= 6 ? '⚠️ ساعات کاری متوسط' : '❌ نیاز به بررسی ساعات کاری'}

${challengesCount > 0 ? '⚠️ وجود چالش‌هایی که نیاز به بررسی دارند' : '✅ عدم گزارش چالش خاص'}

${achievementsCount > 0 ? '🏆 ثبت دستاوردهای مثبت' : '⚠️ عدم ثبت دستاوردهای مشخص'}

## 💡 توصیه‌های کلی
- برای تحلیل دقیق‌تر، لطفاً از سرویس تحلیل هوش مصنوعی استفاده کنید
- بررسی جزئیات گزارشات برای درک بهتر عملکرد
- پیگیری چالش‌های ثبت شده و ارائه راهکار

**تاریخ تحلیل:** ${moment().format('jYYYY/jMM/jDD')}
            `;

            return NextResponse.json({
                success: true,
                data: {
                    user_info: {
                        name: selectedUser[0].name,
                        role: selectedUser[0].role
                    },
                    period: analysisData.period,
                    reports_count: reports.length,
                    analysis: fallbackAnalysis,
                    raw_reports: reports,
                    ai_error: true
                }
            });
        }

    } catch (error) {
        console.error('Analyze reports API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در تحلیل گزارشات' },
            { status: 500 }
        );
    }
}