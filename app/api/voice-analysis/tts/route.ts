import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json(
                { success: false, message: 'متن ارسال نشده است' },
                { status: 400 }
            );
        }

        // For now, return a simple response indicating TTS is not available
        // In a real implementation, you would integrate with a TTS service like:
        // - Google Cloud Text-to-Speech
        // - Amazon Polly
        // - Microsoft Speech Services
        // - Or any other Persian TTS service

        return NextResponse.json({
            success: false,
            message: 'سرویس TTS فعلاً در دسترس نیست. از صدای مرورگر استفاده می‌شود.',
            fallbackToBrowser: true
        });

    } catch (error) {
        console.error('TTS API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در سرویس TTS' },
            { status: 500 }
        );
    }
}