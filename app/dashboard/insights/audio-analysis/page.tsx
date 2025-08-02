'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { audioIntelligenceService } from '@/lib/audio-intelligence-service';
import { enhancedPersianTTS } from '@/lib/enhanced-persian-tts';
import { simpleTTS } from '@/lib/simple-tts';
import { googleTTS } from '@/lib/google-tts';
import { responsiveVoiceTTS } from '@/lib/responsive-voice-tts';
import { enhancedPersianSpeechRecognition } from '@/lib/enhanced-persian-speech-recognition';

export default function AudioAnalysisPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [voiceInfo, setVoiceInfo] = useState<string>('');
  const [testResults, setTestResults] = useState<any>(null);
  const [interactionHistory, setInteractionHistory] = useState<Array<{
    timestamp: string;
    transcript: string;
    response: string;
    success: boolean;
  }>>([]);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Google TTS state
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  // Check if user is authenticated by calling API
  const checkAuthentication = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // Include cookies
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentUser(data.data);
          setIsAuthenticated(true);
          return true;
        }
      }

      setCurrentUser(null);
      setIsAuthenticated(false);
      return false;
    } catch (error) {
      console.error('Authentication check failed:', error);
      setCurrentUser(null);
      setIsAuthenticated(false);
      return false;
    }
  };

  // Helper function to find authentication token
  const findAuthToken = (): string | null => {
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
  };

  useEffect(() => {
    // Initialize system status
    const updateSystemStatus = () => {
      const status = audioIntelligenceService.getSystemStatus();
      setSystemStatus(status);

      const voiceInfo = status.voiceInfo;
      setVoiceInfo(`
        کل صداها: ${voiceInfo.total}
        صداهای فارسی: ${voiceInfo.persian}
        صداهای عربی: ${voiceInfo.arabic}
        صداهای زنانه: ${voiceInfo.female}
        بهترین صدا: ${voiceInfo.bestVoice || 'یافت نشد'}
        کیفیت صدا: ${voiceInfo.hasGoodVoice ? 'خوب' : 'متوسط'}
      `);
    };

    updateSystemStatus();

    // Check authentication on component mount
    checkAuthentication();

    // Update status periodically
    const interval = setInterval(updateSystemStatus, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Main voice interaction handler
  const handleVoiceInteraction = async () => {
    if (isProcessing) {
      // Stop current processing
      audioIntelligenceService.stopAudioProcessing();
      setIsProcessing(false);
      setIsSpeaking(false);
      setVoiceInfo('⏹️ تعامل صوتی متوقف شد');
      return;
    }

    setIsProcessing(true);
    setTranscript('');
    setAiResponse('');
    setVoiceInfo('🎤 آماده شوید... در حال شروع تعامل صوتی');

    try {
      const result = await audioIntelligenceService.handleVoiceInteraction();

      setTranscript(result.transcript);
      setAiResponse(result.response.text);

      // Add to history
      const newInteraction = {
        timestamp: new Date().toLocaleString('fa-IR'),
        transcript: result.transcript,
        response: result.response.text,
        success: result.success
      };

      setInteractionHistory(prev => [newInteraction, ...prev.slice(0, 4)]); // Keep last 5 interactions

      if (result.success) {
        setVoiceInfo('✅ تعامل صوتی با موفقیت انجام شد');
      } else {
        setVoiceInfo('⚠️ تعامل صوتی با خطا مواجه شد');
      }

    } catch (error) {
      console.error('خطا در تعامل صوتی:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص';
      setAiResponse(`خطا: ${errorMessage}`);
      setVoiceInfo(`❌ خطا: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Test system functionality
  const testSystem = async () => {
    setVoiceInfo('🔍 در حال تست سیستم...');

    try {
      const results = await audioIntelligenceService.testSystem();
      setTestResults(results);

      if (results.overall) {
        setVoiceInfo('✅ تست سیستم موفق - همه قابلیت‌ها کار می‌کنند');
      } else {
        let issues = [];
        if (!results.speechRecognition) issues.push('تشخیص گفتار');
        if (!results.textToSpeech) issues.push('تبدیل متن به گفتار');
        if (!results.microphone) issues.push('میکروفون');

        setVoiceInfo(`⚠️ مشکل در: ${issues.join('، ')}`);
      }
    } catch (error) {
      setVoiceInfo('❌ خطا در تست سیستم');
    }
  };

  // Test voice with sample text
  const testVoice = async () => {
    setIsSpeaking(true);
    setVoiceInfo('🔊 در حال تست صدای فارسی...');

    try {
      await enhancedPersianTTS.testVoice();
      setVoiceInfo('✅ تست صدا با موفقیت انجام شد');
    } catch (error) {
      setVoiceInfo('❌ خطا در تست صدا');
    } finally {
      setIsSpeaking(false);
    }
  };

  // Test simple TTS
  const testSimpleTTS = async () => {
    setIsSpeaking(true);
    setVoiceInfo('🔊 در حال تست TTS ساده...');

    try {
      await simpleTTS.test();
      setVoiceInfo('✅ TTS ساده کار می‌کند');
    } catch (error) {
      setVoiceInfo('❌ خطا در TTS ساده');
    } finally {
      setIsSpeaking(false);
    }
  };

  // Test Google TTS
  const testGoogleTTS = async () => {
    if (!googleTTS.hasApiKey()) {
      setShowApiKeyInput(true);
      setVoiceInfo('⚠️ لطفاً ابتدا API Key گوگل را وارد کنید');
      return;
    }

    setIsSpeaking(true);
    setVoiceInfo('🔊 در حال تست Google TTS...');

    try {
      await googleTTS.test();
      setVoiceInfo('✅ Google TTS کار می‌کند - صدای فارسی عالی!');
    } catch (error) {
      setVoiceInfo(`❌ خطا در Google TTS: ${error}`);
    } finally {
      setIsSpeaking(false);
    }
  };

  // Test ResponsiveVoice TTS
  const testResponsiveVoice = async () => {
    setIsSpeaking(true);
    setVoiceInfo('🔊 در حال بارگذاری ResponsiveVoice...');

    try {
      await responsiveVoiceTTS.test();
      setVoiceInfo('✅ ResponsiveVoice کار می‌کند - بدون نیاز به API Key!');
    } catch (error) {
      setVoiceInfo(`❌ خطا در ResponsiveVoice: ${error}`);
    } finally {
      setIsSpeaking(false);
    }
  };

  // Set Google API Key
  const setGoogleApiKey = () => {
    if (apiKeyInput.trim()) {
      googleTTS.setApiKey(apiKeyInput.trim());
      setShowApiKeyInput(false);
      setApiKeyInput('');
      setVoiceInfo('✅ API Key ذخیره شد. حالا Google TTS را تست کنید.');
    }
  };

  // Toggle API Key input
  const toggleApiKeyInput = () => {
    setShowApiKeyInput(!showApiKeyInput);
    if (googleTTS.hasApiKey()) {
      setVoiceInfo('✅ API Key قبلاً تنظیم شده است');
    }
  };

  // Show available voices
  const showAvailableVoices = () => {
    const voices = speechSynthesis.getVoices();
    let voiceInfo = '🎵 صداهای موجود:\n\n';

    if (voices.length === 0) {
      voiceInfo += 'هیچ صدایی یافت نشد. لطفاً چند ثانیه صبر کنید و دوباره تلاش کنید.';
    } else {
      voices.forEach((voice, index) => {
        const isPersian = voice.lang === 'fa-IR' || voice.lang === 'fa';
        const isArabic = voice.lang.startsWith('ar');
        const isFemale = voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman');

        voiceInfo += `${index + 1}. ${voice.name}\n`;
        voiceInfo += `   زبان: ${voice.lang}`;
        if (isPersian) voiceInfo += ' ✅ فارسی';
        if (isArabic) voiceInfo += ' 🔸 عربی';
        if (isFemale) voiceInfo += ' 👩 زنانه';
        voiceInfo += '\n\n';
      });
    }

    setVoiceInfo(voiceInfo);

    // Also speak a summary
    const persianVoices = voices.filter(v => v.lang === 'fa-IR' || v.lang === 'fa').length;
    const arabicVoices = voices.filter(v => v.lang.startsWith('ar')).length;
    const femaleVoices = voices.filter(v => v.name.toLowerCase().includes('female')).length;

    const summary = `${voices.length} صدا یافت شد. ${persianVoices} فارسی، ${arabicVoices} عربی، ${femaleVoices} زنانه.`;
    simpleTTS.speak(summary).catch(console.error);
  };

  // Handle manual text input
  const handleManualInput = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setTranscript('');
    setAiResponse('');
    setVoiceInfo('⌨️ در انتظار ورودی متنی...');

    try {
      const userInput = await enhancedPersianSpeechRecognition.getManualInput();

      if (userInput) {
        setTranscript(userInput);
        setVoiceInfo('📝 متن دریافت شد، در حال پردازش...');

        // Process the command directly without voice input
        const command = {
          text: userInput,
          type: userInput.toLowerCase().includes('گزارش') || userInput.toLowerCase().includes('report') ? 'report' : 'general',
          employeeName: userInput.toLowerCase().includes('گزارش') || userInput.toLowerCase().includes('report') ?
            userInput.replace(/گزارش\s*(کار\s*)?/gi, '').replace(/report\s*/gi, '').trim() : undefined,
          confidence: 0.9
        };

        // Process command and get response
        let response;
        if (command.type === 'report' && command.employeeName) {
          // Handle report command
          try {
            // Check authentication first
            const isAuth = await checkAuthentication();

            if (!isAuth) {
              response = {
                text: `برای دسترسی به گزارشات، لطفاً وارد سیستم شوید.\n\nلطفاً دکمه "🚪 ورود مجدد" را فشار دهید.`,
                type: 'error'
              };
            } else {
              const apiResponse = await fetch('/api/voice-analysis/process', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include', // Include cookies
                body: JSON.stringify({
                  text: userInput,
                  employeeName: command.employeeName
                })
              });

              const data = await apiResponse.json();

              if (data.success && data.data.employee_found) {
                response = { text: `گزارش همکار ${data.data.employee_name}:\n\n${data.data.analysis}`, type: 'success' };
              } else {
                response = { text: `همکار "${command.employeeName}" در سیستم یافت نشد.`, type: 'info' };
              }
            }
          } catch (error) {
            response = { text: 'خطا در دریافت گزارش. لطفاً دوباره تلاش کنید.', type: 'error' };
          }
        } else {
          // Handle general question
          try {
            const encodedText = encodeURIComponent(userInput);
            const apiResponse = await fetch(`https://mine-gpt-alpha.vercel.app/proxy?text=${encodedText}`);
            const data = await apiResponse.json();
            const aiText = data.answer || data.response || data.text || data;

            if (aiText && typeof aiText === 'string') {
              response = { text: aiText, type: 'success' };
            } else {
              response = { text: 'متأسفم، نتوانستم پاسخ مناسبی تولید کنم.', type: 'info' };
            }
          } catch (error) {
            response = { text: 'خطا در دریافت پاسخ از هوش مصنوعی.', type: 'error' };
          }
        }

        setAiResponse(response.text);

        // Speak the response if it's not an error
        if (response.type !== 'error') {
          try {
            setIsSpeaking(true);
            setVoiceInfo('🔊 در حال خواندن پاسخ...');
            // Try ResponsiveVoice first (no API key needed), then Google TTS, then simple TTS
            try {
              await responsiveVoiceTTS.speak(response.text);
            } catch (responsiveError) {
              console.log('ResponsiveVoice failed, trying Google TTS:', responsiveError);

              if (googleTTS.hasApiKey()) {
                try {
                  await googleTTS.speak(response.text);
                } catch (googleError) {
                  console.log('Google TTS failed, using simple TTS:', googleError);
                  await simpleTTS.speak(response.text);
                }
              } else {
                await simpleTTS.speak(response.text);
              }
            }
            setVoiceInfo('✅ خواندن پاسخ تمام شد');
          } catch (ttsError) {
            console.error('خطا در خواندن پاسخ:', ttsError);
            setVoiceInfo('⚠️ خطا در خواندن پاسخ - متن نمایش داده شد');
          } finally {
            setIsSpeaking(false);
          }
        }

        // Add to history
        const newInteraction = {
          timestamp: new Date().toLocaleString('fa-IR'),
          transcript: userInput,
          response: response.text,
          success: response.type !== 'error'
        };

        setInteractionHistory(prev => [newInteraction, ...prev.slice(0, 4)]);

        if (response.type !== 'error') {
          setVoiceInfo('✅ پردازش متن با موفقیت انجام شد');
        } else {
          setVoiceInfo('⚠️ پردازش متن با خطا مواجه شد');
        }
      }
    } catch (error) {
      console.error('خطا در ورودی متنی:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطای نامشخص';
      setVoiceInfo(`❌ خطا: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Check authentication status
  const checkAuthStatus = async () => {
    const token = findAuthToken();
    const cookies = document.cookie.split('; ');
    const localStorageKeys = Object.keys(localStorage);
    const sessionStorageKeys = Object.keys(sessionStorage);

    let statusMessage = '🔐 وضعیت احراز هویت:\n\n';

    // Check authentication with API
    const isAuth = await checkAuthentication();

    if (isAuth && currentUser) {
      statusMessage += `✅ احراز هویت موفق\n`;
      statusMessage += `👤 کاربر: ${currentUser.name}\n`;
      statusMessage += `📧 ایمیل: ${currentUser.email}\n`;
      statusMessage += `🎭 نقش: ${currentUser.role}\n`;
      statusMessage += `📱 تیم: ${currentUser.team || 'تعریف نشده'}\n\n`;

      // Test API access
      try {
        const testResponse = await fetch('/api/voice-analysis/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            text: 'تست',
            employeeName: 'تست'
          })
        });

        const testData = await testResponse.json();

        if (testResponse.ok) {
          statusMessage += `✅ دسترسی API موفق\n`;
        } else {
          statusMessage += `❌ خطا در دسترسی API: ${testData.message}\n`;
        }
      } catch (apiError) {
        statusMessage += `❌ خطا در تست API: ${apiError}\n`;
      }
    } else {
      statusMessage += `❌ احراز هویت ناموفق\n\n`;
    }

    // Show fallback token info
    if (token) {
      statusMessage += `\n🔑 Token در storage: ${token.substring(0, 20)}...\n`;
    } else {
      statusMessage += `\n❌ Token در storage یافت نشد\n`;
    }

    statusMessage += `📊 اطلاعات ذخیره‌سازی:\n`;
    statusMessage += `- کوکی‌ها: ${cookies.length} مورد\n`;
    statusMessage += `- localStorage: ${localStorageKeys.length} مورد\n`;
    statusMessage += `- sessionStorage: ${sessionStorageKeys.length} مورد\n\n`;

    if (cookies.length > 0) {
      statusMessage += `🍪 کوکی‌های موجود:\n`;
      cookies.forEach(cookie => {
        const [name, value] = cookie.split('=');
        statusMessage += `- ${name}: ${value ? value.substring(0, 20) + '...' : 'empty'}\n`;
      });
      statusMessage += '\n';
    }

    if (localStorageKeys.length > 0) {
      statusMessage += `💾 localStorage keys:\n`;
      localStorageKeys.forEach(key => {
        const value = localStorage.getItem(key);
        statusMessage += `- ${key}: ${value ? value.substring(0, 20) + '...' : 'empty'}\n`;
      });
    }

    // Check current URL and user status
    statusMessage += `\n🌐 اطلاعات صفحه:\n`;
    statusMessage += `- URL: ${window.location.pathname}\n`;
    statusMessage += `- Domain: ${window.location.hostname}\n`;
    statusMessage += `- Protocol: ${window.location.protocol}\n`;

    setVoiceInfo(statusMessage);

    // Also speak the result
    const spokenMessage = isAuth ?
      `احراز هویت موفق است. خوش آمدید ${currentUser?.name}` :
      'احراز هویت ناموفق. لطفاً دوباره وارد شوید.';

    simpleTTS.speak(spokenMessage).catch(console.error);
  };

  // Stop all audio processing
  const stopAllAudio = () => {
    audioIntelligenceService.stopAudioProcessing();
    responsiveVoiceTTS.stop();
    simpleTTS.stop();
    googleTTS.stop();
    enhancedPersianTTS.stop();
    setIsProcessing(false);
    setIsSpeaking(false);
    setVoiceInfo('⏹️ همه فعالیت‌های صوتی متوقف شد');
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Authentication Status Banner */}
      <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-blue-700 font-medium">وضعیت احراز هویت:</span>
            {isAuthenticated === null ? (
              <span className="px-2 py-1 rounded text-sm font-bold bg-yellow-200 text-yellow-800">
                🔄 در حال بررسی...
              </span>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded text-sm font-bold bg-green-200 text-green-800">
                  ✅ وارد شده
                </span>
                {currentUser && (
                  <span className="text-sm text-gray-600">
                    ({currentUser.name} - {currentUser.role})
                  </span>
                )}
              </div>
            ) : (
              <span className="px-2 py-1 rounded text-sm font-bold bg-red-200 text-red-800">
                ❌ وارد نشده
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={checkAuthStatus}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              بررسی جزئیات
            </Button>
            <Button
              onClick={checkAuthentication}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              🔄 بررسی مجدد
            </Button>
          </div>
        </div>
      </div>

      {/* Google API Key Input */}
      {showApiKeyInput && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-bold mb-3 text-yellow-800">🔑 تنظیم Google Cloud TTS API Key</h3>
          <div className="flex gap-3 items-center">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="API Key گوگل را وارد کنید..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button
              onClick={setGoogleApiKey}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
            >
              ذخیره
            </Button>
            <Button
              onClick={() => setShowApiKeyInput(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2"
            >
              لغو
            </Button>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            <p>📋 <strong>نحوه دریافت API Key:</strong></p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>به <a href="https://console.cloud.google.com/" target="_blank" className="text-blue-600 underline">Google Cloud Console</a> بروید</li>
              <li>یک پروژه جدید بسازید یا پروژه موجود را انتخاب کنید</li>
              <li>Cloud Text-to-Speech API را فعال کنید</li>
              <li>در بخش Credentials یک API Key بسازید</li>
              <li>API Key را کپی کرده و اینجا وارد کنید</li>
            </ol>
            <p className="mt-2 text-green-600">💰 <strong>رایگان:</strong> ماهانه 1 میلیون کاراکتر رایگان!</p>
          </div>
        </div>
      )}

      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🎤 تحلیل صوتی هوشمند
        </h1>
        <p className="text-lg text-gray-600">
          سیستم پیشرفته تعامل صوتی با پشتیبانی کامل از زبان فارسی
        </p>
      </div>

      {/* Main Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Voice Interaction */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 border-2 border-blue-100">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">🎯 تعامل صوتی</h2>

          <div className="flex flex-wrap gap-4 justify-center mb-6">
            <Button
              onClick={handleVoiceInteraction}
              disabled={!systemStatus?.speechRecognitionSupported || !systemStatus?.ttsSupported}
              className={`px-8 py-4 text-lg font-bold rounded-full transition-all duration-300 ${isProcessing
                ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700'
                }`}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  توقف تعامل
                </div>
              ) : (
                '🎤 شروع تعامل صوتی'
              )}
            </Button>

            <Button
              onClick={testVoice}
              disabled={isSpeaking || isProcessing}
              className="px-6 py-4 text-lg font-bold rounded-full bg-purple-600 hover:bg-purple-700"
            >
              🔊 تست صدا
            </Button>

            <Button
              onClick={testSimpleTTS}
              disabled={isSpeaking || isProcessing}
              className="px-6 py-4 text-lg font-bold rounded-full bg-pink-600 hover:bg-pink-700"
            >
              🎙️ TTS ساده
            </Button>

            <Button
              onClick={testResponsiveVoice}
              disabled={isSpeaking || isProcessing}
              className="px-6 py-4 text-lg font-bold rounded-full bg-blue-600 hover:bg-blue-700"
            >
              🎙️ ResponsiveVoice
            </Button>

            <Button
              onClick={testGoogleTTS}
              disabled={isSpeaking || isProcessing}
              className="px-6 py-4 text-lg font-bold rounded-full bg-red-600 hover:bg-red-700"
            >
              🎯 Google TTS
            </Button>

            <Button
              onClick={toggleApiKeyInput}
              className="px-6 py-4 text-lg font-bold rounded-full bg-green-600 hover:bg-green-700"
            >
              🔑 API Key
            </Button>

            <Button
              onClick={showAvailableVoices}
              className="px-6 py-4 text-lg font-bold rounded-full bg-indigo-600 hover:bg-indigo-700"
            >
              🎵 صداهای موجود
            </Button>

            <Button
              onClick={testSystem}
              disabled={isProcessing}
              className="px-6 py-4 text-lg font-bold rounded-full bg-orange-600 hover:bg-orange-700"
            >
              🔍 تست سیستم
            </Button>

            <Button
              onClick={handleManualInput}
              disabled={isProcessing}
              className="px-6 py-4 text-lg font-bold rounded-full bg-gray-600 hover:bg-gray-700"
            >
              ⌨️ ورودی متنی
            </Button>

            <Button
              onClick={checkAuthStatus}
              className="px-6 py-4 text-lg font-bold rounded-full bg-yellow-600 hover:bg-yellow-700"
            >
              🔐 بررسی احراز هویت
            </Button>

            <Button
              onClick={() => window.location.href = '/login'}
              className="px-6 py-4 text-lg font-bold rounded-full bg-red-600 hover:bg-red-700"
            >
              🚪 ورود مجدد
            </Button>

            {(isProcessing || isSpeaking) && (
              <Button
                onClick={stopAllAudio}
                className="px-6 py-4 text-lg font-bold rounded-full bg-red-600 hover:bg-red-700"
              >
                ⏹️ توقف همه
              </Button>
            )}
          </div>

          {/* Transcript Display */}
          <div className="bg-gray-50 rounded-lg p-6 mb-4 min-h-[120px] border-2 border-dashed border-gray-300">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">📝 متن شناسایی شده:</h3>
            {isProcessing && !transcript ? (
              <div className="flex items-center justify-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="text-lg">در حال گوش دادن...</p>
              </div>
            ) : transcript ? (
              <p className="text-lg text-gray-800 leading-relaxed">{transcript}</p>
            ) : (
              <p className="text-gray-500 text-center italic">متن شناسایی شده در اینجا نمایش داده می‌شود</p>
            )}
          </div>

          {/* AI Response Display */}
          {aiResponse && (
            <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-blue-800">🤖 پاسخ هوش مصنوعی:</h3>
                {isSpeaking && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="animate-pulse w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span className="text-sm font-medium">🔊 در حال خواندن...</span>
                  </div>
                )}
              </div>
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
            </div>
          )}
        </div>

        {/* System Status */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-100">
          <h2 className="text-xl font-bold mb-4 text-green-800">📊 وضعیت سیستم</h2>

          {systemStatus && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>تشخیص گفتار:</span>
                <span className={systemStatus.speechRecognitionSupported ? 'text-green-600' : 'text-red-600'}>
                  {systemStatus.speechRecognitionSupported ? '✅' : '❌'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>تبدیل متن به گفتار:</span>
                <span className={systemStatus.ttsSupported ? 'text-green-600' : 'text-red-600'}>
                  {systemStatus.ttsSupported ? '✅' : '❌'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>در حال پردازش:</span>
                <span className={systemStatus.isProcessing ? 'text-orange-600' : 'text-gray-600'}>
                  {systemStatus.isProcessing ? '🔄' : '⏸️'}
                </span>
              </div>
            </div>
          )}

          {testResults && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">نتایج تست:</h4>
              <div className="text-sm space-y-1">
                <div>میکروفون: {testResults.microphone ? '✅' : '❌'}</div>
                <div>تشخیص گفتار: {testResults.speechRecognition ? '✅' : '❌'}</div>
                <div>صدا: {testResults.textToSpeech ? '✅' : '❌'}</div>
                <div className="font-semibold">
                  کلی: {testResults.overall ? '✅ آماده' : '❌ نیاز به بررسی'}
                </div>
              </div>
            </div>
          )}

          {voiceInfo && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-800 whitespace-pre-line">{voiceInfo}</div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-yellow-100">
        <h2 className="text-xl font-bold mb-4 text-yellow-800">📋 راهنمای استفاده</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3 text-gray-700">🎯 دستورات گزارش:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <code className="bg-gray-100 px-2 py-1 rounded">گزارش کار احمد</code>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <code className="bg-gray-100 px-2 py-1 rounded">گزارش علی</code>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <code className="bg-gray-100 px-2 py-1 rounded">report sara</code>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-gray-700">💬 سوالات عمومی:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>هر سوال فارسی یا انگلیسی</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>درخواست اطلاعات عمومی</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>کمک در کارهای روزانه</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">💡 نکات مهم:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• برای بهترین نتیجه، در محیط آرام صحبت کنید</li>
            <li>• پس از فشردن دکمه، کمی صبر کنید تا سیستم آماده شود</li>
            <li>• اگر صدا خوب نیست، ابتدا "تست صدا" را امتحان کنید</li>
            <li>• برای گزارش همکاران، حتماً کلمه "گزارش" را بگویید</li>
            <li>• در صورت مشکل تشخیص گفتار، می‌توانید متن را تایپ کنید</li>
            <li>• متن‌های طولانی به صورت خلاصه خوانده می‌شوند</li>
          </ul>
        </div>
      </div>

      {/* Interaction History */}
      {interactionHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100">
          <h2 className="text-xl font-bold mb-4 text-gray-800">📚 تاریخچه تعاملات</h2>

          <div className="space-y-4">
            {interactionHistory.map((interaction, index) => (
              <div key={index} className={`p-4 rounded-lg border-2 ${interaction.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">{interaction.timestamp}</span>
                  <span className={interaction.success ? 'text-green-600' : 'text-red-600'}>
                    {interaction.success ? '✅' : '❌'}
                  </span>
                </div>

                <div className="mb-2">
                  <strong className="text-sm text-gray-700">شما گفتید:</strong>
                  <p className="text-sm text-gray-800 mt-1">{interaction.transcript}</p>
                </div>

                <div>
                  <strong className="text-sm text-gray-700">پاسخ سیستم:</strong>
                  <p className="text-sm text-gray-800 mt-1">{interaction.response.substring(0, 150)}...</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
