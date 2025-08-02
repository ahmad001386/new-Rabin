import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple JWT decoder for middleware (Edge Runtime compatible)
function decodeJWT(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));

    // Check expiration
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for these paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/migrate') ||
    pathname.startsWith('/public') ||
    pathname === '/login' ||
    pathname === '/favicon.ico' ||
    pathname === '/' ||
    pathname === '/test-audio' || // Add test page exception
    pathname === '/supabase-test' // Add supabase test page exception
  ) {
    return NextResponse.next();
  }

  // For dashboard routes, check authentication
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verify token
    try {
      const decoded = decodeJWT(token);
      if (!decoded) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // For API routes (except auth), verify token and add user info to headers
  if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth') && !pathname.startsWith('/api/voice-analysis')) {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
      request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'غیر مجاز - لطفاً وارد شوید' },
        { status: 401 }
      );
    }

    try {
      const decoded = decodeJWT(token);
      if (!decoded) {
        return NextResponse.json(
          { success: false, message: 'توکن نامعتبر' },
          { status: 401 }
        );
      }

      // Add user info to request headers
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', decoded.id);
      requestHeaders.set('x-user-role', decoded.role);
      requestHeaders.set('x-user-email', decoded.email);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'خطا در تأیید هویت' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};