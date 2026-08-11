'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createTaskRecord } from '@/actions/tasks'
import { getProjects } from '@/actions/projects'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import type { Project, User, Milestone } from '@/types'

function NewTaskPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultProjectId = searchParams.get('project_id') || ''
  const defaultMilestoneId = searchParams.get('milestone_id') || ''
  const supabase = createClient()

  const [projects, setProjects] = React.useState<Project[]>([])
  const [users, setUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)

  // Form states
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [projectId, setProjectId] = React.useState(defaultProjectId)
  const [milestones, setMilestones] = React.useState<Milestone[]>([])
  const [milestoneId, setMilestoneId] = React.useState(defaultMilestoneId)
  const [assignedTo, setAssignedTo] = React.useState('')
  const [priority, setPriority] = React.useState('medium')
  const [dueDate, setDueDate] = React.useState('')
  const [estHours, setEstHours] = React.useState('')

  React.useEffect(() => {
    if (defaultProjectId) setProjectId(defaultProjectId)
    if (defaultMilestoneId) setMilestoneId(defaultMilestoneId)
  }, [defaultProjectId, defaultMilestoneId])

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [projData, { data: userData }] = await Promise.all([
          getProjects(),
          supabase.from('users').select('*'),
        ])
        setProjects(projData)
        setUsers(userData || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [supabase])

  React.useEffect(() => {
    if (!projectId) {
      setMilestones([])
      setMilestoneId('')
      return
    }
    const fetchMilestones = async () => {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true })
      
      if (!error && data) {
        setMilestones(data)
      }
    }
    fetchMilestones()
  }, [projectId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createTaskRecord({
        title,
        description: description || null,
        project_id: projectId || null,
        milestone_id: milestoneId || null,
        assigned_to: assignedTo || null,
        priority,
        due_date: dueDate || null,
        estimated_hours: estHours ? parseFloat(estHours) : null,
        status: 'todo',
      })
      toast.success('Task created successfully')
      router.push('/tasks')
    } catch (err: any) {
      toast.error(err.message || 'Failed to create task')
    }
  }

  if (loading) return <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading options...</div>

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <div className="space-y-1">
        <button
          onClick={() => router.push('/tasks')}
          className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Back to Tasks
        </button>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Create Task</h1>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Task Title *</label>
            <input
              required
              placeholder="e.g. Set up API endpoints"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Project Link (Optional)</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
              >
                <option value="">No Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Milestone Link (Optional)</label>
              <select
                value={milestoneId}
                onChange={(e) => setMilestoneId(e.target.value)}
                disabled={!projectId}
                className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none disabled:opacity-50"
              >
                <option value="">No Milestone</option>
                {milestones.map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Assignee</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
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
              <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Estimated Hours</label>
              <input
                type="number"
                placeholder="Hours"
                value={estHours}
                onChange={(e) => setEstHours(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Description</label>
            <textarea
              placeholder="Outline task deliverables or details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => router.push('/tasks')}
              className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-semibold"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function NewTaskPage() {
  return (
    <React.Suspense fallback={<div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading page...</div>}>
      <NewTaskPageContent />
    </React.Suspense>
  )
}
