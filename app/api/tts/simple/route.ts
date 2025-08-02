import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { text, lang = 'fa' } = await req.json();

        if (!text) {
            return NextResponse.json(
                { success: false, message: 'متن ارسال نشده است' },
                { status: 400 }
            );
        }

        // Use a simple TTS service that works
        const encodedText = encodeURIComponent(text);

        // Try VoiceRSS (has free tier and supports Persian)
        try {
            const voiceRssUrl = `https://api.voicerss.org/?key=undefined&hl=${lang}&src=${encodedText}&f=48khz_16bit_mono&c=mp3`;

            const response = await fetch(voiceRssUrl);

            if (response.ok && response.headers.get('content-type')?.includes('audio')) {
                const audioBuffer = await response.arrayBuffer();
                const base64Audio = Buffer.from(audioBuffer).toString('base64');

                return NextResponse.json({
                    success: true,
                    audioContent: base64Audio,
                    contentType: 'audio/mpeg',
                    service: 'VoiceRSS',
                    message: 'صدا با موفقیت تولید شد'
                });
            }
        } catch (error) {
            console.log('VoiceRSS failed:', error);
        }

        // Fallback: Return success but let client use browser TTS
        return NextResponse.json({
            success: false,
            fallbackToBrowser: true,
            message: 'از صدای مرورگر استفاده می‌شود'
        });

    } catch (error) {
        console.error('Simple TTS API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در سرویس TTS' },
            { status: 500 }
        );
    }
}