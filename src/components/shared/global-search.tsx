'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, FileText, CheckSquare, FolderKanban, Users, Target, X } from 'lucide-react'

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<{
    leads: any[]
    clients: any[]
    projects: any[]
    tasks: any[]
  }>({ leads: [], clients: [], projects: [], tasks: [] })
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()
  const supabase = createClient()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Hook trigger from button click
  React.useEffect(() => {
    const trigger = document.getElementById('global-search-trigger')
    if (trigger) {
      const clickHandler = () => setOpen(true)
      trigger.addEventListener('click', clickHandler)
      return () => trigger.removeEventListener('click', clickHandler)
    }
  }, [])

  React.useEffect(() => {
    if (!query) {
      setResults({ leads: [], clients: [], projects: [], tasks: [] })
      return
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true)
      try {
        const [leadsRes, clientsRes, projectsRes, tasksRes] = await Promise.all([
          supabase.from('leads').select('id, title, status').ilike('title', `%${query}%`).limit(3),
          supabase.from('clients').select('id, company_name').ilike('company_name', `%${query}%`).limit(3),
          supabase.from('projects').select('id, name, project_id').ilike('name', `%${query}%`).limit(3),
          supabase.from('tasks').select('id, title, status').ilike('title', `%${query}%`).limit(3),
        ])

        setResults({
          leads: leadsRes.data || [],
          clients: clientsRes.data || [],
          projects: projectsRes.data || [],
          tasks: tasksRes.data || [],
        })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [query, supabase])

  const navigateTo = (path: string) => {
    setOpen(false)
    setQuery('')
    router.push(path)
  }

  if (!open) return null

  const hasResults =
    results.leads.length > 0 ||
    results.clients.length > 0 ||
    results.projects.length > 0 ||
    results.tasks.length > 0

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in mx-4">
        {/* Search Header */}
        <div className="flex items-center gap-2 px-4 border-b border-[var(--border)]">
          <Search className="text-[var(--muted-foreground)]" size={20} />
          <input
            placeholder="Type command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-12 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none"
            autoFocus
          />
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-md hover:bg-[var(--secondary)] text-[var(--muted-foreground)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[350px] overflow-y-auto p-2 space-y-3">
          {loading && (
            <div className="py-6 text-center text-sm text-[var(--muted-foreground)]">
              Searching databases...
            </div>
          )}

          {!loading && !query && (
            <div className="py-6 text-center text-sm text-[var(--muted-foreground)]">
              Search for leads, projects, tasks, or clients...
            </div>
          )}

          {!loading && query && !hasResults && (
            <div className="py-6 text-center text-sm text-[var(--muted-foreground)]">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {!loading && hasResults && (
            <div className="space-y-4 p-1">
              {results.leads.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase font-semibold text-[var(--muted-foreground)] px-2 mb-1.5 tracking-wider">
                    Leads
                  </div>
                  {results.leads.map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => navigateTo(`/crm/leads/${lead.id}`)}
                      className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--secondary)] text-left"
                    >
                      <Target size={15} className="text-blue-500" />
                      <span className="flex-1 truncate">{lead.title}</span>
                      <span className="text-[10px] uppercase bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded font-medium border border-blue-500/20">
                        {lead.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {results.clients.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase font-semibold text-[var(--muted-foreground)] px-2 mb-1.5 tracking-wider">
                    Clients
                  </div>
                  {results.clients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => navigateTo(`/clients/${client.id}`)}
                      className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--secondary)] text-left"
                    >
                      <Users size={15} className="text-violet-500" />
                      <span className="flex-1 truncate">{client.company_name}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.projects.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase font-semibold text-[var(--muted-foreground)] px-2 mb-1.5 tracking-wider">
                    Projects
                  </div>
                  {results.projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => navigateTo(`/projects/${project.id}`)}
                      className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--secondary)] text-left"
                    >
                      <FolderKanban size={15} className="text-emerald-500" />
                      <span className="flex-1 truncate">{project.name}</span>
                      <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                        {project.project_id}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {results.tasks.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase font-semibold text-[var(--muted-foreground)] px-2 mb-1.5 tracking-wider">
                    Tasks
                  </div>
                  {results.tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => navigateTo(`/tasks/${task.id}`)}
                      className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--secondary)] text-left"
                    >
                      <CheckSquare size={15} className="text-amber-500" />
                      <span className="flex-1 truncate">{task.title}</span>
                      <span className="text-[10px] uppercase bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded font-medium border border-amber-500/20">
                        {task.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
