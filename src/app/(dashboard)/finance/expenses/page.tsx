'use client'

import * as React from 'react'
import { getExpenses, createExpenseRecord, deleteExpenseRecord, getVendors, updateExpenseRecord } from '@/actions/expenses'
import { saveExpenseTransaction } from '@/actions/finance-actions'
import { getProjects } from '@/actions/projects'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Search, Trash2, ArrowDownCircle, ExternalLink, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import type { Expense, Project, Vendor } from '@/types'

const EXPENSE_CATEGORIES = [
  // Software
  { value: 'software', label: 'Software (Vercel, OpenAI, ChatGPT, Cursor, GitHub, Canva, Notion, etc.)' },
  // Hosting
  { value: 'hosting', label: 'Hosting (AWS, Azure, GCP, Hostinger, Cloudflare, Namecheap)' },
  // Marketing
  { value: 'marketing', label: 'Marketing (Meta Ads, Google Ads, LinkedIn, Printing)' },
  // Office
  { value: 'office', label: 'Office (Internet, Rent, Electricity, Equipment)' },
  // Team
  { value: 'salary', label: 'Team Salary (Salary, Stipend, Freelancer Payments)' },
  // Travel
  { value: 'travel', label: 'Travel & Food (Fuel, Cab, Food, Hotel, Events)' },
  // Miscellaneous
  { value: 'miscellaneous', label: 'Miscellaneous (Legal, GST Filing, CA Fees, Bank Charges)' }
]

