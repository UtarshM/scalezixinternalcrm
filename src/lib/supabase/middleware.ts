import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing in environment variables.')
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Refresh session - important for Server Components
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Routes that don't require an active session
    const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/auth/callback']
    const isPublicRoute = publicRoutes.some(route =>
      request.nextUrl.pathname.startsWith(route)
    )

    // Auth entry pages where already-authenticated users should be redirected to /dashboard
    // NOTE: /auth/callback (API endpoint) and /reset-password (password update) must NOT redirect to /dashboard
    const authPagesToRedirect = ['/login', '/signup', '/forgot-password']
    const isAuthPage = authPagesToRedirect.some(route =>
      request.nextUrl.pathname.startsWith(route)
    )

    // Redirect unauthenticated users to login
    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Redirect authenticated users away from login/signup/forgot-password pages
    if (user && isAuthPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  } catch (error) {
    console.error('Middleware Supabase session update failed:', error)
  }

  return supabaseResponse
}
