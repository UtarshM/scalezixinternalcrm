'use client'

import * as React from 'react'
import Link from 'next/link'
import { getInvoices } from '@/actions/invoices'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { Plus, Search, FileText, IndianRupee, Calendar } from 'lucide-react'

export default function InvoicesPage() {
  const [invoices, setInvoices] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')

  const fetchInvoices = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getInvoices()
      setInvoices(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (inv.client?.company_name?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Invoices</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Manage client billing, tax invoices, and receipt statuses</p>
        </div>
        <Link
          href="/invoices/new"
          className="flex items-center gap-2 bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
        >
          <Plus size={16} />
          Create Invoice
        </Link>
      </div>

      {/* Filters bar */}
      <div className="flex gap-4 bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            placeholder="Search by invoice # or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading invoices...</div>
      ) : filteredInvoices.length === 0 ? (
        <div className="py-20 bg-[var(--card)] rounded-xl border border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
          No invoices found.
        </div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50">
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Invoice #</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Client</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Issue Date</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Due Date</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Total Value</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Amount Paid</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Status</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[var(--secondary)]/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-[var(--accent)]">{inv.invoice_number}</td>
                    <td className="p-4 font-medium text-[var(--foreground)]">{inv.client?.company_name || '-'}</td>
                    <td className="p-4 text-[var(--foreground)]">{formatDate(inv.issue_date)}</td>
                    <td className="p-4 text-[var(--foreground)]">{inv.due_date ? formatDate(inv.due_date) : '-'}</td>
                    <td className="p-4 font-bold text-[var(--foreground)]">{formatCurrency(inv.total)}</td>
                    <td className="p-4 text-emerald-500 font-semibold">{formatCurrency(inv.amount_paid)}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/invoices/${inv.id}`} className="text-xs font-semibold text-[var(--accent)] hover:underline">
                        View & Manage
                      </Link>
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
