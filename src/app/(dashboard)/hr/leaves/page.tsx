'use client'

import * as React from 'react'
import { getLeaveRequests, createLeaveRequestRecord, updateLeaveRequestStatus } from '@/actions/hr'
import { useAuth } from '@/components/providers/auth-provider'
import { formatDate } from '@/lib/utils'
import { Plus, Search, Calendar, Check, X, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { LeaveRequest } from '@/types'

export default function LeavesPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [leaves, setLeaves] = React.useState<LeaveRequest[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showAddModal, setShowAddModal] = React.useState(false)

  // Form states
  const [leaveType, setLeaveType] = React.useState('casual')
  const [startDate, setStartDate] = React.useState('')
  const [endDate, setEndDate] = React.useState('')
  const [reason, setReason] = React.useState('')

  const fetchLeaves = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getLeaveRequests()
      setLeaves(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchLeaves()
  }, [fetchLeaves])

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate) return
    try {
      await createLeaveRequestRecord({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason || null,
      })
      toast.success('Leave application submitted')
      setShowAddModal(false)
      // reset
      setLeaveType('casual')
      setStartDate('')
      setEndDate('')
      setReason('')
      fetchLeaves()
    } catch (err: any) {
      toast.error(err.message || 'Submission failed')
    }
  }

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateLeaveRequestStatus(id, status)
      toast.success(`Leave request ${status}`)
      fetchLeaves()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link href="/hr" className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors w-fit">
            <ArrowLeft size={16} />
            Back to HR
          </Link>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Leave Applications</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
        >
          <Plus size={16} />
          Apply for Leave
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading requests...</div>
      ) : leaves.length === 0 ? (
        <div className="py-20 bg-[var(--card)] rounded-xl border border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
          No leave applications logged.
        </div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50">
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Employee</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Leave Type</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Start Date</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">End Date</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Reason</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Status</th>
                  {isAdmin && <th className="p-4 font-semibold text-[var(--muted-foreground)] text-right">Approve Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-[var(--secondary)]/30 transition-colors">
                    <td className="p-4 font-medium text-[var(--foreground)]">{leave.employee?.user?.full_name || '-'}</td>
                    <td className="p-4 text-[var(--foreground)] capitalize">{leave.leave_type} leave</td>
                    <td className="p-4 text-[var(--foreground)]">{formatDate(leave.start_date)}</td>
                    <td className="p-4 text-[var(--foreground)]">{formatDate(leave.end_date)}</td>
                    <td className="p-4 text-[var(--muted-foreground)] max-w-xs truncate" title={leave.reason || ''}>{leave.reason || '-'}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        leave.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        leave.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="p-4 text-right">
                        {leave.status === 'pending' ? (
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => handleStatusUpdate(leave.id, 'approved')}
                              className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded border border-emerald-500/20 transition-all"
                              title="Approve"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(leave.id, 'rejected')}
                              className="p-1 text-red-500 hover:bg-red-500/10 rounded border border-red-500/20 transition-all"
                              title="Reject"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--muted-foreground)]">Processed</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Leave Application Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-sm bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--foreground)]">Apply for Leave</h3>
            </div>
            <form onSubmit={handleApplyLeave} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                >
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="earned">Earned Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Reason / Details</label>
                <textarea
                  placeholder="Medical urgency or family vacation..."
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
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
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
