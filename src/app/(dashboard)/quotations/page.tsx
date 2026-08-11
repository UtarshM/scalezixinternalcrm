'use client'

import * as React from 'react'
import Link from 'next/link'
import { getQuotations } from '@/actions/quotations'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { Plus, Search, FileBadge, Calendar, Eye } from 'lucide-react'

export default function QuotationsPage() {
  const [quotations, setQuotations] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')

  const fetchQuotes = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getQuotations()
      setQuotations(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchQuotes()
  }, [fetchQuotes])

  const filteredQuotes = quotations.filter(quote => {
    const matchesSearch =
      quote.quotation_number.toLowerCase().includes(search.toLowerCase()) ||
      (quote.client?.company_name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (quote.lead?.title?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Proposals & Quotes</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Manage client business proposals, statements of work, and quotations</p>
        </div>
        <Link
          href="/quotations/new"
          className="flex items-center gap-2 bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
        >
          <Plus size={16} />
          Create Proposal
        </Link>
      </div>

      {/* Filters bar */}
      <div className="flex gap-4 bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            placeholder="Search by quote # or client..."
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
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading proposals...</div>
      ) : filteredQuotes.length === 0 ? (
        <div className="py-20 bg-[var(--card)] rounded-xl border border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
          No proposals/quotations found.
        </div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50">
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Proposal / Quote #</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Client/Lead Link</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Version</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Valid Until</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Total Value</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Status</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-[var(--secondary)]/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-[var(--accent)]">{quote.quotation_number}</td>
                    <td className="p-4 text-[var(--foreground)] font-medium">
                      {quote.client?.company_name || quote.lead?.title || '-'}
                    </td>
                    <td className="p-4 text-[var(--foreground)]">v{quote.version}</td>
                    <td className="p-4 text-[var(--foreground)]">{quote.valid_until ? formatDate(quote.valid_until) : '-'}</td>
                    <td className="p-4 font-bold text-[var(--foreground)]">{formatCurrency(quote.total)}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(quote.status)}`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/quotations/${quote.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline">
                        <Eye size={12} />
                        View Proposal
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
