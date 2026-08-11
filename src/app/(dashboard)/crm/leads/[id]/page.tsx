'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getLeadById, addLeadNote, addLeadFollowup, convertLeadToClient, updateLeadStatus, updateLead } from '@/actions/leads'
import { getStatusColor, getPriorityColor, formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Plus, Calendar, FileText, CheckCircle2, Phone, Mail, Globe, MapPin, IndianRupee, ExternalLink, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Lead } from '@/types'

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [lead, setLead] = React.useState<Lead | null>(null)
  const [loading, setLoading] = React.useState(true)

  // Sub-items forms
  const [noteContent, setNoteContent] = React.useState('')
  const [followupType, setFollowupType] = React.useState<'call' | 'email' | 'meeting' | 'whatsapp' | 'other'>('call')
  const [followupDate, setFollowupDate] = React.useState('')
  const [followupNotes, setFollowupNotes] = React.useState('')

  // Convert state
  const [showConvertModal, setShowConvertModal] = React.useState(false)
  const [convertCompanyName, setConvertCompanyName] = React.useState('')

  const fetchLead = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getLeadById(id)
      setLead(data)
      if (data?.company_name) {
        setConvertCompanyName(data.company_name)
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to load lead details')
    } finally {
      setLoading(false)
    }
  }, [id])

  React.useEffect(() => {
    fetchLead()
  }, [fetchLead])

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateLeadStatus(id, newStatus)
      toast.success(`Status updated to ${newStatus}`)
      fetchLead()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteContent.trim()) return
    try {
      await addLeadNote(id, noteContent)
      toast.success('Note added')
      setNoteContent('')
      fetchLead()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleAddFollowup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!followupDate) return
    try {
      await addLeadFollowup(id, followupType, new Date(followupDate).toISOString(), followupNotes)
      toast.success('Followup scheduled')
      setFollowupDate('')
      setFollowupNotes('')
      fetchLead()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const clientId = await convertLeadToClient(id, convertCompanyName)
      toast.success('Lead converted to Client!')
      setShowConvertModal(false)
      router.push(`/clients/${clientId}`)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (loading) return <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading lead details...</div>
  if (!lead) return <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Lead not found.</div>

  return (
    <div className="space-y-6">
      {/* Back button & Action Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <button
          onClick={() => router.push('/crm/leads')}
          className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Leads
        </button>

        <div className="flex flex-wrap gap-2">
          {lead.status !== 'won' && (
            <button
              onClick={() => setShowConvertModal(true)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-500 transition-colors"
            >
              <CheckCircle2 size={16} />
              Convert to Client
            </button>
          )}
          <select
            value={lead.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3 py-2 text-sm bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
          >
            <option value="new">New</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>

      {/* Main Info Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Core info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-6">
            <div>
              <div className="flex gap-2 mb-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${getPriorityColor(lead.priority)}`}>
                  {lead.priority} Priority
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(lead.status)}`}>
                  {lead.status}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">{lead.title}</h2>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Lead owner: {lead.owner?.full_name || 'Unassigned'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={16} className="text-[var(--muted-foreground)] shrink-0" />
                  <span className="text-[var(--foreground)]">{lead.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail size={16} className="text-[var(--muted-foreground)] shrink-0" />
                  <span className="text-[var(--foreground)]">{lead.email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Globe size={16} className="text-[var(--muted-foreground)] shrink-0" />
                  <span className="text-[var(--foreground)]">{lead.company_name || 'No company'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Share2 size={16} className="text-[var(--muted-foreground)] shrink-0" />
                  <span className="text-[var(--foreground)]">
                    Source: <span className="capitalize">{lead.source || 'Unknown'}</span>
                    {lead.source === 'referral' && lead.referred_by && ` (Referred by: ${lead.referred_by})`}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <IndianRupee size={16} className="text-[var(--muted-foreground)] shrink-0" />
                  <span className="text-[var(--foreground)] font-semibold">
                    Budget: {lead.expected_budget ? formatCurrency(lead.expected_budget) : 'Not specified'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={16} className="text-[var(--muted-foreground)] shrink-0" />
                  <span className="text-[var(--foreground)]">
                    Close Date: {lead.expected_close_date ? formatDate(lead.expected_close_date) : 'Not set'}
                  </span>
                </div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  Created: {formatDate(lead.created_at)}
                </div>
              </div>
            </div>
          </div>

          {/* Google Drive Link Section */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[var(--foreground)] flex items-center gap-2">
                <FileText size={18} className="text-[var(--accent)]" />
                Drive Proposal Link
              </h3>
              {lead.drive_link && (
                <a
                  href={lead.drive_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[var(--accent)] font-semibold hover:underline"
                >
                  Open Proposal
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const input = form.elements.namedItem('drive_link') as HTMLInputElement;
              try {
                await updateLead(id, { drive_link: input.value || null });
                toast.success('Drive link updated');
                fetchLead();
              } catch (err: any) {
                toast.error(err.message || 'Failed to update link');
              }
            }} className="flex gap-2">
              <input
                name="drive_link"
                placeholder="Paste Google Drive/Proposal link here..."
                defaultValue={lead.drive_link || ''}
                className="flex-1 px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <button
                type="submit"
                className="bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all shrink-0"
              >
                Save
              </button>
            </form>
          </div>

          {/* Notes Log */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-[var(--foreground)]">Notes & Log</h3>
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                placeholder="Add notes..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <button
                type="submit"
                className="bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all shrink-0"
              >
                Post
              </button>
            </form>

            <div className="space-y-3 divide-y divide-[var(--border)] pt-2 max-h-[300px] overflow-y-auto">
              {lead.notes?.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)] pt-2">No notes posted yet.</p>
              ) : (
                lead.notes?.map((note) => (
                  <div key={note.id} className="pt-3 first:pt-0">
                    <div className="flex justify-between items-center text-xs text-[var(--muted-foreground)] mb-1">
                      <span className="font-medium text-[var(--foreground)]">{note.user?.full_name || 'System'}</span>
                      <span>{formatDate(note.created_at)}</span>
                    </div>
                    <p className="text-sm text-[var(--foreground)]">{note.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Card: Followups scheduling & History */}
        <div className="space-y-6">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-6">
            <div>
              <h3 className="font-bold text-[var(--foreground)]">Schedule Follow-up</h3>
              <p className="text-xs text-[var(--muted-foreground)]">Set reminders to follow up with lead</p>
            </div>
            <form onSubmit={handleAddFollowup} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Type</label>
                <select
                  value={followupType}
                  onChange={(e: any) => setFollowupType(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                >
                  <option value="call">Phone Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">In-Person Meeting</option>
                  <option value="whatsapp">WhatsApp Text</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Schedule Time</label>
                <input
                  type="datetime-local"
                  required
                  value={followupDate}
                  onChange={(e) => setFollowupDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Short Instructions/Notes</label>
                <textarea
                  placeholder="e.g. Discuss the pricing proposal details"
                  value={followupNotes}
                  onChange={(e) => setFollowupNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-[var(--secondary)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-semibold transition-all"
              >
                Schedule Task
              </button>
            </form>
          </div>

          {/* Followup logs list */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-[var(--foreground)]">Pending & Past Reminders</h3>
            <div className="space-y-3">
              {lead.followups?.length === 0 ? (
                <p className="text-xs text-[var(--muted-foreground)]">No followups scheduled.</p>
              ) : (
                lead.followups?.map((follow) => (
                  <div key={follow.id} className="p-3 bg-[var(--secondary)]/30 rounded-lg border border-[var(--border)] text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold uppercase text-[var(--accent)]">{follow.type}</span>
                      <span className="text-[var(--muted-foreground)]">{formatDate(follow.scheduled_at)}</span>
                    </div>
                    {follow.notes && <p className="text-[var(--foreground)] mt-1">{follow.notes}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Convert to Client Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setShowConvertModal(false)} />
          <div className="relative w-full max-w-sm bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--foreground)]">Convert Lead to Client</h3>
              <p className="text-xs text-[var(--muted-foreground)]">This will link the lead and create a new client company profile.</p>
            </div>
            <form onSubmit={handleConvert} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Company Name</label>
                <input
                  required
                  value={convertCompanyName}
                  onChange={(e) => setConvertCompanyName(e.target.value)}
                  placeholder="e.g. Scalezix Corp"
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowConvertModal(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold"
                >
                  Convert Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
