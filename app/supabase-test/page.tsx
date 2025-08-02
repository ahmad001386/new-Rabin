'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [message, setMessage] = useState('در حال تست اتصال...');

  useEffect(() => {
    async function testConnection() {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('count')
          .limit(1);
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist"
          console.error('❌ Supabase connection failed:', error.message);
          setConnectionStatus('error');
          setMessage(`❌ خطا در اتصال: ${error.message}`);
          return false;
        }
        
        console.log('✅ Supabase connection successful!');
        setConnectionStatus('success');
        setMessage('✅ اتصال به Supabase با موفقیت برقرار شد!');
        return true;
      } catch (error) {
        console.error('❌ Supabase connection failed:', error);
        setConnectionStatus('error');
        setMessage(`❌ خطا در اتصال: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return false;
      }
    }

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          تست اتصال Supabase
        </h1>
        
        <div className="text-center">
          {connectionStatus === 'testing' && (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">در حال تست...</span>
            </div>
          )}
          
          {connectionStatus === 'success' && (
            <div className="text-green-600">
              <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-lg font-semibold">{message}</p>
            </div>
          )}
          
          {connectionStatus === 'error' && (
            <div className="text-red-600">
              <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-lg font-semibold">{message}</p>
            </div>
          )}
        </div>
        
        <div className="mt-8 text-sm text-gray-600 space-y-2">
          <h3 className="font-semibold">اطلاعات پیکربندی:</h3>
          <p>• URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'تنظیم نشده'}</p>
          <p>• API Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ تنظیم شده' : '✗ تنظیم نشده'}</p>
        </div>
      </div>
    </div>
  );
}