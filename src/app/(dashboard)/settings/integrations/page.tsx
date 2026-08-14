'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Puzzle, ShieldAlert } from 'lucide-react'

import { SettingsNav } from '@/components/layout/settings-nav'

export default function IntegrationsSettingsPage() {
  const supabase = createClient()

  // Form states
  const [openaiKey, setOpenaiKey] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const fetchIntegrations = async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'integrations').single()
      if (data?.value) {
        const val = data.value as any
        setOpenaiKey(val.openai_api_key || '')
      }
    }
    fetchIntegrations()
  }, [supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await supabase.from('settings').upsert({
        key: 'integrations',
        value: {
          openai_api_key: openaiKey,
        },
      })
      toast.success('Connector configurations saved successfully')
    } catch (err: any) {
      toast.error('Failed to update integration connector keys')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">API Integrations</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Manage external webhooks, AI model API keys, and third-party bindings.</p>
      </div>

      <SettingsNav />

      <div className="max-w-2xl bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-6">

        <div className="p-4 bg-[var(--secondary)] border border-[var(--border)] rounded-lg flex items-start gap-3 text-xs text-[var(--muted-foreground)] leading-relaxed">
          <Puzzle className="text-[var(--accent)] shrink-0 mt-0.5" size={16} />
          <div>
            <p className="font-semibold text-[var(--foreground)] mb-1">AI Automation Stubs (Phase 2)</p>
            Supply your keys below to unlock automated reminders, semantic invoice summary highlights and lead score assessments.
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">OpenAI API Key</label>
            <input
              type="password"
              placeholder="sk-..."
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-[var(--accent)] text-white font-semibold rounded-lg text-sm transition-all"
          >
            {loading ? 'Saving...' : 'Save API Connectors'}
          </button>
        </form>
      </div>
    </div>
  )
}
