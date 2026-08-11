'use client'

import * as React from 'react'
import { getPayments, createPaymentRecord, deletePaymentRecord } from '@/actions/payments'
import { getClients } from '@/actions/clients'
import { getInvoices } from '@/actions/invoices'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Search, IndianRupee, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Client, Invoice, Payment } from '@/types'

export default function PaymentsPage() {
  const [payments, setPayments] = React.useState<Payment[]>([])
  const [clients, setClients] = React.useState<Client[]>([])
  const [invoices, setInvoices] = React.useState<Invoice[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [showAddModal, setShowAddModal] = React.useState(false)

  // Form states
  const [invoiceId, setInvoiceId] = React.useState('')
  const [clientId, setClientId] = React.useState('')
  const [amount, setAmount] = React.useState('')
  const [paymentMethod, setPaymentMethod] = React.useState('bank_transfer')
  const [paymentDate, setPaymentDate] = React.useState('')
  const [refNumber, setRefNumber] = React.useState('')
  const [notes, setNotes] = React.useState('')

  const fetchPaymentsData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [paymentsData, clientsData, invoicesData] = await Promise.all([
        getPayments(),
        getClients(),
        getInvoices(),
      ])
      setPayments(paymentsData)
      setClients(clientsData)
      setInvoices(invoicesData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchPaymentsData()
  }, [fetchPaymentsData])

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return
    try {
      // Find client id from invoice if linked
      let targetClientId = clientId
      if (invoiceId) {
        const linkedInv = invoices.find(i => i.id === invoiceId)
        if (linkedInv?.client_id) {
          targetClientId = linkedInv.client_id
        }
      }

      await createPaymentRecord({
        invoice_id: invoiceId || null,
        client_id: targetClientId || null,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        payment_date: paymentDate || null,
        reference_number: refNumber || null,
        notes: notes || null,
        status: 'paid',
      })
      toast.success('Payment transaction logged')
      setShowAddModal(false)
      // reset
      setInvoiceId('')
      setClientId('')
      setAmount('')
      setPaymentMethod('bank_transfer')
      setPaymentDate('')
      setRefNumber('')
      setNotes('')
      fetchPaymentsData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to log payment')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this payment transaction record?')) return
    try {
      await deletePaymentRecord(id)
      toast.success('Record removed')
      fetchPaymentsData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const filteredPayments = payments.filter(pay =>
    (pay.reference_number?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    (pay.client?.company_name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    (pay.invoice?.invoice_number?.toLowerCase().includes(search.toLowerCase()) ?? false)
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Payments Ledger</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Track UPI, bank transfers, cheque deposits, and credit collections</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
        >
          <Plus size={16} />
          Log Payment
        </button>
      </div>

      {/* Search Filter */}
      <div className="flex gap-4 bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            placeholder="Search by transaction Ref # or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading transactions...</div>
      ) : filteredPayments.length === 0 ? (
        <div className="py-20 bg-[var(--card)] rounded-xl border border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
          No payment transactions found.
        </div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50">
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Reference / Trans #</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Date</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Client</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Linked Invoice #</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Amount</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Method</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-[var(--secondary)]/30 transition-colors">
                    <td className="p-4 font-mono font-semibold text-[var(--foreground)]">{pay.reference_number || 'N/A'}</td>
                    <td className="p-4 text-[var(--foreground)]">{pay.payment_date ? formatDate(pay.payment_date) : formatDate(pay.created_at)}</td>
                    <td className="p-4 font-medium text-[var(--foreground)]">{pay.client?.company_name || '-'}</td>
                    <td className="p-4 font-mono text-[var(--accent)]">{pay.invoice?.invoice_number || '-'}</td>
                    <td className="p-4 font-bold text-emerald-500">{formatCurrency(pay.amount)}</td>
                    <td className="p-4 text-[var(--foreground)] capitalize">{pay.payment_method?.replace('_', ' ')}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(pay.id)}
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

      {/* Log Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--foreground)]">Log Credit Transaction</h3>
            </div>
            <form onSubmit={handleAddPayment} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Linked Invoice (Optional)</label>
                  <select
                    value={invoiceId}
                    onChange={(e) => {
                      setInvoiceId(e.target.value)
                      if (e.target.value) setClientId('')
                    }}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="">No Invoice link</option>
                    {invoices.filter(i => i.status !== 'paid').map(inv => (
                      <option key={inv.id} value={inv.id}>{inv.invoice_number} ({inv.client?.company_name})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Client (If no invoice)</label>
                  <select
                    value={clientId}
                    onChange={(e) => {
                      setClientId(e.target.value)
                      if (e.target.value) setInvoiceId('')
                    }}
                    disabled={!!invoiceId}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none disabled:opacity-50"
                  >
                    <option value="">Select Client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.company_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Amount Received (INR) *</label>
                  <input
                    required
                    type="number"
                    placeholder="Log value"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="upi">UPI (GPay/PhonePe)</option>
                    <option value="online">Online Card/Payment Gateway</option>
                    <option value="cheque">Cheque Deposit</option>
                    <option value="cash">Cash Collection</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Transaction Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Ref / Trans #</label>
                  <input
                    placeholder="e.g. UTR or Check Number"
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Notes</label>
                <textarea
                  placeholder="Additional receipt notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
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
