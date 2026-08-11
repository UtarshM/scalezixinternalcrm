'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Server, ExternalLink, Cpu } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Project } from '@/types'

export default function GlobalHostingDeploymentPage() {
  const supabase = createClient()
  const [projects, setProjects] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')

  const fetchHostingData = React.useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, hosting:project_hosting_deployments(*)')
        .order('name')

      if (error) throw error
      setProjects(data || [])
    } catch (e: any) {
      toast.error('Failed to load hosting setups: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  React.useEffect(() => {
    fetchHostingData()
  }, [fetchHostingData])

  const filtered = projects.filter(proj =>
    proj.name.toLowerCase().includes(search.toLowerCase()) ||
    proj.project_id.toLowerCase().includes(search.toLowerCase()) ||
    (proj.hosting?.hosting_provider || '').toLowerCase().includes(search.toLowerCase()) ||
    (proj.hosting?.frontend_tech || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Hosting & Deployments</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Global list of project hosting, databases, and deployment methods</p>
      </div>

      <div className="flex bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Search hosting setups by project, provider, or frontend tech..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading hosting details...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 bg-[var(--card)] rounded-xl border border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
          No records found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-none">
          {filtered.map(proj => (
            <div key={proj.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
                <Link href={`/projects/${proj.id}`} className="hover:underline flex items-center gap-1.5 font-bold text-[var(--foreground)] text-base">
                  {proj.name}
                  <span className="text-xs font-mono text-[var(--muted-foreground)] font-normal">({proj.project_id})</span>
                </Link>
                <Link href={`/projects/${proj.id}`} className="text-xs text-[var(--accent)] hover:underline flex items-center gap-0.5">
                  View Detail <ExternalLink size={10} />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[var(--muted-foreground)] block">Hosting Provider:</span>
                  <span className="font-semibold text-[var(--foreground)] mt-0.5 block">{proj.hosting?.hosting_provider || <span className="italic text-[var(--muted-foreground)] font-normal">Not configured</span>}</span>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)] block">Frontend:</span>
                  <span className="font-semibold text-[var(--foreground)] mt-0.5 block">{proj.hosting?.frontend_tech || <span className="italic text-[var(--muted-foreground)] font-normal">Not configured</span>}</span>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)] block">Backend:</span>
                  <span className="font-semibold text-[var(--foreground)] mt-0.5 block">{proj.hosting?.backend_tech || <span className="italic text-[var(--muted-foreground)] font-normal">Not configured</span>}</span>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)] block">Database:</span>
                  <span className="font-semibold text-[var(--foreground)] mt-0.5 block">{proj.hosting?.database_tech || <span className="italic text-[var(--muted-foreground)] font-normal">Not configured</span>}</span>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)] block">Domain Registrar:</span>
                  <span className="font-semibold text-[var(--foreground)] mt-0.5 block">{proj.hosting?.domain_provider || <span className="italic text-[var(--muted-foreground)] font-normal">Not configured</span>}</span>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)] block">Deployment Method:</span>
                  <span className="font-semibold text-[var(--foreground)] mt-0.5 block">{proj.hosting?.deployment_method || <span className="italic text-[var(--muted-foreground)] font-normal font-medium">-</span>}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
