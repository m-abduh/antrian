import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || ''

function isDev(hostname: string) {
  return hostname === 'localhost' || hostname.endsWith('.localhost')
}

function rewriteTo(request: NextRequest, subdomain: string) {
  const host = request.headers.get('host') || ''
  const hostname = host.split(':')[0]
  const protocol = request.nextUrl.protocol
  const pathname = request.nextUrl.pathname

  const destPath = pathname === '/' ? '/merchant' : `/merchant${pathname}`

  const res = isDev(hostname)
    ? NextResponse.rewrite(new URL(`${protocol}//localhost${host.includes(':') ? ':' + host.split(':')[1] : ''}${destPath}`))
    : NextResponse.rewrite(new URL(`${protocol}//${hostname.split('.').slice(1).join('.')}${host.includes(':') ? ':' + host.split(':')[1] : ''}${destPath}`))
  res.headers.set('x-merchant-slug', subdomain)
  return res
}

export function proxy(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const hostname = host.split(':')[0]

  if (isDev(hostname)) {
    if (hostname === 'localhost') return NextResponse.next()
    const subdomain = hostname.split('.')[0]
    if (subdomain === 'www') return NextResponse.next()
    return rewriteTo(request, subdomain)
  }

  if (ROOT_DOMAIN) {
    if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) {
      return NextResponse.next()
    }
    if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
      const subdomain = hostname.slice(0, -(ROOT_DOMAIN.length + 1))
      if (subdomain && subdomain !== 'www') return rewriteTo(request, subdomain)
    }
  } else {
    const parts = hostname.split('.')
    if (parts.length >= 3) {
      const subdomain = parts[0]
      if (subdomain !== 'www') return rewriteTo(request, subdomain)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo|sitemap.xml|robots.txt|sw.js|manifest.json).*)'],
}
