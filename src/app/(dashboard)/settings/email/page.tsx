'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ShieldAlert, Mail } from 'lucide-react'

export default function EmailSettingsPage() {
  const supabase = createClient()

  // Form states
  const [gmailUser, setGmailUser] = React.useState('')
  const [clientId, setClientId] = React.useState('')
  const [clientSecret, setClientSecret] = React.useState('')
  const [refreshToken, setRefreshToken] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const fetchEmailSettings = async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'email').single()
      if (data?.value) {
        const val = data.value as any
        setGmailUser(val.user || '')
        setClientId(val.client_id || '')
        setClientSecret(val.client_secret || '')
        setRefreshToken(val.refresh_token || '')
      }
    }
    fetchEmailSettings()
  }, [supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await supabase.from('settings').upsert({
        key: 'email',
        value: {
          user: gmailUser,
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
        },
      })
      toast.success('Gmail API Nodemailer credentials saved successfully')
    } catch (err: any) {
      toast.error('Failed to update email integration settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Email SMTP Integrations</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Configure Gmail OAuth2 API parameters for secure system notifications and PDF invoices dispatch</p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-6">
        <div className="p-4 bg-[var(--secondary)] border border-[var(--border)] rounded-lg flex items-start gap-3 text-xs text-[var(--muted-foreground)] leading-relaxed">
          <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={16} />
          <div>
            <p className="font-semibold text-[var(--foreground)] mb-1">Gmail API OAuth2 Security</p>
            Scalezix OS CRM uses Google Nodemailer integrations to trigger invoice notifications. Save client credentials below. These credentials bypass sandbox limitations and run securely from server-side handlers.
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Gmail Dispatch Address *</label>
            <input
              required
              type="email"
              placeholder="e.g. hello@scalezix.co"
              value={gmailUser}
              onChange={(e) => setGmailUser(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Google OAuth Client ID</label>
            <input
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Enter Client ID"
              className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Google OAuth Client Secret</label>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Enter Client Secret"
              className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Google OAuth Refresh Token</label>
            <input
              type="password"
              value={refreshToken}
              onChange={(e) => setRefreshToken(e.target.value)}
              placeholder="Enter Refresh Token"
              className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-[var(--accent)] text-white font-semibold rounded-lg text-sm transition-all"
          >
            {loading ? 'Saving...' : 'Save credentials'}
          </button>
        </form>
      </div>
    </div>
  )
}
