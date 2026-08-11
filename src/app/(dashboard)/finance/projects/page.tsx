'use client'

import * as React from 'react'
import { getProjects } from '@/actions/projects'
import { getExpenses } from '@/actions/expenses'
import { getPayments } from '@/actions/payments'
import { formatCurrency } from '@/lib/utils'
import { FolderKanban, Search, TrendingUp, RefreshCw, BarChart2, Briefcase } from 'lucide-react'

export default function ProjectProfitabilityPage() {
  const [projects, setProjects] = React.useState<any[]>([])
  const [expenses, setExpenses] = React.useState<any[]>([])
  const [payments, setPayments] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')

  const fetchProjectFinancials = React.useCallback(async () => {
    setLoading(true)
    try {
      const [projData, expData, payData] = await Promise.all([
        getProjects(),
        getExpenses(),
        getPayments()
      ])
      setProjects(projData || [])
      setExpenses(expData || [])
      setPayments(payData || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchProjectFinancials()
  }, [fetchProjectFinancials])

  const projectFinancials = React.useMemo(() => {
    return projects.map(proj => {
      // Amount Received
      const amtReceived = payments
        .filter(p => p.project_id === proj.id)
        .reduce((sum, p) => sum + (p.total_amount_received || p.amount || 0), 0)

      // Direct Project Expenses (e.g. API billing, hosting, etc.)
      const projExpenses = expenses
        .filter(e => e.project_id === proj.id)
        .reduce((sum, e) => sum + (e.total_amount || e.amount || 0), 0)

      const budgetVal = parseFloat(proj.budget || '0')
      const pendingAmt = Math.max(0, budgetVal - amtReceived)
      const grossProfit = amtReceived - projExpenses
      const marginPercent = amtReceived > 0 ? (grossProfit / amtReceived) * 100 : 0

      return {
        id: proj.id,
        name: proj.name,
        category: proj.category,
        project_type: proj.project_type,
        status: proj.status,
        totalValue: budgetVal,
        amountReceived: amtReceived,
        pendingAmount: pendingAmt,
        expenses: projExpenses,
        profit: grossProfit,
        margin: marginPercent
      }
    })
  }, [projects, expenses, payments])

  const filteredFinancials = projectFinancials.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.project_type?.toLowerCase().includes(search.toLowerCase()) ?? false)
  )

  if (loading) return <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading project profitability...</div>

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Project-wise Profitability</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Track revenues, direct hosting/SaaS expenses, and net profit margins across active client contracts</p>
        </div>
        <button
          onClick={fetchProjectFinancials}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border)] rounded-lg text-xs font-semibold hover:bg-[var(--secondary)] text-[var(--foreground)]"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Search Filter */}
      <div className="flex gap-4 items-center justify-between bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            placeholder="Search by project name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
          />
        </div>
      </div>

      {/* Project Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredFinancials.length === 0 ? (
          <div className="col-span-2 py-20 bg-[var(--card)] rounded-xl border border-[var(--border)] text-center text-sm text-[var(--muted-foreground)] border-dashed">
            No projects registered or matching search.
          </div>
        ) : (
          filteredFinancials.map(p => (
            <div key={p.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4 hover:shadow-md transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-[var(--foreground)] text-base flex items-center gap-2">
                    <Briefcase size={18} className="text-[var(--accent)]" /> {p.name}
                  </h3>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--muted-foreground)] block mt-0.5">
                    {p.project_type || 'Custom'} • {p.category?.replace('_', ' ') || 'Client Project'}
                  </span>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                  p.status === 'live' ? 'bg-emerald-500/10 text-emerald-500' :
                  p.status === 'development' ? 'bg-blue-500/10 text-blue-500' :
                  'bg-amber-500/10 text-amber-500'
                }`}>
                  {p.status}
                </span>
              </div>

              {/* Profit Progress indicator */}
              <div className="grid grid-cols-3 gap-2 border border-[var(--border)] bg-[var(--secondary)]/10 rounded-lg p-3">
                <div>
                  <span className="text-[10px] text-[var(--muted-foreground)] block">Budget Value</span>
                  <span className="text-xs font-bold text-[var(--foreground)] block mt-0.5">{formatCurrency(p.totalValue)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--muted-foreground)] block">Received</span>
                  <span className="text-xs font-bold text-emerald-500 block mt-0.5">{formatCurrency(p.amountReceived)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--muted-foreground)] block">Pending</span>
                  <span className="text-xs font-bold text-[var(--foreground)] block mt-0.5">{formatCurrency(p.pendingAmount)}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 border border-[var(--border)] rounded-lg">
                  <span className="text-[10px] text-[var(--muted-foreground)] block">Hosting & APIs</span>
                  <span className="text-xs font-semibold text-rose-500 block mt-0.5">{formatCurrency(p.expenses)}</span>
                </div>
                <div className="p-3 border border-[var(--border)] rounded-lg">
                  <span className="text-[10px] text-[var(--muted-foreground)] block">Gross Profit</span>
                  <span className="text-xs font-semibold text-emerald-500 block mt-0.5">{formatCurrency(p.profit)}</span>
                </div>
                <div className="p-3 border border-[var(--border)] rounded-lg bg-emerald-500/5">
                  <span className="text-[10px] text-emerald-600 font-semibold block">Profit Margin</span>
                  <span className="text-xs font-bold text-emerald-500 block mt-0.5">{p.margin.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
