// Text-to-Speech utility using Google TTS API
export class TextToSpeechService {
    private apiKey: string;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_TTS_API_KEY || '';
    }

    // Method 1: Google Translate TTS (Free but limited)
    async speakWithGoogleTranslate(text: string, lang: string = 'fa'): Promise<void> {
        try {
            // Split text into smaller chunks (Google TTS has character limits)
            const chunks = this.splitTextIntoChunks(text, 200);

            for (const chunk of chunks) {
                await this.playGoogleTTSViaAPI(chunk, lang);
                // Small delay between chunks
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        } catch (error) {
            console.error('Google Translate TTS error:', error);
            throw error;
        }
    }

    private splitTextIntoChunks(text: string, maxLength: number): string[] {
        if (text.length <= maxLength) return [text];

        const chunks: string[] = [];
        const sentences = text.split(/[.!?؟۔]\s*/);
        let currentChunk = '';

        for (const sentence of sentences) {
            if ((currentChunk + sentence).length <= maxLength) {
                currentChunk += (currentChunk ? ' ' : '') + sentence;
            } else {
                if (currentChunk) chunks.push(currentChunk);
                currentChunk = sentence;
            }
        }

        if (currentChunk) chunks.push(currentChunk);
        return chunks;
    }

    private async playGoogleTTSViaAPI(text: string, lang: string): Promise<void> {
        try {
            const response = await fetch('/api/tts/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, lang }),
            });

            const data = await response.json();

            if (data.success && data.audioContent) {
                // Create audio from base64 data
                const audioBlob = new Blob([
                    Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))
                ], { type: 'audio/mpeg' });

                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);

                return new Promise((resolve, reject) => {
                    audio.onended = () => {
                        URL.revokeObjectURL(audioUrl);
                        resolve();
                    };
                    audio.onerror = () => {
                        URL.revokeObjectURL(audioUrl);
                        reject(new Error('Failed to play audio'));
                    };
                    audio.play().catch(reject);
                });
            } else {
                throw new Error(data.message || 'TTS API failed');
            }
        } catch (error) {
            console.error('TTS API error:', error);
            // Fallback to direct method
            return this.playGoogleTTSChunk(text, lang);
        }
    }

    private async playGoogleTTSChunk(text: string, lang: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const encodedText = encodeURIComponent(text);

            // Try multiple Google TTS endpoints
            const urls = [
                `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=tw-ob&tk=1`,
                `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=gtx`,
                `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=tw-ob`
            ];

            let currentUrlIndex = 0;

            const tryNextUrl = () => {
                if (currentUrlIndex >= urls.length) {
                    // If all Google URLs fail, fallback to browser TTS
                    console.log('All Google TTS URLs failed, using browser fallback');
                    this.speakWithBrowserTTS(text, lang === 'fa' ? 'fa-IR' : lang)
                        .then(resolve)
                        .catch(reject);
                    return;
                }

                const audio = new Audio();
                const currentUrl = urls[currentUrlIndex];

                audio.oncanplaythrough = () => {
                    audio.play()
                        .then(() => {
                            audio.onended = () => resolve();
                        })
                        .catch(() => {
                            currentUrlIndex++;
                            tryNextUrl();
                        });
                };

                audio.onerror = () => {
                    currentUrlIndex++;
                    tryNextUrl();
                };

                // Set a timeout for loading
                const timeout = setTimeout(() => {
                    currentUrlIndex++;
                    tryNextUrl();
                }, 3000);

                audio.onloadstart = () => clearTimeout(timeout);
                audio.src = currentUrl;
                audio.load();
            };

            tryNextUrl();
        });
    }

    // Method 2: Google Cloud Text-to-Speech API (Requires API key)
    async speakWithGoogleCloud(text: string, lang: string = 'fa-IR'): Promise<void> {
        if (!this.apiKey) {
            throw new Error('Google Cloud TTS API key is required');
        }

        try {
            const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: { text },
                    voice: {
                        languageCode: lang,
                        name: lang === 'fa-IR' ? 'fa-IR-Standard-A' : 'en-US-Standard-A',
                        ssmlGender: 'FEMALE'
                    },
                    audioConfig: {
                        audioEncoding: 'MP3',
                        speakingRate: 0.9,
                        pitch: 0.0,
                        volumeGainDb: 0.0
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Google Cloud TTS API error: ${response.status}`);
            }

            const data = await response.json();
            const audioContent = data.audioContent;

            // Convert base64 to audio and play
            const audioBlob = new Blob([
                Uint8Array.from(atob(audioContent), c => c.charCodeAt(0))
            ], { type: 'audio/mp3' });

            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            return new Promise((resolve, reject) => {
                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    resolve();
                };
                audio.onerror = () => {
                    URL.revokeObjectURL(audioUrl);
                    reject(new Error('Failed to play audio'));
                };
                audio.play().catch(reject);
            });
        } catch (error) {
            console.error('Google Cloud TTS error:', error);
            throw error;
        }
    }

    // Method 3: ResponsiveVoice (Free with attribution)
    async speakWithResponsiveVoice(text: string, voice: string = 'Persian Female'): Promise<void> {
        return new Promise((resolve, reject) => {
            // Load ResponsiveVoice if not already loaded
            if (!(window as any).responsiveVoice) {
                const script = document.createElement('script');
                script.src = 'https://code.responsivevoice.org/responsivevoice.js?key=YOUR_KEY'; // You can get a free key
                script.onload = () => {
                    this.playWithResponsiveVoice(text, voice, resolve, reject);
                };
                script.onerror = () => reject(new Error('Failed to load ResponsiveVoice'));
                document.head.appendChild(script);
            } else {
                this.playWithResponsiveVoice(text, voice, resolve, reject);
            }
        });
    }

    private playWithResponsiveVoice(text: string, voice: string, resolve: () => void, reject: (error: Error) => void) {
        const rv = (window as any).responsiveVoice;
        if (rv) {
            rv.speak(text, voice, {
                onend: resolve,
                onerror: () => reject(new Error('ResponsiveVoice playback failed')),
                rate: 0.8,
                pitch: 1,
                volume: 0.9
            });
        } else {
            reject(new Error('ResponsiveVoice not available'));
        }
    }

    // Method 4: Fallback to browser's built-in TTS with better Persian support
    async speakWithBrowserTTS(text: string, lang: string = 'fa-IR'): Promise<void> {
        if (!('speechSynthesis' in window)) {
            throw new Error('Speech synthesis not supported');
        }

        return new Promise((resolve, reject) => {
            // Wait for voices to be loaded
            const loadVoices = () => {
                const voices = speechSynthesis.getVoices();
                console.log('🔊 Available voices:', voices.map(v => ({ name: v.name, lang: v.lang })));

                const utterance = new SpeechSynthesisUtterance(text);

                // Try to find the best voice for Persian
                let selectedVoice = null;

                // Priority 1: Exact Persian voices
                selectedVoice = voices.find(voice =>
                    voice.lang === 'fa-IR' || voice.lang === 'fa'
                );

                // Priority 2: Persian-like voices
                if (!selectedVoice) {
                    selectedVoice = voices.find(voice =>
                        voice.lang.startsWith('fa') ||
                        voice.name.toLowerCase().includes('persian') ||
                        voice.name.toLowerCase().includes('farsi')
                    );
                }

                // Priority 3: Arabic voices (similar pronunciation)
                if (!selectedVoice) {
                    selectedVoice = voices.find(voice =>
                        voice.lang === 'ar-SA' ||
                        voice.lang === 'ar' ||
                        voice.lang.startsWith('ar')
                    );
                }

                // Priority 4: Any female voice for better pronunciation
                if (!selectedVoice) {
                    selectedVoice = voices.find(voice =>
                        voice.name.toLowerCase().includes('female') ||
                        voice.name.toLowerCase().includes('woman') ||
                        voice.name.toLowerCase().includes('زن')
                    );
                }

                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                    console.log('✅ Selected voice:', selectedVoice.name, selectedVoice.lang);
                } else {
                    console.log('⚠️ No specific voice found, using default');
                }

                // Optimize settings for Persian
                utterance.lang = lang;
                utterance.rate = 0.6; // Very slow for better Persian pronunciation
                utterance.pitch = 1.0; // Normal pitch
                utterance.volume = 1.0; // Full volume

                utterance.onstart = () => {
                    console.log('🎵 Speech started');
                };

                utterance.onend = () => {
                    console.log('✅ Speech ended successfully');
                    resolve();
                };

                utterance.onerror = (event) => {
                    console.error('❌ Speech error:', event);
                    reject(new Error(`Speech synthesis error: ${event.error}`));
                };

                // Cancel any ongoing speech
                speechSynthesis.cancel();

                // Small delay to ensure cancellation
                setTimeout(() => {
                    console.log('🚀 Starting speech synthesis...');
                    speechSynthesis.speak(utterance);
                }, 100);
            };

            // Check if voices are already loaded
            if (speechSynthesis.getVoices().length > 0) {
                loadVoices();
            } else {
                // Wait for voices to load
                console.log('⏳ Waiting for voices to load...');
                speechSynthesis.onvoiceschanged = () => {
                    loadVoices();
                    speechSynthesis.onvoiceschanged = null;
                };
            }
        });
    }

    // Smart method that tries different approaches
    async speak(text: string, options: {
        preferredMethod?: 'browser' | 'google-translate' | 'google-cloud' | 'responsive-voice';
        lang?: string;
        fallback?: boolean;
    } = {}): Promise<void> {
        const { preferredMethod = 'browser', lang = 'fa', fallback = true } = options;

        console.log(`🎯 Starting TTS with method: ${preferredMethod}, lang: ${lang}`);

        try {
            switch (preferredMethod) {
                case 'browser':
                    await this.speakWithBrowserTTS(text, lang === 'fa' ? 'fa-IR' : lang);
                    break;
                case 'google-cloud':
                    await this.speakWithGoogleCloud(text, lang === 'fa' ? 'fa-IR' : lang);
                    break;
                case 'responsive-voice':
                    await this.speakWithResponsiveVoice(text, 'Persian Female');
                    break;
                case 'google-translate':
                default:
                    // Google Translate is not working, fallback to browser immediately
                    console.log('⚠️ Google Translate TTS is not available, using browser TTS');
                    await this.speakWithBrowserTTS(text, lang === 'fa' ? 'fa-IR' : lang);
                    break;
            }
        } catch (error) {
            console.error(`❌ TTS method ${preferredMethod} failed:`, error);

            if (fallback && preferredMethod !== 'browser') {
                console.log('🔄 Falling back to browser TTS...');
                try {
                    await this.speakWithBrowserTTS(text, lang === 'fa' ? 'fa-IR' : lang);
                } catch (fallbackError) {
                    console.error('❌ Fallback TTS also failed:', fallbackError);
                    throw fallbackError;
                }
            } else {
                throw error;
            }
        }
    }

    // Stop any ongoing speech
    stop(): void {
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }

        if ((window as any).responsiveVoice) {
            (window as any).responsiveVoice.cancel();
        }
    }
}

// Export a singleton instance
export const ttsService = new TextToSpeechService();