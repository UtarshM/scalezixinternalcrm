import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Resolve base URL taking into account proxy headers or current origin
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  let baseUrl = origin
  if (!isLocalEnv && forwardedHost) {
    const proto = request.headers.get('x-forwarded-proto') || 'https'
    baseUrl = `${proto}://${forwardedHost}`
  } else if (!baseUrl || baseUrl === 'null') {
    baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://scrm.scalezix.com').replace(/\/$/, '')
  }

  // Ensure next path starts with a slash
  const redirectPath = next.startsWith('/') ? next : `/${next}`

  // If Supabase passed an auth error (e.g. token expired or invalid link)
  if (errorParam || errorDescription) {
    const msg = errorDescription || errorParam || 'Auth link is invalid or expired'
    return NextResponse.redirect(`${baseUrl}/forgot-password?error=${encodeURIComponent(msg)}`)
  }

  const supabase = await createClient()

  // 1. PKCE flow with code
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${redirectPath}`)
    } else {
      return NextResponse.redirect(`${baseUrl}/forgot-password?error=${encodeURIComponent(error.message)}`)
    }
  }

  // 2. Token hash flow (email OTP / recovery)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${redirectPath}`)
    } else {
      return NextResponse.redirect(`${baseUrl}/forgot-password?error=${encodeURIComponent(error.message)}`)
    }
  }

  return NextResponse.redirect(`${baseUrl}/login?error=auth_callback_error`)
}
