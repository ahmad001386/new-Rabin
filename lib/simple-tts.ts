// Simple and Reliable Text-to-Speech Service
export class SimpleTTS {
    private static instance: SimpleTTS;
    private currentUtterance: SpeechSynthesisUtterance | null = null;

    static getInstance(): SimpleTTS {
        if (!SimpleTTS.instance) {
            SimpleTTS.instance = new SimpleTTS();
        }
        return SimpleTTS.instance;
    }

    // Simple speak method that just works
    async speak(text: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                // Stop any current speech
                this.stop();

                // Clean text for better pronunciation
                const cleanText = this.cleanText(text);
                console.log('🎵 Speaking:', cleanText.substring(0, 100) + '...');

                // Create utterance
                const utterance = new SpeechSynthesisUtterance(cleanText);
                this.currentUtterance = utterance;

                // Simple settings that work
                utterance.rate = 0.9;
                utterance.pitch = 1.0;
                utterance.volume = 1.0;
                utterance.lang = 'en-US'; // Use English for better compatibility

                // Event handlers
                utterance.onend = () => {
                    console.log('✅ Speech completed');
                    this.currentUtterance = null;
                    resolve();
                };

                utterance.onerror = (event) => {
                    console.error('❌ Speech error:', event.error);
                    this.currentUtterance = null;

                    if (event.error === 'canceled' || event.error === 'interrupted') {
                        resolve(); // Don't treat as error
                    } else {
                        reject(new Error(`Speech failed: ${event.error}`));
                    }
                };

                // Start speaking
                speechSynthesis.speak(utterance);

            } catch (error) {
                console.error('❌ TTS Error:', error);
                reject(error);
            }
        });
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

            // Replace numbers with words for better pronunciation
            .replace(/1\./g, 'اول.')
            .replace(/2\./g, 'دوم.')
            .replace(/3\./g, 'سوم.')
            .replace(/4\./g, 'چهارم.')
            .replace(/5\./g, 'پنجم.')

            // Clean up extra spaces and newlines
            .replace(/\n+/g, '. ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Stop current speech
    stop(): void {
        if (this.currentUtterance) {
            speechSynthesis.cancel();
            this.currentUtterance = null;
            console.log('🔇 Speech stopped');
        }
    }

    // Check if TTS is supported
    isSupported(): boolean {
        return typeof window !== 'undefined' && 'speechSynthesis' in window;
    }

    // Test TTS with a simple message
    async test(): Promise<void> {
        await this.speak('سلام. این یک تست صوتی است. سیستم کار می کند.');
    }
}

// Export singleton instance
export const simpleTTS = SimpleTTS.getInstance();