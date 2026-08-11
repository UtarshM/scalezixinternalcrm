'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Users, ExternalLink, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function GlobalTeamAccessPage() {
  const supabase = createClient()
  const [members, setMembers] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')

  const fetchMembers = React.useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select('*, project:projects(*), user:users(*)')
        .order('joined_at', { ascending: false })

      if (error) throw error
      setMembers(data || [])
    } catch (e: any) {
      toast.error('Failed to load team access logs: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  React.useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const filtered = members.filter(m =>
    (m.user?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.project?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.role || '').toLowerCase().includes(search.toLowerCase())
  )

  const renderAccessBadge = (hasAccess: boolean) => {
    return hasAccess ? (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500"><Check size={12} /></span>
    ) : (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/10 text-rose-500"><X size={12} /></span>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Team Access Management</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Global overview of developer access permissions across all systems and projects</p>
      </div>

      <div className="flex bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Search by team member, project name or designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading developer access matrix...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 bg-[var(--card)] rounded-xl border border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
          No team members assigned.
        </div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left text-[var(--foreground)]">
            <thead className="bg-[var(--secondary)] text-xs text-[var(--muted-foreground)] font-semibold uppercase border-b border-[var(--border)]">
              <tr>
                <th className="px-4 py-3">Team Member</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Project Role</th>
                <th className="px-4 py-3 text-center">GitHub</th>
                <th className="px-4 py-3 text-center">Vercel</th>
                <th className="px-4 py-3 text-center">Supabase</th>
                <th className="px-4 py-3 text-center">Railway</th>
                <th className="px-4 py-3 text-center">Prod Access</th>
                <th className="px-4 py-3 text-center">Billing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] border-b border-[var(--border)]">
              {filtered.map(member => (
                <tr key={member.id} className="hover:bg-[var(--secondary)]/30">
                  <td className="px-4 py-3 font-semibold text-[var(--foreground)]">
                    {member.user?.full_name || 'Unknown User'}
                    <span className="block text-[10px] text-[var(--muted-foreground)] font-normal">{member.user?.email}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[var(--foreground)]">
                    <Link href={`/projects/${member.project_id}`} className="hover:underline flex items-center gap-1">
                      {member.project?.name}
                      <ExternalLink size={11} className="text-[var(--muted-foreground)]" />
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs capitalize font-semibold">{member.role}</td>
                  <td className="px-4 py-3 text-center">{renderAccessBadge(member.github_access)}</td>
                  <td className="px-4 py-3 text-center">{renderAccessBadge(member.vercel_access)}</td>
                  <td className="px-4 py-3 text-center">{renderAccessBadge(member.supabase_access)}</td>
                  <td className="px-4 py-3 text-center">{renderAccessBadge(member.railway_access)}</td>
                  <td className="px-4 py-3 text-center">{renderAccessBadge(member.production_access)}</td>
                  <td className="px-4 py-3 text-center">{renderAccessBadge(member.billing_access)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
