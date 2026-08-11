'use client'

import * as React from 'react'
import { getEmployees, createEmployeeRecord, deleteEmployeeRecord } from '@/actions/hr'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Search, Trash2, ArrowLeft, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Employee, User } from '@/types'

export default function EmployeesPage() {
  const supabase = createClient()

  const [employees, setEmployees] = React.useState<Employee[]>([])
  const [systemUsers, setSystemUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [showAddModal, setShowAddModal] = React.useState(false)

  // Form states
  const [userId, setUserId] = React.useState('')
  const [employeeId, setEmployeeId] = React.useState('')
  const [department, setDepartment] = React.useState('')
  const [designation, setDesignation] = React.useState('')
  const [joiningDate, setJoiningDate] = React.useState('')
  const [salary, setSalary] = React.useState('')

  const fetchEmployeesAndUsers = React.useCallback(async () => {
    setLoading(true)
    try {
      const [empData, { data: usersData }] = await Promise.all([
        getEmployees(),
        supabase.from('users').select('*'),
      ])
      setEmployees(empData)
      setSystemUsers(usersData || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  React.useEffect(() => {
    fetchEmployeesAndUsers()
  }, [fetchEmployeesAndUsers])

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !employeeId) return
    try {
      await createEmployeeRecord({
        user_id: userId,
        employee_id: employeeId,
        department: department || null,
        designation: designation || null,
        joining_date: joiningDate || null,
        salary: salary ? parseFloat(salary) : null,
        status: 'active',
      })
      toast.success('Employee profile registered')
      setShowAddModal(false)
      // reset
      setUserId('')
      setEmployeeId('')
      setDepartment('')
      setDesignation('')
      setJoiningDate('')
      setSalary('')
      fetchEmployeesAndUsers()
    } catch (err: any) {
      toast.error(err.message || 'Registration failed')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Unregister employee record?')) return
    try {
      await deleteEmployeeRecord(id)
      toast.success('Employee profile deleted')
      fetchEmployeesAndUsers()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const filteredEmployees = employees.filter(emp =>
    (emp.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    (emp.department?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    (emp.employee_id?.toLowerCase().includes(search.toLowerCase()) ?? false)
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link href="/hr" className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors w-fit">
            <ArrowLeft size={16} />
            Back to HR
          </Link>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Employee Directory</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
        >
          <UserPlus size={16} />
          Register Employee
        </button>
      </div>

      {/* Filter search */}
      <div className="flex gap-4 bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            placeholder="Search by name, ID or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading directory...</div>
      ) : filteredEmployees.length === 0 ? (
        <div className="py-20 bg-[var(--card)] rounded-xl border border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
          No employee records found.
        </div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50">
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Employee ID</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Name</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Department</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Designation</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Joining Date</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Salary (Monthly)</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-[var(--secondary)]/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-[var(--accent)]">{emp.employee_id || '-'}</td>
                    <td className="p-4 font-medium text-[var(--foreground)]">{emp.user?.full_name || '-'}</td>
                    <td className="p-4 text-[var(--foreground)]">{emp.department || '-'}</td>
                    <td className="p-4 text-[var(--foreground)]">{emp.designation || '-'}</td>
                    <td className="p-4 text-[var(--foreground)]">{emp.joining_date ? formatDate(emp.joining_date) : '-'}</td>
                    <td className="p-4 text-[var(--foreground)] font-semibold">{emp.salary ? formatCurrency(emp.salary) : 'Confidential'}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="p-1.5 rounded hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-500 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--foreground)]">Register Employee Directory</h3>
            </div>
            <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Select User Profile Link *</label>
                <select
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                >
                  <option value="">Select a user</option>
                  {systemUsers.filter(u => !employees.some(e => e.user_id === u.id)).map(user => (
                    <option key={user.id} value={user.id}>{user.full_name} ({user.email})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Employee ID *</label>
                  <input
                    required
                    placeholder="e.g. EMP-001"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Department</label>
                  <input
                    placeholder="e.g. Engineering, Sales"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Designation</label>
                  <input
                    placeholder="e.g. Frontend Developer"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Monthly Base Salary (INR)</label>
                  <input
                    type="number"
                    placeholder="Salary value"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Joining Date</label>
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-semibold"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
