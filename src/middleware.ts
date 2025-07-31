import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export const config = {
  matcher: ['/dashboard/:path*', '/sign-in', '/sign-up','/revise','/practice','/admin/:path*','/contests/create','/problems/create','/agent/:path*'],
};

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const url = request.nextUrl;

  // Redirect to dashboard if the user is already authenticated
  // and trying to access sign-in, sign-up, or home page
  if (
    token &&
    (url.pathname.startsWith('/sign-in') ||
      url.pathname.startsWith('/sign-up') )
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/contests/create') || url.pathname.startsWith('/problems/create')) {
    if (!token || token.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url)); // Redirect non-admins away
    }
  }
  if (!token && (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/practice') || url.pathname.startsWith('/agent') || url.pathname.startsWith('/revise'))) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}