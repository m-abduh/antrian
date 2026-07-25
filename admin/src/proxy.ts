export { auth as proxy } from '@/lib/auth';

export const config = {
  matcher: ['/dashboard/:path*', '/services/:path*', '/stats/:path*', '/merchant/:path*'],
};
