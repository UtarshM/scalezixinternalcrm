'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Image from 'next/image'

import { SettingsNav } from '@/components/layout/settings-nav'

export default function CompanySettingsPage() {
  const supabase = createClient()

  // Form states
  const [companyName, setCompanyName] = React.useState('Scalezix')
  const [gstNum, setGstNum] = React.useState('')
  const [panNum, setPanNum] = React.useState('')
  const [website, setWebsite] = React.useState('https://scalezix.co')
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const fetchCompanySettings = async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'company').single()
      if (data?.value) {
        const val = data.value as any
        setCompanyName(val.name || '')
        setGstNum(val.gst_number || '')
        setPanNum(val.pan_number || '')
        setWebsite(val.website || '')
      }
    }
    fetchCompanySettings()
  }, [supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await supabase.from('settings').upsert({
        key: 'company',
        value: {
          name: companyName,
          gst_number: gstNum,
          pan_number: panNum,
          website,
        },
      })
      toast.success('Company profiles setting updated successfully')
    } catch (err: any) {
      toast.error('Failed to update company settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Company Branding</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Manage company branding details, logo previews, and Indian GST split calculation parameters.</p>
      </div>

      <SettingsNav />

      <div className="max-w-2xl bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-6">

        {/* Logo preview */}
        <div className="flex items-center gap-4 border-b border-[var(--border)] pb-4">
          <Image src="/logo.png" alt="Logo" width={120} height={36} className="dark:invert" />
          <span className="text-xs text-[var(--muted-foreground)]">System Logo staged from public/logo.png</span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Official Company Name *</label>
            <input
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Corporate GSTIN</label>
              <input
                value={gstNum}
                onChange={(e) => setGstNum(e.target.value)}
                placeholder="GSTIN number"
                className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Corporate PAN</label>
              <input
                value={panNum}
                onChange={(e) => setPanNum(e.target.value)}
                placeholder="PAN number"
                className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Official Website</label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-[var(--accent)] text-white font-semibold rounded-lg text-sm transition-all"
          >
            {loading ? 'Saving...' : 'Save Corporate Branding'}
          </button>
        </form>
      </div>
    </div>
  )
}
