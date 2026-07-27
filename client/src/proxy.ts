import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ROOT_DOMAIN = 'tunggu.id'

export function proxy(request: NextRequest) {
  const hostname = request.nextUrl.hostname
  const pathname = request.nextUrl.pathname

  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    const parts = hostname.split('.')
    if (parts.length >= 2 && parts[0] !== 'localhost' && parts[0] !== 'www') {
      const url = request.nextUrl.clone()
      url.pathname = `/${parts[0]}${pathname}`
      return NextResponse.rewrite(url)
    }
    return NextResponse.next()
  }

  if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) {
    return NextResponse.next()
  }

  if (hostname.endsWith(ROOT_DOMAIN)) {
    const subdomain = hostname.slice(0, -(ROOT_DOMAIN.length + 1))
    if (subdomain && subdomain !== 'www') {
      const url = request.nextUrl.clone()
      url.pathname = `/${subdomain}${pathname}`
      return NextResponse.rewrite(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
}
