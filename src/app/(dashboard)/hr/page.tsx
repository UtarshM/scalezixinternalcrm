'use client'

import * as React from 'react'
import Link from 'next/link'
import { getEmployees, getLeaveRequests } from '@/actions/hr'
import { Users, CalendarRange, Landmark, ShieldCheck, ArrowRight } from 'lucide-react'

export default function HROverviewPage() {
  const [employees, setEmployees] = React.useState<any[]>([])
  const [leaves, setLeaves] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [empData, leaveData] = await Promise.all([getEmployees(), getLeaveRequests()])
        setEmployees(empData)
        setLeaves(leaveData)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading HR modules...</div>

  const pendingLeavesCount = leaves.filter(l => l.status === 'pending').length

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Human Resources</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Manage internal team profiles, check leave applications, and view salaries payrolls</p>
      </div>

      {/* Directory options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 flex flex-col justify-between card-hover">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Users size={20} />
            </div>
            <h3 className="font-bold text-[var(--foreground)] text-lg">Employee Directory</h3>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              Register employee IDs, designations, joined date milestones, and bank details.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[var(--border)] flex justify-between items-center text-xs">
            <span className="text-[var(--muted-foreground)]">Active Staff: {employees.length}</span>
            <Link href="/hr/employees" className="flex items-center gap-1 text-[var(--accent)] font-semibold hover:underline">
              Enter
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 flex flex-col justify-between card-hover">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <CalendarRange size={20} />
            </div>
            <h3 className="font-bold text-[var(--foreground)] text-lg">Leave Applications</h3>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              Verify casual leaves, sick leaves, medical records, and approve/reject applications.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[var(--border)] flex justify-between items-center text-xs">
            <span className="text-[var(--muted-foreground)]">{pendingLeavesCount} pending requests</span>
            <Link href="/hr/leaves" className="flex items-center gap-1 text-[var(--accent)] font-semibold hover:underline">
              Enter
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 flex flex-col justify-between card-hover">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500">
              <Landmark size={20} />
            </div>
            <h3 className="font-bold text-[var(--foreground)] text-lg">Payroll Salaries</h3>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              Track company payroll values, salary schedules, and bank account numbers.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[var(--border)] flex justify-between items-center text-xs">
            <span className="text-[var(--muted-foreground)]">Active payroll</span>
            <Link href="/hr/payroll" className="flex items-center gap-1 text-[var(--accent)] font-semibold hover:underline">
              Enter
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
