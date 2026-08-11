'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getQuotationById, convertQuotationToInvoice, convertQuotationToProject, deleteQuotationRecord } from '@/actions/quotations'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { ArrowLeft, CheckCircle2, IndianRupee, Trash2, Printer, FileText, FolderKanban, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import type { Quotation } from '@/types'

export default function QuotationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [quote, setQuote] = React.useState<Quotation | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [converting, setConverting] = React.useState(false)

  // Project convert modal
  const [showProjectModal, setShowProjectModal] = React.useState(false)
  const [projectName, setProjectName] = React.useState('')

  const fetchQuote = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getQuotationById(id)
      setQuote(data)
      if (data?.client?.company_name) {
        setProjectName(`${data.client.company_name} Project`)
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to load proposal')
    } finally {
      setLoading(false)
    }
  }, [id])

  React.useEffect(() => {
    fetchQuote()
  }, [fetchQuote])

  const handleConvertToInvoice = async () => {
    setConverting(true)
    const toastId = toast.loading('Converting proposal to draft invoice...')
    try {
      const invId = await convertQuotationToInvoice(id)
      toast.success('Successfully converted to Draft Invoice!', { id: toastId })
      router.push(`/invoices/${invId}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to convert to invoice', { id: toastId })
    } finally {
      setConverting(false)
    }
  }

  const handleConvertToProject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const projId = await convertQuotationToProject(id, projectName)
      toast.success('Successfully converted to Active Project!')
      setShowProjectModal(false)
      router.push(`/projects/${projId}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to convert to project')
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await supabase
        .from('quotations')
        .update({ status: newStatus })
        .eq('id', id)
      toast.success(`Proposal status updated to ${newStatus}`)
      fetchQuote()
    } catch (err: any) {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this proposal?')) return
    try {
      await deleteQuotationRecord(id)
      toast.success('Proposal deleted')
      router.push('/quotations')
    } catch (err: any) {
      toast.error('Failed to delete proposal')
    }
  }

  if (loading) return <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading proposal...</div>
  if (!quote) return <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Proposal not found.</div>

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      {/* Header Back & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center print:hidden">
        <button
          onClick={() => router.push('/quotations')}
          className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Back to Proposals & Quotes
        </button>

        <div className="flex flex-wrap gap-2">
          {quote.status !== 'approved' && (
            <>
              <button
                onClick={handleConvertToInvoice}
                disabled={converting}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-55"
              >
                <FileText size={14} />
                {converting ? 'Converting...' : 'Convert to Invoice'}
              </button>
              <button
                onClick={() => setShowProjectModal(true)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition-all"
              >
                <FolderKanban size={14} />
                Convert to Project
              </button>
            </>
          )}

          <select
            value={quote.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3 py-2 text-sm bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>

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
            title="Delete proposal"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Google Drive Agreement Link Section */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4 print:hidden">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
            <FileText size={16} className="text-[var(--accent)]" />
            Drive Proposal / Agreement Link
          </h3>
          {quote.drive_link && (
            <a
              href={quote.drive_link}
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
              .from('quotations')
              .update({ drive_link: input.value || null })
              .eq('id', id);
            toast.success('Drive link updated');
            fetchQuote();
          } catch (err: any) {
            toast.error(err.message || 'Failed to update link');
          }
        }} className="flex gap-2">
          <input
            name="drive_link"
            placeholder="Paste Google Drive Proposal / Agreement link..."
            defaultValue={quote.drive_link || ''}
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

      {/* Paper Sheet style proposal */}
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
            <h2 className="text-2xl font-bold tracking-wider uppercase text-[var(--foreground)]">Business Proposal</h2>
            <p className="font-mono text-sm font-semibold text-[var(--accent)]">{quote.quotation_number}</p>
          </div>
          <span className={`px-3 py-1 rounded text-xs font-semibold border ${getStatusColor(quote.status)}`}>
            {quote.status.toUpperCase()}
          </span>
        </div>

        {/* Info grids */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[var(--muted-foreground)] uppercase block mb-1 font-semibold">Prepared For:</span>
            <div className="space-y-1">
              <p className="font-bold text-sm text-[var(--foreground)]">
                {quote.client?.company_name || quote.lead?.company_name || 'Individual opportunity'}
              </p>
              {(quote.client?.website || quote.lead?.email) && (
                <p className="text-[var(--muted-foreground)]">{quote.client?.website || quote.lead?.email}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[var(--muted-foreground)] uppercase block mb-1 font-semibold">Proposal Validity:</span>
            <div className="space-y-1 text-[var(--foreground)]">
              <p>Created Date: <strong>{formatDate(quote.created_at)}</strong></p>
              {quote.valid_until && <p>Valid Until: <strong>{formatDate(quote.valid_until)}</strong></p>}
              <p>Proposal Version: <strong>v{quote.version}</strong></p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[var(--secondary)] border-b border-[var(--border)] text-[var(--muted-foreground)] font-semibold uppercase">
                <th className="p-3">Description of Work / Deliverables</th>
                <th className="p-3 text-center">Qty</th>
                <th className="p-3 text-right">Proposed Rate</th>
                <th className="p-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--foreground)]">
              {quote.items?.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--secondary)]/10">
                  <td className="p-3 font-medium">{item.description}</td>
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
              <span>Proposal Subtotal</span>
              <span className="text-[var(--foreground)] font-medium">{formatCurrency(quote.subtotal)}</span>
            </div>
            {quote.discount_value > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Offered Discount</span>
                <span className="font-medium">- {formatCurrency(quote.discount_value)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-[var(--border)] pt-2 text-sm font-bold">
              <span className="text-[var(--foreground)]">Proposed Budget (INR)</span>
              <span className="text-[var(--accent)]">{formatCurrency(quote.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer notes */}
        {(quote.notes || quote.terms) && (
          <div className="pt-6 border-t border-[var(--border)] text-[10px] text-[var(--muted-foreground)] space-y-2 leading-relaxed">
            {quote.notes && <p><strong>Notes:</strong> {quote.notes}</p>}
            {quote.terms && <p><strong>Terms & Conditions:</strong> {quote.terms}</p>}
          </div>
        )}
      </div>

      {/* Convert to Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setShowProjectModal(false)} />
          <div className="relative w-full max-w-sm bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--foreground)]">Convert Proposal to Active Project</h3>
              <p className="text-xs text-[var(--muted-foreground)]">This will initialize the project using proposed items value.</p>
            </div>
            <form onSubmit={handleConvertToProject} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Project Name *</label>
                <input
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Website Redesign"
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold"
                >
                  Convert and Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
