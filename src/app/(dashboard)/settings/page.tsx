'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { SettingsNav } from '@/components/layout/settings-nav'
import { getAppUrl } from '@/lib/utils'
import {
  Globe,
  Building,
  CheckCircle2,
  Copy,
  ExternalLink,
  Shield,
  Server,
  Database,
  Cpu,
  Clock,
  RefreshCw,
  Sliders,
  Zap,
  Lock
} from 'lucide-react'

export default function SettingsOverviewPage() {
  const supabase = createClient()

  // App settings state
  const [appName, setAppName] = React.useState('Scalezix OS')
  const [appUrl, setAppUrl] = React.useState('https://scalezixinternalcrm.vercel.app')
  const [currency, setCurrency] = React.useState('INR')
  const [timezone, setTimezone] = React.useState('Asia/Kolkata')

  // System Toggles
  const [maintenanceMode, setMaintenanceMode] = React.useState(false)
  const [allowRegistration, setAllowRegistration] = React.useState(false)
  const [emailNotifications, setEmailNotifications] = React.useState(true)
  const [auditLogging, setAuditLogging] = React.useState(true)

  const [loading, setLoading] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    // Set default deployed app URL
    const currentUrl = getAppUrl()
    if (currentUrl && !currentUrl.includes('localhost')) {
      setAppUrl(currentUrl)
    } else {
      setAppUrl('https://scalezixinternalcrm.vercel.app')
    }

    async function loadSettings() {
      try {
        const { data } = await supabase.from('settings').select('value').eq('key', 'general').single()
        if (data?.value) {
          const val = data.value
          if (val.app_name) setAppName(val.app_name)
          if (val.app_url) setAppUrl(val.app_url)
          if (val.currency) setCurrency(val.currency)
          if (val.timezone) setTimezone(val.timezone)
          if (val.maintenance_mode !== undefined) setMaintenanceMode(val.maintenance_mode)
          if (val.allow_registration !== undefined) setAllowRegistration(val.allow_registration)
          if (val.email_notifications !== undefined) setEmailNotifications(val.email_notifications)
          if (val.audit_logging !== undefined) setAuditLogging(val.audit_logging)
        }
      } catch (err) {
        // Fallback to defaults
      }
    }
    loadSettings()
  }, [supabase])

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(appUrl)
    setCopied(true)
    toast.success('App URL copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await supabase.from('settings').upsert({
        key: 'general',
        value: {
          app_name: appName,
          app_url: appUrl,
          currency,
          timezone,
          maintenance_mode: maintenanceMode,
          allow_registration: allowRegistration,
          email_notifications: emailNotifications,
          audit_logging: auditLogging,
          updated_at: new Date().toISOString()
        },
      })
      toast.success('General settings updated successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">General Settings</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Configure Scalezix CRM platform parameters, system URLs, and live environment settings.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <SettingsNav />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Business & System Identification Card */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
                <Globe size={18} className="text-[var(--accent)]" />
                <h3 className="font-bold text-sm text-[var(--foreground)]">System Identification & URLs</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--foreground)] mb-1.5 block">
                    App / Business Display Name
                  </label>
                  <input
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    required
                    placeholder="Scalezix OS"
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                  <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
                    Appears on login screens, page titles, and system communications.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--foreground)] mb-1.5 block">
                    Deployed Production URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      value={appUrl}
                      onChange={(e) => setAppUrl(e.target.value)}
                      required
                      placeholder="https://scalezixinternalcrm.vercel.app"
                      className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="px-3 py-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-xs text-[var(--foreground)] hover:bg-[var(--card)] transition-all flex items-center gap-1.5 shrink-0"
                      title="Copy URL"
                    >
                      {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <a
                      href={appUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 rounded-lg text-xs font-semibold hover:bg-[var(--accent)]/20 transition-all flex items-center gap-1.5 shrink-0"
                      title="Open Deployed Application"
                    >
                      <ExternalLink size={14} />
                      Open
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-[var(--foreground)] mb-1.5 block">
                      Default Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                    >
                      <option value="INR">INR (₹ - Indian Rupee)</option>
                      <option value="USD">USD ($ - US Dollar)</option>
                      <option value="EUR">EUR (€ - Euro)</option>
                      <option value="GBP">GBP (£ - British Pound)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--foreground)] mb-1.5 block">
                      Default Timezone
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+5:30)</option>
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* System Operational Toggles */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
                <Sliders size={18} className="text-[var(--accent)]" />
                <h3 className="font-bold text-sm text-[var(--foreground)]">System Controls & Preferences</h3>
              </div>

              <div className="divide-y divide-[var(--border)] text-xs">
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[var(--foreground)]">Maintenance Mode</div>
                    <div className="text-[var(--muted-foreground)]">
                      Temporarily restrict platform access for non-admin users during updates.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={maintenanceMode}
                      onChange={(e) => setMaintenanceMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[var(--secondary)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                  </label>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[var(--foreground)]">Public Self-Registration</div>
                    <div className="text-[var(--muted-foreground)]">
                      Allow new employees or users to create accounts without admin invite.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowRegistration}
                      onChange={(e) => setAllowRegistration(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[var(--secondary)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                  </label>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[var(--foreground)]">Email Activity Alerts</div>
                    <div className="text-[var(--muted-foreground)]">
                      Send automatic email notifications for invoice generation and leave updates.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[var(--secondary)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                  </label>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[var(--foreground)]">System Audit Logging</div>
                    <div className="text-[var(--muted-foreground)]">
                      Log security actions, user logins, and administrative modifications.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={auditLogging}
                      onChange={(e) => setAuditLogging(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[var(--secondary)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-[var(--accent)] hover:opacity-90 text-white font-semibold rounded-xl text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Saving Settings...' : 'Save General Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Infrastructure & System Health Status Card */}
        <div className="space-y-6">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <Server size={18} className="text-emerald-500" />
              <h3 className="font-bold text-sm text-[var(--foreground)]">Live System Infrastructure</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between">
                <span className="font-semibold text-emerald-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Deployed Environment
                </span>
                <span className="font-mono text-[11px] text-[var(--foreground)]">Vercel Production</span>
              </div>

              <div className="p-3 border border-[var(--border)] bg-[var(--secondary)]/15 rounded-lg space-y-1.5">
                <div className="text-[var(--muted-foreground)] flex items-center justify-between">
                  <span>Live App URL:</span>
                  <a
                    href={appUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--accent)] font-mono hover:underline flex items-center gap-1"
                  >
                    scalezixinternalcrm.vercel.app
                    <ExternalLink size={10} />
                  </a>
                </div>

                <div className="text-[var(--muted-foreground)] flex items-center justify-between">
                  <span>Database engine:</span>
                  <span className="font-semibold text-[var(--foreground)]">Supabase PostgreSQL</span>
                </div>

                <div className="text-[var(--muted-foreground)] flex items-center justify-between">
                  <span>Framework:</span>
                  <span className="font-semibold text-[var(--foreground)]">Next.js 16 (App Router)</span>
                </div>

                <div className="text-[var(--muted-foreground)] flex items-center justify-between">
                  <span>Auth Engine:</span>
                  <span className="font-semibold text-[var(--foreground)]">Supabase Auth (RLS)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Support Card */}
          <div className="bg-gradient-to-br from-[var(--accent)]/10 via-[var(--card)] to-[var(--card)] border border-[var(--accent)]/20 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-[var(--accent)] font-bold text-sm">
              <Shield size={16} />
              Scalezix CRM Operating System
            </div>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              All settings are saved directly to your Supabase PostgreSQL cluster with Row-Level Security (RLS) policies enabled.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
