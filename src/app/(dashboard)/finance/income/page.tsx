'use client'

import * as React from 'react'
import { getPayments, deletePaymentRecord } from '@/actions/payments'
import { saveIncomeTransaction, getBankAccounts } from '@/actions/finance-actions'
import { getClients } from '@/actions/clients'
import { getProjects } from '@/actions/projects'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Search, Trash2, ArrowUpCircle, ExternalLink, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

const INCOME_CATEGORIES = [
  'Client Project Payment',
  'AMC Revenue',
  'Digital Marketing Revenue',
  'Website Development Revenue',
  'AI Development Revenue',
  'Automation Revenue',
  'Internship Revenue',
  'Training Revenue',
  'SaaS Revenue',
  'Subscription Revenue',
  'Consultation Revenue',
  'Affiliate Revenue',
  'Miscellaneous Income'
]

export default function IncomePage() {
  const [payments, setPayments] = React.useState<any[]>([])
  const [clients, setClients] = React.useState<any[]>([])
  const [projects, setProjects] = React.useState<any[]>([])
  const [bankAccounts, setBankAccounts] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [showAddModal, setShowAddModal] = React.useState(false)

  // Form states
  const [date, setDate] = React.useState('')
  const [amount, setAmount] = React.useState('')
  const [gstAmount, setGstAmount] = React.useState('0')
  const [clientId, setClientId] = React.useState('')
  const [projectId, setProjectId] = React.useState('')
  const [category, setCategory] = React.useState('Client Project Payment')
  const [paymentMethod, setPaymentMethod] = React.useState('bank_transfer')
  const [invoiceNumber, setInvoiceNumber] = React.useState('')
  const [receivedInAccount, setReceivedInAccount] = React.useState('')
  const [refNumber, setRefNumber] = React.useState('')
  const [notes, setNotes] = React.useState('')

  const fetchIncomeData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [payData, clientsData, projectsData, bankData] = await Promise.all([
        getPayments(),
        getClients(),
        getProjects(),
        getBankAccounts()
      ])
      setPayments(payData || [])
      setClients(clientsData || [])
      setProjects(projectsData || [])
      setBankAccounts(bankData || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchIncomeData()
  }, [fetchIncomeData])

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Amount must be positive')
      return
    }

    const amt = parseFloat(amount)
    const gst = parseFloat(gstAmount || '0')
    const totalReceived = amt + gst

    try {
      await saveIncomeTransaction({
        payment_date: date || new Date().toISOString().split('T')[0],
        amount: amt,
        gst_amount: gst,
        total_amount_received: totalReceived,
        client_id: clientId || null,
        project_id: projectId || null,
        category,
        payment_method: paymentMethod,
        invoice_number: invoiceNumber || null,
        received_in_account: receivedInAccount || null,
        reference_number: refNumber || null,
        notes: notes || null
      })

      toast.success('Income transaction logged successfully')
      setShowAddModal(false)
      // reset
      setDate('')
      setAmount('')
      setGstAmount('0')
      setClientId('')
      setProjectId('')
      setCategory('Client Project Payment')
      setPaymentMethod('bank_transfer')
      setInvoiceNumber('')
      setReceivedInAccount('')
      setRefNumber('')
      setNotes('')
      fetchIncomeData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to log income')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this income record?')) return
    try {
      await deletePaymentRecord(id)
      toast.success('Income record deleted')
      fetchIncomeData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete record')
    }
  }

  const filteredPayments = payments.filter(p => {
    const text = search.toLowerCase()
    return (
      (p.client?.company_name?.toLowerCase().includes(text) ?? false) ||
      (p.project?.name?.toLowerCase().includes(text) ?? false) ||
      (p.category?.toLowerCase().includes(text) ?? false) ||
      (p.invoice_number?.toLowerCase().includes(text) ?? false) ||
      (p.reference_number?.toLowerCase().includes(text) ?? false)
    )
  })

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Income Management</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Track all company incoming revenue transactions, AMC fees, and SaaS settlement payments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
        >
          <Plus size={16} />
          Log Income
        </button>
      </div>

      {/* Filter and stats overview */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            placeholder="Search by client, project, status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
          />
        </div>
        <div className="text-xs text-[var(--muted-foreground)]">
          Total Inflow Found: <span className="font-bold text-emerald-500">{formatCurrency(filteredPayments.reduce((sum, p) => sum + (p.total_amount_received || p.amount || 0), 0))}</span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading payments...</div>
      ) : filteredPayments.length === 0 ? (
        <div className="py-20 bg-[var(--card)] rounded-xl border border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
          No income transactions found matching your search.
        </div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50 text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Client / Project</th>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold">Invoice / Ref No</th>
                  <th className="p-4 font-semibold">Base Amt</th>
                  <th className="p-4 font-semibold">GST Amt</th>
                  <th className="p-4 font-semibold">Total Received</th>
                  <th className="p-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--foreground)]">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--secondary)]/30 transition-colors">
                    <td className="p-4">{formatDate(p.payment_date || p.created_at)}</td>
                    <td className="p-4">
                      <div className="font-semibold text-[var(--foreground)]">{p.client?.company_name || p.client_id || 'Direct Sale'}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{p.project?.name || 'No Project'}</div>
                    </td>
                    <td className="p-4 capitalize">{p.category || 'Client Project Payment'}</td>
                    <td className="p-4">
                      <div className="text-xs">{p.invoice_number ? `Inv: ${p.invoice_number}` : 'No Invoice'}</div>
                      {p.reference_number && <div className="text-xs text-[var(--muted-foreground)]">Ref: {p.reference_number}</div>}
                    </td>
                    <td className="p-4">{formatCurrency(p.amount)}</td>
                    <td className="p-4 text-[var(--muted-foreground)]">{formatCurrency(p.gst_amount || 0)}</td>
                    <td className="p-4 font-bold text-emerald-500">{formatCurrency(p.total_amount_received || p.amount)}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-xs text-rose-500 hover:text-rose-700 transition-colors"
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-[var(--border)] flex justify-between items-center">
              <h2 className="font-bold text-[var(--foreground)]">Log Income Transaction</h2>
              <button onClick={() => setShowAddModal(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">✕</button>
            </div>
            <form onSubmit={handleAddIncome} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
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
                    {INCOME_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Base Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="80000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">GST Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="14400"
                    value={gstAmount}
                    onChange={(e) => setGstAmount(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Total Received</label>
                  <div className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--muted-foreground)] select-none">
                    ₹{(parseFloat(amount || '0') + parseFloat(gstAmount || '0')).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Client</label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="">Direct / Walk-in</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.company_name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Project</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="">No Project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Received In Account</label>
                  <select
                    value={receivedInAccount}
                    onChange={(e) => setReceivedInAccount(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="">Select Account</option>
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>{b.bank_name} ({b.account_holder_name})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Invoice Number</label>
                  <input
                    placeholder="INV-2026-001"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI ID</option>
                    <option value="online">Razorpay / Online</option>
                    <option value="cash">Cash Payment</option>
                    <option value="cheque">Bank Cheque</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Transaction / Ref ID</label>
                  <input
                    placeholder="TXN987654321"
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--muted-foreground)]">Remarks / Notes</label>
                <textarea
                  placeholder="Extra transaction remarks..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none h-20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-semibold hover:bg-[var(--secondary)] text-[var(--foreground)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-semibold hover:opacity-90"
                >
                  Log Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
