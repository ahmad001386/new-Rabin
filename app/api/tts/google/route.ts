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

        // Encode text for URL
        const encodedText = encodeURIComponent(text);

        // Try different Google TTS endpoints
        const urls = [
            `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=tw-ob&tk=1`,
            `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=gtx`,
            `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=tw-ob`
        ];

        let audioBuffer = null;
        let successUrl = null;

        // Try each URL until one works
        for (const url of urls) {
            try {
                console.log(`Trying TTS URL: ${url}`);

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        'Accept': 'audio/mpeg, audio/*, */*',
                        'Accept-Language': 'fa,en;q=0.9',
                        'Referer': 'https://translate.google.com/',
                    },
                });

                if (response.ok && response.headers.get('content-type')?.includes('audio')) {
                    audioBuffer = await response.arrayBuffer();
                    successUrl = url;
                    console.log(`✅ TTS successful with URL: ${url}`);
                    break;
                } else {
                    console.log(`❌ TTS failed with URL: ${url}, status: ${response.status}`);
                }
            } catch (error) {
                console.log(`❌ TTS error with URL: ${url}`, error);
                continue;
            }
        }

        if (!audioBuffer) {
            return NextResponse.json(
                { success: false, message: 'تمام سرویس‌های TTS در دسترس نیستند' },
                { status: 503 }
            );
        }

        // Convert to base64 for client
        const base64Audio = Buffer.from(audioBuffer).toString('base64');

        return NextResponse.json({
            success: true,
            audioContent: base64Audio,
            contentType: 'audio/mpeg',
            usedUrl: successUrl,
            message: 'صدا با موفقیت تولید شد'
        });

    } catch (error) {
        console.error('TTS API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در سرویس TTS' },
            { status: 500 }
        );
    }
}