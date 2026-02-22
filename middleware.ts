import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // 1. First, update the session (refreshes the cookie if needed)
  const response = await updateSession(request)
  
  // 2. Define path logic
  const path = request.nextUrl.pathname
  const isAuthPage = path.startsWith('/auth')
  const isProtectedPage = path.startsWith('/dashboard') || path.startsWith('/organization') || path.startsWith('/assets') || path.startsWith('/risk')
  
  // Get the session status from the updated response or request cookies
  // Note: updateSession usually returns the modified response with user data
  // But we can check for the existence of the supabase-auth-token
  const hasSession = request.cookies.getAll().some(cookie => 
    cookie.name.includes('supabase-auth-token') || cookie.name.includes('sb-')
  )

  // 3. Logic: Redirect logged-in users away from auth pages (Login/Register)
  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 4. Logic: Redirect logged-out users away from protected pages
  if (!hasSession && isProtectedPage) {
    const redirectUrl = new URL('/auth/login', request.url)
    // Add the current path as a redirect param so they come back after login
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (svg, png, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}