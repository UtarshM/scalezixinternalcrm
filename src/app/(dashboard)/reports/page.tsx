'use client'

import * as React from 'react'
import { getInvoices } from '@/actions/invoices'
import { getExpenses } from '@/actions/expenses'
import { getProjects } from '@/actions/projects'
import { getTasks } from '@/actions/tasks'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts'

export default function ReportsHubPage() {
  const [invoices, setInvoices] = React.useState<any[]>([])
  const [expenses, setExpenses] = React.useState<any[]>([])
  const [projects, setProjects] = React.useState<any[]>([])
  const [tasks, setTasks] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [inv, exp, proj, tsk] = await Promise.all([
          getInvoices(),
          getExpenses(),
          getProjects(),
          getTasks(),
        ])
        setInvoices(inv)
        setExpenses(exp)
        setProjects(proj)
        setTasks(tsk)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Aggregate project data for progress tracking
  const projectProgressData = React.useMemo(() => {
    return projects.slice(0, 5).map(p => ({
      name: p.name,
      Progress: p.progress,
      Budget: p.budget || 0,
    }))
  }, [projects])

  if (loading) return <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading reports hub...</div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Reports Hub</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Aggregate visual reports representing core project margins, sales completions, and productivity metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Projects budget chart */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-[var(--foreground)] mb-4">Project Budgets comparison</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={projectProgressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `₹${v/1000}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(v: any) => [formatCurrency(Number(v || 0)), 'Budget']}
              />
              <Bar dataKey="Budget" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Project progress comparison */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-[var(--foreground)] mb-4">Launch Progress completeness (%)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={projectProgressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(v: any) => [`${v || 0}%`, 'Completeness']}
              />
              <Bar dataKey="Progress" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
