'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { getExpenses } from '@/actions/expenses'
import { getPayments } from '@/actions/payments'
import { getBankAccounts, getSubscriptions } from '@/actions/finance-actions'
import { formatCurrency } from '@/lib/utils'
import {
  TrendingUp, TrendingDown, IndianRupee, PieChart as ChartIcon, Wallet,
  Calendar, Clock, ShieldAlert, Cpu, Percent, AlertCircle, RefreshCw
} from 'lucide-react'
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts'
import Link from 'next/link'

export default function FinanceOverviewPage() {
  const supabase = createClient()

  // Dynamic States
  const [payments, setPayments] = React.useState<any[]>([])
  const [expenses, setExpenses] = React.useState<any[]>([])
  const [bankAccounts, setBankAccounts] = React.useState<any[]>([])
  const [subscriptions, setSubscriptions] = React.useState<any[]>([])
  const [invoices, setInvoices] = React.useState<any[]>([])
  const [withdrawals, setWithdrawals] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [payData, expData, bankData, subData, invRes, wdRes] = await Promise.all([
        getPayments(),
        getExpenses(),
        getBankAccounts(),
        getSubscriptions(),
        supabase.from('invoices').select('*'),
        supabase.from('founder_withdrawals').select('*')
      ])
      setPayments(payData || [])
      setExpenses(expData || [])
      setBankAccounts(bankData || [])
      setSubscriptions(subData || [])
      setInvoices(invRes.data || [])
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

  // Timestamps
  const todayStr = new Date().toISOString().split('T')[0]
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const isToday = (dateStr: string) => dateStr === todayStr
  const isThisMonth = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  }
  const isThisYear = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.getFullYear() === currentYear
  }

  // Calculations
  // 1. Revenue
  const todayRevenue = payments.filter(p => p.payment_date && isToday(p.payment_date)).reduce((sum, p) => sum + (p.amount || 0), 0)
  const monthlyRevenue = payments.filter(p => p.payment_date && isThisMonth(p.payment_date)).reduce((sum, p) => sum + (p.amount || 0), 0)
  const yearlyRevenue = payments.filter(p => p.payment_date && isThisYear(p.payment_date)).reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0)

  // 2. Expenses
  const todayExpenses = expenses.filter(e => e.date && isToday(e.date)).reduce((sum, e) => sum + (e.amount || 0), 0)
  const monthlyExpenses = expenses.filter(e => e.date && isThisMonth(e.date)).reduce((sum, e) => sum + (e.amount || 0), 0)
  const yearlyExpenses = expenses.filter(e => e.date && isThisYear(e.date)).reduce((sum, e) => sum + (e.amount || 0), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)

  // 3. Profitability
  const grossProfit = totalRevenue - totalExpenses
  const totalWithdrawals = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0)
  const netProfit = grossProfit - totalWithdrawals
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
  const monthlyProfit = monthlyRevenue - monthlyExpenses

  // 4. Cash Flow
  const cashInflow = totalRevenue
  const cashOutflow = totalExpenses + totalWithdrawals
  const availableCash = bankAccounts.reduce((sum, b) => sum + (b.current_balance || 0), 0)

  // 5. Pending Payments
  const clientPending = invoices.filter(inv => ['sent', 'overdue'].includes(inv.status)).reduce((sum, inv) => sum + (inv.total - inv.amount_paid), 0)
  const vendorPending = expenses.filter(e => e.status === 'pending' && e.category === 'vendor').reduce((sum, e) => sum + (e.amount || 0), 0)
  const salaryDue = expenses.filter(e => e.status === 'pending' && e.category === 'salary').reduce((sum, e) => sum + (e.amount || 0), 0)

  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  const upcomingRenewalsCount = subscriptions.filter(sub => {
    if (!sub.renewal_date) return false
    const d = new Date(sub.renewal_date)
    return d >= new Date() && d <= thirtyDaysFromNow
  }).length

  // 6. Subscriptions
  const monthlySaaS = subscriptions.filter(s => s.category === 'software').reduce((sum, s) => sum + (s.monthly_cost || 0), 0)
  const hostingCosts = subscriptions.filter(s => s.category === 'hosting').reduce((sum, s) => sum + (s.monthly_cost || 0), 0)
  const marketingCosts = subscriptions.filter(s => s.category === 'marketing').reduce((sum, s) => sum + (s.monthly_cost || 0), 0)
  const officeCosts = subscriptions.filter(s => s.category === 'office').reduce((sum, s) => sum + (s.monthly_cost || 0), 0)

  // Recharts trends data
  const monthlyData = React.useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const year = new Date().getFullYear()
    return months.map((m, idx) => {
      const rev = payments
        .filter(p => p.payment_date && new Date(p.payment_date).getMonth() === idx && new Date(p.payment_date).getFullYear() === year)
        .reduce((sum, p) => sum + (p.amount || 0), 0)
      const exp = expenses
        .filter(e => e.date && new Date(e.date).getMonth() === idx && new Date(e.date).getFullYear() === year)
        .reduce((sum, e) => sum + (e.amount || 0), 0)
      return {
        month: m,
        Revenue: rev,
        Expenses: exp,
        Profit: rev - exp
      }
    })
  }, [payments, expenses])

  // Category breakdown for expenses
  const expenseCategories = React.useMemo(() => {
    const map: Record<string, number> = {}
    expenses.forEach(exp => {
      const cat = exp.category || 'other'
      map[cat] = (map[cat] || 0) + exp.amount
    })
    const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#14b8a6', '#f43f5e']
    return Object.keys(map).map((cat, idx) => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' '),
      value: map[cat],
      color: COLORS[idx % COLORS.length],
    }))
  }, [expenses])

  if (loading) return <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading finance records...</div>

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Finance Overview</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Complete real-time cash flow, profitability, and GST accounts matrix</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border)] rounded-lg text-xs font-semibold hover:bg-[var(--secondary)] text-[var(--foreground)]"
        >
          <RefreshCw size={13} /> Reload data
        </button>
      </div>

      {/* REVENUE & EXPENSES DECK */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-[var(--foreground)] border-b border-[var(--border)] pb-2 flex items-center gap-1.5"><TrendingUp size={16} className="text-emerald-500" /> Revenue</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Today:</span>
              <span className="font-semibold text-[var(--foreground)]">{formatCurrency(todayRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">This Month:</span>
              <span className="font-semibold text-[var(--foreground)]">{formatCurrency(monthlyRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">This Year:</span>
              <span className="font-semibold text-[var(--foreground)]">{formatCurrency(yearlyRevenue)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-2 font-bold text-sm text-[var(--foreground)]">
              <span>Total:</span>
              <span>{formatCurrency(totalRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-[var(--foreground)] border-b border-[var(--border)] pb-2 flex items-center gap-1.5"><TrendingDown size={16} className="text-rose-500" /> Expenses</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Today:</span>
              <span className="font-semibold text-[var(--foreground)]">{formatCurrency(todayExpenses)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">This Month:</span>
              <span className="font-semibold text-[var(--foreground)]">{formatCurrency(monthlyExpenses)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">This Year:</span>
              <span className="font-semibold text-[var(--foreground)]">{formatCurrency(yearlyExpenses)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-2 font-bold text-sm text-[var(--foreground)]">
              <span>Total:</span>
              <span>{formatCurrency(totalExpenses)}</span>
            </div>
          </div>
        </div>

        {/* Profitability Card */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-[var(--foreground)] border-b border-[var(--border)] pb-2 flex items-center gap-1.5"><Percent size={16} className="text-blue-500" /> Profitability</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Gross Profit:</span>
              <span className="font-semibold text-emerald-500">{formatCurrency(grossProfit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Net Profit:</span>
              <span className="font-semibold text-[var(--foreground)]">{formatCurrency(netProfit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Margin %:</span>
              <span className="font-semibold text-[var(--foreground)]">{profitMargin.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-2 font-bold text-sm text-[var(--foreground)]">
              <span>Monthly Profit:</span>
              <span className={monthlyProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{formatCurrency(monthlyProfit)}</span>
            </div>
          </div>
        </div>

        {/* Cash Flow Card */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-[var(--foreground)] border-b border-[var(--border)] pb-2 flex items-center gap-1.5"><Wallet size={16} className="text-violet-500" /> Cash Flow</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Total Inflow:</span>
              <span className="font-semibold text-emerald-500">{formatCurrency(cashInflow)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Total Outflow:</span>
              <span className="font-semibold text-rose-500">{formatCurrency(cashOutflow)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-2 font-bold text-sm text-[var(--foreground)]">
              <span>Available Cash:</span>
              <span className="text-violet-500">{formatCurrency(availableCash)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* OPERATIONS & LIABILITIES BLOCK */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Payments Liability */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-[var(--foreground)] border-b border-[var(--border)] pb-2 flex items-center gap-1.5"><AlertCircle size={16} className="text-amber-500" /> Pending Liabilities</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 border border-[var(--border)] bg-[var(--secondary)]/10 rounded-lg">
              <span className="text-[var(--muted-foreground)] block">Client Receivables:</span>
              <span className="text-sm font-bold text-[var(--foreground)] block mt-1">{formatCurrency(clientPending)}</span>
            </div>
            <div className="p-3 border border-[var(--border)] bg-[var(--secondary)]/10 rounded-lg">
              <span className="text-[var(--muted-foreground)] block">Vendor Payables:</span>
              <span className="text-sm font-bold text-[var(--foreground)] block mt-1">{formatCurrency(vendorPending)}</span>
            </div>
            <div className="p-3 border border-[var(--border)] bg-[var(--secondary)]/10 rounded-lg">
              <span className="text-[var(--muted-foreground)] block">Salary Payments Due:</span>
              <span className="text-sm font-bold text-[var(--foreground)] block mt-1">{formatCurrency(salaryDue)}</span>
            </div>
            <div className="p-3 border border-[var(--border)] bg-[var(--secondary)]/10 rounded-lg">
              <span className="text-[var(--muted-foreground)] block">Upcoming Renewals:</span>
              <span className="text-sm font-bold text-[var(--foreground)] block mt-1">{upcomingRenewalsCount} SaaS</span>
            </div>
          </div>
        </div>

        {/* SaaS & Subscriptions Costs */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-[var(--foreground)] border-b border-[var(--border)] pb-2 flex items-center gap-1.5"><Calendar size={16} className="text-indigo-500" /> SaaS & Subscription Burn Rates</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 border border-[var(--border)] bg-[var(--secondary)]/10 rounded-lg">
              <span className="text-[var(--muted-foreground)] block">Monthly SaaS Costs:</span>
              <span className="text-sm font-bold text-[var(--foreground)] block mt-1">{formatCurrency(monthlySaaS)}/mo</span>
            </div>
            <div className="p-3 border border-[var(--border)] bg-[var(--secondary)]/10 rounded-lg">
              <span className="text-[var(--muted-foreground)] block">Hosting Costs:</span>
              <span className="text-sm font-bold text-[var(--foreground)] block mt-1">{formatCurrency(hostingCosts)}/mo</span>
            </div>
            <div className="p-3 border border-[var(--border)] bg-[var(--secondary)]/10 rounded-lg">
              <span className="text-[var(--muted-foreground)] block">Marketing Subscriptions:</span>
              <span className="text-sm font-bold text-[var(--foreground)] block mt-1">{formatCurrency(marketingCosts)}/mo</span>
            </div>
            <div className="p-3 border border-[var(--border)] bg-[var(--secondary)]/10 rounded-lg">
              <span className="text-[var(--muted-foreground)] block">Office Overhead Subscriptions:</span>
              <span className="text-sm font-bold text-[var(--foreground)] block mt-1">{formatCurrency(officeCosts)}/mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS GRAPH SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Trends */}
        <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="font-bold text-sm text-[var(--foreground)] mb-4">Cash Flow Overview Trends (Current Year)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
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
              <Area type="monotone" dataKey="Revenue" stroke="#10b981" fill="url(#incomeGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="Expenses" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expenses Category Pie */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-[var(--foreground)] mb-1">Expenses breakdown</h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-4">Capital allocation distribution</p>
            {expenseCategories.length === 0 ? (
              <div className="py-12 text-center text-xs text-[var(--muted-foreground)]">No expenses categorized</div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={expenseCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {expenseCategories.map((entry, idx) => (
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

          <div className="space-y-2 mt-4 max-h-[140px] overflow-y-auto pr-1">
            {expenseCategories.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs border border-[var(--border)] px-2.5 py-1 rounded bg-[var(--secondary)]/15">
                <span className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-semibold text-[var(--foreground)]">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
