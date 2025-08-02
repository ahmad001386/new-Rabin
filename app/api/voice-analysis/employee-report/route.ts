import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { employeeName } = await request.json();

    if (!employeeName || employeeName.trim().length === 0) {
      return NextResponse.json({
        success: false,
        message: 'نام همکار الزامی است'
      }, { status: 400 });
    }

    // Search for employee in database
    // Since we're transitioning to Supabase, we'll simulate the search for now
    // In a real implementation, this would query the Supabase users table
    
    const mockEmployeeData = await searchEmployee(employeeName.trim());
    
    if (mockEmployeeData.found) {
      return NextResponse.json({
        success: true,
        data: {
          employee_name: mockEmployeeData.name,
          employee_found: true,
          analysis: mockEmployeeData.analysis,
          performance_summary: mockEmployeeData.performance_summary,
          last_activity: mockEmployeeData.last_activity
        }
      });
    } else {
      return NextResponse.json({
        success: true,
        data: {
          employee_name: employeeName,
          employee_found: false,
          analysis: `همکار "${employeeName}" در سیستم یافت نشد.`
        }
      });
    }

  } catch (error) {
    console.error('Employee report error:', error);
    return NextResponse.json({
      success: false,
      message: 'خطای داخلی سرور'
    }, { status: 500 });
  }
}

// Mock function to simulate employee search
// In production, this would be replaced with actual Supabase queries
async function searchEmployee(name: string) {
  const mockEmployees = [
    {
      name: 'احمدرضا آوندی',
      found: true,
      analysis: `گزارش عملکرد احمدرضا آوندی:

📊 فعالیت‌های این هفته:
• 12 تماس تلفنی با مشتریان
• 8 جلسه حضوری برگزار شده
• 3 پروپوزال ارسال شده
• 2 قرارداد بسته شده

📈 وضعیت فروش:
• هدف ماهانه: 50 میلیون تومان
• فروش تحقق یافته: 32 میلیون تومان
• درصد تحقق: 64 درصد

✅ نقاط قوت:
• نرخ تبدیل لید بالا
• رضایت مشتریان عالی
• پیگیری مؤثر

⚠️ نکات بهبود:
• افزایش تعداد تماس‌های روزانه
• تمرکز بیشتر روی مشتریان جدید`,
      performance_summary: 'عملکرد خوب با امکان بهبود در بخش مشتریان جدید',
      last_activity: 'امروز - تماس با مشتری شرکت پارس'
    },
    {
      name: 'علی محمدی',
      found: true,
      analysis: `گزارش عملکرد علی محمدی:

📊 فعالیت‌های این هفته:
• 15 تماس تلفنی با مشتریان
• 5 جلسه آنلاین
• 4 پیشنهاد قیمت ارسالی
• 1 قرارداد در حال مذاکره

📈 وضعیت فروش:
• هدف ماهانه: 40 میلیون تومان
• فروش تحقق یافته: 28 میلیون تومان
• درصد تحقق: 70 درصد

✅ نقاط قوت:
• مهارت مذاکره عالی
• دانش فنی مناسب
• ارتباط مؤثر با مشتریان

⚠️ نکات بهبود:
• کاهش زمان چرخه فروش
• افزایش دنبال‌کردن لیدها`,
      performance_summary: 'عملکرد مطلوب با پیشرفت مثبت',
      last_activity: 'دیروز - ارسال پروپوزال به شرکت سایپا'
    },
    {
      name: 'سارا احمدی',
      found: true,
      analysis: `گزارش عملکرد سارا احمدی:

📊 فعالیت‌های این هفته:
• 18 تماس تلفنی با مشتریان
• 10 ایمیل پیگیری
• 6 میتینگ مشتری
• 3 قرارداد تکمیل شده

📈 وضعیت فروش:
• هدف ماهانه: 60 میلیون تومان
• فروش تحقق یافته: 45 میلیون تومان
• درصد تحقق: 75 درصد

✅ نقاط قوت:
• بالاترین نرخ بستن قرارداد
• مدیریت زمان عالی
• روابط طنی مناسب

⚠️ نکات بهبود:
• توسعه شبکه مشتریان
• کار روی پروژه‌های بزرگ‌تر`,
      performance_summary: 'عملکرد بسیار خوب و قابل تحسین',
      last_activity: 'امروز - بستن قرارداد 15 میلیونی'
    }
  ];

  // Simple name matching
  const employee = mockEmployees.find(emp => 
    emp.name.includes(name) || 
    name.includes(emp.name.split(' ')[0]) ||
    name.includes(emp.name.split(' ')[1])
  );

  if (employee) {
    return employee;
  }

  return { found: false, name };
}