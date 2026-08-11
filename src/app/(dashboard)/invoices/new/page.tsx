'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { createInvoiceRecord } from '@/actions/invoices'
import { getClients } from '@/actions/clients'
import { getProjects } from '@/actions/projects'
import { ArrowLeft, Plus, Trash2, IndianRupee } from 'lucide-react'
import { toast } from 'sonner'
import type { Client, Project } from '@/types'

interface LineItem {
  description: string
  quantity: number
  unit_price: number
  hsn_code: string
}

export default function NewInvoicePage() {
  const router = useRouter()

  const [clients, setClients] = React.useState<Client[]>([])
  const [projects, setProjects] = React.useState<Project[]>([])
  const [loading, setLoading] = React.useState(true)

  // Invoice form states
  const [clientId, setClientId] = React.useState('')
  const [projectId, setProjectId] = React.useState('')
  const [dueDate, setDueDate] = React.useState('')
  const [discountType, setDiscountType] = React.useState<'fixed' | 'percentage'>('fixed')
  const [discountValue, setDiscountValue] = React.useState('0')
  const [taxType, setTaxType] = React.useState<'cgst_sgst' | 'igst' | 'none'>('cgst_sgst')
  const [gstRate, setGstRate] = React.useState('18')
  const [notes, setNotes] = React.useState('')
  const [terms, setTerms] = React.useState('')

  // Line items state
  const [items, setItems] = React.useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0, hsn_code: '' },
  ])

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientData, projData] = await Promise.all([getClients(), getProjects()])
        setClients(clientData)
        setProjects(projData)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleAddItem = () => {
    setItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0, hsn_code: '' }])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, key: keyof LineItem, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updated = { ...item, [key]: value }
        return updated
      }
      return item
    }))
  }

  // Calculations
  const subtotal = React.useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  }, [items])

  const discountAmount = React.useMemo(() => {
    const val = parseFloat(discountValue) || 0
    if (discountType === 'percentage') {
      return (subtotal * val) / 100
    }
    return val
  }, [subtotal, discountType, discountValue])

  const taxableAmount = Math.max(0, subtotal - discountAmount)

  const taxAmount = React.useMemo(() => {
    if (taxType === 'none') return 0
    const rate = parseFloat(gstRate) || 0
    return (taxableAmount * rate) / 100
  }, [taxableAmount, taxType, gstRate])

  const total = taxableAmount + taxAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId) {
      toast.error('Please select a client')
      return
    }

    const invalidItem = items.some(item => !item.description || item.unit_price <= 0)
    if (invalidItem) {
      toast.error('Please specify description and price for all line items')
      return
    }

    try {
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`
      
      const invoiceData = {
        invoice_number: invoiceNumber,
        client_id: clientId,
        project_id: projectId || null,
        due_date: dueDate || null,
        subtotal,
        discount_type: discountType,
        discount_value: parseFloat(discountValue) || 0,
        tax_type: taxType,
        cgst_rate: taxType === 'cgst_sgst' ? (parseFloat(gstRate) / 2) : 0,
        sgst_rate: taxType === 'cgst_sgst' ? (parseFloat(gstRate) / 2) : 0,
        igst_rate: taxType === 'igst' ? parseFloat(gstRate) : 0,
        tax_amount: taxAmount,
        total,
        notes: notes || null,
        terms: terms || null,
        status: 'draft',
      }

      const formattedItems = items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.quantity * item.unit_price,
        hsn_code: item.hsn_code || null,
      }))

      await createInvoiceRecord(invoiceData, formattedItems)
      toast.success('Invoice created as Draft successfully')
      router.push('/invoices')
    } catch (err: any) {
      toast.error(err.message || 'Failed to create invoice')
    }
  }

  if (loading) return <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading databases...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="space-y-1">
        <button
          onClick={() => router.push('/invoices')}
          className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Back to Invoices
        </button>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">New Tax Invoice</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Billing details */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Client Company *</label>
            <select
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
            >
              <option value="">Select a Client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.company_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Project Link (Optional)</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
            >
              <option value="">No Project</option>
              {projects.filter(p => !clientId || p.client_id === clientId).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
            />
          </div>
        </div>

        {/* Step 2: Line items editor */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-[var(--foreground)]">Line Items</h3>
          
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-3 items-center border-b border-[var(--border)]/30 pb-3 last:border-b-0">
                <div className="col-span-5">
                  <input
                    required
                    placeholder="Item description / Service"
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    placeholder="Rate"
                    value={item.unit_price || ''}
                    onChange={(e) => handleItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    placeholder="HSN/SAC"
                    value={item.hsn_code}
                    onChange={(e) => handleItemChange(idx, 'hsn_code', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-2 text-[var(--muted-foreground)] hover:text-red-500 rounded-lg hover:bg-red-500/5 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-1 text-xs text-[var(--accent)] font-semibold hover:underline"
          >
            <Plus size={14} />
            Add Line Item
          </button>
        </div>

        {/* Step 3: Tax calculations & Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-[var(--foreground)]">Tax & Discount</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">GST Structure</label>
                <select
                  value={taxType}
                  onChange={(e: any) => setTaxType(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                >
                  <option value="cgst_sgst">CGST + SGST (Intra-state)</option>
                  <option value="igst">IGST (Inter-state)</option>
                  <option value="none">Zero Tax / Exempt</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">GST Rate (%)</label>
                <select
                  value={gstRate}
                  onChange={(e) => setGstRate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                >
                  <option value="18">18% GST (Default)</option>
                  <option value="12">12% GST</option>
                  <option value="5">5% GST</option>
                  <option value="28">28% GST</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Discount Type</label>
                <select
                  value={discountType}
                  onChange={(e: any) => setDiscountType(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                >
                  <option value="fixed">Fixed (INR)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Discount Value</label>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm space-y-4 text-sm h-fit">
            <h3 className="font-bold text-[var(--foreground)]">Invoice Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]/50">
                <span className="text-[var(--muted-foreground)]">Gross Subtotal</span>
                <span className="text-[var(--foreground)] font-semibold">INR {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]/50">
                <span className="text-[var(--muted-foreground)]">Discount</span>
                <span className="text-red-500 font-semibold">- INR {discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]/50">
                <span className="text-[var(--muted-foreground)]">Taxable Amount</span>
                <span className="text-[var(--foreground)]">INR {taxableAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]/50">
                <span className="text-[var(--muted-foreground)]">
                  {taxType === 'cgst_sgst' ? 'CGST + SGST' : taxType === 'igst' ? 'IGST' : 'Tax'} ({gstRate}%)
                </span>
                <span className="text-[var(--foreground)]">INR {taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2.5 text-base">
                <span className="font-bold text-[var(--foreground)]">Grand Total (Due)</span>
                <span className="font-bold text-[var(--accent)]">INR {total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.push('/invoices')}
            className="px-6 py-2.5 border border-[var(--border)] rounded-lg text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--secondary)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-[var(--accent)] text-white rounded-lg text-sm font-semibold hover:opacity-90"
          >
            Save as Draft
          </button>
        </div>
      </form>
    </div>
  )
}
