// Persian Text-to-Speech Service
export class PersianTTSService {
    private currentUtterance: SpeechSynthesisUtterance | null = null;
    private isInitialized = false;

    constructor() {
        this.initialize();
    }

    private initialize() {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            console.warn('Speech synthesis not supported');
            return;
        }

        // Load voices
        this.loadVoices();

        // Listen for voice changes
        speechSynthesis.onvoiceschanged = () => {
            this.loadVoices();
        };
    }

    private loadVoices() {
        const voices = speechSynthesis.getVoices();
        console.log('🎵 Available voices loaded:', voices.length);
        this.isInitialized = true;
    }

    // Get best voice for Persian
    private getBestPersianVoice(): SpeechSynthesisVoice | null {
        const voices = speechSynthesis.getVoices();

        // Priority 1: Exact Persian voices
        let voice = voices.find(v => v.lang === 'fa-IR' || v.lang === 'fa');
        if (voice) return voice;

        // Priority 2: Persian-like voices
        voice = voices.find(v =>
            v.lang.startsWith('fa') ||
            v.name.toLowerCase().includes('persian') ||
            v.name.toLowerCase().includes('farsi')
        );
        if (voice) return voice;

        // Priority 3: Arabic voices (similar pronunciation)
        voice = voices.find(v =>
            v.lang === 'ar-SA' ||
            v.lang === 'ar' ||
            v.lang.startsWith('ar')
        );
        if (voice) return voice;

        // Priority 4: Female voices (better for Persian)
        voice = voices.find(v =>
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('woman')
        );
        if (voice) return voice;

        return null;
    }

    // Main speak method
    async speak(text: string): Promise<void> {
        if (!text || !this.isSupported()) {
            throw new Error('TTS not supported or no text provided');
        }

        // Cancel any ongoing speech
        this.stop();

        return new Promise((resolve, reject) => {
            const utterance = new SpeechSynthesisUtterance(text);
            this.currentUtterance = utterance;

            // Set voice
            const bestVoice = this.getBestPersianVoice();
            if (bestVoice) {
                utterance.voice = bestVoice;
                console.log('🎵 Using voice:', bestVoice.name, bestVoice.lang);
            }

            // Configure for Persian
            utterance.lang = 'fa-IR';
            utterance.rate = 0.7; // Slower for better Persian pronunciation
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            // Event handlers
            utterance.onstart = () => {
                console.log('🎵 Speech started');
            };

            utterance.onend = () => {
                console.log('✅ Speech completed');
                this.currentUtterance = null;
                resolve();
            };

            utterance.onerror = (event) => {
                console.error('❌ Speech error:', event.error);
                this.currentUtterance = null;
                reject(new Error(`Speech error: ${event.error}`));
            };

            // Start speaking
            speechSynthesis.speak(utterance);
        });
    }

    // Stop current speech
    stop(): void {
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        this.currentUtterance = null;
    }

    // Check if TTS is supported
    isSupported(): boolean {
        return typeof window !== 'undefined' && 'speechSynthesis' in window;
    }

    // Check if currently speaking
    isSpeaking(): boolean {
        return speechSynthesis.speaking;
    }

    // Get available voices info
    getVoicesInfo(): { total: number; persian: number; arabic: number; hasGoodVoice: boolean } {
        const voices = speechSynthesis.getVoices();
        const persianVoices = voices.filter(v => v.lang.includes('fa'));
        const arabicVoices = voices.filter(v => v.lang.includes('ar'));

        return {
            total: voices.length,
            persian: persianVoices.length,
            arabic: arabicVoices.length,
            hasGoodVoice: persianVoices.length > 0 || arabicVoices.length > 0
        };
    }
}

// Export singleton
export const persianTTS = new PersianTTSService();