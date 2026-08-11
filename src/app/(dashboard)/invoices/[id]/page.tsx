'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getInvoiceById, sendInvoiceEmail, updateInvoiceRecord, deleteInvoiceRecord } from '@/actions/invoices'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { ArrowLeft, Mail, CheckCircle2, IndianRupee, Trash2, Printer, ExternalLink, FileText } from 'lucide-react'
import { toast } from 'sonner'
import type { Invoice } from '@/types'

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [invoice, setInvoice] = React.useState<Invoice | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [sendingEmail, setSendingEmail] = React.useState(false)

  const fetchInvoice = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getInvoiceById(id)
      setInvoice(data)
    } catch (e) {
      console.error(e)
      toast.error('Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }, [id])

  React.useEffect(() => {
    fetchInvoice()
  }, [fetchInvoice])

  const handleSendEmail = async () => {
    setSendingEmail(true)
    try {
      const result = await sendInvoiceEmail(id)
      toast.success(result.message)
      fetchInvoice()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSendingEmail(false)
    }
  }

  const handleMarkAsPaid = async () => {
    try {
      await supabase
        .from('invoices')
        .update({
          status: 'paid',
          amount_paid: invoice?.total || 0,
        })
        .eq('id', id)

      // Also create a payment record
      await supabase.from('payments').insert({
        invoice_id: id,
        client_id: invoice?.client_id,
        amount: invoice?.total || 0,
        payment_method: 'bank_transfer',
        status: 'paid',
        payment_date: new Date().toISOString().split('T')[0],
        notes: `Auto-generated from marking invoice ${invoice?.invoice_number} as paid`,
      })

      toast.success('Invoice marked as Paid!')
      fetchInvoice()
    } catch (err: any) {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this invoice?')) return
    try {
      await deleteInvoiceRecord(id)
      toast.success('Invoice deleted')
      router.push('/invoices')
    } catch (err: any) {
      toast.error('Failed to delete invoice')
    }
  }

  if (loading) return <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading invoice...</div>
  if (!invoice) return <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Invoice not found.</div>

  const taxableAmount = invoice.subtotal - invoice.discount_value

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      {/* Header back link */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center print:hidden">
        <button
          onClick={() => router.push('/invoices')}
          className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Back to Invoices
        </button>

        <div className="flex flex-wrap gap-2">
          {invoice.status !== 'paid' && (
            <button
              onClick={handleMarkAsPaid}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition-all"
            >
              <CheckCircle2 size={14} />
              Mark as Paid
            </button>
          )}
          <button
            onClick={handleSendEmail}
            disabled={sendingEmail}
            className="flex items-center gap-1.5 bg-[var(--secondary)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--foreground)] px-3.5 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
          >
            <Mail size={14} />
            {sendingEmail ? 'Sending...' : 'Email Invoice'}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-[var(--secondary)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--foreground)] px-3.5 py-2 rounded-lg text-xs font-semibold transition-all"
          >
            <Printer size={14} />
            Print
          </button>
          <button
            onClick={handleDelete}
            className="p-2 border border-red-500/20 text-red-500 rounded-lg hover:bg-red-500/5 transition-all"
            title="Delete invoice"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Google Drive Invoice PDF / Backup Document Link */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4 print:hidden">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
            <FileText size={16} className="text-[var(--accent)]" />
            Drive Invoice / Receipt Backup Link
          </h3>
          {invoice.drive_link && (
            <a
              href={invoice.drive_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[var(--accent)] font-semibold hover:underline"
            >
              Open Link
              <ExternalLink size={12} />
            </a>
          )}
        </div>
        
        <form onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const input = form.elements.namedItem('drive_link') as HTMLInputElement;
          try {
            await supabase
              .from('invoices')
              .update({ drive_link: input.value || null })
              .eq('id', id);
            toast.success('Drive link updated');
            fetchInvoice();
          } catch (err: any) {
            toast.error(err.message || 'Failed to update link');
          }
        }} className="flex gap-2">
          <input
            name="drive_link"
            placeholder="Paste Google Drive Invoice backup PDF link..."
            defaultValue={invoice.drive_link || ''}
            className="flex-1 px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <button
            type="submit"
            className="bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all shrink-0"
          >
            Save
          </button>
        </form>
      </div>

      {/* Invoice PDF Paper Style Sheet */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-8 shadow-md space-y-8 print:border-0 print:shadow-none">
        {/* Scalezix Company Logo Branding Header */}
        <div className="flex justify-between items-center border-b border-[var(--border)] pb-6">
          <div className="flex items-center">
            <img src="/scalezixco_logo.png" alt="Scalezix Logo" className="h-10 w-auto object-contain dark:brightness-110" />
          </div>
          <div className="text-right text-xs text-[var(--muted-foreground)] leading-relaxed">
            <p className="font-semibold text-[var(--foreground)]">Scalezix Venture LLP</p>
            <p>Email: contact@scalezix.com</p>
            <p>Web: www.scalezix.com</p>
          </div>
        </div>

        {/* Top Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-wider uppercase text-[var(--foreground)]">Tax Invoice</h2>
            <p className="font-mono text-sm font-semibold text-[var(--accent)]">{invoice.invoice_number}</p>
          </div>
          <span className={`px-3 py-1 rounded text-xs font-semibold border ${getStatusColor(invoice.status)}`}>
            {invoice.status.toUpperCase()}
          </span>
        </div>

        {/* Info grids */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[var(--muted-foreground)] uppercase block mb-1 font-semibold">Billed To:</span>
            <div className="space-y-1">
              <p className="font-bold text-sm text-[var(--foreground)]">{invoice.client?.company_name}</p>
              <p className="text-[var(--muted-foreground)]">GSTIN: {invoice.client?.gst_number || 'N/A'}</p>
              <p className="text-[var(--muted-foreground)]">PAN: {invoice.client?.pan_number || 'N/A'}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[var(--muted-foreground)] uppercase block mb-1 font-semibold">Invoice Details:</span>
            <div className="space-y-1 text-[var(--foreground)]">
              <p>Issue Date: <strong>{formatDate(invoice.issue_date)}</strong></p>
              {invoice.due_date && <p>Due Date: <strong>{formatDate(invoice.due_date)}</strong></p>}
              {invoice.project && <p>Project: <strong>{invoice.project.name}</strong></p>}
            </div>
          </div>
        </div>

        {/* Line items table */}
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[var(--secondary)] border-b border-[var(--border)] text-[var(--muted-foreground)] font-semibold uppercase">
                <th className="p-3">Item Description</th>
                <th className="p-3">HSN/SAC</th>
                <th className="p-3 text-center">Qty</th>
                <th className="p-3 text-right">Unit Rate</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--foreground)]">
              {invoice.items?.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--secondary)]/10">
                  <td className="p-3 font-medium">{item.description}</td>
                  <td className="p-3 font-mono">{item.hsn_code || '-'}</td>
                  <td className="p-3 text-center">{item.quantity}</td>
                  <td className="p-3 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="p-3 text-right font-semibold">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Billing totals alignment */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-[var(--muted-foreground)]">
              <span>Gross Subtotal</span>
              <span className="text-[var(--foreground)] font-medium">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount_value > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Discount</span>
                <span className="font-medium">- {formatCurrency(invoice.discount_value)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-[var(--border)] pt-2 text-[var(--muted-foreground)]">
              <span>Taxable Value</span>
              <span className="text-[var(--foreground)] font-medium">{formatCurrency(taxableAmount)}</span>
            </div>
            <div className="flex justify-between text-[var(--muted-foreground)]">
              <span>Tax Amount</span>
              <span className="text-[var(--foreground)] font-medium">{formatCurrency(invoice.tax_amount)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-2 text-sm font-bold">
              <span className="text-[var(--foreground)]">Total Value (INR)</span>
              <span className="text-[var(--accent)]">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer notes */}
        {(invoice.notes || invoice.terms) && (
          <div className="pt-6 border-t border-[var(--border)] text-[10px] text-[var(--muted-foreground)] space-y-2 leading-relaxed">
            {invoice.notes && <p><strong>Notes:</strong> {invoice.notes}</p>}
            {invoice.terms && <p><strong>Terms:</strong> {invoice.terms}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
