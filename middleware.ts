import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = new Set([
  '/',
  '/signin',
  '/register',
])

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow Next internals and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next()
  }

  // Public routes
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  // All app pages are accessible without sign-in.
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api|favicon|images|public).*)'],
}