export default function ExpensesPage() {
  const [expenses, setExpenses] = React.useState<Expense[]>([])
  const [projects, setProjects] = React.useState<Project[]>([])
  const [vendors, setVendors] = React.useState<Vendor[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [showAddModal, setShowAddModal] = React.useState(false)

  // Form states
  const [title, setTitle] = React.useState('')
  const [category, setCategory] = React.useState('software')
  const [amount, setAmount] = React.useState('')
  const [gstRate, setGstRate] = React.useState('18') // default 18% GST
  const [gstAmount, setGstAmount] = React.useState('0')
  const [date, setDate] = React.useState('')
  const [projectId, setProjectId] = React.useState('')
  const [vendorId, setVendorId] = React.useState('')
  const [receiptUrl, setReceiptUrl] = React.useState('')
  const [status, setStatus] = React.useState('pending')
  const [notes, setNotes] = React.useState('')
  const [paidTo, setPaidTo] = React.useState('')
  const [paidBy, setPaidBy] = React.useState('')
  const [paymentMethod, setPaymentMethod] = React.useState('bank_transfer')

  const handleAmountChange = (newBaseAmt: string, newRate: string = gstRate) => {
    setAmount(newBaseAmt)
    const base = parseFloat(newBaseAmt || '0')
    if (newRate !== 'custom' && !isNaN(base)) {
      const rateNum = parseFloat(newRate)
      const calculatedGst = (base * rateNum) / 100
      setGstAmount(calculatedGst ? calculatedGst.toFixed(2) : '0')
    }
  }

  const handleGstRateChange = (newRate: string) => {
    setGstRate(newRate)
    const base = parseFloat(amount || '0')
    if (newRate !== 'custom' && !isNaN(base)) {
      const rateNum = parseFloat(newRate)
      const calculatedGst = (base * rateNum) / 100
      setGstAmount(calculatedGst ? calculatedGst.toFixed(2) : '0')
    }
  }


  const fetchExpensesData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [expData, projData, vendData] = await Promise.all([
        getExpenses(),
        getProjects(),
        getVendors(),
      ])
      setExpenses(expData)
      setProjects(projData)
      setVendors(vendData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchExpensesData()
  }, [fetchExpensesData])

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !amount || parseFloat(amount) <= 0) return

    const baseAmt = parseFloat(amount)
    const gstAmt = parseFloat(gstAmount || '0')
    const totalAmt = baseAmt + gstAmt

    try {
      await saveExpenseTransaction({
        title,
        category,
        amount: baseAmt,
        gst_amount: gstAmt,
        total_amount: totalAmt,
        date: date || new Date().toISOString().split('T')[0],
        project_id: projectId || null,
        vendor_id: vendorId || null,
        receipt_url: receiptUrl || null,
        status: status || 'pending',
        notes: notes || null,
        paid_to: paidTo || null,
        paid_by: paidBy || null,
        payment_method: paymentMethod
      })
      toast.success('Expense debit logged successfully')
      setShowAddModal(false)
      // reset
      setTitle('')
      setCategory('software')
      setAmount('')
      setGstAmount('0')
      setDate('')
      setProjectId('')
      setVendorId('')
      setReceiptUrl('')
      setStatus('pending')
      setNotes('')
      setPaidTo('')
      setPaidBy('')
      setPaymentMethod('bank_transfer')
      fetchExpensesData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to log expense')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense record?')) return
    try {
      await deleteExpenseRecord(id)
      toast.success('Expense record deleted')
      fetchExpensesData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const filteredExpenses = expenses.filter(exp =>
    exp.title.toLowerCase().includes(search.toLowerCase()) ||
    (exp.category?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    (exp.paid_to?.toLowerCase().includes(search.toLowerCase()) ?? false)
  )

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Expense Management</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Track company expenditures, software licenses, AWS hosting, and contractor payouts</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
        >
          <Plus size={16} />
          Log Expense
        </button>
      </div>

      {/* Search Filter */}
      <div className="flex gap-4 items-center justify-between bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            placeholder="Search by title, category, recipient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
          />
        </div>
        <div className="text-xs text-[var(--muted-foreground)]">
          Total Expenditures: <span className="font-bold text-rose-500">{formatCurrency(filteredExpenses.reduce((sum, e) => sum + (e.total_amount || e.amount || 0), 0))}</span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading expenses...</div>
      ) : filteredExpenses.length === 0 ? (
        <div className="py-20 bg-[var(--card)] rounded-xl border border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
          No expenses logged.
        </div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50 text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
                  <th className="p-4 font-semibold">Description</th>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Paid To / By</th>
                  <th className="p-4 font-semibold">Receipt</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Base Amt</th>
                  <th className="p-4 font-semibold">Total Cost</th>
                  <th className="p-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--foreground)]">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[var(--secondary)]/30 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-[var(--foreground)]">{exp.title}</div>
                      {exp.project?.name && <div className="text-xs text-[var(--accent)] font-medium">Project: {exp.project.name}</div>}
                    </td>
                    <td className="p-4 capitalize">{exp.category || '-'}</td>
                    <td className="p-4">{formatDate(exp.date)}</td>
                    <td className="p-4">
                      <div className="text-xs font-semibold">{exp.paid_to || 'Direct'}</div>
                      <div className="text-[10px] text-[var(--muted-foreground)]">By: {exp.paid_by || 'Scalezix'}</div>
                    </td>
                    <td className="p-4">
                      {exp.receipt_url ? (
                        <a
                          href={exp.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[var(--accent)] font-semibold hover:underline"
                        >
                          <ExternalLink size={12} />
                          Receipt
                        </a>
                      ) : (
                        <span className="text-[var(--muted-foreground)] text-xs italic">None</span>
                      )}
                    </td>
                    <td className="p-4">
                      <select
                        value={exp.status || 'pending'}
                        onChange={async (e) => {
                          try {
                            await updateExpenseRecord(exp.id, { status: e.target.value })
                            toast.success(`Expense status updated to ${e.target.value}`)
                            fetchExpensesData()
                          } catch (err: any) {
                            toast.error('Failed to update status')
                          }
                        }}
                        className={`px-2 py-1 text-xs font-semibold rounded border focus:outline-none bg-[var(--card)] ${
                          exp.status === 'approved' ? 'text-emerald-500 border-emerald-500/20' :
                          exp.status === 'rejected' ? 'text-red-500 border-red-500/20' :
                          'text-amber-500 border-amber-500/20'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="p-4">{formatCurrency(exp.amount)}</td>
                    <td className="p-4 font-bold text-rose-500">{formatCurrency(exp.total_amount || exp.amount)}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(exp.id)}
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

      {/* Log Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-lg bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="font-bold text-[var(--foreground)]">Log Expense Debit</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">✕</button>
            </div>
            <form onSubmit={handleAddExpense} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Expense Title *</label>
                  <input
                    required
                    placeholder="e.g. Supabase DB usage"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1 col-span-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Base Cost (₹) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="25000"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1 col-span-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">GST Rate</label>
                  <select
                    value={gstRate}
                    onChange={(e) => handleGstRateChange(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="18">18% GST</option>
                    <option value="12">12% GST</option>
                    <option value="5">5% GST</option>
                    <option value="0">0% (Exempt)</option>
                    <option value="custom">Custom Amt</option>
                  </select>
                </div>

                <div className="space-y-1 col-span-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">GST Amt (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="4500"
                    value={gstAmount}
                    onChange={(e) => {
                      setGstAmount(e.target.value)
                      setGstRate('custom')
                    }}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1 col-span-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Total Cost</label>
                  <div className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] font-bold select-none">
                    ₹{(parseFloat(amount || '0') + parseFloat(gstAmount || '0')).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Paid To (Recipient)</label>
                  <input
                    placeholder="AWS / Freelancer Name"
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Paid By (Account)</label>
                  <input
                    placeholder="ICICI Credit Card / HDFC Current"
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Linked Project</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="">No Project link</option>
                    {projects.map(proj => (
                      <option key={proj.id} value={proj.id}>{proj.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Vendor Profile</label>
                  <select
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="">No Vendor link</option>
                    {vendors.map(vend => (
                      <option key={vend.id} value={vend.id}>{vend.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Receipt (Google Drive)</label>
                  <input
                    placeholder="Paste Drive link..."
                    value={receiptUrl}
                    onChange={(e) => setReceiptUrl(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Payment Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="pending">Pending Claim</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI ID</option>
                    <option value="online">Razorpay / Card</option>
                    <option value="cash">Cash Payment</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--muted-foreground)]">Remarks / Notes</label>
                <textarea
                  placeholder="Additional remarks..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none h-16"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-semibold hover:opacity-90"
                >
                  Log Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
