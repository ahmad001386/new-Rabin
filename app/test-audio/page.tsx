'use client';

import { useState, useEffect } from 'react';
import {
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Play, 
  Square, 
  User, 
  MessageCircle,
  Brain,
  Headphones,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface AudioAnalysisState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  transcript: string;
  response: string;
  systemReady: boolean;
  error: string | null;
  confidence: number;
}

interface EmployeeReport {
  employee_name: string;
  employee_found: boolean;
  analysis: string;
  last_activity?: string;
  performance_summary?: string;
}

export default function TestAudioPage() {
  const [audioState, setAudioState] = useState<AudioAnalysisState>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    transcript: '',
    response: '',
    systemReady: false,
    error: null,
    confidence: 0
  });

  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null);
  const [persianVoice, setPersianVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'fa-IR'; // فارسی
        
        recognition.onstart = () => {
          setAudioState(prev => ({ ...prev, isListening: true, error: null }));
        };
        
        recognition.onresult = (event) => {
          const transcript = event.results[0].transcript;
          const confidence = event.results[0].confidence;
          
          setAudioState(prev => ({ 
            ...prev, 
            transcript, 
            confidence: confidence * 100,
            isListening: false,
            isProcessing: true 
          }));
          
          // Process the command
          processVoiceCommand(transcript);
        };
        
        recognition.onerror = (event) => {
          setAudioState(prev => ({ 
            ...prev, 
            isListening: false, 
            error: `خطا در تشخیص صدا: ${event.error}` 
          }));
        };
        
        recognition.onend = () => {
          setAudioState(prev => ({ ...prev, isListening: false }));
        };
        
        setRecognition(recognition);
      }

      // Initialize Speech Synthesis
      if (window.speechSynthesis) {
        setSynthesis(window.speechSynthesis);
        
        // Find Persian voice
        const updateVoices = () => {
          const voices = window.speechSynthesis.getVoices();
          
          // Try to find Persian voice
          let selectedVoice = voices.find(voice => 
            voice.lang === 'fa-IR' || voice.lang === 'fa'
          );
          
          // Fallback to Arabic or English female voice
          if (!selectedVoice) {
            selectedVoice = voices.find(voice => 
              voice.lang.startsWith('ar') && voice.name.toLowerCase().includes('female')
            ) || voices.find(voice => 
              voice.lang.startsWith('en') && voice.name.toLowerCase().includes('female')
            ) || voices[0];
          }
          
          setPersianVoice(selectedVoice);
          setAudioState(prev => ({ ...prev, systemReady: true }));
        };
        
        if (window.speechSynthesis.getVoices().length > 0) {
          updateVoices();
        } else {
          window.speechSynthesis.onvoiceschanged = updateVoices;
        }
      }
    }
  }, []);

  const processVoiceCommand = async (transcript: string) => {
    try {
      // Check if it's a report request
      const reportPattern = /گزارش\s+(کار\s+)?([آ-ی\s]+)/i;
      const reportMatch = transcript.match(reportPattern);
      
      if (reportMatch) {
        const employeeName = reportMatch[2].trim();
        await fetchEmployeeReport(employeeName);
      } else {
        // General AI query
        await processGeneralQuery(transcript);
      }
    } catch (error) {
      setAudioState(prev => ({
        ...prev,
        isProcessing: false,
        error: 'خطا در پردازش دستور صوتی',
        response: ''
      }));
    }
  };

  const fetchEmployeeReport = async (employeeName: string) => {
    try {
      const response = await fetch('/api/voice-analysis/employee-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeName })
      });

      const data = await response.json();
      
      if (data.success && data.data.employee_found) {
        const report: EmployeeReport = data.data;
        const responseText = `گزارش همکار ${report.employee_name}:

${report.analysis}

${report.performance_summary ? `خلاصه عملکرد: ${report.performance_summary}` : ''}

${report.last_activity ? `آخرین فعالیت: ${report.last_activity}` : ''}`;

        setAudioState(prev => ({
          ...prev,
          response: responseText,
          isProcessing: false
        }));
        
        // Speak the response
        await speakResponse(responseText);
      } else {
        const errorResponse = `همکار "${employeeName}" در سیستم یافت نشد. لطفاً نام را دوباره بررسی کنید.`;
        setAudioState(prev => ({
          ...prev,
          response: errorResponse,
          isProcessing: false
        }));
        await speakResponse(errorResponse);
      }
    } catch (error) {
      const errorResponse = 'خطا در دریافت گزارش همکار. لطفاً دوباره تلاش کنید.';
      setAudioState(prev => ({
        ...prev,
        response: errorResponse,
        isProcessing: false,
        error: 'خطا در ارتباط با سرور'
      }));
      await speakResponse(errorResponse);
    }
  };

  const processGeneralQuery = async (query: string) => {
    try {
      // Call external AI API for general questions
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(`https://mine-gpt-alpha.vercel.app/proxy?text=${encodedQuery}`);
      const data = await response.json();
      const aiResponse = data.answer || data.response || data.text || 'متأسفم، نتوانستم پاسخ مناسبی تولید کنم.';

      setAudioState(prev => ({
        ...prev,
        response: aiResponse,
        isProcessing: false
      }));
      
      await speakResponse(aiResponse);
    } catch (error) {
      const errorResponse = 'خطا در دریافت پاسخ از هوش مصنوعی.';
      setAudioState(prev => ({
        ...prev,
        response: errorResponse,
        isProcessing: false,
        error: 'خطا در ارتباط با هوش مصنوعی'
      }));
      await speakResponse(errorResponse);
    }
  };

  const speakResponse = async (text: string) => {
    if (!synthesis || !persianVoice) return;
    
    // Cancel any ongoing speech
    synthesis.cancel();
    
    setAudioState(prev => ({ ...prev, isSpeaking: true }));
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = persianVoice;
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 1;
    
    utterance.onend = () => {
      setAudioState(prev => ({ ...prev, isSpeaking: false }));
    };
    
    utterance.onerror = () => {
      setAudioState(prev => ({ ...prev, isSpeaking: false }));
    };
    
    synthesis.speak(utterance);
  };

  const startListening = () => {
    if (recognition && audioState.systemReady) {
      setAudioState(prev => ({ 
        ...prev, 
        transcript: '', 
        response: '', 
        error: null,
        confidence: 0 
      }));
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
    }
  };

  const stopSpeaking = () => {
    if (synthesis) {
      synthesis.cancel();
      setAudioState(prev => ({ ...prev, isSpeaking: false }));
    }
  };

  const testVoice = async () => {
    await speakResponse('سلام! من آماده دریافت دستورات شما هستم. برای گزارش همکاران بگویید: گزارش نام همکار');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🎤 تحلیل صوتی هوشمند
          </h1>
          <p className="text-lg text-gray-600">
            سیستم پیشرفته تعامل صوتی با پشتیبانی کامل از زبان فارسی
          </p>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold text-blue-800">وضعیت سیستم</h2>
            </div>
            {persianVoice && (
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                صدا: {persianVoice.name}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-3 h-3 rounded-full ${audioState.systemReady ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>
              {audioState.systemReady ? 'سیستم آماده' : 'در حال راه‌اندازی...'}
            </span>
          </div>
          
          {audioState.error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-700">{audioState.error}</span>
            </div>
          )}
        </div>

        {/* Main Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* Voice Control */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 border-2 border-green-100">
            <div className="flex items-center gap-2 mb-4">
              <Mic className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-bold text-green-800">کنترل صوتی</h2>
            </div>
            <p className="text-gray-600 mb-6">
              برای شروع، دکمه "شروع ضبط" را فشار دهید و دستور خود را بگویید
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center mb-6">
              {!audioState.isListening ? (
                <button
                  onClick={startListening}
                  disabled={!audioState.systemReady || audioState.isProcessing}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  <Mic className="h-6 w-6" />
                  شروع ضبط
                </button>
              ) : (
                <button
                  onClick={stopListening}
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-lg rounded-lg font-bold flex items-center gap-2 animate-pulse"
                >
                  <Square className="h-6 w-6" />
                  توقف ضبط
                </button>
              )}

              <button
                onClick={testVoice}
                disabled={audioState.isSpeaking || !audioState.systemReady}
                className="border border-green-600 text-green-600 hover:bg-green-50 px-6 py-6 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
              >
                <Volume2 className="h-5 w-5" />
                تست صدا
              </button>

              {audioState.isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-6 rounded-lg font-bold flex items-center gap-2"
                >
                  <VolumeX className="h-5 w-5" />
                  توقف صدا
                </button>
              )}
            </div>

            {/* Processing Indicator */}
            {(audioState.isListening || audioState.isProcessing || audioState.isSpeaking) && (
              <div className="text-center mb-4">
                {audioState.isListening && (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <Mic className="h-5 w-5 animate-pulse" />
                    <span>در حال گوش دادن...</span>
                  </div>
                )}
                {audioState.isProcessing && (
                  <div className="flex items-center justify-center gap-2 text-blue-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>در حال پردازش...</span>
                  </div>
                )}
                {audioState.isSpeaking && (
                  <div className="flex items-center justify-center gap-2 text-purple-600">
                    <Volume2 className="h-5 w-5 animate-pulse" />
                    <span>در حال صحبت...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-yellow-100">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="h-5 w-5 text-yellow-600" />
              <h2 className="text-xl font-bold text-yellow-800">راهنمای استفاده</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">📊 گزارش همکاران:</h4>
                <div className="space-y-1 text-sm">
                  <div>• "گزارش احمدرضا آوندی"</div>
                  <div>• "گزارش کار علی محمدی"</div>
                  <div>• "گزارش سارا احمدی"</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">💬 سوالات عمومی:</h4>
                <div className="space-y-1 text-sm">
                  <div>• هر سوال فارسی یا انگلیسی</div>
                  <div>• درخواست اطلاعات</div>
                  <div>• راهنمایی کاری</div>
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  💡 <strong>نکته:</strong> برای بهترین نتیجه، در محیط آرام و با صدای واضح صحبت کنید.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Transcript */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-100">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold text-blue-800">متن شناسایی شده</h2>
              {audioState.confidence > 0 && (
                <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  دقت: {Math.round(audioState.confidence)}%
                </div>
              )}
            </div>
            
            {audioState.transcript ? (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-lg text-gray-800 leading-relaxed">
                  {audioState.transcript}
                </p>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Mic className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>متن شناسایی شده در اینجا نمایش داده می‌شود</p>
              </div>
            )}
          </div>

          {/* AI Response */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-100">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-5 w-5 text-purple-600" />
              <h2 className="text-xl font-bold text-purple-800">پاسخ سیستم</h2>
            </div>
            
            {audioState.response ? (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {audioState.response}
                </p>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Brain className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>پاسخ سیستم در اینجا نمایش داده می‌شود</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}