'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { getAppUrl } from '@/lib/utils'

export default function SettingsOverviewPage() {
  const supabase = createClient()

  // App settings state
  const [appName, setAppName] = React.useState('Scalezix OS')
  const [appUrl, setAppUrl] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    setAppUrl(getAppUrl())
    async function loadSettings() {
      try {
        const { data } = await supabase.from('settings').select('value').eq('key', 'general').single()
        if (data?.value) {
          if (data.value.app_name) setAppName(data.value.app_name)
          if (data.value.app_url) setAppUrl(data.value.app_url)
        }
      } catch (err) {
        // Table or key might not exist yet; fallback to default
      }
    }
    loadSettings()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await supabase.from('settings').upsert({
        key: 'general',
        value: { app_name: appName, app_url: appUrl },
      })
      toast.success('General settings updated')
    } catch (err: unknown) {
      toast.error('Failed to update settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">General Settings</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Manage Scalezix CRM platform config and base system URLs</p>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">App / Business Display Name</label>
            <input
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">System Public Web URL</label>
            <input
              value={appUrl}
              onChange={(e) => setAppUrl(e.target.value)}
              placeholder="https://scrm.scalezix.com"
              className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-[var(--accent)] hover:opacity-90 text-white font-semibold rounded-lg text-sm transition-all"
          >
            {loading ? 'Saving...' : 'Save General Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
