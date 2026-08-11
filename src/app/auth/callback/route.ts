import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || origin || 'https://scrm.scalezix.com').replace(/\/$/, '')

  // If Supabase passed an auth error (e.g. token expired or invalid link)
  if (errorParam || errorDescription) {
    const msg = errorDescription || errorParam || 'Auth link is invalid or expired'
    return NextResponse.redirect(`${baseUrl}/forgot-password?error=${encodeURIComponent(msg)}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`)
    } else {
      return NextResponse.redirect(`${baseUrl}/forgot-password?error=${encodeURIComponent(error.message)}`)
    }
  }

  return NextResponse.redirect(`${baseUrl}/login?error=auth_callback_error`)
}
