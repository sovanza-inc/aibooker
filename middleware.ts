import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth-config';

const protectedPrefixes = ['/dashboard', '/overview', '/reservations', '/booking-types', '/settings', '/pricing', '/onboarding', '/admin'];
const publicPaths = ['/', '/sign-in', '/sign-up', '/api/auth', '/api/v1/ai', '/api/health', '/openapi.json'];

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const session = request.auth;

  // Allow public paths
  if (publicPaths.some(p => pathname.startsWith(p)) || pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtectedRoute = protectedPrefixes.some(p => pathname.startsWith(p));

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // Role-based access control
  if (session) {
    const role = (session.user as any)?.role || 'provider';

    // Admin routes — only admin role
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/overview', request.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
