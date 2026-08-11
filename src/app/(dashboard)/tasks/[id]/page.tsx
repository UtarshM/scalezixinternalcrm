'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getTaskById, updateTaskStatus, createTaskSubtask, toggleTaskSubtask, deleteTaskSubtask, createTaskComment, startTaskTimer, stopTaskTimer, addManualTimeLog, deleteTaskRecord } from '@/actions/tasks'
import { getStatusColor, getPriorityColor, formatDate } from '@/lib/utils'
import { TASK_STATUSES } from '@/lib/constants'
import { ArrowLeft, Play, Square, Plus, Trash2, Clock, Calendar, ShieldAlert, CheckCircle2, User, MessageCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Task } from '@/types'

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [task, setTask] = React.useState<Task | null>(null)
  const [loading, setLoading] = React.useState(true)

  // Timer state
  const [activeTimerId, setActiveTimerId] = React.useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0)
  const [timerIntervalId, setTimerIntervalId] = React.useState<any>(null)
  const [showStopTimerModal, setShowStopTimerModal] = React.useState(false)
  const [timerNotes, setTimerNotes] = React.useState('')

  // Subtasks/checklist state
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('')

  // Comments state
  const [commentContent, setCommentContent] = React.useState('')

  // Manual log state
  const [showManualLogModal, setShowManualLogModal] = React.useState(false)
  const [manualDuration, setManualDuration] = React.useState('')
  const [manualNotes, setManualNotes] = React.useState('')

  const fetchTask = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTaskById(id)
      setTask(data)

      // Look for a running timer for this task
      if (data?.time_logs) {
        const runningLog = data.time_logs.find(log => log.end_time === null)
        if (runningLog) {
          setActiveTimerId(runningLog.id)
          const startTime = new Date(runningLog.start_time).getTime()
          const diffSeconds = Math.floor((Date.now() - startTime) / 1000)
          setElapsedSeconds(diffSeconds)
        }
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to load task details')
    } finally {
      setLoading(false)
    }
  }, [id])

  React.useEffect(() => {
    fetchTask()
  }, [fetchTask])

  // Local timer update interval
  React.useEffect(() => {
    if (activeTimerId) {
      const interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1)
      }, 1000)
      setTimerIntervalId(interval)
      return () => clearInterval(interval)
    } else {
      if (timerIntervalId) {
        clearInterval(timerIntervalId)
        setTimerIntervalId(null)
      }
      setElapsedSeconds(0)
    }
  }, [activeTimerId])

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateTaskStatus(id, newStatus, task?.project_id || undefined)
      toast.success(`Task status updated to ${newStatus}`)
      fetchTask()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubtaskTitle.trim()) return
    try {
      await createTaskSubtask(id, newSubtaskTitle)
      toast.success('Subtask added')
      setNewSubtaskTitle('')
      fetchTask()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleToggleSubtask = async (subtaskId: string, isCompleted: boolean) => {
    try {
      await toggleTaskSubtask(subtaskId, isCompleted, id)
      fetchTask()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await deleteTaskSubtask(subtaskId, id)
      toast.success('Subtask removed')
      fetchTask()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentContent.trim()) return
    try {
      await createTaskComment(id, commentContent)
      toast.success('Comment posted')
      setCommentContent('')
      fetchTask()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleStartTimer = async () => {
    try {
      const logId = await startTaskTimer(id, true)
      setActiveTimerId(logId)
      toast.success('Timer started!')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleStopTimer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeTimerId) return
    try {
      await stopTaskTimer(activeTimerId, timerNotes, id)
      toast.success('Timer stopped. Log updated.')
      setActiveTimerId(null)
      setShowStopTimerModal(false)
      setTimerNotes('')
      fetchTask()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleAddManualLog = async (e: React.FormEvent) => {
    e.preventDefault()
    const minutes = parseInt(manualDuration)
    if (isNaN(minutes) || minutes <= 0) return
    try {
      await addManualTimeLog(id, minutes, true, manualNotes)
      toast.success('Time log added manually')
      setShowManualLogModal(false)
      setManualDuration('')
      setManualNotes('')
      fetchTask()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDeleteTask = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return
    try {
      await deleteTaskRecord(id, task?.project_id || undefined)
      toast.success('Task deleted')
      router.push('/tasks')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600)
    const mins = Math.floor((totalSecs % 3600) / 60)
    const secs = totalSecs % 60
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  if (loading) return <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading task...</div>
  if (!task) return <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Task not found.</div>

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <button
          onClick={() => router.push('/tasks')}
          className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Back to Tasks
        </button>

        <div className="flex items-center gap-2">
          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3 py-2 text-sm bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
          >
            {TASK_STATUSES.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <button
            onClick={handleDeleteTask}
            className="p-2 border border-red-500/20 rounded-lg text-red-500 hover:bg-red-500/10 transition-all"
            title="Delete task"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Grid columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Core details */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-6">
            <div>
              <div className="flex gap-2 mb-2">
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                  {task.priority} Priority
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">{task.title}</h2>
              {task.project && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-[var(--accent)]">
                  <p>
                    Project: <Link href={`/projects/${task.project_id}`} className="hover:underline font-semibold">{task.project.name}</Link>
                  </p>
                  {task.milestone && (
                    <p className="text-emerald-500 font-semibold border-l border-[var(--border)] pl-4">
                      Milestone: <span className="text-[var(--foreground)]">{task.milestone.title}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {task.description && (
              <div className="pt-4 border-t border-[var(--border)]">
                <span className="text-xs text-[var(--muted-foreground)] block mb-1">Details</span>
                <p className="text-sm text-[var(--foreground)] leading-relaxed bg-[var(--secondary)]/30 p-3.5 rounded-lg border border-[var(--border)]">
                  {task.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border)] text-sm">
              <div>
                <span className="text-xs text-[var(--muted-foreground)] block mb-1">Assignee</span>
                <span className="text-[var(--foreground)] font-semibold flex items-center gap-1.5">
                  <User size={14} />
                  {task.assignee?.full_name || 'Unassigned'}
                </span>
              </div>
              <div>
                <span className="text-xs text-[var(--muted-foreground)] block mb-1">Estimated Hours</span>
                <span className="text-[var(--foreground)] font-semibold">{task.estimated_hours || '-'} hrs</span>
              </div>
            </div>
          </div>

          {/* Subtasks Checklist */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-[var(--foreground)]">Checklist / Subtasks</h3>
            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <input
                required
                placeholder="Add item..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
              />
              <button
                type="submit"
                className="bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
              >
                Add
              </button>
            </form>

            <div className="space-y-2 pt-2">
              {task.subtasks?.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">No subtasks defined.</p>
              ) : (
                task.subtasks?.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 bg-[var(--secondary)]/20 rounded-lg border border-[var(--border)]">
                    <label className="flex items-center gap-3 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={sub.is_completed}
                        onChange={(e) => handleToggleSubtask(sub.id, e.target.checked)}
                        className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                      />
                      <span className={sub.is_completed ? 'line-through text-[var(--muted-foreground)]' : 'text-[var(--foreground)]'}>
                        {sub.title}
                      </span>
                    </label>
                    <button
                      onClick={() => handleDeleteSubtask(sub.id)}
                      className="p-1 rounded text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/5 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Comments section */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-[var(--foreground)] flex items-center gap-2">
              <MessageCircle size={18} />
              Comments
            </h3>
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                required
                placeholder="Post an update or question..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
              />
              <button
                type="submit"
                className="bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
              >
                Comment
              </button>
            </form>

            <div className="space-y-4 pt-2">
              {task.comments?.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">No comments posted.</p>
              ) : (
                task.comments?.map((comment) => (
                  <div key={comment.id} className="p-3 bg-[var(--secondary)]/10 rounded-lg border border-[var(--border)]">
                    <div className="flex justify-between items-center text-xs text-[var(--muted-foreground)] mb-1">
                      <span className="font-semibold text-[var(--foreground)]">{comment.user?.full_name || 'System'}</span>
                      <span>{formatDate(comment.created_at)}</span>
                    </div>
                    <p className="text-sm text-[var(--foreground)]">{comment.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right side: Timer tracker widgets */}
        <div className="space-y-6">
          {/* Active Timer Widget */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4 text-center">
            <h3 className="font-bold text-[var(--foreground)] text-base">Time Tracker</h3>
            <div className="py-6 font-mono text-3xl font-bold tracking-wider text-[var(--foreground)] bg-[var(--secondary)]/40 rounded-xl border border-[var(--border)]">
              {formatTimer(elapsedSeconds)}
            </div>

            {activeTimerId ? (
              <button
                onClick={() => setShowStopTimerModal(true)}
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-red-500/10"
              >
                <Square size={16} />
                Stop Track Timer
              </button>
            ) : (
              <button
                onClick={handleStartTimer}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/10"
              >
                <Play size={16} />
                Start Work Timer
              </button>
            )}

            <button
              onClick={() => setShowManualLogModal(true)}
              className="w-full py-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline block"
            >
              Add time log manually
            </button>
          </div>

          {/* Time logs log list */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-[var(--foreground)]">Logged Work Hours</h3>
              <span className="text-xs bg-[var(--accent)]/10 text-[var(--accent)] font-bold px-2 py-0.5 rounded border border-[var(--accent)]/10">
                Total: {task.actual_hours} hrs
              </span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {task.time_logs?.filter(l => l.end_time !== null).length === 0 ? (
                <p className="text-xs text-[var(--muted-foreground)]">No work hours logged yet.</p>
              ) : (
                task.time_logs?.filter(l => l.end_time !== null).map((log) => (
                  <div key={log.id} className="p-3 bg-[var(--secondary)]/30 rounded-lg border border-[var(--border)] text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-[var(--foreground)]">{log.user?.full_name || 'System'}</span>
                      <span className="font-mono font-bold text-[var(--accent)]">
                        {log.duration_minutes ? (log.duration_minutes / 60).toFixed(2) : '0'} hrs
                      </span>
                    </div>
                    <div className="text-[10px] text-[var(--muted-foreground)] mb-1.5 flex justify-between">
                      <span>{log.is_manual ? 'Manual Entry' : 'Timer Log'}</span>
                      <span>{formatDate(log.start_time)}</span>
                    </div>
                    {log.notes && <p className="text-[var(--foreground)] border-t border-[var(--border)]/40 pt-1.5 mt-1.5">{log.notes}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stop Timer Modal */}
      {showStopTimerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setShowStopTimerModal(false)} />
          <div className="relative w-full max-w-sm bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--foreground)]">Stop Work Timer</h3>
              <p className="text-xs text-[var(--muted-foreground)]">Add brief notes about what you accomplished during this session.</p>
            </div>
            <form onSubmit={handleStopTimer} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Session Notes</label>
                <textarea
                  placeholder="e.g. Worked on layout design and resolved CSS lints"
                  required
                  value={timerNotes}
                  onChange={(e) => setTimerNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowStopTimerModal(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-semibold"
                >
                  Stop and Log Time
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Time Log Modal */}
      {showManualLogModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setShowManualLogModal(false)} />
          <div className="relative w-full max-w-sm bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--foreground)]">Add Time Log Manually</h3>
            </div>
            <form onSubmit={handleAddManualLog} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Duration (Minutes)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 90 minutes (1.5 hours)"
                  value={manualDuration}
                  onChange={(e) => setManualDuration(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Work Details/Notes</label>
                <textarea
                  placeholder="What was accomplished..."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowManualLogModal(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-semibold"
                >
                  Log Time
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
