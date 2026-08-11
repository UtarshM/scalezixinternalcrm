'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, IndianRupee, ExternalLink, AlertTriangle, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function GlobalBillingRenewalsPage() {
  const supabase = createClient()
  const [billingItems, setBillingItems] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [frequencyFilter, setFrequencyFilter] = React.useState('')

  const fetchBillingItems = React.useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('project_billing_renewals')
        .select('*, project:projects(*)')
        .order('renewal_date', { ascending: true })

      if (error) throw error
      setBillingItems(data || [])
    } catch (e: any) {
      toast.error('Failed to load billing: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  React.useEffect(() => {
    fetchBillingItems()
  }, [fetchBillingItems])

  const filtered = billingItems.filter(bill => {
    const matchSearch =
      bill.service_name.toLowerCase().includes(search.toLowerCase()) ||
      (bill.project?.name || '').toLowerCase().includes(search.toLowerCase())
    const matchFreq = frequencyFilter ? bill.billing_frequency === frequencyFilter : true
    return matchSearch && matchFreq
  })

  // Group alerts
  const today = new Date()
  today.setHours(0,0,0,0)
  
  const getAlertStatus = (renewalDateStr: string | null) => {
    if (!renewalDateStr) return null
    const renewal = new Date(renewalDateStr)
    renewal.setHours(0,0,0,0)
    
    const diffTime = renewal.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'overdue'
    if (diffDays === 0) return 'today'
    if (diffDays <= 7) return 'urgent'
    if (diffDays <= 30) return 'soon'
    return 'safe'
  }

  const alertItems = filtered.filter(item => {
    const status = getAlertStatus(item.renewal_date)
    return status === 'today' || status === 'urgent' || status === 'soon' || status === 'overdue'
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Billing & Renewals</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Global view of operational costs, hostings, and domain renewal dates</p>
      </div>

      {/* Renewal Alerts */}
      {alertItems.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
            <AlertTriangle size={18} />
            <span>Renewal Alerts ({alertItems.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {alertItems.map(item => {
              const status = getAlertStatus(item.renewal_date)
              let badgeColor = 'bg-rose-500/10 text-rose-500 border-rose-500/20'
              let label = 'Due Today'
              if (status === 'overdue') label = 'Overdue'
              else if (status === 'urgent') label = 'Due within 7 Days'
              else if (status === 'soon') {
                badgeColor = 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                label = 'Due within 30 Days'
              }

              return (
                <div key={item.id} className="bg-[var(--card)] border border-[var(--border)] p-3 rounded-lg flex flex-col justify-between text-xs">
                  <div>
                    <span className="font-semibold block text-[var(--foreground)] truncate">{item.service_name}</span>
                    <span className="text-[var(--muted-foreground)] block truncate">{item.project?.name}</span>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-[var(--border)]">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeColor}`}>{label}</span>
                    <span className="font-semibold text-[var(--foreground)]">{formatDate(item.renewal_date || '')}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Search subscriptions by service or project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
          />
        </div>
        <select
          value={frequencyFilter}
          onChange={(e) => setFrequencyFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
        >
          <option value="">All Frequencies</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="half_yearly">Half Yearly</option>
          <option value="yearly">Yearly</option>
          <option value="one_time">One Time</option>
        </select>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading operational costs...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 bg-[var(--card)] rounded-xl border border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
          No operational cost items found.
        </div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left text-[var(--foreground)]">
            <thead className="bg-[var(--secondary)] text-xs text-[var(--muted-foreground)] font-semibold uppercase border-b border-[var(--border)]">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Service Name</th>
                <th className="px-4 py-3">Frequency</th>
                <th className="px-4 py-3">Paid By</th>
                <th className="px-4 py-3">Renewal Date</th>
                <th className="px-4 py-3">Costs</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map(bill => (
                <tr key={bill.id} className="hover:bg-[var(--secondary)]/30">
                  <td className="px-4 py-3 font-semibold text-[var(--foreground)]">
                    <Link href={`/projects/${bill.project_id}`} className="hover:underline flex items-center gap-1">
                      {bill.project?.name}
                      <ExternalLink size={12} className="text-[var(--muted-foreground)]" />
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[var(--foreground)]">
                    {bill.service_name}
                    {bill.invoice_link && (
                      <a href={bill.invoice_link} target="_blank" rel="noreferrer" className="inline-flex items-center text-[10px] text-[var(--accent)] hover:underline ml-1.5"><ExternalLink size={10} className="mr-0.5" /> Invoice</a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs capitalize">{bill.billing_frequency?.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-xs capitalize">{bill.paid_by}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-[var(--foreground)]">
                    {bill.renewal_date ? formatDate(bill.renewal_date) : '-'}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold">
                    <span className="block text-[var(--foreground)]">{bill.currency} {bill.monthly_cost}/mo</span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      bill.payment_status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : bill.payment_status === 'pending'
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    }`}>
                      {bill.payment_status}
                    </span>
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
