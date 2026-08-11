'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { getPayments } from '@/actions/payments'
import { getExpenses } from '@/actions/expenses'
import { getBankAccounts } from '@/actions/finance-actions'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, RefreshCw, Wallet, Calendar, Percent } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts'

export default function CashFlowPage() {
  const supabase = createClient()
  const [payments, setPayments] = React.useState<any[]>([])
  const [expenses, setExpenses] = React.useState<any[]>([])
  const [bankAccounts, setBankAccounts] = React.useState<any[]>([])
  const [withdrawals, setWithdrawals] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [payData, expData, bankData, wdRes] = await Promise.all([
        getPayments(),
        getExpenses(),
        getBankAccounts(),
        supabase.from('founder_withdrawals').select('*')
      ])
      setPayments(payData || [])
      setExpenses(expData || [])
      setBankAccounts(bankData || [])
      setWithdrawals(wdRes.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const totalInflow = payments.reduce((sum, p) => sum + (p.total_amount_received || p.amount || 0), 0)
  const totalOutflow = expenses.reduce((sum, e) => sum + (e.total_amount || e.amount || 0), 0) + withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0)
  const availableCash = bankAccounts.reduce((sum, b) => sum + (b.current_balance || 0), 0)

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthlyInflow = payments
    .filter(p => {
      const d = new Date(p.payment_date || p.created_at)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })
    .reduce((sum, p) => sum + (p.total_amount_received || p.amount || 0), 0)

  const monthlyOutflow = expenses
    .filter(e => {
      const d = new Date(e.date || e.created_at)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })
    .reduce((sum, e) => sum + (e.total_amount || e.amount || 0), 0) + 
    withdrawals
      .filter(w => {
        const d = new Date(w.date || w.created_at)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
      })
      .reduce((sum, w) => sum + (w.amount || 0), 0)

  const burnRate = monthlyOutflow
  const netProfitThisMonth = monthlyInflow - monthlyOutflow

  // Cash Flow Monthly data for Chart
  const chartData = React.useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const year = new Date().getFullYear()
    return months.map((m, idx) => {
      const rev = payments
        .filter(p => {
          const d = new Date(p.payment_date || p.created_at)
          return d.getMonth() === idx && d.getFullYear() === year
        })
        .reduce((sum, p) => sum + (p.total_amount_received || p.amount || 0), 0)
      const exp = expenses
        .filter(e => {
          const d = new Date(e.date || e.created_at)
          return d.getMonth() === idx && d.getFullYear() === year
        })
        .reduce((sum, e) => sum + (e.total_amount || e.amount || 0), 0) +
        withdrawals
          .filter(w => {
            const d = new Date(w.date || w.created_at)
            return d.getMonth() === idx && d.getFullYear() === year
          })
          .reduce((sum, w) => sum + (w.amount || 0), 0)
      return {
        month: m,
        Inflow: rev,
        Outflow: exp,
        Net: rev - exp
      }
    })
  }, [payments, expenses, withdrawals])

  if (loading) return <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading cash flow data...</div>

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Cash Flow Management</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Real-time ledger of liquid capital reserves, HDFC/ICICI balances, and monthly burn rate</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border)] rounded-lg text-xs font-semibold hover:bg-[var(--secondary)] text-[var(--foreground)]"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 card-hover">
          <span className="text-xs text-[var(--muted-foreground)] block">Total Cash Available</span>
          <span className="text-2xl font-bold text-violet-500 block mt-1">{formatCurrency(availableCash)}</span>
          <span className="text-[10px] text-[var(--muted-foreground)] block mt-0.5">Sum of all bank account balances</span>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 card-hover">
          <span className="text-xs text-[var(--muted-foreground)] block">Total Inflow</span>
          <span className="text-2xl font-bold text-emerald-500 block mt-1">{formatCurrency(totalInflow)}</span>
          <span className="text-[10px] text-[var(--muted-foreground)] block mt-0.5">Lifetime incoming revenues</span>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 card-hover">
          <span className="text-xs text-[var(--muted-foreground)] block">Total Outflow</span>
          <span className="text-2xl font-bold text-rose-500 block mt-1">{formatCurrency(totalOutflow)}</span>
          <span className="text-[10px] text-[var(--muted-foreground)] block mt-0.5">Expenses & founder withdrawals</span>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 card-hover">
          <span className="text-xs text-[var(--muted-foreground)] block">Monthly Burn Rate</span>
          <span className="text-2xl font-bold text-[var(--foreground)] block mt-1">{formatCurrency(burnRate)}</span>
          <span className="text-[10px] text-[var(--muted-foreground)] block mt-0.5">Total outflows this month</span>
        </div>
      </div>

      {/* Bank Account Balances */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
        <h3 className="font-bold text-sm text-[var(--foreground)] mb-4">Liquid Cash Accounts</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bankAccounts.length === 0 ? (
            <div className="col-span-3 text-center py-6 text-xs text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-lg">
              No bank accounts mapped. Create bank profiles in the Bank Accounts section.
            </div>
          ) : (
            bankAccounts.map(b => (
              <div key={b.id} className="p-4 border border-[var(--border)] bg-[var(--secondary)]/10 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[var(--foreground)] block">{b.bank_name}</span>
                  <span className="text-[10px] text-[var(--muted-foreground)] block mt-0.5">{b.account_holder_name}</span>
                </div>
                <span className="text-sm font-bold text-[var(--foreground)]">{formatCurrency(b.current_balance)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cash Flow Graph */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
        <h3 className="font-bold text-sm text-[var(--foreground)] mb-4">Cash Inflow vs Outflow Graph</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              formatter={(value: any) => [formatCurrency(Number(value || 0)), '']}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Area type="monotone" dataKey="Inflow" stroke="#10b981" fill="url(#inflowGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="Outflow" stroke="#ef4444" fill="url(#outflowGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Double Column Transaction History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inflows (Payments) */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-emerald-500 border-b border-[var(--border)] pb-2 flex items-center gap-1.5"><ArrowUpCircle size={16} /> Recent Inflows</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {payments.slice(0, 10).map((p, idx) => (
              <div key={p.id || idx} className="p-3 border border-[var(--border)] rounded-lg flex items-center justify-between bg-[var(--secondary)]/5 hover:bg-[var(--secondary)]/10 transition-colors">
                <div>
                  <span className="text-xs font-semibold text-[var(--foreground)] block">{p.client?.company_name || 'Direct Revenue'}</span>
                  <span className="text-[10px] text-[var(--muted-foreground)] block mt-0.5">{formatDate(p.payment_date || p.created_at)} • {p.category}</span>
                </div>
                <span className="text-xs font-bold text-emerald-500">{formatCurrency(p.total_amount_received || p.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Outflows (Expenses & Withdrawals) */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-rose-500 border-b border-[var(--border)] pb-2 flex items-center gap-1.5"><ArrowDownCircle size={16} /> Recent Outflows</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {[...expenses, ...withdrawals.map(w => ({ ...w, title: `Founder Withdrawal (${w.reason || 'Draw'})`, category: 'draw' }))]
              .sort((a, b) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime())
              .slice(0, 10).map((e, idx) => (
                <div key={e.id || idx} className="p-3 border border-[var(--border)] rounded-lg flex items-center justify-between bg-[var(--secondary)]/5 hover:bg-[var(--secondary)]/10 transition-colors">
                  <div>
                    <span className="text-xs font-semibold text-[var(--foreground)] block">{e.title}</span>
                    <span className="text-[10px] text-[var(--muted-foreground)] block mt-0.5">{formatDate(e.date || e.created_at)} • {e.category}</span>
                  </div>
                  <span className="text-xs font-bold text-rose-500">{formatCurrency(e.total_amount || e.amount)}</span>
                </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
