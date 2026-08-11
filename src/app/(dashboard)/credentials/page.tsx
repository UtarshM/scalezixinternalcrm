'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Key, Eye, EyeOff, Copy, ExternalLink, Shield } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Credential } from '@/types'

const DYNAMIC_SERVICES = [
  'Supabase', 'Github', 'Vercel', 'Railway', 'Shopify', 'AWS', 
  'Cloudflare', 'OpenAI', 'Resend', 'Hostinger', 'Firebase', 
  'MongoDB', 'Google Workspace', 'Razorpay', 'Stripe'
]

export default function GlobalCredentialsPage() {
  const supabase = createClient()
  const [credentials, setCredentials] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [serviceFilter, setServiceFilter] = React.useState('')
  const [visiblePasswords, setVisiblePasswords] = React.useState<Record<string, boolean>>({})

  const fetchCredentials = React.useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('project_credentials')
        .select('*, project:projects(*)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCredentials(data || [])
    } catch (e: any) {
      toast.error('Failed to load credentials: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  React.useEffect(() => {
    fetchCredentials()
  }, [fetchCredentials])

  const handleCopyText = (text: string, label = 'Text') => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const filtered = credentials.filter(cred => {
    const matchSearch = 
      cred.service_name.toLowerCase().includes(search.toLowerCase()) ||
      (cred.account_email || '').toLowerCase().includes(search.toLowerCase()) ||
      (cred.username || '').toLowerCase().includes(search.toLowerCase()) ||
      (cred.project?.name || '').toLowerCase().includes(search.toLowerCase())
    const matchService = serviceFilter ? cred.service_name === serviceFilter : true
    return matchSearch && matchService
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Credentials Manager</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Global vault of development credentials across all projects</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Search by service, email, username or project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
          />
        </div>
        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
        >
          <option value="">All Services</option>
          {DYNAMIC_SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading credentials...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 bg-[var(--card)] rounded-xl border border-[var(--border)] text-center text-sm text-[var(--muted-foreground)] flex flex-col items-center justify-center gap-2">
          <Shield size={28} className="text-[var(--muted-foreground)]" />
          No credentials found matching your search.
        </div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left text-[var(--foreground)]">
            <thead className="bg-[var(--secondary)] text-xs text-[var(--muted-foreground)] font-semibold uppercase border-b border-[var(--border)]">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Account Email</th>
                <th className="px-4 py-3">Username / Owner</th>
                <th className="px-4 py-3">Password</th>
                <th className="px-4 py-3">2FA</th>
                <th className="px-4 py-3 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map(cred => (
                <tr key={cred.id} className="hover:bg-[var(--secondary)]/30">
                  <td className="px-4 py-3 font-semibold text-[var(--foreground)]">
                    <Link href={`/projects/${cred.project_id}`} className="hover:underline flex items-center gap-1">
                      {cred.project?.name || 'Unknown Project'}
                      <ExternalLink size={12} className="text-[var(--muted-foreground)]" />
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[var(--foreground)]">{cred.service_name}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{cred.account_email || '-'}</td>
                  <td className="px-4 py-3 text-xs">
                    {cred.username && <span className="block font-semibold">{cred.username}</span>}
                    {cred.account_owner && <span className="block text-[var(--muted-foreground)]">Owner: {cred.account_owner}</span>}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <div className="flex items-center gap-2">
                      <input
                        type={visiblePasswords[cred.id] ? 'text' : 'password'}
                        value={cred.password || ''}
                        readOnly
                        className="bg-transparent border-none text-xs w-[120px] focus:outline-none"
                      />
                      <button
                        onClick={() => togglePasswordVisibility(cred.id)}
                        className="p-1 hover:bg-[var(--secondary)] rounded text-[var(--muted-foreground)]"
                      >
                        {visiblePasswords[cred.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      {cred.password && (
                        <button
                          onClick={() => handleCopyText(cred.password || '', 'Password')}
                          className="p-1 hover:bg-[var(--secondary)] rounded text-[var(--muted-foreground)]"
                        >
                          <Copy size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      cred.two_factor_enabled 
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    }`}>
                      {cred.two_factor_enabled ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/projects/${cred.project_id}`}
                      className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                    >
                      Open Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
