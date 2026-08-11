'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  IndianRupee, FolderKanban, CheckSquare, FileText,
  Clock, TrendingUp, TrendingDown, Users, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Calendar, Key, Globe, Server, ShieldCheck, Database, Cpu
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import Link from 'next/link'

interface StatCardProps {
  title: string
  value: string
  change?: string
  changeType?: 'up' | 'down'
  icon: React.ReactNode
  color: string
}

function StatCard({ title, value, change, changeType, icon, color }: StatCardProps) {
  return (
    <div className="card-hover bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
        {change && (
          <div className={`flex items-center gap-0.5 text-xxs font-semibold ${
            changeType === 'up' ? 'text-emerald-500' : 'text-red-500'
          }`}>
            {changeType === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {change}
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-xl font-bold text-[var(--foreground)] leading-none">{value}</p>
        <p className="text-[11px] text-[var(--muted-foreground)] font-medium mt-1.5 uppercase tracking-wider">{title}</p>
      </div>
    </div>
  )
}

// Sample data for charts
const revenueData = [
  { month: 'Jan', revenue: 120000, expenses: 80000 },
  { month: 'Feb', revenue: 150000, expenses: 90000 },
  { month: 'Mar', revenue: 180000, expenses: 95000 },
  { month: 'Apr', revenue: 140000, expenses: 85000 },
  { month: 'May', revenue: 200000, expenses: 100000 },
  { month: 'Jun', revenue: 220000, expenses: 110000 },
  { month: 'Jul', revenue: 250000, expenses: 120000 },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const supabase = createClient()
  
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    clientProjects: 0,
    internalProjects: 0,
    liveProjects: 0,
    devProjects: 0,
    totalMonthlyCosts: 0,
    upcomingRenewalsCount: 0,
    pendingPayments: 0,
    totalClients: 0
  })

  // Lists states
  const [recentProjects, setRecentProjects] = useState<any[]>([])
  const [upcomingRenewals, setUpcomingRenewals] = useState<any[]>([])
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([])
  const [teamActivity, setTeamActivity] = useState<any[]>([])
  const [recentCredentials, setRecentCredentials] = useState<any[]>([])

  const [projectStatusData, setProjectStatusData] = useState<any[]>([
    { name: 'Planning', value: 0, color: '#3b82f6' },
    { name: 'Development', value: 0, color: '#8b5cf6' },
    { name: 'Testing', value: 0, color: '#f59e0b' },
    { name: 'Live', value: 0, color: '#10b981' },
    { name: 'Maintenance', value: 0, color: '#64748b' }
  ])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          { data: allProjects },
          { data: allClients },
          { data: allBilling },
          { data: allInvoices },
          { data: actsData },
          { data: credsData }
        ] = await Promise.all([
          supabase.from('projects').select('*'),
          supabase.from('clients').select('*'),
          supabase.from('project_billing_renewals').select('*, project:projects(name)'),
          supabase.from('invoices').select('*, client:clients(company_name)'),
          supabase.from('activities').select('*, user:users(*)').order('created_at', { ascending: false }).limit(6),
          supabase.from('project_credentials').select('*, project:projects(name)').order('updated_at', { ascending: false }).limit(5)
        ])

        const projList = allProjects || []
        const clientList = allClients || []
        const billingList = allBilling || []
        const invoiceList = allInvoices || []

        // 1. Projects Category Metrics
        const totalProjects = projList.length
        const activeProjects = projList.filter(p => ['planning', 'development', 'testing', 'live', 'maintenance'].includes(p.status)).length
        const clientProjects = projList.filter(p => p.category === 'client_project' || !p.category).length
        const internalProjects = projList.filter(p => p.category === 'internal_project').length
        const liveProjects = projList.filter(p => p.status === 'live').length
        const devProjects = projList.filter(p => p.status === 'development').length

        // 2. Billing Costs
        const totalMonthlyCosts = billingList.reduce((sum, b) => sum + (b.monthly_cost || 0), 0)

        // 3. Renewals due in 30 days
        const today = new Date()
        today.setHours(0,0,0,0)
        const limitDate = new Date()
        limitDate.setDate(today.getDate() + 30)

        const dueRenewals = billingList.filter(b => {
          if (!b.renewal_date) return false
          const renDate = new Date(b.renewal_date)
          return renDate >= today && renDate <= limitDate
        })
        const upcomingRenewalsCount = dueRenewals.length

        // 4. Pending Payments
        const pendingPayments = invoiceList
          .filter(inv => ['sent', 'overdue'].includes(inv.status))
          .reduce((sum, inv) => sum + (inv.total - inv.amount_paid), 0)

        const totalClients = clientList.length

        setStats({
          totalProjects,
          activeProjects,
          clientProjects,
          internalProjects,
          liveProjects,
          devProjects,
          totalMonthlyCosts,
          upcomingRenewalsCount,
          pendingPayments,
          totalClients
        })

        // Lists set
        setRecentProjects(projList.slice(0, 5))
        setUpcomingRenewals(dueRenewals.slice(0, 5))
        setPendingInvoices(invoiceList.filter(inv => ['sent', 'overdue'].includes(inv.status)).slice(0, 5))
        setTeamActivity(actsData || [])
        setRecentCredentials(credsData || [])

        // Distribution chart
        const planning = projList.filter(p => p.status === 'planning').length
        const development = projList.filter(p => p.status === 'development').length
        const testing = projList.filter(p => p.status === 'testing').length
        const live = projList.filter(p => p.status === 'live').length
        const maintenance = projList.filter(p => p.status === 'maintenance').length

        setProjectStatusData([
          { name: 'Planning', value: planning, color: '#3b82f6' },
          { name: 'Development', value: development, color: '#8b5cf6' },
          { name: 'Testing', value: testing, color: '#f59e0b' },
          { name: 'Live', value: live, color: '#10b981' },
          { name: 'Maintenance', value: maintenance, color: '#64748b' }
        ])

      } catch (error) {
        console.error('Dashboard fetching error:', error)
      }
    }

    fetchDashboardData()
  }, [supabase])

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          {greeting()}, {user?.full_name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Scalezix operations overview: projects, credentials, environments, and renewals metrics.
        </p>
      </div>

      {/* 10 Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatCard
          title="Total Projects"
          value={String(stats.totalProjects)}
          icon={<FolderKanban size={18} className="text-indigo-500" />}
          color="bg-indigo-500/10"
        />
        <StatCard
          title="Active Projects"
          value={String(stats.activeProjects)}
          icon={<Server size={18} className="text-violet-500" />}
          color="bg-violet-500/10"
        />
        <StatCard
          title="Client Projects"
          value={String(stats.clientProjects)}
          icon={<Users size={18} className="text-blue-500" />}
          color="bg-blue-500/10"
        />
        <StatCard
          title="Internal Projects"
          value={String(stats.internalProjects)}
          icon={<Globe size={18} className="text-emerald-500" />}
          color="bg-emerald-500/10"
        />
        <StatCard
          title="Live Projects"
          value={String(stats.liveProjects)}
          icon={<ShieldCheck size={18} className="text-cyan-500" />}
          color="bg-cyan-500/10"
        />
        <StatCard
          title="In Development"
          value={String(stats.devProjects)}
          icon={<Cpu size={18} className="text-amber-500" />}
          color="bg-amber-500/10"
        />
        <StatCard
          title="Monthly Costs"
          value={formatCurrency(stats.totalMonthlyCosts)}
          icon={<IndianRupee size={18} className="text-rose-500" />}
          color="bg-rose-500/10"
        />
        <StatCard
          title="Upcoming Renewals"
          value={String(stats.upcomingRenewalsCount)}
          icon={<Calendar size={18} className="text-orange-500" />}
          color="bg-orange-500/10"
        />
        <StatCard
          title="Pending Payments"
          value={formatCurrency(stats.pendingPayments)}
          icon={<FileText size={18} className="text-yellow-500" />}
          color="bg-yellow-500/10"
        />
        <StatCard
          title="Total Clients"
          value={String(stats.totalClients)}
          icon={<Users size={18} className="text-teal-500" />}
          color="bg-teal-500/10"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-[var(--card)] rounded-xl border border-[var(--border)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-[var(--foreground)] text-sm">Revenue vs Expenses</h3>
              <p className="text-xs text-[var(--muted-foreground)]">Last 7 months overview</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                Expenses
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
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
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revenueGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="expenses" stroke="#f59e0b" fill="url(#expenseGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Project Status Pie */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-[var(--foreground)] text-sm">Project Status</h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-3">Distribution status</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={projectStatusData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={4}
                dataKey="value"
              >
                {projectStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
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
          <div className="grid grid-cols-2 gap-2 mt-4">
            {projectStatusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs border border-[var(--border)] px-2 py-1 rounded bg-[var(--secondary)]/15">
                <span className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-semibold text-[var(--foreground)]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* operations tables grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
        {/* Recent Projects */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
            <h3 className="font-bold text-[var(--foreground)] text-sm flex items-center gap-1.5"><FolderKanban size={16} className="text-[var(--accent)]" /> Recent Projects</h3>
            <Link href="/projects" className="text-xs text-[var(--accent)] hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {recentProjects.length === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)] italic py-2">No projects.</p>
            ) : (
              recentProjects.map(proj => (
                <div key={proj.id} className="flex justify-between items-center text-xs">
                  <div>
                    <Link href={`/projects/${proj.id}`} className="font-semibold text-[var(--foreground)] hover:underline">{proj.name}</Link>
                    <span className="block text-[10px] text-[var(--muted-foreground)] mt-0.5 capitalize">{proj.category?.replace('_', ' ') || 'Client Project'} • {proj.project_type}</span>
                  </div>
                  <span className="text-[10px] bg-[var(--secondary)] border border-[var(--border)] px-2 py-0.5 rounded text-[var(--foreground)] capitalize font-semibold">{proj.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Renewals */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
            <h3 className="font-bold text-[var(--foreground)] text-sm flex items-center gap-1.5"><Calendar size={16} className="text-orange-500" /> Upcoming Renewals</h3>
            <Link href="/billing-renewals" className="text-xs text-[var(--accent)] hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {upcomingRenewals.length === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)] italic py-2">No renewals due in 30 days.</p>
            ) : (
              upcomingRenewals.map(bill => (
                <div key={bill.id} className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-[var(--foreground)]">{bill.service_name}</span>
                    <span className="block text-[10px] text-[var(--muted-foreground)] mt-0.5">{bill.project?.name} • {bill.billing_frequency}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold block text-[var(--foreground)]">{bill.currency} {bill.monthly_cost}</span>
                    <span className="text-[10px] text-rose-500 font-medium block mt-0.5">{formatDate(bill.renewal_date)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Credential Updates */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
            <h3 className="font-bold text-[var(--foreground)] text-sm flex items-center gap-1.5"><Key size={16} className="text-indigo-500" /> Recent Credentials</h3>
            <Link href="/credentials" className="text-xs text-[var(--accent)] hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {recentCredentials.length === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)] italic py-2">No credentials registered.</p>
            ) : (
              recentCredentials.map(cred => (
                <div key={cred.id} className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-[var(--foreground)]">{cred.service_name}</span>
                    <span className="block text-[10px] text-[var(--muted-foreground)] mt-0.5">{cred.project?.name} • {cred.account_email || cred.username || '-'}</span>
                  </div>
                  <Link href={`/projects/${cred.project_id}`} className="text-[10px] text-[var(--accent)] hover:underline">Manage</Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Activity Logs */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
            <h3 className="font-bold text-[var(--foreground)] text-sm flex items-center gap-1.5"><Clock size={16} className="text-violet-500" /> Team Activity</h3>
            <Link href="/activity-logs" className="text-xs text-[var(--accent)] hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {teamActivity.length === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)] italic py-2">No recent activities.</p>
            ) : (
              teamActivity.slice(0, 5).map(act => (
                <div key={act.id} className="flex justify-between items-start text-xs">
                  <div className="max-w-[70%]">
                    <span className="font-medium text-[var(--foreground)] block leading-snug">{act.description}</span>
                    <span className="text-[9px] text-[var(--muted-foreground)] block mt-0.5">By {act.user?.full_name || 'System'}</span>
                  </div>
                  <span className="text-[9px] text-[var(--muted-foreground)] font-mono">{new Date(act.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
