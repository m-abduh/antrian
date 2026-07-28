import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const VALID_CALLBACK_PATHS = ['/dashboard', '/services', '/merchant', '/settings', '/finance'];

function isValidCallbackPath(path: string): boolean {
  return VALID_CALLBACK_PATHS.some(p => path === p || path.startsWith(p + '/'));
}

export async function proxy(req: NextRequest) {
  const token = await getToken({ req });
  const isProtected =
    req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/services') ||
    req.nextUrl.pathname.startsWith('/merchant') ||
    req.nextUrl.pathname.startsWith('/settings') ||
    req.nextUrl.pathname.startsWith('/finance');

  if (isProtected && !token) {
    const signInUrl = new URL('/login', req.nextUrl);
    const callbackPath = req.nextUrl.pathname;
    if (isValidCallbackPath(callbackPath)) {
      signInUrl.searchParams.set('callbackUrl', callbackPath);
    }
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/services/:path*', '/stats/:path*', '/merchant/:path*', '/finance/:path*', '/settings/:path*'],
};
