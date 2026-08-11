'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const errorParam = searchParams.get('error_description') || searchParams.get('error')
    if (errorParam) {
      setLinkError(errorParam)
      toast.error(errorParam)
    }

    // Check if error is in URL hash (e.g. #error=access_denied&error_description=...)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const hashError = hashParams.get('error_description') || hashParams.get('error')
      if (hashError) {
        setLinkError(decodeURIComponent(hashError.replace(/\+/g, ' ')))
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setLinkError(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [searchParams, supabase])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      setSuccess(true)
      toast.success('Password updated successfully!')
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 2000)
    } catch (error: unknown) {
      const rawMessage = error instanceof Error ? error.message : 'Failed to reset password'
      let friendlyMessage = rawMessage
      if (rawMessage.toLowerCase().includes('session') || rawMessage.toLowerCase().includes('auth')) {
        friendlyMessage = 'Your reset link is invalid or has expired. Please request a new one.'
      }
      toast.error(friendlyMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-8 shadow-2xl shadow-black/5 dark:shadow-black/20">
      {linkError && (
        <div className="mb-6 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-start gap-2.5">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Reset Link Expired or Invalid</p>
            <p className="text-xs opacity-90 mt-0.5">{linkError}</p>
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-1 text-xs font-semibold underline mt-2 text-red-500 hover:opacity-80"
            >
              Request a new reset link <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      )}

      {success ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={36} />
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Password Updated!</h1>
          <p className="text-sm text-[var(--muted-foreground)] mb-6">
            Your password has been reset successfully. Redirecting you to your dashboard...
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 py-2.5 px-6 bg-[var(--accent)] text-white rounded-lg font-medium text-sm hover:opacity-90 transition-all"
          >
            Go to Dashboard <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Set New Password</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Please enter a new password for your account.
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {/* New Password */}
            <div>
              <label className="text-sm font-medium text-[var(--foreground)] mb-1.5 block">
                New Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-12 py-2.5 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="text-sm font-medium text-[var(--foreground)] mb-1.5 block">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-12 py-2.5 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="reset-password-submit"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[var(--accent)] text-white rounded-lg font-medium text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Update Password
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="animate-fade-in">
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Scalezix" width={180} height={50} className="dark:invert" />
        </div>
      </div>

      <Suspense fallback={<div className="glass rounded-2xl p-8 text-center">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>

      {/* Footer */}
      <p className="text-center text-xs text-[var(--muted-foreground)] mt-6">
        © {new Date().getFullYear()} Scalezix. All rights reserved.
      </p>
    </div>
  )
}
