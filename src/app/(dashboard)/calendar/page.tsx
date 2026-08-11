'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { Calendar as CalendarIcon, Clock, Plus, Trash2, Tag } from 'lucide-react'
import { toast } from 'sonner'
import type { CalendarEvent } from '@/types'

export default function CalendarPage() {
  const supabase = createClient()

  const [events, setEvents] = React.useState<CalendarEvent[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showAddModal, setShowAddModal] = React.useState(false)

  // Form states
  const [title, setTitle] = React.useState('')
  const [desc, setDesc] = React.useState('')
  const [type, setType] = React.useState<'meeting' | 'deadline' | 'task' | 'leave' | 'invoice_due' | 'follow_up' | 'other'>('meeting')
  const [startTime, setStartTime] = React.useState('')
  const [location, setLocation] = React.useState('')

  const fetchEvents = React.useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('start_time', { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  React.useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !startTime) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      const { error } = await supabase.from('calendar_events').insert({
        title,
        description: desc || null,
        type,
        start_time: new Date(startTime).toISOString(),
        location: location || null,
        created_by: user.id,
      })

      if (error) throw error
      toast.success('Event added to calendar')
      setShowAddModal(false)
      // reset
      setTitle('')
      setDesc('')
      setType('meeting')
      setStartTime('')
      setLocation('')
      fetchEvents()
    } catch (err: any) {
      toast.error(err.message || 'Failed to add event')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this event?')) return
    try {
      const { error } = await supabase.from('calendar_events').delete().eq('id', id)
      if (error) throw error
      toast.success('Event deleted')
      fetchEvents()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Business Calendar</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Track team meetings, project deadlines, invoice due dates, and followups</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
        >
          <Plus size={16} />
          Add Event
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading calendar events...</div>
      ) : events.length === 0 ? (
        <div className="py-20 bg-[var(--card)] rounded-xl border border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
          No events scheduled.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event) => (
            <div key={event.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 flex flex-col justify-between shadow-sm card-hover">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase border ${
                    event.type === 'meeting' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                    event.type === 'deadline' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    event.type === 'invoice_due' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    'bg-slate-500/10 text-slate-500 border-slate-500/20'
                  }`}>
                    <Tag size={10} />
                    {event.type.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="text-[var(--muted-foreground)] hover:text-red-500 p-1 rounded hover:bg-red-500/5 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div>
                  <h4 className="font-bold text-base text-[var(--foreground)]">{event.title}</h4>
                  {event.description && <p className="text-xs text-[var(--muted-foreground)] mt-1">{event.description}</p>}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[var(--border)] flex flex-wrap gap-4 text-xs text-[var(--muted-foreground)]">
                <div className="flex items-center gap-1.5">
                  <Clock size={12} />
                  <span>{formatDate(event.start_time)}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon size={12} />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-sm bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--foreground)]">Schedule Calendar Event</h3>
            </div>
            <form onSubmit={handleAddEvent} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Title *</label>
                <input
                  required
                  placeholder="e.g. Sync with product design"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Event Type</label>
                  <select
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="meeting">Meeting</option>
                    <option value="deadline">Project Deadline</option>
                    <option value="task">Task Due</option>
                    <option value="leave">Leave Schedule</option>
                    <option value="invoice_due">Invoice Due</option>
                    <option value="follow_up">Sales Followup</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Start Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Location / Call URL</label>
                <input
                  placeholder="e.g. Google Meet URL or Room A"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Details / Agenda</label>
                <textarea
                  placeholder="Outline meeting goals..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
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
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
