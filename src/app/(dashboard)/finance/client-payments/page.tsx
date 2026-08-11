'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { getInvoices } from '@/actions/invoices'
import { formatCurrency, formatDate } from '@/lib/utils'
import { RefreshCw, Search, ShieldAlert, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function ClientPaymentsPage() {
  const supabase = createClient()
  const [invoices, setInvoices] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')

  const fetchClientPayments = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getInvoices()
      setInvoices(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchClientPayments()
  }, [fetchClientPayments])

  const paymentsData = React.useMemo(() => {
    const today = new Date()
    today.setHours(0,0,0,0)

    return invoices.map(inv => {
      const proposalAmount = parseFloat(inv.subtotal || '0')
      const totalAmount = parseFloat(inv.total || '0')
      const advanceReceived = parseFloat(inv.amount_paid || '0')
      const remainingAmount = Math.max(0, totalAmount - advanceReceived)
      
      let computedStatus = inv.status // 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
      const dueDate = inv.due_date ? new Date(inv.due_date) : null
      
      if (dueDate && inv.status !== 'paid' && inv.status !== 'cancelled') {
        dueDate.setHours(0,0,0,0)
        if (dueDate < today) {
          computedStatus = 'overdue'
        }
      }

      return {
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        clientName: inv.client?.company_name || 'Direct Client',
        projectName: inv.project?.name || 'No Project',
        proposalAmount,
        invoiceAmount: totalAmount,
        advanceReceived,
        remainingAmount,
        dueDate: inv.due_date,
        status: computedStatus,
        issueDate: inv.issue_date
      }
    })
  }, [invoices])

  // Filter alerts
  const alerts = React.useMemo(() => {
    const today = new Date()
    today.setHours(0,0,0,0)
    
    const overdueList: any[] = []
    const dueTodayList: any[] = []
    const dueSoonList: any[] = [] // due in 7 days

    paymentsData.forEach(p => {
      if (p.status === 'paid' || p.status === 'cancelled' || !p.dueDate) return

      const due = new Date(p.dueDate)
      due.setHours(0,0,0,0)
      
      const diffTime = due.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays < 0) {
        overdueList.push(p)
      } else if (diffDays === 0) {
        dueTodayList.push(p)
      } else if (diffDays > 0 && diffDays <= 7) {
        dueSoonList.push(p)
      }
    })

    return {
      overdue: overdueList,
      dueToday: dueTodayList,
      dueSoon: dueSoonList
    }
  }, [paymentsData])

  const filteredPayments = paymentsData.filter(p =>
    p.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    p.clientName.toLowerCase().includes(search.toLowerCase()) ||
    p.projectName.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading client payments...</div>

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Client Payments</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Manage accounts receivable, advances, unpaid invoice balances, and due alerts</p>
        </div>
        <button
          onClick={fetchClientPayments}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border)] rounded-lg text-xs font-semibold hover:bg-[var(--secondary)] text-[var(--foreground)]"
        >
          <RefreshCw size={13} /> Reload
        </button>
      </div>

      {/* ALERTS BLOCK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overdue */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
            <ShieldAlert size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider">Overdue Payments</h4>
            <span className="text-lg font-bold text-[var(--foreground)] block mt-0.5">{alerts.overdue.length} Invoices</span>
            <span className="text-[10px] text-[var(--muted-foreground)] block mt-0.5">Requires immediate attention</span>
          </div>
        </div>

        {/* Due Today */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
            <AlertTriangle size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">Due Today</h4>
            <span className="text-lg font-bold text-[var(--foreground)] block mt-0.5">{alerts.dueToday.length} Invoices</span>
            <span className="text-[10px] text-[var(--muted-foreground)] block mt-0.5">Due for collection today</span>
          </div>
        </div>

        {/* Due in 7 Days */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
            <AlertCircle size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Due in 7 Days</h4>
            <span className="text-lg font-bold text-[var(--foreground)] block mt-0.5">{alerts.dueSoon.length} Invoices</span>
            <span className="text-[10px] text-[var(--muted-foreground)] block mt-0.5">Upcoming payment windows</span>
          </div>
        </div>
      </div>

      {/* Filter and stats */}
      <div className="flex gap-4 items-center justify-between bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            placeholder="Search by client or invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
          />
        </div>
        <div className="text-xs text-[var(--muted-foreground)]">
          Total Receivables: <span className="font-bold text-emerald-500">{formatCurrency(filteredPayments.reduce((sum, p) => sum + p.remainingAmount, 0))}</span>
        </div>
      </div>

      {/* Main Ledger Table */}
      {filteredPayments.length === 0 ? (
        <div className="py-20 bg-[var(--card)] rounded-xl border border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
          No client payment records found.
        </div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50 text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
                  <th className="p-4 font-semibold">Invoice Number</th>
                  <th className="p-4 font-semibold">Client / Project</th>
                  <th className="p-4 font-semibold">Due Date</th>
                  <th className="p-4 font-semibold">Proposal Amt</th>
                  <th className="p-4 font-semibold">Invoice Value</th>
                  <th className="p-4 font-semibold">Advance Paid</th>
                  <th className="p-4 font-semibold">Balance Due</th>
                  <th className="p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--foreground)]">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--secondary)]/30 transition-colors">
                    <td className="p-4 font-semibold text-[var(--foreground)]">{p.invoiceNumber}</td>
                    <td className="p-4">
                      <div className="font-semibold">{p.clientName}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{p.projectName}</div>
                    </td>
                    <td className="p-4">
                      {p.dueDate ? formatDate(p.dueDate) : <span className="text-[var(--muted-foreground)] text-xs italic">No Date</span>}
                    </td>
                    <td className="p-4">{formatCurrency(p.proposalAmount)}</td>
                    <td className="p-4">{formatCurrency(p.invoiceAmount)}</td>
                    <td className="p-4 text-emerald-500 font-medium">{formatCurrency(p.advanceReceived)}</td>
                    <td className="p-4 font-bold text-rose-500">{formatCurrency(p.remainingAmount)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                        p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        p.status === 'overdue' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        p.status === 'sent' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
