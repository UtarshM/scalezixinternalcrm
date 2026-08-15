import Link from 'next/link'
import { ArrowLeft, Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center">
          <Search size={40} className="animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-6xl font-extrabold text-[var(--foreground)] tracking-tight">404</h1>
          <h2 className="text-xl font-bold text-[var(--foreground)]">Page Not Found</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            The page you are looking for doesn't exist, was moved, or you may have entered an incorrect URL.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent)]/90 transition-all shadow-md"
          >
            <Home size={16} />
            Go to Dashboard
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--secondary)] text-[var(--foreground)] text-sm font-medium hover:bg-[var(--secondary)]/80 transition-all border border-[var(--border)]"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
