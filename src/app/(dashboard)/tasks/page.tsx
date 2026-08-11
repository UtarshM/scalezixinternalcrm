'use client'

import * as React from 'react'
import Link from 'next/link'
import { getTasks, updateTaskStatus } from '@/actions/tasks'
import { getProjects } from '@/actions/projects'
import { getStatusColor, getPriorityColor, formatDate } from '@/lib/utils'
import { TASK_STATUSES } from '@/lib/constants'
import { Plus, Search, Calendar, CheckSquare, ChevronLeft, ChevronRight, RefreshCw, Eye } from 'lucide-react'
import { toast } from 'sonner'
import type { Task, Project } from '@/types'

export default function TasksPage() {
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [projects, setProjects] = React.useState<Project[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [projectFilter, setProjectFilter] = React.useState('all')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [view, setView] = React.useState<'kanban' | 'table'>('kanban')

  const fetchTasksAndProjects = React.useCallback(async () => {
    setLoading(true)
    try {
      const [tasksData, projectsData] = await Promise.all([getTasks(), getProjects()])
      setTasks(tasksData)
      setProjects(projectsData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchTasksAndProjects()
  }, [fetchTasksAndProjects])

  const handleMoveTask = async (taskId: string, currentStatus: string, direction: 'prev' | 'next', projectId?: string) => {
    const currentIndex = TASK_STATUSES.findIndex(status => status.id === currentStatus)
    let newIndex = currentIndex
    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1
    } else if (direction === 'next' && currentIndex < TASK_STATUSES.length - 1) {
      newIndex = currentIndex + 1
    }

    if (newIndex === currentIndex) return

    const newStatus = TASK_STATUSES[newIndex].id
    try {
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t))
      await updateTaskStatus(taskId, newStatus, projectId)
      toast.success(`Task moved to ${newStatus}`)
    } catch (e) {
      toast.error('Failed to move task')
      fetchTasksAndProjects() // rollback
    }
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase())
    const matchesProject = projectFilter === 'all' || task.project_id === projectFilter
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    return matchesSearch && matchesProject && matchesStatus
  })

  // Group tasks for Kanban columns
  const columns = React.useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    TASK_STATUSES.forEach(status => {
      grouped[status.id] = []
    })
    filteredTasks.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task)
      } else {
        grouped['todo'] = grouped['todo'] || []
        grouped['todo'].push(task)
      }
    })
    return grouped
  }, [filteredTasks])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Tasks</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Track team tasks, backlogs, checklists, and status</p>
        </div>
        <Link
          href="/tasks/new"
          className="flex items-center gap-2 bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
        >
          <Plus size={16} />
          Create Task
        </Link>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
        <div className="flex flex-wrap flex-1 gap-3 items-center">
          <div className="relative flex-1 max-w-xs min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
            />
          </div>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            {TASK_STATUSES.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
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
            onClick={() => setView('table')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              view === 'table' ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm' : 'text-[var(--muted-foreground)]'
            }`}
          >
            Table List
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-20 bg-[var(--card)] rounded-xl border border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
          No tasks found.
        </div>
      ) : view === 'kanban' ? (
        /* Kanban Board */
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1200px] h-[calc(100vh-230px)] items-stretch">
            {TASK_STATUSES.map(column => {
              const columnTasks = columns[column.id] || []
              return (
                <div key={column.id} className="flex-1 flex flex-col bg-[var(--secondary)]/20 border border-[var(--border)] rounded-xl overflow-hidden min-w-[200px]">
                  {/* Column Header */}
                  <div className="p-3 border-b border-[var(--border)] bg-[var(--card)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: column.color }} />
                      <span className="font-semibold text-sm text-[var(--foreground)]">{column.label}</span>
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)] bg-[var(--secondary)] px-2 py-0.5 rounded-full">
                      {columnTasks.length}
                    </span>
                  </div>

                  {/* Cards Body */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {columnTasks.map(task => (
                      <div key={task.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        <Link href={`/tasks/${task.id}`} className="font-bold text-xs text-[var(--foreground)] hover:text-[var(--accent)] line-clamp-2 block mb-1">
                          {task.title}
                        </Link>
                        {task.project && (
                          <span className="text-[10px] text-[var(--accent)] bg-[var(--accent)]/5 px-2 py-0.5 rounded border border-[var(--accent)]/10 font-medium">
                            {task.project.name}
                          </span>
                        )}
                        <div className="flex items-center justify-between mt-4 pt-2 border-t border-[var(--border)]">
                          <span className="text-[10px] text-[var(--muted-foreground)] flex items-center gap-1">
                            <Calendar size={10} />
                            {task.due_date ? formatDate(task.due_date) : 'No due date'}
                          </span>
                          <span className="text-[10px] text-[var(--foreground)] font-semibold">
                            {task.assignee?.full_name?.split(' ')[0] || 'Unassigned'}
                          </span>
                        </div>

                        {/* Kanban move controls */}
                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-[var(--border)]/50">
                          <button
                            disabled={column.id === 'todo'}
                            onClick={() => handleMoveTask(task.id, task.status, 'prev', task.project_id || undefined)}
                            className="p-1 rounded bg-[var(--secondary)] hover:bg-[var(--border)] disabled:opacity-30 text-[var(--muted-foreground)]"
                          >
                            <ChevronLeft size={12} />
                          </button>
                          <span className="text-[10px] text-[var(--muted-foreground)]">Move</span>
                          <button
                            disabled={column.id === 'blocked'}
                            onClick={() => handleMoveTask(task.id, task.status, 'next', task.project_id || undefined)}
                            className="p-1 rounded bg-[var(--secondary)] hover:bg-[var(--border)] disabled:opacity-30 text-[var(--muted-foreground)]"
                          >
                            <ChevronRight size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Table View */
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50">
                <th className="p-4 font-semibold text-[var(--muted-foreground)]">Task Title</th>
                <th className="p-4 font-semibold text-[var(--muted-foreground)]">Project</th>
                <th className="p-4 font-semibold text-[var(--muted-foreground)]">Assignee</th>
                <th className="p-4 font-semibold text-[var(--muted-foreground)]">Due Date</th>
                <th className="p-4 font-semibold text-[var(--muted-foreground)]">Priority</th>
                <th className="p-4 font-semibold text-[var(--muted-foreground)]">Status</th>
                <th className="p-4 font-semibold text-[var(--muted-foreground)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredTasks.map(task => (
                <tr key={task.id} className="hover:bg-[var(--secondary)]/30 transition-colors">
                  <td className="p-4">
                    <Link href={`/tasks/${task.id}`} className="font-semibold text-[var(--accent)] hover:underline">
                      {task.title}
                    </Link>
                  </td>
                  <td className="p-4 text-[var(--foreground)]">{task.project?.name || '-'}</td>
                  <td className="p-4 text-[var(--foreground)]">{task.assignee?.full_name || 'Unassigned'}</td>
                  <td className="p-4 text-[var(--foreground)]">{task.due_date ? formatDate(task.due_date) : '-'}</td>
                  <td className="p-4">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/tasks/${task.id}`} className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline">
                      <Eye size={12} />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
