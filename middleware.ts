import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-config';

const protectedPrefixes = [
  '/dashboard',
  '/overview',
  '/reservations',
  '/booking-types',
  '/settings',
  '/pricing',
  '/onboarding',
  '/admin',
];

export default auth((request) => {
  const { pathname } = request.nextUrl;

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

  const isProtectedRoute = protectedPrefixes.some((p) => pathname.startsWith(p));

  if (isProtectedRoute) {
    const user = request.auth?.user;
    if (!user?.email) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    const role = (user as { role?: string }).role;
    // Redirect admin users away from normal user pages to admin panel
    if (role === 'admin' && pathname === '/overview') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/overview', request.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
