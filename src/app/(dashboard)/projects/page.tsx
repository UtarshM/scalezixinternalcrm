'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getProjects, createProjectRecord, updateProjectRecord } from '@/actions/projects'
import { getClients } from '@/actions/clients'
import { getLeads, updateLeadStatus, convertLeadToClient } from '@/actions/leads'
import { getStatusColor, getPriorityColor, formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Search, FolderKanban, Calendar, TrendingUp, ChevronLeft, ChevronRight, Eye, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Project, Client, Lead } from '@/types'

function ProjectsPageContent() {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category')

  const [projects, setProjects] = React.useState<Project[]>([])
  const [clients, setClients] = React.useState<Client[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [showAddModal, setShowAddModal] = React.useState(false)
  const [view, setView] = React.useState<'grid' | 'kanban'>('kanban')

  // Add form states
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [projectId, setProjectId] = React.useState('')
  const [clientId, setClientId] = React.useState('')
  const [category, setCategory] = React.useState('client_project')
  const [projectType, setProjectType] = React.useState('website')
  const [priority, setPriority] = React.useState('medium')
  const [budget, setBudget] = React.useState('')
  const [startDate, setStartDate] = React.useState('')
  const [deadline, setDeadline] = React.useState('')

  const fetchProjectsAndClients = React.useCallback(async () => {
    setLoading(true)
    try {
      const [projData, clientData] = await Promise.all([
        getProjects(),
        getClients(),
      ])
      setProjects(projData)
      setClients(clientData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchProjectsAndClients()
  }, [fetchProjectsAndClients])

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createProjectRecord({
        name,
        project_id: projectId,
        description: description || null,
        client_id: clientId || null,
        category,
        project_type: projectType,
        priority,
        budget: budget ? parseFloat(budget) : null,
        start_date: startDate || null,
        deadline: deadline || null,
        status: 'planning',
      })
      toast.success('Project created successfully')
      setShowAddModal(false)
      // reset
      setName('')
      setProjectId('')
      setDescription('')
      setClientId('')
      setCategory('client_project')
      setProjectType('website')
      setPriority('medium')
      setBudget('')
      setStartDate('')
      setDeadline('')
      fetchProjectsAndClients()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create project')
    }
  }

  const PROJECT_STATUS_COLS = [
    { id: 'planning', label: 'Planning', color: '#3b82f6' },
    { id: 'development', label: 'Development', color: '#8b5cf6' },
    { id: 'testing', label: 'Testing', color: '#f59e0b' },
    { id: 'on_hold', label: 'On Hold', color: '#64748b' },
    { id: 'completed', label: 'Completed', color: '#10b981' },
  ] as const

  const handleMoveProject = async (projectId: string, currentStatus: string, direction: 'prev' | 'next') => {
    const currentIndex = PROJECT_STATUS_COLS.findIndex(status => status.id === currentStatus)
    let newIndex = currentIndex
    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1
    } else if (direction === 'next' && currentIndex < PROJECT_STATUS_COLS.length - 1) {
      newIndex = currentIndex + 1
    }

    if (newIndex === currentIndex) return

    const newStatus = PROJECT_STATUS_COLS[newIndex].id
    try {
      // Optimistic update
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus as any } : p))
      await updateProjectRecord(projectId, { status: newStatus })
      toast.success(`Project moved to ${newStatus}`)
    } catch (e) {
      toast.error('Failed to move project')
      fetchProjectsAndClients() // rollback
    }
  }

  const filteredProjects = projects.filter(proj => {
    const matchSearch = proj.name.toLowerCase().includes(search.toLowerCase()) ||
                        proj.project_id.toLowerCase().includes(search.toLowerCase())
    const matchCategory = categoryParam ? proj.category === categoryParam : true
    return matchSearch && matchCategory
  })

  const columns = React.useMemo(() => {
    const grouped: Record<string, Project[]> = {}
    PROJECT_STATUS_COLS.forEach(status => {
      grouped[status.id] = []
    })
    filteredProjects.forEach(project => {
      if (grouped[project.status]) {
        grouped[project.status].push(project)
      } else {
        // Fallback for cancelled, maintenance, etc.
        grouped['planning'] = grouped['planning'] || []
        grouped['planning'].push(project)
      }
    })
    return grouped
  }, [filteredProjects])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Projects</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Overview of client projects, status, and deadlines</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            placeholder="Search projects by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>

        {/* View toggles */}
        <div className="flex gap-1 p-1 bg-[var(--secondary)] rounded-lg self-end md:self-auto">
          <button
            onClick={() => setView('kanban')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              view === 'kanban' ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm' : 'text-[var(--muted-foreground)]'
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => setView('grid')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              view === 'grid' ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm' : 'text-[var(--muted-foreground)]'
            }`}
          >
            Grid Cards
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading projects...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="py-20 bg-[var(--card)] rounded-xl border border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
          No projects found.
        </div>
      ) : view === 'kanban' ? (
        /* Project Kanban Board */
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1000px] h-[calc(100vh-230px)] items-stretch">
            {PROJECT_STATUS_COLS.map(column => {
              const columnProjects = columns[column.id] || []
              return (
                <div key={column.id} className="flex-1 flex flex-col bg-[var(--secondary)]/20 border border-[var(--border)] rounded-xl overflow-hidden min-w-[200px]">
                  {/* Column Header */}
                  <div className="p-3 border-b border-[var(--border)] bg-[var(--card)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: column.color }} />
                      <span className="font-semibold text-sm text-[var(--foreground)]">{column.label}</span>
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)] bg-[var(--secondary)] px-2 py-0.5 rounded-full">
                      {columnProjects.length}
                    </span>
                  </div>

                  {/* Cards Body */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {columnProjects.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-xl">
                        No projects
                      </div>
                    ) : (
                      columnProjects.map(project => (
                        <div key={project.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <span className="text-[10px] font-mono text-[var(--muted-foreground)]">{project.project_id}</span>
                          </div>
                          <Link href={`/projects/${project.id}`} className="font-bold text-xs text-[var(--foreground)] hover:text-[var(--accent)] line-clamp-2 block mb-1">
                            {project.name}
                          </Link>
                          <p className="text-[10px] text-[var(--muted-foreground)] mb-3">Client: {project.client?.company_name || 'N/A'}</p>

                          {/* Progress bar */}
                          <div className="space-y-1.5 mb-3">
                            <div className="flex justify-between text-[9px] text-[var(--muted-foreground)]">
                              <span>Progress</span>
                              <span className="font-semibold text-[var(--foreground)]">{project.progress}%</span>
                            </div>
                            <div className="w-full h-1 bg-[var(--secondary)] rounded-full overflow-hidden">
                              <div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${project.progress}%` }} />
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--border)]">
                            <span className="text-[9px] text-[var(--muted-foreground)] flex items-center gap-1">
                              <Calendar size={10} />
                              {project.deadline ? formatDate(project.deadline) : 'No deadline'}
                            </span>
                            <span className="text-[9px] text-[var(--foreground)] font-bold">
                              {project.budget ? formatCurrency(project.budget) : 'TBD'}
                            </span>
                          </div>

                          {/* Kanban move controls */}
                          <div className="flex items-center justify-between pt-2 mt-2 border-t border-[var(--border)]/50">
                            <button
                              disabled={column.id === 'planning'}
                              onClick={() => handleMoveProject(project.id, project.status, 'prev')}
                              className="p-1 rounded bg-[var(--secondary)] hover:bg-[var(--border)] disabled:opacity-30 text-[var(--muted-foreground)]"
                            >
                              <ChevronLeft size={12} />
                            </button>
                            <span className="text-[9px] text-[var(--muted-foreground)] font-medium">Move</span>
                            <button
                              disabled={column.id === 'completed'}
                              onClick={() => handleMoveProject(project.id, project.status, 'next')}
                              className="p-1 rounded bg-[var(--secondary)] hover:bg-[var(--border)] disabled:opacity-30 text-[var(--muted-foreground)]"
                            >
                              <ChevronRight size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <div key={project.id} className="card-hover bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-[var(--muted-foreground)]">{project.project_id}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>

                <Link href={`/projects/${project.id}`} className="font-bold text-lg text-[var(--foreground)] hover:text-[var(--accent)] transition-all">
                  {project.name}
                </Link>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">Client: {project.client?.company_name || 'N/A'}</p>

                {/* Progress bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
                    <span>Progress</span>
                    <span className="font-semibold text-[var(--foreground)]">{project.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--secondary)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[var(--border)] flex justify-between items-center text-xs">
                <span className="text-[var(--muted-foreground)] flex items-center gap-1">
                  <Calendar size={12} />
                  {project.deadline ? formatDate(project.deadline) : 'No deadline'}
                </span>
                <span className="font-bold text-[var(--foreground)]">
                  {project.budget ? formatCurrency(project.budget) : 'TBD'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--foreground)]">Create New Project</h3>
            </div>
            <form onSubmit={handleAddProject} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Project ID *</label>
                  <input
                    required
                    placeholder="e.g. SCZ-001"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Project Name *</label>
                  <input
                    required
                    placeholder="e.g. E-Commerce Development"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Client Company</label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="">Select a Client (Optional)</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.company_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="client_project">Client Project</option>
                    <option value="internal_project">Internal Project</option>
                    <option value="product">Product</option>
                    <option value="saas_product">SaaS Product</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Type</label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="website">Website</option>
                    <option value="full_stack">Full Stack</option>
                    <option value="crm">CRM</option>
                    <option value="erp">ERP</option>
                    <option value="mobile_app">Mobile App</option>
                    <option value="saas">SaaS</option>
                    <option value="ai_agent">AI Agent</option>
                    <option value="dashboard">Dashboard</option>
                    <option value="shopify_store">Shopify Store</option>
                    <option value="automation_system">Automation System</option>
                    <option value="internal_tool">Internal Tool</option>
                    <option value="marketing">Marketing</option>
                    <option value="seo">SEO</option>
                    <option value="cloud">Cloud</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Budget (INR)</label>
                  <input
                    type="number"
                    placeholder="Project Budget"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Description</label>
                <textarea
                  placeholder="Outline project objectives..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-semibold"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProjectsPage() {
  return (
    <React.Suspense fallback={<div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading projects...</div>}>
      <ProjectsPageContent />
    </React.Suspense>
  )
}
