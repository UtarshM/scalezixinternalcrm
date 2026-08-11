'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { getEmployees, updateEmployeeRecord } from '@/actions/hr'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Edit2, Printer, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import type { Employee } from '@/types'

export default function PayrollPage() {
  const router = useRouter()
  const [employees, setEmployees] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  // Edit modal state
  const [editingEmployee, setEditingEmployee] = React.useState<any | null>(null)
  const [salary, setSalary] = React.useState('')
  const [bankName, setBankName] = React.useState('')
  const [accountNo, setAccountNo] = React.useState('')
  const [ifscCode, setIfscCode] = React.useState('')
  const [driveLink, setDriveLink] = React.useState('')

  // Print slip state
  const [printingEmployee, setPrintingEmployee] = React.useState<any | null>(null)

  const fetchEmployees = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getEmployees()
      setEmployees(data)
    } catch (e) {
      console.error(e)
      toast.error('Failed to load employee list')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const handleEditClick = (emp: any) => {
    setEditingEmployee(emp)
    setSalary(emp.salary ? String(emp.salary) : '')
    const bank = emp.bank_details || {}
    setBankName(bank.bank_name || '')
    setAccountNo(bank.account_no || '')
    setIfscCode(bank.ifsc || '')
    setDriveLink(bank.drive_link || '')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEmployee) return
    try {
      const bankDetailsObj = {
        bank_name: bankName,
        account_no: accountNo,
        ifsc: ifscCode,
        drive_link: driveLink
      }
      
      await updateEmployeeRecord(editingEmployee.id, {
        salary: salary ? parseFloat(salary) : null,
        bank_details: bankDetailsObj
      })

      toast.success('Payroll details updated successfully')
      setEditingEmployee(null)
      fetchEmployees()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update details')
    }
  }

  if (loading) return <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading payroll records...</div>

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="space-y-1">
          <button
            onClick={() => router.push('/hr')}
            className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors w-fit"
          >
            <ArrowLeft size={16} />
            Back to HR
          </button>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Payroll & Salaries</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Manage internal team salaries, payouts, and Payslip Drive links</p>
        </div>
      </div>

      {/* Employee Payroll List */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50 text-[var(--muted-foreground)] font-semibold font-mono uppercase tracking-wider text-xs">
                <th className="p-4">Staff Member</th>
                <th className="p-4">Designation</th>
                <th className="p-4 text-right">Monthly Salary</th>
                <th className="p-4">Bank Account Details</th>
                <th className="p-4 text-center">Payslip Link</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--foreground)]">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[var(--muted-foreground)]">
                    No employees registered in the directory.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const name = emp.user?.full_name || 'Unnamed Employee'
                  const bank = emp.bank_details || {}
                  return (
                    <tr key={emp.id} className="hover:bg-[var(--secondary)]/20 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-[var(--foreground)]">{name}</div>
                        <div className="text-xs text-[var(--muted-foreground)] font-mono">{emp.employee_id || 'No ID'}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-[var(--foreground)]">{emp.designation || 'General Staff'}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">{emp.department || '-'}</div>
                      </td>
                      <td className="p-4 text-right font-semibold">
                        {emp.salary ? formatCurrency(emp.salary) : 'Not set'}
                      </td>
                      <td className="p-4 text-xs max-w-[200px] truncate">
                        {bank.bank_name ? (
                          <div className="space-y-0.5">
                            <p className="font-medium text-[var(--foreground)]">{bank.bank_name}</p>
                            <p className="text-[var(--muted-foreground)] font-mono">A/C: {bank.account_no}</p>
                            <p className="text-[var(--muted-foreground)] font-mono">IFSC: {bank.ifsc}</p>
                          </div>
                        ) : (
                          <span className="text-[var(--muted-foreground)] italic">Not provided</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {bank.drive_link ? (
                          <a
                            href={bank.drive_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[var(--accent)] font-semibold hover:underline"
                          >
                            Open Payslips
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="text-[var(--muted-foreground)] text-xs italic">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleEditClick(emp)}
                            className="p-1.5 rounded hover:bg-[var(--secondary)] border border-transparent hover:border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all"
                            title="Edit details"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setPrintingEmployee(emp)}
                            className="p-1.5 rounded hover:bg-[var(--secondary)] border border-transparent hover:border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all"
                            title="Print Slip"
                          >
                            <Printer size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Payroll Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setEditingEmployee(null)} />
          <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--foreground)]">Edit Payroll: {editingEmployee.user?.full_name}</h3>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Monthly Salary (INR)</label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>

              <div className="border-t border-[var(--border)] pt-4 space-y-3">
                <h4 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">Bank Transfer Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[var(--muted-foreground)] mb-1.5 block">Bank Name</label>
                    <input
                      placeholder="e.g. HDFC Bank"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--muted-foreground)] mb-1.5 block">IFSC Code</label>
                    <input
                      placeholder="e.g. HDFC0001234"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[var(--muted-foreground)] mb-1.5 block">Account Number</label>
                  <input
                    placeholder="e.g. 50100293847"
                    value={accountNo}
                    onChange={(e) => setAccountNo(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-[var(--border)] pt-4">
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Google Drive Payslip Folder</label>
                <input
                  placeholder="Paste Google Drive folder link..."
                  value={driveLink}
                  onChange={(e) => setDriveLink(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm hover:bg-[var(--secondary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Slip Preview Modal */}
      {printingEmployee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setPrintingEmployee(null)} />
          <div className="relative w-full max-w-lg bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in print:bg-white print:border-0 print:shadow-none">
            <div className="p-6 border-b border-[var(--border)] flex justify-between items-center print:hidden">
              <h3 className="text-lg font-bold text-[var(--foreground)]">Payslip Preview</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-[var(--accent)] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90"
                >
                  <Printer size={12} />
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setPrintingEmployee(null)}
                  className="px-3 py-1.5 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-xs hover:bg-[var(--secondary)]"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Payslip Sheet body */}
            <div className="p-8 space-y-6 text-sm text-[var(--foreground)] print:p-0">
              <div className="flex justify-between items-start border-b border-[var(--border)] pb-4">
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-wider text-[var(--foreground)]">Salary Payslip</h2>
                  <p className="text-xs text-[var(--muted-foreground)]">Month: {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="text-right">
                  <h3 className="font-bold text-[var(--foreground)]">Scalezix Venture LLP</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">Bangalore, India</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-[var(--border)] pb-4 text-xs">
                <div className="space-y-1">
                  <p><span className="text-[var(--muted-foreground)]">Employee Name:</span> <strong>{printingEmployee.user?.full_name}</strong></p>
                  <p><span className="text-[var(--muted-foreground)]">Employee ID:</span> <strong className="font-mono">{printingEmployee.employee_id || '-'}</strong></p>
                  <p><span className="text-[var(--muted-foreground)]">Designation:</span> <strong>{printingEmployee.designation || 'Staff'}</strong></p>
                </div>
                <div className="space-y-1 text-right">
                  <p><span className="text-[var(--muted-foreground)]">Bank Name:</span> <strong>{printingEmployee.bank_details?.bank_name || '-'}</strong></p>
                  <p><span className="text-[var(--muted-foreground)]">Account No:</span> <strong className="font-mono">{printingEmployee.bank_details?.account_no || '-'}</strong></p>
                  <p><span className="text-[var(--muted-foreground)]">IFSC Code:</span> <strong className="font-mono">{printingEmployee.bank_details?.ifsc || '-'}</strong></p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-semibold border-b border-[var(--border)] pb-1 text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
                  <span>Earnings & Allowances</span>
                  <span>Amount</span>
                </div>
                <div className="flex justify-between">
                  <span>Basic / Net Payout</span>
                  <span className="font-semibold">{printingEmployee.salary ? formatCurrency(printingEmployee.salary) : 'INR 0.00'}</span>
                </div>
              </div>

              <div className="border-t border-[var(--border)] pt-4 flex justify-between items-center">
                <span className="font-bold text-[var(--foreground)] uppercase">Total Net Payout:</span>
                <span className="text-lg font-bold text-[var(--accent)]">{printingEmployee.salary ? formatCurrency(printingEmployee.salary) : 'INR 0.00'}</span>
              </div>

              <div className="pt-8 text-center text-xs text-[var(--muted-foreground)] italic border-t border-[var(--border)]/40">
                This payslip is a system-generated record and does not require a physical signature.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
