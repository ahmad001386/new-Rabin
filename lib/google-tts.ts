// Google Cloud Text-to-Speech Service
export class GoogleTTS {
    private static instance: GoogleTTS;
    private apiKey: string | null = null;
    private currentAudio: HTMLAudioElement | null = null;

    static getInstance(): GoogleTTS {
        if (!GoogleTTS.instance) {
            GoogleTTS.instance = new GoogleTTS();
        }
        return GoogleTTS.instance;
    }

    constructor() {
        // Try to get API key from environment or localStorage
        this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_TTS_API_KEY ||
            (typeof window !== 'undefined' ? localStorage.getItem('google_tts_api_key') : null);
    }

    // Set API key manually
    setApiKey(apiKey: string): void {
        this.apiKey = apiKey;
        if (typeof window !== 'undefined') {
            localStorage.setItem('google_tts_api_key', apiKey);
        }
    }

    // Check if API key is available
    hasApiKey(): boolean {
        return !!this.apiKey;
    }

    // Main speak method using Google Cloud TTS
    async speak(text: string): Promise<void> {
        if (!this.apiKey) {
            throw new Error('Google TTS API key not set');
        }

        try {
            // Stop any current audio
            this.stop();

            // Clean text
            const cleanText = this.cleanText(text);
            console.log('🎵 Google TTS speaking:', cleanText.substring(0, 100) + '...');

            // Prepare request body
            const requestBody = {
                input: { text: cleanText },
                voice: {
                    languageCode: 'fa-IR', // Persian (Iran)
                    name: 'fa-IR-Standard-A', // Female voice
                    ssmlGender: 'FEMALE'
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                    speakingRate: 0.9,
                    pitch: 0.0,
                    volumeGainDb: 0.0
                }
            };

            // Call Google Cloud TTS API
            const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Google TTS API error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();

            if (!data.audioContent) {
                throw new Error('No audio content received from Google TTS');
            }

            // Convert base64 audio to blob and play
            const audioBlob = this.base64ToBlob(data.audioContent, 'audio/mp3');
            const audioUrl = URL.createObjectURL(audioBlob);

            return new Promise((resolve, reject) => {
                const audio = new Audio(audioUrl);
                this.currentAudio = audio;

                audio.onended = () => {
                    console.log('✅ Google TTS playback completed');
                    URL.revokeObjectURL(audioUrl);
                    this.currentAudio = null;
                    resolve();
                };

                audio.onerror = (error) => {
                    console.error('❌ Audio playback error:', error);
                    URL.revokeObjectURL(audioUrl);
                    this.currentAudio = null;
                    reject(new Error('Audio playback failed'));
                };

                audio.play().catch(reject);
            });

        } catch (error) {
            console.error('❌ Google TTS Error:', error);
            throw error;
        }
    }

    // Convert base64 to blob
    private base64ToBlob(base64: string, mimeType: string): Blob {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    // Clean text for better TTS
    private cleanText(text: string): string {
        return text
            // Remove markdown formatting
            .replace(/#{1,6}\s/g, '') // Remove headers
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
            .replace(/\*(.*?)\*/g, '$1') // Remove italic
            .replace(/`(.*?)`/g, '$1') // Remove code
            .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links

            // Replace English numbers with Persian words
            .replace(/1\./g, 'یک.')
            .replace(/2\./g, 'دو.')
            .replace(/3\./g, 'سه.')
            .replace(/4\./g, 'چهار.')
            .replace(/5\./g, 'پنج.')

            // Clean up extra spaces and newlines
            .replace(/\n+/g, '. ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Stop current audio
    stop(): void {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
            console.log('🔇 Google TTS stopped');
        }
    }

    // Test TTS with a simple message
    async test(): Promise<void> {
        await this.speak('سلام. این یک تست صوتی گوگل است. صدای فارسی بسیار واضح و طبیعی است.');
    }

    // Get available voices (for future use)
    async getVoices(): Promise<any[]> {
        if (!this.apiKey) {
            throw new Error('Google TTS API key not set');
        }

        try {
            const response = await fetch(`https://texttospeech.googleapis.com/v1/voices?key=${this.apiKey}`);

            if (!response.ok) {
                throw new Error(`Failed to get voices: ${response.statusText}`);
            }

            const data = await response.json();
            return data.voices || [];
        } catch (error) {
            console.error('❌ Error getting voices:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const googleTTS = GoogleTTS.getInstance();