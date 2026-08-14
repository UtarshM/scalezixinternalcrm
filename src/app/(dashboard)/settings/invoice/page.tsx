'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

import { SettingsNav } from '@/components/layout/settings-nav'

export default function InvoiceSettingsPage() {
  const supabase = createClient()

  // Form states
  const [prefix, setPrefix] = React.useState('INV')
  const [nextNumber, setNextNumber] = React.useState('1')
  const [dueDays, setDueDays] = React.useState('30')
  const [defaultTerms, setDefaultTerms] = React.useState('Payment is due within 30 days of invoice date.')
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const fetchInvoiceSettings = async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'invoice').single()
      if (data?.value) {
        const val = data.value as any
        setPrefix(val.prefix || 'INV')
        setNextNumber(String(val.next_number || 1))
        setDueDays(String(val.default_due_days || 30))
        setDefaultTerms(val.default_terms || '')
      }
    }
    fetchInvoiceSettings()
  }, [supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await supabase.from('settings').upsert({
        key: 'invoice',
        value: {
          prefix,
          next_number: parseInt(nextNumber) || 1,
          default_due_days: parseInt(dueDays) || 30,
          default_terms: defaultTerms,
        },
      })
      toast.success('Invoice billing settings saved')
    } catch (err: any) {
      toast.error('Failed to update invoice settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Invoice & Billing Settings</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Configure billing terms, default invoice prefixes, and payment cycles.</p>
      </div>

      <SettingsNav />

      <div className="max-w-2xl bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm">

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Invoice Prefix</label>
              <input
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Next Serial #</label>
              <input
                type="number"
                value={nextNumber}
                onChange={(e) => setNextNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Due Days</label>
              <input
                type="number"
                value={dueDays}
                onChange={(e) => setDueDays(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Default Payment Terms & Notes</label>
            <textarea
              value={defaultTerms}
              onChange={(e) => setDefaultTerms(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-[var(--accent)] text-white font-semibold rounded-lg text-sm transition-all"
          >
            {loading ? 'Saving...' : 'Save Invoice Configuration'}
          </button>
        </form>
      </div>
    </div>
  )
}
