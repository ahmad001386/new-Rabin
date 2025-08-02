// Enhanced Persian Text-to-Speech Service
export class EnhancedPersianTTS {
    private currentUtterance: SpeechSynthesisUtterance | null = null;
    private isInitialized = false;
    private availableVoices: SpeechSynthesisVoice[] = [];

    constructor() {
        this.initialize();
    }

    private initialize() {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            console.warn('Speech synthesis not supported');
            return;
        }

        this.loadVoices();
        speechSynthesis.onvoiceschanged = () => {
            this.loadVoices();
        };
    }

    private loadVoices() {
        this.availableVoices = speechSynthesis.getVoices();
        console.log('🎵 Loaded voices:', this.availableVoices.length);
        this.isInitialized = true;
    }

    // Get the best female voice for Persian
    private getBestFemaleVoice(): SpeechSynthesisVoice | null {
        const voices = this.availableVoices;

        // Priority 1: Persian female voices
        let voice = voices.find(v =>
            (v.lang === 'fa-IR' || v.lang === 'fa') &&
            (v.name.toLowerCase().includes('female') ||
                v.name.toLowerCase().includes('woman') ||
                v.name.toLowerCase().includes('زن'))
        );
        if (voice) {
            console.log('✅ Found Persian female voice:', voice.name);
            return voice;
        }

        // Priority 2: Any Persian voice
        voice = voices.find(v => v.lang === 'fa-IR' || v.lang === 'fa');
        if (voice) {
            console.log('✅ Found Persian voice:', voice.name);
            return voice;
        }

        // Priority 3: Arabic female voices (similar pronunciation)
        voice = voices.find(v =>
            (v.lang === 'ar-SA' || v.lang === 'ar' || v.lang.startsWith('ar')) &&
            (v.name.toLowerCase().includes('female') ||
                v.name.toLowerCase().includes('woman'))
        );
        if (voice) {
            console.log('✅ Found Arabic female voice:', voice.name);
            return voice;
        }

        // Priority 4: Any Arabic voice
        voice = voices.find(v =>
            v.lang === 'ar-SA' || v.lang === 'ar' || v.lang.startsWith('ar')
        );
        if (voice) {
            console.log('✅ Found Arabic voice:', voice.name);
            return voice;
        }

        // Priority 5: Any female voice
        voice = voices.find(v =>
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('woman') ||
            v.name.toLowerCase().includes('زن')
        );
        if (voice) {
            console.log('✅ Found female voice:', voice.name);
            return voice;
        }

        // Priority 6: Google voices (usually good quality)
        voice = voices.find(v =>
            v.name.toLowerCase().includes('google')
        );
        if (voice) {
            console.log('✅ Found Google voice:', voice.name);
            return voice;
        }

        // Priority 7: Any available voice
        if (voices.length > 0) {
            voice = voices[0];
            console.log('✅ Using first available voice:', voice.name);
            return voice;
        }

        console.log('⚠️ No voices available');
        return null;
    }

    // Preprocess Persian text for better pronunciation
    private preprocessPersianText(text: string): string {
        // Replace common problematic characters and words
        let processedText = text
            // Replace English numbers with Persian equivalents
            .replace(/0/g, 'صفر')
            .replace(/1/g, 'یک')
            .replace(/2/g, 'دو')
            .replace(/3/g, 'سه')
            .replace(/4/g, 'چهار')
            .replace(/5/g, 'پنج')
            .replace(/6/g, 'شش')
            .replace(/7/g, 'هفت')
            .replace(/8/g, 'هشت')
            .replace(/9/g, 'نه')

            // Replace common abbreviations
            .replace(/\bدر\b/g, 'در')
            .replace(/\bو\b/g, 'و')
            .replace(/\bیا\b/g, 'یا')
            .replace(/\bاز\b/g, 'از')
            .replace(/\bبه\b/g, 'به')
            .replace(/\bتا\b/g, 'تا')

            // Add pauses for better pronunciation
            .replace(/[.!?؟۔]/g, '$&. ')
            .replace(/[،,]/g, '$&، ')
            .replace(/[:]/g, '$&: ')

            // Fix common Persian pronunciation issues
            .replace(/ی\s/g, 'ی ')
            .replace(/ه\s/g, 'ه ')
            .replace(/\s+/g, ' ')
            .trim();

        return processedText;
    }

    // Split long text into manageable chunks
    private splitTextIntoChunks(text: string, maxLength: number = 150): string[] {
        if (text.length <= maxLength) return [text];

        const chunks: string[] = [];
        const sentences = text.split(/[.!?؟۔]\s*/);
        let currentChunk = '';

        for (const sentence of sentences) {
            if ((currentChunk + sentence).length <= maxLength) {
                currentChunk += (currentChunk ? '. ' : '') + sentence;
            } else {
                if (currentChunk) chunks.push(currentChunk);
                currentChunk = sentence;
            }
        }

        if (currentChunk) chunks.push(currentChunk);
        return chunks;
    }

    // Create a summary of long text for TTS
    private createSummaryForTTS(text: string): string {
        // Split text into sentences
        const sentences = text.split(/[.!?؟۔]\s*/);

        // If it's a report, try to extract key information
        if (text.includes('گزارش') || text.includes('report')) {
            const summary = [];

            // Look for employee name
            const nameMatch = text.match(/همکار\s+([^\n:]+)/);
            if (nameMatch) {
                summary.push(`گزارش همکار ${nameMatch[1]}`);
            }

            // Look for key metrics or numbers
            const numbers = text.match(/\d+/g);
            if (numbers && numbers.length > 0) {
                summary.push(`شامل ${numbers.length} مورد اطلاعات عددی`);
            }

            // Add first sentence if it's not too long
            if (sentences[0] && sentences[0].length < 100) {
                summary.push(sentences[0]);
            }

            return summary.join('. ') + '.';
        }

        // For general text, take first 2-3 sentences
        const firstSentences = sentences.slice(0, 3).join('. ');

        // If still too long, take first 300 characters
        if (firstSentences.length > 300) {
            return firstSentences.substring(0, 300) + '...';
        }

        return firstSentences;
    }

    // Main speak method with enhanced Persian support
    async speak(text: string): Promise<void> {
        if (!text || !this.isSupported()) {
            throw new Error('TTS not supported or no text provided');
        }

        // Stop any ongoing speech
        this.stop();

        // If text is too long, summarize it for TTS
        let textToSpeak = text;
        if (text.length > 500) {
            console.log('📝 Text is long, creating summary for TTS');
            textToSpeak = this.createSummaryForTTS(text);
        }

        // Preprocess text for better Persian pronunciation
        const processedText = this.preprocessPersianText(textToSpeak);
        console.log('🔄 Preprocessed text:', processedText.substring(0, 100) + '...');

        // Split into chunks for better handling
        const chunks = this.splitTextIntoChunks(processedText);
        console.log('📝 Split into', chunks.length, 'chunks');

        // Speak each chunk with delay
        for (let i = 0; i < chunks.length; i++) {
            await this.speakChunk(chunks[i]);

            // Add small delay between chunks (except for the last one)
            if (i < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }

    // Speak a single chunk
    private async speakChunk(text: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const utterance = new SpeechSynthesisUtterance(text);
            this.currentUtterance = utterance;

            // Set the best voice
            const bestVoice = this.getBestFemaleVoice();
            if (bestVoice) {
                utterance.voice = bestVoice;
            }

            // Configure for optimal Persian pronunciation
            // Don't force fa-IR if no Persian voice is available
            if (bestVoice && (bestVoice.lang === 'fa-IR' || bestVoice.lang === 'fa')) {
                utterance.lang = bestVoice.lang;
            } else {
                // Use default language for better compatibility
                utterance.lang = 'en-US';
            }
            utterance.rate = 0.8; // Moderate speed for clarity
            utterance.pitch = 1.0; // Normal pitch
            utterance.volume = 1.0; // Full volume

            // Event handlers
            utterance.onstart = () => {
                console.log('🎵 Started speaking chunk:', text.substring(0, 50) + '...');
            };

            utterance.onend = () => {
                console.log('✅ Finished speaking chunk');
                this.currentUtterance = null;
                resolve();
            };

            utterance.onerror = (event) => {
                console.error('❌ Speech error:', event.error);
                this.currentUtterance = null;

                // Handle different types of TTS errors
                switch (event.error) {
                    case 'canceled':
                        // User canceled or navigated away - this is not really an error
                        console.log('🔇 TTS was canceled by user or system');
                        resolve(); // Resolve instead of reject for canceled
                        break;
                    case 'interrupted':
                        console.log('🔇 TTS was interrupted');
                        resolve(); // Resolve instead of reject for interrupted
                        break;
                    case 'network':
                        reject(new Error('خطا در اتصال شبکه برای پخش صدا'));
                        break;
                    case 'synthesis-failed':
                        reject(new Error('خطا در تولید صدا'));
                        break;
                    case 'synthesis-unavailable':
                        reject(new Error('سرویس تولید صدا در دسترس نیست'));
                        break;
                    default:
                        reject(new Error(`خطا در پخش صدا: ${event.error}`));
                }
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
        console.log('⏹️ Speech stopped');
    }

    // Stop current speech gracefully
    stopGracefully(): void {
        if (this.currentUtterance) {
            // Mark as canceled to avoid error handling
            this.currentUtterance = null;
        }
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        console.log('⏹️ Speech stopped gracefully');
    }

    // Check if TTS is supported
    isSupported(): boolean {
        return typeof window !== 'undefined' && 'speechSynthesis' in window;
    }

    // Check if currently speaking
    isSpeaking(): boolean {
        return speechSynthesis.speaking;
    }

    // Get voice information for debugging
    getVoiceInfo(): {
        total: number;
        persian: number;
        arabic: number;
        female: number;
        bestVoice: string | null;
        hasGoodVoice: boolean;
    } {
        const voices = this.availableVoices;
        const persianVoices = voices.filter(v => v.lang.includes('fa'));
        const arabicVoices = voices.filter(v => v.lang.includes('ar'));
        const femaleVoices = voices.filter(v =>
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('woman')
        );
        const bestVoice = this.getBestFemaleVoice();

        return {
            total: voices.length,
            persian: persianVoices.length,
            arabic: arabicVoices.length,
            female: femaleVoices.length,
            bestVoice: bestVoice ? `${bestVoice.name} (${bestVoice.lang})` : null,
            hasGoodVoice: persianVoices.length > 0 || arabicVoices.length > 0
        };
    }

    // Test voice with sample Persian text
    async testVoice(): Promise<void> {
        const testText = 'سلام، این یک تست صدای فارسی است. آیا صدا به درستی شنیده می‌شود؟';
        await this.speak(testText);
    }
}

// Export singleton
export const enhancedPersianTTS = new EnhancedPersianTTS();