// Audio Intelligence Service - Complete voice interaction system
import { enhancedPersianTTS } from './enhanced-persian-tts';
import { enhancedPersianSpeechRecognition } from './enhanced-persian-speech-recognition';

export interface VoiceCommand {
    text: string;
    type: 'report' | 'general' | 'unknown';
    employeeName?: string;
    confidence: number;
}

export interface AIResponse {
    text: string;
    type: 'success' | 'error' | 'info';
    data?: any;
}

export class AudioIntelligenceService {
    private isProcessing = false;
    private currentSession: string | null = null;

    constructor() {
        console.log('🎯 Audio Intelligence Service initialized');
    }

    // Helper method to find authentication token
    private findAuthToken(): string | null {
        // Try different methods to get authentication token
        let token = null;

        // Method 1: Check cookies with different possible names
        const cookies = document.cookie.split('; ');
        const possibleTokenNames = ['auth-token', 'token', 'authToken', 'jwt', 'access_token'];

        for (const tokenName of possibleTokenNames) {
            const cookieValue = cookies.find(row => row.startsWith(`${tokenName}=`))?.split('=')[1];
            if (cookieValue) {
                token = cookieValue;
                console.log(`✅ Found token in cookie: ${tokenName}`);
                break;
            }
        }

        // Method 2: Check localStorage
        if (!token) {
            for (const tokenName of possibleTokenNames) {
                const localStorageValue = localStorage.getItem(tokenName);
                if (localStorageValue) {
                    token = localStorageValue;
                    console.log(`✅ Found token in localStorage: ${tokenName}`);
                    break;
                }
            }
        }

        // Method 3: Check sessionStorage
        if (!token) {
            for (const tokenName of possibleTokenNames) {
                const sessionStorageValue = sessionStorage.getItem(tokenName);
                if (sessionStorageValue) {
                    token = sessionStorageValue;
                    console.log(`✅ Found token in sessionStorage: ${tokenName}`);
                    break;
                }
            }
        }

        console.log('🔍 Available cookies:', document.cookie);
        console.log('🔍 Token found:', token ? 'Yes' : 'No');

        return token;
    }

    // Main method to handle complete voice interaction
    async handleVoiceInteraction(): Promise<{
        transcript: string;
        response: AIResponse;
        success: boolean;
    }> {
        if (this.isProcessing) {
            throw new Error('در حال حاضر درخواست دیگری در حال پردازش است');
        }

        this.isProcessing = true;
        this.currentSession = Date.now().toString();

        try {
            console.log('🎤 شروع تعامل صوتی...');

            // Step 1: Listen to user voice
            const transcript = await this.listenToUser();
            console.log('📝 متن دریافت شده:', transcript);

            // Step 2: Analyze the command
            const command = this.analyzeVoiceCommand(transcript);
            console.log('🔍 دستور تحلیل شده:', command);

            // Step 3: Process the command
            const response = await this.processCommand(command);
            console.log('💬 پاسخ تولید شده:', response.text.substring(0, 100) + '...');

            // Step 4: Speak the response
            await this.speakResponse(response.text);

            return {
                transcript,
                response,
                success: true
            };

        } catch (error) {
            console.error('❌ خطا در تعامل صوتی:', error);

            const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص';
            const errorResponse: AIResponse = {
                text: `متأسفم، خطایی رخ داد: ${errorMessage}`,
                type: 'error'
            };

            // Try to speak the error message
            try {
                await this.speakResponse(errorResponse.text);
            } catch (ttsError) {
                console.error('❌ خطا در خواندن پیام خطا:', ttsError);
            }

            return {
                transcript: '',
                response: errorResponse,
                success: false
            };

        } finally {
            this.isProcessing = false;
            this.currentSession = null;
        }
    }

    // Listen to user voice input
    private async listenToUser(): Promise<string> {
        try {
            // Test microphone first
            const microphoneOk = await enhancedPersianSpeechRecognition.testMicrophone();
            if (!microphoneOk) {
                console.warn('میکروفون در دسترس نیست، استفاده از ورودی دستی');
                return await enhancedPersianSpeechRecognition.getManualInput();
            }

            // Start listening
            return await enhancedPersianSpeechRecognition.startListening();
        } catch (error) {
            console.error('خطا در تشخیص گفتار:', error);

            // Fallback to manual input
            console.log('استفاده از ورودی دستی به عنوان fallback');
            return await enhancedPersianSpeechRecognition.getManualInput();
        }
    }

    // Analyze voice command to determine type and extract information
    private analyzeVoiceCommand(text: string): VoiceCommand {
        const cleanText = text.toLowerCase().trim();

        // Check for report commands
        const reportKeywords = ['گزارش', 'report', 'گزارش کار', 'کارکرد'];
        const hasReportKeyword = reportKeywords.some(keyword =>
            cleanText.includes(keyword.toLowerCase())
        );

        if (hasReportKeyword) {
            // Extract employee name
            const employeeName = this.extractEmployeeName(text);

            return {
                text,
                type: 'report',
                employeeName,
                confidence: employeeName ? 0.9 : 0.6
            };
        }

        // Check for general questions
        const questionKeywords = ['چی', 'چه', 'کی', 'کجا', 'چرا', 'چگونه', 'آیا', '؟'];
        const hasQuestionKeyword = questionKeywords.some(keyword =>
            cleanText.includes(keyword)
        );

        if (hasQuestionKeyword) {
            return {
                text,
                type: 'general',
                confidence: 0.8
            };
        }

        // Unknown command
        return {
            text,
            type: 'unknown',
            confidence: 0.3
        };
    }

