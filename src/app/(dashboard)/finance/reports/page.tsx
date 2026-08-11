'use client'

import * as React from 'react'
import { getPayments } from '@/actions/payments'
import { getExpenses } from '@/actions/expenses'
import { getSubscriptions } from '@/actions/finance-actions'
import { formatCurrency } from '@/lib/utils'
import { BarChart3, RefreshCw } from 'lucide-react'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'

export default function ReportsPage() {
  const [payments, setPayments] = React.useState<any[]>([])
  const [expenses, setExpenses] = React.useState<any[]>([])
  const [subscriptions, setSubscriptions] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear())

  const fetchReportsData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [payData, expData, subData] = await Promise.all([
        getPayments(),
        getExpenses(),
        getSubscriptions()
      ])
      setPayments(payData || [])
      setExpenses(expData || [])
      setSubscriptions(subData || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchReportsData()
  }, [fetchReportsData])

  // 1. Monthly Revenue & Expense trends for selected year
  const monthlyTrends = React.useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months.map((m, idx) => {
      const rev = payments
        .filter(p => {
          const d = new Date(p.payment_date || p.created_at)
          return d.getMonth() === idx && d.getFullYear() === selectedYear
        })
        .reduce((sum, p) => sum + (p.total_amount_received || p.amount || 0), 0)
      const exp = expenses
        .filter(e => {
          const d = new Date(e.date || e.created_at)
          return d.getMonth() === idx && d.getFullYear() === selectedYear
        })
        .reduce((sum, e) => sum + (e.total_amount || e.amount || 0), 0)
      return {
        month: m,
        Revenue: rev,
        Expenses: exp,
        Net: rev - exp
      }
    })
  }, [payments, expenses, selectedYear])

  // 2. Service-wise Revenue distribution
  const serviceRevenue = React.useMemo(() => {
    const map: Record<string, number> = {}
    payments.forEach(p => {
      const cat = p.category || 'Other Services'
      map[cat] = (map[cat] || 0) + (p.total_amount_received || p.amount)
    })
    const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#14b8a6', '#f43f5e']
    return Object.keys(map).map((cat, idx) => ({
      name: cat,
      value: map[cat],
      color: COLORS[idx % COLORS.length]
    }))
  }, [payments])

  // 3. Subscription Cost Breakdown
  const subscriptionBreakdown = React.useMemo(() => {
    const map: Record<string, number> = {}
    subscriptions.forEach(s => {
      const cat = s.category || 'other'
      map[cat] = (map[cat] || 0) + (s.monthly_cost || 0)
    })
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
    return Object.keys(map).map((cat, idx) => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      value: map[cat],
      color: COLORS[idx % COLORS.length]
    }))
  }, [subscriptions])

  if (loading) return <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Generating analytical reports...</div>

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Financial Reports & Analytics</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Interactive charts mapping monthly growth, revenue by service, and SaaS cost breakdowns</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 border border-[var(--border)] rounded-lg text-xs font-semibold bg-[var(--card)] text-[var(--foreground)]"
          >
            <option value={2026}>Year 2026</option>
            <option value={2025}>Year 2025</option>
            <option value={2024}>Year 2024</option>
          </select>
          <button
            onClick={fetchReportsData}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border)] rounded-lg text-xs font-semibold hover:bg-[var(--secondary)] text-[var(--foreground)]"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Primary Income vs Expenses bar chart */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
        <h3 className="font-bold text-sm text-[var(--foreground)] mb-4">Monthly Financial Performance Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `₹${v/1000}k`} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '11px',
              }}
              formatter={(val: any) => [formatCurrency(Number(val || 0)), '']}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Row side-by-side charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Revenue distribution */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-[var(--foreground)] mb-1">Service-wise Revenue</h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-4">Capital allocation generated by business categories</p>
            {serviceRevenue.length === 0 ? (
              <div className="py-12 text-center text-xs text-[var(--muted-foreground)]">No service revenue registered</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={serviceRevenue}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {serviceRevenue.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="space-y-2 mt-4 max-h-[160px] overflow-y-auto pr-1">
            {serviceRevenue.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs border border-[var(--border)] px-2.5 py-1.5 rounded bg-[var(--secondary)]/15">
                <span className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-semibold text-[var(--foreground)]">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription costs breakdown */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-[var(--foreground)] mb-1">Subscription burn allocation</h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-4">Breakdown of SaaS subscriptions by category</p>
            {subscriptionBreakdown.length === 0 ? (
              <div className="py-12 text-center text-xs text-[var(--muted-foreground)]">No subscriptions registered</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={subscriptionBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {subscriptionBreakdown.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="space-y-2 mt-4 max-h-[160px] overflow-y-auto pr-1">
            {subscriptionBreakdown.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs border border-[var(--border)] px-2.5 py-1.5 rounded bg-[var(--secondary)]/15">
                <span className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-semibold text-[var(--foreground)]">{formatCurrency(item.value)}/mo</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
