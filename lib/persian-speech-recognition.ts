// Persian Speech Recognition Service
export class PersianSpeechRecognition {
    private recognition: any = null;
    private isListening = false;

    constructor() {
        this.initialize();
    }

    private initialize() {
        if (typeof window === 'undefined') return;

        // Check for speech recognition support
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.setupRecognition();
    }

    private setupRecognition() {
        if (!this.recognition) return;

        // Configure recognition
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'fa-IR'; // Persian language
        this.recognition.maxAlternatives = 1;
    }

    // Start listening
    async startListening(): Promise<string> {
        if (!this.isSupported()) {
            throw new Error('Speech recognition not supported');
        }

        if (this.isListening) {
            throw new Error('Already listening');
        }

        return new Promise((resolve, reject) => {
            this.recognition.onstart = () => {
                console.log('🎤 Speech recognition started');
                this.isListening = true;
            };

            this.recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                console.log('🎤 Recognized:', transcript);
                this.isListening = false;
                resolve(transcript);
            };

            this.recognition.onerror = (event: any) => {
                console.error('🎤 Recognition error:', event.error);
                this.isListening = false;
                reject(new Error(`Recognition error: ${event.error}`));
            };

            this.recognition.onend = () => {
                console.log('🎤 Speech recognition ended');
                this.isListening = false;
            };

            // Start recognition
            this.recognition.start();
        });
    }

    // Stop listening
    stopListening(): void {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }

    // Check if supported
    isSupported(): boolean {
        return this.recognition !== null;
    }

    // Check if currently listening
    isCurrentlyListening(): boolean {
        return this.isListening;
    }
}

// Export singleton
export const persianSpeechRecognition = new PersianSpeechRecognition();