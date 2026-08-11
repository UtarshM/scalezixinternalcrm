'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Clock, Shield, Calendar, Users, FileText, CheckSquare, Settings } from 'lucide-react'
import { toast } from 'sonner'

export default function GlobalActivityLogsPage() {
  const supabase = createClient()
  const [logs, setLogs] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [moduleFilter, setModuleFilter] = React.useState('')

  const fetchLogs = React.useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*, user:users(*)')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setLogs(data || [])
    } catch (e: any) {
      toast.error('Failed to load activity logs: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  React.useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const filtered = logs.filter(log => {
    const matchSearch =
      (log.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.action || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.user?.full_name || '').toLowerCase().includes(search.toLowerCase())
    const matchModule = moduleFilter ? log.module === moduleFilter : true
    return matchSearch && matchModule
  })

  const getIcon = (module: string) => {
    switch (module) {
      case 'crm':
        return <Users size={16} className="text-violet-500" />
      case 'projects':
        return <CheckSquare size={16} className="text-emerald-500" />
      case 'billing':
        return <FileText size={16} className="text-blue-500" />
      default:
        return <Settings size={16} className="text-amber-500" />
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Activity Logs</h1>
        <p className="text-sm text-[var(--muted-foreground)]">System-wide audit trail for credentials updates, project changes, and team access logs</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Search logs by description, user, action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
          />
        </div>
        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
        >
          <option value="">All Modules</option>
          <option value="crm">CRM / Leads</option>
          <option value="projects">Projects</option>
          <option value="billing">Billing</option>
        </select>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading audit trail...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 bg-[var(--card)] rounded-xl border border-[var(--border)] text-center text-sm text-[var(--muted-foreground)] flex flex-col items-center justify-center gap-2">
          <Clock size={28} className="text-[var(--muted-foreground)]" />
          No activity logs found.
        </div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4 shadow-sm">
          <div className="space-y-4">
            {filtered.map((log, index) => (
              <div key={log.id} className="flex gap-4 items-start border-b border-[var(--border)] pb-3 last:border-0 last:pb-0 text-xs">
                <div className="w-8 h-8 rounded-lg bg-[var(--secondary)] flex items-center justify-center shrink-0">
                  {getIcon(log.module)}
                </div>
                <div className="flex-1 space-y-0.5">
                  <p className="font-semibold text-sm text-[var(--foreground)]">{log.description}</p>
                  <div className="flex items-center gap-2 text-xxs text-[var(--muted-foreground)]">
                    <span className="font-medium text-[var(--foreground)] capitalize">Module: {log.module || 'general'}</span>
                    <span>•</span>
                    <span>Action: {log.action?.replace('_', ' ')}</span>
                    {log.user?.full_name && (
                      <>
                        <span>•</span>
                        <span>By {log.user.full_name}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-[var(--muted-foreground)] flex items-center gap-1 shrink-0 font-medium"><Calendar size={12} /> {new Date(log.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
