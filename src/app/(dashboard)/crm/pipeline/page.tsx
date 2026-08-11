'use client'

import * as React from 'react'
import Link from 'next/link'
import { getLeads, updateLeadStatus } from '@/actions/leads'
import { LEAD_STAGES } from '@/lib/constants'
import { formatCurrency, getPriorityColor } from '@/lib/utils'
import { Target, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import type { Lead } from '@/types'

export default function PipelinePage() {
  const [leads, setLeads] = React.useState<Lead[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchLeads = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getLeads()
      setLeads(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const moveLead = async (leadId: string, currentStatus: string, direction: 'prev' | 'next') => {
    const currentIndex = LEAD_STAGES.findIndex(stage => stage.id === currentStatus)
    let newIndex = currentIndex
    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1
    } else if (direction === 'next' && currentIndex < LEAD_STAGES.length - 1) {
      newIndex = currentIndex + 1
    }

    if (newIndex === currentIndex) return

    const newStatus = LEAD_STAGES[newIndex].id
    try {
      // Optimistic update
      setLeads(prevLeads =>
        prevLeads.map(lead =>
          lead.id === leadId ? { ...lead, status: newStatus as any } : lead
        )
      )
      await updateLeadStatus(leadId, newStatus)
      toast.success(`Lead status updated to ${newStatus}`)
    } catch (e: any) {
      toast.error('Failed to update lead status')
      fetchLeads() // Rollback
    }
  }

  // Group leads by stage
  const columns = React.useMemo(() => {
    const grouped: Record<string, Lead[]> = {}
    LEAD_STAGES.forEach(stage => {
      grouped[stage.id] = []
    })
    leads.forEach(lead => {
      if (grouped[lead.status]) {
        grouped[lead.status].push(lead)
      } else {
        // Fallback for custom statuses
        grouped['new'] = grouped['new'] || []
        grouped['new'].push(lead)
      }
    })
    return grouped
  }, [leads])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">CRM Pipeline</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Visual pipeline representation of all current sales leads</p>
        </div>
        <button
          onClick={fetchLeads}
          className="p-2 rounded-lg bg-[var(--card)] hover:bg-[var(--secondary)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading pipeline...</div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1200px] h-[calc(100vh-220px)] items-stretch">
            {LEAD_STAGES.map((stage) => {
              const stageLeads = columns[stage.id] || []
              const totalBudget = stageLeads.reduce((sum, lead) => sum + (lead.expected_budget || 0), 0)

              return (
                <div
                  key={stage.id}
                  className="flex-1 flex flex-col bg-[var(--secondary)]/20 border border-[var(--border)] rounded-xl overflow-hidden min-w-[200px]"
                >
                  {/* Column Header */}
                  <div className="p-3 border-b border-[var(--border)] bg-[var(--card)] flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                        <span className="font-semibold text-sm text-[var(--foreground)]">{stage.label}</span>
                      </div>
                      <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                        {stageLeads.length} leads • {formatCurrency(totalBudget)}
                      </p>
                    </div>
                  </div>

                  {/* Cards Body */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {stageLeads.length === 0 ? (
                      <div className="h-24 border border-dashed border-[var(--border)] rounded-lg flex items-center justify-center text-xs text-[var(--muted-foreground)]">
                        No leads
                      </div>
                    ) : (
                      stageLeads.map((lead, idx) => (
                        <div
                          key={lead.id}
                          className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${getPriorityColor(lead.priority)}`}>
                              {lead.priority}
                            </span>
                            <span className="text-[10px] text-[var(--muted-foreground)]">Score: {lead.lead_score}</span>
                          </div>

                          <Link
                            href={`/crm/leads/${lead.id}`}
                            className="font-bold text-xs text-[var(--foreground)] hover:text-[var(--accent)] line-clamp-1 block mb-1"
                          >
                            {lead.title}
                          </Link>
                          <p className="text-[10px] text-[var(--muted-foreground)] mb-3 truncate">
                            {lead.company_name || 'No company'}
                          </p>

                          {lead.expected_budget && (
                            <div className="text-xs font-semibold text-[var(--foreground)] mb-3">
                              {formatCurrency(lead.expected_budget)}
                            </div>
                          )}

                          {/* Quick stage moving controls */}
                          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                            <button
                              disabled={stage.id === 'new'}
                              onClick={() => moveLead(lead.id, lead.status, 'prev')}
                              className="p-1 rounded bg-[var(--secondary)] hover:bg-[var(--border)] disabled:opacity-30 text-[var(--muted-foreground)]"
                            >
                              <ChevronLeft size={12} />
                            </button>
                            <span className="text-[10px] text-[var(--muted-foreground)] font-mono">Move</span>
                            <button
                              disabled={stage.id === 'lost'}
                              onClick={() => moveLead(lead.id, lead.status, 'next')}
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
      )}
    </div>
  )
}
