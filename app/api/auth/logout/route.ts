import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true, message: 'خروج موفق' });
    
    // Clear auth cookie
    response.cookies.delete('auth-token');
    
    return response;
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در خروج' },
      { status: 500 }
    );
  }
}