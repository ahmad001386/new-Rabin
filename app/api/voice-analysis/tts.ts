import type { NextApiRequest, NextApiResponse } from 'next';

const GOOGLE_CLOUD_TTS_API_KEY = process.env.GOOGLE_CLOUD_TTS_API_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  if (!GOOGLE_CLOUD_TTS_API_KEY) {
    return res.status(500).json({ success: false, message: 'Google Cloud TTS API key not configured' });
  }

  const { text, languageCode = 'fa-IR', voiceName = 'fa-IR-Wavenet-A', audioEncoding = 'MP3' } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid or missing text parameter' });
  }

  try {
    const ttsRequestBody = {
      input: { text },
      voice: {
        languageCode,
        name: voiceName,
        ssmlGender: 'FEMALE',
      },
      audioConfig: {
        audioEncoding,
      },
    };

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_CLOUD_TTS_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ttsRequestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ success: false, message: 'TTS API error', error: errorData });
    }

    const data = await response.json();

    if (!data.audioContent) {
      return res.status(500).json({ success: false, message: 'No audio content returned from TTS API' });
    }

    // Return base64 audio content
    return res.status(200).json({ success: true, audioContent: data.audioContent });
  } catch (error) {
    console.error('Error calling Google Cloud TTS API:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
