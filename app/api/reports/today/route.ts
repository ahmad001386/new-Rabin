import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getUserFromToken } from '@/lib/auth';

// GET /api/reports/today - Get today's report for current user
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