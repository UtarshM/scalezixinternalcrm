'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, FileText, ExternalLink, Shield } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Project } from '@/types'

export default function GlobalDocumentationNotesPage() {
  const supabase = createClient()
  const [projects, setProjects] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')

  const fetchDocumentation = React.useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, doc:project_documentation(*)')
        .order('name')

      if (error) throw error
      setProjects(data || [])
    } catch (e: any) {
      toast.error('Failed to load documentation: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  React.useEffect(() => {
    fetchDocumentation()
  }, [fetchDocumentation])

  const filtered = projects.filter(proj =>
    proj.name.toLowerCase().includes(search.toLowerCase()) ||
    proj.project_id.toLowerCase().includes(search.toLowerCase())
  )

  const renderLengthIndicator = (text: string | null) => {
    if (!text) return <span className="text-[10px] bg-rose-500/10 text-rose-500 border border-rose-500/20 px-1.5 py-0.5 rounded font-medium">Empty</span>
    return <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded font-semibold">{text.length} chars</span>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Documentation & Notes</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Global view of deployment instructions, client requirements, and setup docs</p>
      </div>

      <div className="flex bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Search documentation by project name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading project documentation...</div>
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
                  Open Project <ExternalLink size={10} />
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted-foreground)] font-medium">Deployment Instructions:</span>
                  {renderLengthIndicator(proj.doc?.deployment_instructions)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted-foreground)] font-medium">Client Requirements:</span>
                  {renderLengthIndicator(proj.doc?.client_requirements)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted-foreground)] font-medium">Important Instructions:</span>
                  {renderLengthIndicator(proj.doc?.important_instructions)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted-foreground)] font-medium">General Documentation:</span>
                  {renderLengthIndicator(proj.doc?.documentation)}
                </div>
                <div className="flex justify-between items-center border-t border-[var(--border)] pt-2.5">
                  <span className="text-[var(--muted-foreground)] font-medium">Miscellaneous Notes:</span>
                  {renderLengthIndicator(proj.doc?.notes)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
