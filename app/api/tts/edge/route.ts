import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { text, lang = 'fa-IR' } = await req.json();

        if (!text) {
            return NextResponse.json(
                { success: false, message: 'متن ارسال نشده است' },
                { status: 400 }
            );
        }

        // Microsoft Edge TTS API
        const voiceMap: { [key: string]: string } = {
            'fa': 'fa-IR-DilaraNeural',
            'fa-IR': 'fa-IR-DilaraNeural',
            'en': 'en-US-JennyNeural',
            'en-US': 'en-US-JennyNeural'
        };

        const voice = voiceMap[lang] || 'fa-IR-DilaraNeural';

        // Create SSML for better pronunciation
        const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}">
        <voice name="${voice}">
          <prosody rate="0.8" pitch="0Hz">
            ${text}
          </prosody>
        </voice>
      </speak>
    `;

        try {
            // Try Microsoft Edge TTS API
            const response = await fetch('https://speech.platform.bing.com/synthesize', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + generateToken(),
                    'Content-Type': 'application/ssml+xml',
                    'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                body: ssml
            });

            if (response.ok) {
                const audioBuffer = await response.arrayBuffer();
                const base64Audio = Buffer.from(audioBuffer).toString('base64');

                return NextResponse.json({
                    success: true,
                    audioContent: base64Audio,
                    contentType: 'audio/mpeg',
                    voice: voice,
                    message: 'صدا با موفقیت تولید شد (Microsoft Edge TTS)'
                });
            }
        } catch (edgeError) {
            console.log('Edge TTS failed, trying alternative...');
        }

        // Fallback: Use a simple TTS proxy
        try {
            const proxyResponse = await fetch(`https://api.voicerss.org/?key=demo&hl=${lang}&src=${encodeURIComponent(text)}&f=48khz_16bit_mono`);

            if (proxyResponse.ok) {
                const audioBuffer = await proxyResponse.arrayBuffer();
                const base64Audio = Buffer.from(audioBuffer).toString('base64');

                return NextResponse.json({
                    success: true,
                    audioContent: base64Audio,
                    contentType: 'audio/wav',
                    voice: 'VoiceRSS',
                    message: 'صدا با موفقیت تولید شد (VoiceRSS)'
                });
            }
        } catch (voiceRssError) {
            console.log('VoiceRSS also failed');
        }

        return NextResponse.json(
            { success: false, message: 'تمام سرویس‌های TTS در دسترس نیستند' },
            { status: 503 }
        );

    } catch (error) {
        console.error('TTS API error:', error);
        return NextResponse.json(
            { success: false, message: 'خطا در سرویس TTS' },
            { status: 500 }
        );
    }
}

function generateToken(): string {
    // Simple token generation for demo
    return 'demo-token-' + Date.now();
}