    // Extract employee name from voice command
    private extractEmployeeName(text: string): string | undefined {
        const patterns = [
            /گزارش\s*کار\s*(.+)/i,
            /گزارش\s*(.+)/i,
            /report\s*(.+)/i,
            /کارکرد\s*(.+)/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }

        return undefined;
    }

    // Process the analyzed command
    private async processCommand(command: VoiceCommand): Promise<AIResponse> {
        switch (command.type) {
            case 'report':
                return await this.processReportCommand(command);

            case 'general':
                return await this.processGeneralCommand(command);

            default:
                return {
                    text: 'متأسفم، دستور شما را متوجه نشدم. لطفاً دوباره تلاش کنید یا از دستورات مجاز استفاده کنید.',
                    type: 'info'
                };
        }
    }

    // Process report-related commands
    private async processReportCommand(command: VoiceCommand): Promise<AIResponse> {
        if (!command.employeeName) {
            return {
                text: 'لطفاً نام همکار را مشخص کنید. مثال: "گزارش کار احمد"',
                type: 'info'
            };
        }

        try {
            // Check authentication first
            console.log('🔍 Checking authentication...');
            const authCheck = await fetch('/api/auth/me', {
                method: 'GET',
                credentials: 'include',
            });

            console.log('🔍 Auth check response:', authCheck.status, authCheck.ok);

            if (!authCheck.ok) {
                return {
                    text: 'برای دسترسی به گزارشات، لطفاً وارد سیستم شوید.',
                    type: 'error'
                };
            }

            const authData = await authCheck.json();
            console.log('🔍 Auth data:', authData);

            // Call API to get report
            console.log('📞 Calling voice-analysis API...');
            const response = await fetch('/api/voice-analysis/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Include cookies
                body: JSON.stringify({
                    text: command.text,
                    employeeName: command.employeeName
                })
            });

            console.log('📞 Voice-analysis response:', response.status, response.ok);

            const data = await response.json();
            console.log('📞 Voice-analysis data:', data);

            if (response.ok && data.success) {
                if (data.data.employee_found) {
                    return {
                        text: `گزارش همکار ${data.data.employee_name}:\n\n${data.data.analysis}`,
                        type: 'success',
                        data: data.data
                    };
                } else {
                    return {
                        text: `همکار "${command.employeeName}" در سیستم یافت نشد. لطفاً نام را بررسی کنید.`,
                        type: 'info'
                    };
                }
            } else {
                console.error('❌ API Error:', response.status, data);
                return {
                    text: `خطا در دریافت گزارش: ${data.message || 'خطای نامشخص'} (Status: ${response.status})`,
                    type: 'error'
                };
            }

        } catch (error) {
            console.error('خطا در پردازش گزارش:', error);
            return {
                text: 'خطا در دریافت گزارش. لطفاً دوباره تلاش کنید.',
                type: 'error'
            };
        }
    }

    // Process general questions
    private async processGeneralCommand(command: VoiceCommand): Promise<AIResponse> {
        try {
            const encodedText = encodeURIComponent(command.text);
            const response = await fetch(`https://mine-gpt-alpha.vercel.app/proxy?text=${encodedText}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });

            const data = await response.json();
            const aiText = data.answer || data.response || data.text || data;

            if (aiText && typeof aiText === 'string') {
                return {
                    text: aiText,
                    type: 'success'
                };
            } else {
                return {
                    text: 'متأسفم، نتوانستم پاسخ مناسبی تولید کنم.',
                    type: 'info'
                };
            }

        } catch (error) {
            console.error('خطا در پردازش سوال عمومی:', error);
            return {
                text: 'خطا در دریافت پاسخ از هوش مصنوعی. لطفاً دوباره تلاش کنید.',
                type: 'error'
            };
        }
    }

    // Speak the response using enhanced Persian TTS
    private async speakResponse(text: string): Promise<void> {
        try {
            await enhancedPersianTTS.speak(text);
        } catch (error) {
            console.error('خطا در خواندن پاسخ:', error);

            // Don't throw error for TTS issues - just log them
            // The main interaction should continue even if TTS fails
            console.warn('TTS failed but continuing with interaction');
        }
    }

    // Stop any ongoing audio processing
    stopAudioProcessing(): void {
        enhancedPersianSpeechRecognition.stopListening();
        enhancedPersianTTS.stopGracefully();
        this.isProcessing = false;
        this.currentSession = null;
        console.log('⏹️ پردازش صوتی متوقف شد');
    }

    // Get system status
    getSystemStatus(): {
        isProcessing: boolean;
        speechRecognitionSupported: boolean;
        ttsSupported: boolean;
        currentSession: string | null;
        voiceInfo: any;
    } {
        return {
            isProcessing: this.isProcessing,
            speechRecognitionSupported: enhancedPersianSpeechRecognition.isSupported(),
            ttsSupported: enhancedPersianTTS.isSupported(),
            currentSession: this.currentSession,
            voiceInfo: enhancedPersianTTS.getVoiceInfo()
        };
    }

    // Test the complete system
    async testSystem(): Promise<{
        speechRecognition: boolean;
        textToSpeech: boolean;
        microphone: boolean;
        overall: boolean;
    }> {
        const results = {
            speechRecognition: enhancedPersianSpeechRecognition.isSupported(),
            textToSpeech: enhancedPersianTTS.isSupported(),
            microphone: false,
            overall: false
        };

        try {
            results.microphone = await enhancedPersianSpeechRecognition.testMicrophone();
        } catch (error) {
            console.error('خطا در تست میکروفون:', error);
        }

        results.overall = results.speechRecognition && results.textToSpeech && results.microphone;

        return results;
    }
}

// Export singleton
export const audioIntelligenceService = new AudioIntelligenceService();