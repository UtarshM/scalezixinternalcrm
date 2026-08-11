'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Globe, ExternalLink, Copy } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Project } from '@/types'

const Github = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
)

export default function GlobalUrlsGithubPage() {
  const supabase = createClient()
  const [projects, setProjects] = React.useState<Project[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')

  const fetchProjects = React.useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name')

      if (error) throw error
      setProjects(data || [])
    } catch (e: any) {
      toast.error('Failed to load project URLs: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  React.useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleCopyText = (text: string, label = 'Link') => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const filtered = projects.filter(proj =>
    proj.name.toLowerCase().includes(search.toLowerCase()) ||
    proj.project_id.toLowerCase().includes(search.toLowerCase()) ||
    (proj.github_repo_url || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">URLs & Repositories</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Global list of project environments and repository URLs</p>
      </div>

      <div className="flex bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Search projects by name, ID or repository URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading project URLs...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 bg-[var(--card)] rounded-xl border border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
          No records found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map(proj => (
            <div key={proj.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
                <Link href={`/projects/${proj.id}`} className="hover:underline flex items-center gap-1.5 font-bold text-[var(--foreground)] text-base">
                  {proj.name}
                  <span className="text-xs font-mono text-[var(--muted-foreground)] font-normal">({proj.project_id})</span>
                </Link>
                <Link href={`/projects/${proj.id}`} className="text-xs text-[var(--accent)] hover:underline flex items-center gap-0.5">
                  Full Page <ExternalLink size={10} />
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                {/* Repo url */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--muted-foreground)] font-semibold flex items-center gap-1 shrink-0"><Github size={14} /> Repository:</span>
                  {proj.github_repo_url ? (
                    <div className="flex items-center gap-1 truncate">
                      <a href={proj.github_repo_url} target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline truncate">{proj.github_repo_url}</a>
                      <button onClick={() => handleCopyText(proj.github_repo_url || '', 'GitHub URL')} className="p-1 hover:bg-[var(--secondary)] rounded text-[var(--muted-foreground)]"><Copy size={11} /></button>
                    </div>
                  ) : <span className="text-[var(--muted-foreground)] italic">Not Set</span>}
                </div>

                {/* Prod url */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--muted-foreground)] font-semibold flex items-center gap-1 shrink-0"><Globe size={14} /> Production:</span>
                  {proj.production_url ? (
                    <div className="flex items-center gap-1 truncate">
                      <a href={proj.production_url} target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline truncate">{proj.production_url}</a>
                      <button onClick={() => handleCopyText(proj.production_url || '', 'Production URL')} className="p-1 hover:bg-[var(--secondary)] rounded text-[var(--muted-foreground)]"><Copy size={11} /></button>
                    </div>
                  ) : <span className="text-[var(--muted-foreground)] italic">Not Set</span>}
                </div>

                {/* Staging url */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--muted-foreground)] font-semibold flex items-center gap-1 shrink-0"><Globe size={14} /> Staging:</span>
                  {proj.staging_url ? (
                    <div className="flex items-center gap-1 truncate">
                      <a href={proj.staging_url} target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline truncate">{proj.staging_url}</a>
                      <button onClick={() => handleCopyText(proj.staging_url || '', 'Staging URL')} className="p-1 hover:bg-[var(--secondary)] rounded text-[var(--muted-foreground)]"><Copy size={11} /></button>
                    </div>
                  ) : <span className="text-[var(--muted-foreground)] italic">Not Set</span>}
                </div>

                {/* Admin url */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[var(--muted-foreground)] font-semibold flex items-center gap-1 shrink-0"><Globe size={14} /> Admin URL:</span>
                  {proj.admin_panel_url ? (
                    <div className="flex items-center gap-1 truncate">
                      <a href={proj.admin_panel_url} target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline truncate">{proj.admin_panel_url}</a>
                      <button onClick={() => handleCopyText(proj.admin_panel_url || '', 'Admin URL')} className="p-1 hover:bg-[var(--secondary)] rounded text-[var(--muted-foreground)]"><Copy size={11} /></button>
                    </div>
                  ) : <span className="text-[var(--muted-foreground)] italic">Not Set</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
