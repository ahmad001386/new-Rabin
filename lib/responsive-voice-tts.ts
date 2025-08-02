// ResponsiveVoice.js Text-to-Speech Service
declare global {
    interface Window {
        responsiveVoice: any;
    }
}

export class ResponsiveVoiceTTS {
    private static instance: ResponsiveVoiceTTS;
    private isLoaded = false;
    private loadingPromise: Promise<void> | null = null;

    static getInstance(): ResponsiveVoiceTTS {
        if (!ResponsiveVoiceTTS.instance) {
            ResponsiveVoiceTTS.instance = new ResponsiveVoiceTTS();
        }
        return ResponsiveVoiceTTS.instance;
    }

    constructor() {
        this.loadResponsiveVoice();
    }

    // Load ResponsiveVoice.js library
    private loadResponsiveVoice(): Promise<void> {
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = new Promise((resolve, reject) => {
            if (typeof window === 'undefined') {
                reject(new Error('ResponsiveVoice requires browser environment'));
                return;
            }

            // Check if already loaded
            if (window.responsiveVoice) {
                this.isLoaded = true;
                resolve();
                return;
            }

            // Create script element
            const script = document.createElement('script');
            script.src = 'https://code.responsivevoice.org/responsivevoice.js?key=FREE';
            script.async = true;

            script.onload = () => {
                console.log('✅ ResponsiveVoice loaded successfully');
                this.isLoaded = true;
                resolve();
            };

            script.onerror = () => {
                console.error('❌ Failed to load ResponsiveVoice');
                reject(new Error('Failed to load ResponsiveVoice'));
            };

            document.head.appendChild(script);
        });

        return this.loadingPromise;
    }

    // Wait for ResponsiveVoice to be ready
    private async waitForReady(): Promise<void> {
        await this.loadResponsiveVoice();

        return new Promise((resolve) => {
            const checkReady = () => {
                if (window.responsiveVoice && window.responsiveVoice.voiceSupport()) {
                    resolve();
                } else {
                    setTimeout(checkReady, 100);
                }
            };
            checkReady();
        });
    }

    // Main speak method
    async speak(text: string): Promise<void> {
        try {
            await this.waitForReady();

            // Clean text for better pronunciation
            const cleanText = this.cleanText(text);
            console.log('🎵 ResponsiveVoice speaking:', cleanText.substring(0, 100) + '...');

            return new Promise((resolve, reject) => {
                // Stop any current speech
                this.stop();

                // Try different voice options for Persian/Arabic (best to worst)
                const voiceOptions = [
                    'Arabic Female',
                    'Arabic Male',
                    'Turkish Female',
                    'Turkish Male',
                    'Hindi Female',
                    'Hindi Male',
                    'UK English Female',
                    'US English Female',
                    'French Female',
                    'German Female'
                ];

                let currentVoiceIndex = 0;

                const trySpeak = () => {
                    const voice = voiceOptions[currentVoiceIndex];

                    window.responsiveVoice.speak(cleanText, voice, {
                        rate: 0.8,
                        pitch: 1,
                        volume: 1,
                        onstart: () => {
                            console.log(`🎵 Started speaking with voice: ${voice}`);
                        },
                        onend: () => {
                            console.log('✅ ResponsiveVoice speech completed');
                            resolve();
                        },
                        onerror: () => {
                            console.log(`❌ Voice ${voice} failed, trying next...`);
                            currentVoiceIndex++;

                            if (currentVoiceIndex < voiceOptions.length) {
                                setTimeout(trySpeak, 500);
                            } else {
                                reject(new Error('All voice options failed'));
                            }
                        }
                    });
                };

                trySpeak();
            });

        } catch (error) {
            console.error('❌ ResponsiveVoice Error:', error);
            throw error;
        }
    }

    // Clean text for better pronunciation
    private cleanText(text: string): string {
        return text
            // Remove markdown formatting
            .replace(/#{1,6}\s/g, '') // Remove headers
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
            .replace(/\*(.*?)\*/g, '$1') // Remove italic
            .replace(/`(.*?)`/g, '$1') // Remove code
            .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links

            // Replace Persian numbers with words for better pronunciation
            .replace(/۱/g, 'یک')
            .replace(/۲/g, 'دو')
            .replace(/۳/g, 'سه')
            .replace(/۴/g, 'چهار')
            .replace(/۵/g, 'پنج')
            .replace(/۶/g, 'شش')
            .replace(/۷/g, 'هفت')
            .replace(/۸/g, 'هشت')
            .replace(/۹/g, 'نه')
            .replace(/۰/g, 'صفر')

            // Replace English numbers
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

    // Stop current speech
    stop(): void {
        if (this.isLoaded && window.responsiveVoice) {
            window.responsiveVoice.cancel();
            console.log('🔇 ResponsiveVoice stopped');
        }
    }

    // Check if TTS is supported and loaded
    isSupported(): boolean {
        return this.isLoaded && window.responsiveVoice && window.responsiveVoice.voiceSupport();
    }

    // Test TTS with a simple message
    async test(): Promise<void> {
        await this.speak('سلام. این یک تست صوتی ResponsiveVoice است. کیفیت صدا چطور است؟');
    }

    // Get available voices
    getVoices(): string[] {
        if (!this.isSupported()) {
            return [];
        }

        return window.responsiveVoice.getVoices().map((voice: any) => voice.name);
    }

    // Check loading status
    isReady(): boolean {
        return this.isLoaded && this.isSupported();
    }
}

// Export singleton instance
export const responsiveVoiceTTS = ResponsiveVoiceTTS.getInstance();