import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for token in both cookies and localStorage (via headers)
  const token = request.cookies.get('accessToken')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isExamPage = request.nextUrl.pathname.startsWith('/exam');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');

  // Skip middleware for API routes
  if (isApiRoute) {
    return NextResponse.next();
  }

  // If user is not authenticated and trying to access protected routes
  if (!token && (isExamPage || request.nextUrl.pathname === '/results')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // If user is authenticated and trying to access auth pages
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};