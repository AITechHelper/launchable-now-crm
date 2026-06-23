import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const authCookie = request.cookies.get('launchable_auth')
  const isLoginPage = pathname === '/login'

  if (!authCookie || authCookie.value !== 'authenticated') {
    if (!isLoginPage) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (authCookie?.value === 'authenticated' && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
