import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const protectedPrefixes = ['/dashboard', '/overview', '/reservations', '/booking-types', '/settings', '/pricing', '/onboarding', '/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/v1/ai') ||
    pathname.startsWith('/api/health') ||
    pathname === '/favicon.ico' ||
    pathname === '/openapi.json' ||
    pathname === '/' ||
    pathname === '/sign-in' ||
    pathname === '/sign-up'
  ) {
    return NextResponse.next();
  }

  const isProtectedRoute = protectedPrefixes.some(p => pathname.startsWith(p));

  if (isProtectedRoute) {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });

    if (!token) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    // Role-based access: admin routes only for admin role
    if (pathname.startsWith('/admin') && token.role !== 'admin') {
      return NextResponse.redirect(new URL('/overview', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
