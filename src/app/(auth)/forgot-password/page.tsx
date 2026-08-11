'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { Mail, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react'
import { getAppUrl } from '@/lib/utils'

function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  const supabase = createClient()

  useEffect(() => {
    if (errorParam) {
      toast.error(errorParam)
    }
  }, [errorParam])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getAppUrl()}/auth/callback?next=/reset-password`,
      })
      if (error) throw error
      setSent(true)
      toast.success('Password reset link sent!')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send reset link'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-8 shadow-2xl shadow-black/5 dark:shadow-black/20">
      {errorParam && (
        <div className="mb-6 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-start gap-2.5">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Link Expired or Invalid</p>
            <p className="text-xs opacity-90 mt-0.5">{errorParam}</p>
          </div>
        </div>
      )}

      {sent ? (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-[var(--accent)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Check your email</h1>
          <p className="text-sm text-[var(--muted-foreground)] mb-6">
            We sent a new password reset link to <strong>{email}</strong>
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline font-medium"
          >
            <ArrowLeft size={16} />
            Back to login
          </Link>
        </div>
      ) : (
        <>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Reset password</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Enter your email and we&apos;ll send you a new reset link
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[var(--foreground)] mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@scalezix.co"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[var(--accent)] text-white rounded-lg font-medium text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Send Reset Link <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--muted-foreground)] mt-6">
            <Link href="/login" className="text-[var(--accent)] hover:underline font-medium inline-flex items-center gap-1">
              <ArrowLeft size={14} /> Back to login
            </Link>
          </p>
        </>
      )}
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <div className="animate-fade-in">
      <div className="flex justify-center mb-8">
        <Image src="/logo.png" alt="Scalezix" width={180} height={50} className="dark:invert" />
      </div>
      <Suspense fallback={<div className="glass rounded-2xl p-8 text-center">Loading...</div>}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  )
}
