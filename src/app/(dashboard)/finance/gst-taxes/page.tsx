'use client'

import * as React from 'react'
import { getPayments } from '@/actions/payments'
import { getExpenses } from '@/actions/expenses'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ShieldAlert, RefreshCw, FileText, ArrowUpCircle, ArrowDownCircle, Info } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'

export default function GstTaxesPage() {
  const supabase = createClient()
  const [payments, setPayments] = React.useState<any[]>([])
  const [expenses, setExpenses] = React.useState<any[]>([])
  const [invoices, setInvoices] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchGstData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [payData, expData, invRes] = await Promise.all([
        getPayments(),
        getExpenses(),
        supabase.from('invoices').select('*, client:clients(*)')
      ])
      setPayments(payData || [])
      setExpenses(expData || [])
      setInvoices(invRes.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  React.useEffect(() => {
    fetchGstData()
  }, [fetchGstData])

  // Calculations
  const gstFromPayments = payments.reduce((sum, p) => sum + Number(p.gst_amount || 0), 0)
  const gstFromInvoices = invoices.reduce((sum, inv) => sum + Number(inv.tax_amount || 0), 0)
  const gstCollected = gstFromPayments + gstFromInvoices
  const gstPaid = expenses.reduce((sum, e) => sum + Number(e.gst_amount || 0), 0)
  const netGstPayable = gstCollected - gstPaid

  // Filter only transactions having GST details
  const gstInflows = React.useMemo(() => {
    const list: any[] = []
    payments.filter(p => Number(p.gst_amount || 0) > 0).forEach(p => {
      list.push({
        id: p.id,
        date: p.payment_date || p.created_at,
        clientName: p.client?.company_name || 'Direct Revenue',
        invoiceNumber: p.invoice_number || 'N/A',
        taxableValue: Number(p.amount || 0),
        gstAmount: Number(p.gst_amount || 0),
        totalAmount: Number(p.total_amount_received || p.amount || 0)
      })
    })

    invoices.filter(inv => Number(inv.tax_amount || 0) > 0).forEach(inv => {
      list.push({
        id: inv.id,
        date: inv.issue_date || inv.created_at,
        clientName: inv.client?.company_name || 'Direct Client',
        invoiceNumber: inv.invoice_number || 'N/A',
        taxableValue: Number(inv.subtotal || 0),
        gstAmount: Number(inv.tax_amount || 0),
        totalAmount: Number(inv.total || 0)
      })
    })
    return list
  }, [payments, invoices])

  const gstOutflows = React.useMemo(() => {
    return expenses.filter(e => Number(e.gst_amount || 0) > 0)
  }, [expenses])


  if (loading) return <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading GST ledgers...</div>

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">GST & Tax Management</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Reconciliation sheet of Input Tax Credit (ITC), GST Collected, and CA filing status</p>
        </div>
        <button
          onClick={fetchGstData}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border)] rounded-lg text-xs font-semibold hover:bg-[var(--secondary)] text-[var(--foreground)]"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Summary Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 card-hover">
          <span className="text-xs text-[var(--muted-foreground)] block">GST Collected (Inflows)</span>
          <span className="text-2xl font-bold text-emerald-500 block mt-1">{formatCurrency(gstCollected)}</span>
          <span className="text-[10px] text-[var(--muted-foreground)] block mt-0.5">Total GST output tax liability</span>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 card-hover">
          <span className="text-xs text-[var(--muted-foreground)] block">GST Paid (Outflows)</span>
          <span className="text-2xl font-bold text-rose-500 block mt-1">{formatCurrency(gstPaid)}</span>
          <span className="text-[10px] text-[var(--muted-foreground)] block mt-0.5">Input Tax Credit (ITC) claimable</span>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 card-hover">
          <span className="text-xs text-[var(--muted-foreground)] block">Net GST Payable</span>
          <span className={`text-2xl font-bold block mt-1 ${netGstPayable >= 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
            {formatCurrency(Math.abs(netGstPayable))}
          </span>
          <span className="text-[10px] text-[var(--muted-foreground)] block mt-0.5">
            {netGstPayable >= 0 ? 'Payable to government' : 'Excess ITC / Credit forward'}
          </span>
        </div>
      </div>

      {/* RCM / GST Information banner */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-xs text-[var(--foreground)]">
        <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Input Tax Credit (ITC) Reconciliation Note:</span>
          <p className="text-[var(--muted-foreground)] mt-1">
            Always upload GSTIN invoices from SaaS tools (Vercel, Supabase, domains) to claim Input Tax Credit on software and office expenses. Share monthly summaries with CA before the 10th of every month.
          </p>
        </div>
      </div>

      {/* Inflow GST list */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
        <h3 className="font-bold text-sm text-emerald-500 flex items-center gap-1.5"><ArrowUpCircle size={16} /> GST Collected Ledger</h3>
        {gstInflows.length === 0 ? (
          <div className="text-center py-6 text-xs text-[var(--muted-foreground)]">No collected GST records logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50 text-[var(--muted-foreground)] uppercase">
                  <th className="p-3">Date</th>
                  <th className="p-3">Client Name</th>
                  <th className="p-3">Invoice Number</th>
                  <th className="p-3">Taxable Value</th>
                  <th className="p-3">GST Collected</th>
                  <th className="p-3">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {gstInflows.map(p => (
                  <tr key={p.id} className="hover:bg-[var(--secondary)]/30 transition-colors">
                    <td className="p-3">{formatDate(p.date)}</td>
                    <td className="p-3 font-semibold">{p.clientName}</td>
                    <td className="p-3">{p.invoiceNumber}</td>
                    <td className="p-3">{formatCurrency(p.taxableValue)}</td>
                    <td className="p-3 text-emerald-500 font-bold">{formatCurrency(p.gstAmount)}</td>
                    <td className="p-3">{formatCurrency(p.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Outflow GST list */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
        <h3 className="font-bold text-sm text-rose-500 flex items-center gap-1.5"><ArrowDownCircle size={16} /> GST Paid (ITC claims) Ledger</h3>
        {gstOutflows.length === 0 ? (
          <div className="text-center py-6 text-xs text-[var(--muted-foreground)]">No paid GST records logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50 text-[var(--muted-foreground)] uppercase">
                  <th className="p-3">Date</th>
                  <th className="p-3">Expense Name</th>
                  <th className="p-3">Paid To</th>
                  <th className="p-3">Base Cost</th>
                  <th className="p-3">GST Paid (ITC)</th>
                  <th className="p-3">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {gstOutflows.map(e => (
                  <tr key={e.id} className="hover:bg-[var(--secondary)]/30 transition-colors">
                    <td className="p-3">{formatDate(e.date || e.created_at)}</td>
                    <td className="p-3 font-semibold">{e.title}</td>
                    <td className="p-3">{e.paid_to || 'Direct'}</td>
                    <td className="p-3">{formatCurrency(e.amount)}</td>
                    <td className="p-3 text-rose-500 font-bold">{formatCurrency(e.gst_amount)}</td>
                    <td className="p-3">{formatCurrency(e.total_amount || e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
