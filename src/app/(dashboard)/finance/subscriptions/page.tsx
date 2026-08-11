'use client'

import * as React from 'react'
import { getSubscriptions, saveSubscription, deleteSubscription } from '@/actions/finance-actions'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Search, Trash2, Calendar, RefreshCw, Key, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'sonner'
import type { Subscription } from '@/types'

const SUB_CATEGORIES = [
  { value: 'software', label: 'Software Licensing' },
  { value: 'hosting', label: 'Hosting/Cloud Infra' },
  { value: 'marketing', label: 'Marketing/Ad tools' },
  { value: 'office', label: 'Office Utilities' },
  { value: 'other', label: 'Other Recurring Costs' }
]

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [showAddModal, setShowAddModal] = React.useState(false)

  // Form states
  const [name, setName] = React.useState('')
  const [monthlyCost, setMonthlyCost] = React.useState('')
  const [yearlyCost, setYearlyCost] = React.useState('')
  const [renewalDate, setRenewalDate] = React.useState('')
  const [autoRenewal, setAutoRenewal] = React.useState(true)
  const [paymentMethod, setPaymentMethod] = React.useState('credit_card')
  const [category, setCategory] = React.useState<'software' | 'hosting' | 'marketing' | 'office' | 'other'>('software')

  const fetchSubscriptionsData = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getSubscriptions()
      setSubscriptions(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchSubscriptionsData()
  }, [fetchSubscriptionsData])

  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    try {
      await saveSubscription({
        name,
        monthly_cost: monthlyCost || '0',
        yearly_cost: yearlyCost || '0',
        renewal_date: renewalDate || null,
        auto_renewal: autoRenewal,
        payment_method: paymentMethod,
        category
      })

      toast.success('Subscription registered successfully')
      setShowAddModal(false)
      // reset
      setName('')
      setMonthlyCost('')
      setYearlyCost('')
      setRenewalDate('')
      setAutoRenewal(true)
      setPaymentMethod('credit_card')
      setCategory('software')
      fetchSubscriptionsData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save subscription')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Cancel/Delete this subscription record?')) return
    try {
      await deleteSubscription(id)
      toast.success('Subscription record removed')
      fetchSubscriptionsData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete record')
    }
  }

  const filteredSubscriptions = subscriptions.filter(sub =>
    sub.name.toLowerCase().includes(search.toLowerCase()) ||
    sub.category.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading SaaS subscriptions...</div>

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Subscriptions & Renewals</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Track company SaaS recurring invoices (ChatGPT, Vercel, Supabase) and renew alerts</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
        >
          <Plus size={16} />
          Add Subscription
        </button>
      </div>

      {/* Stats and Filter */}
      <div className="flex gap-4 items-center justify-between bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            placeholder="Search by SaaS name, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
          />
        </div>
        <div className="text-xs text-[var(--muted-foreground)]">
          Monthly SaaS Burn: <span className="font-bold text-rose-500">{formatCurrency(filteredSubscriptions.reduce((sum, s) => sum + (s.monthly_cost || 0), 0))}</span>
        </div>
      </div>

      {/* Grid of Subscriptions */}
      {filteredSubscriptions.length === 0 ? (
        <div className="py-20 bg-[var(--card)] rounded-xl border border-[var(--border)] text-center text-sm text-[var(--muted-foreground)] border-dashed">
          No subscriptions registered yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubscriptions.map((sub) => (
            <div key={sub.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-[var(--foreground)] flex items-center gap-1.5"><Key size={16} className="text-[var(--accent)]" /> {sub.name}</h3>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--muted-foreground)] mt-0.5 block">{sub.category}</span>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    sub.auto_renewal ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {sub.auto_renewal ? 'Auto-Renew' : 'Manual'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-[var(--border)] text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--muted-foreground)] block">Monthly Cost</span>
                    <span className="font-bold text-[var(--foreground)] mt-0.5 block">{formatCurrency(sub.monthly_cost)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--muted-foreground)] block">Yearly Cost</span>
                    <span className="font-bold text-[var(--foreground)] mt-0.5 block">{formatCurrency(sub.yearly_cost)}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs mt-3 pt-3 border-t border-[var(--border)]">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Payment Method:</span>
                    <span className="font-medium text-[var(--foreground)] capitalize">{sub.payment_method?.replace('_', ' ') || 'Credit Card'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Renewal Date:</span>
                    <span className="font-medium text-[var(--foreground)]">{sub.renewal_date ? formatDate(sub.renewal_date) : 'Not specified'}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 mt-2">
                <button
                  onClick={() => handleDelete(sub.id)}
                  className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1 hover:underline"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-[var(--border)] flex justify-between items-center">
              <h2 className="font-bold text-[var(--foreground)]">Log SaaS Subscription</h2>
              <button onClick={() => setShowAddModal(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">✕</button>
            </div>
            <form onSubmit={handleAddSubscription} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--muted-foreground)]">SaaS / Subscription Name *</label>
                <input
                  required
                  placeholder="e.g. ChatGPT Plus / Cursor IDE"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    {SUB_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="credit_card">Credit Card</option>
                    <option value="bank_transfer">Bank Auto-debit</option>
                    <option value="upi">UPI Auto-pay</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Monthly Cost (₹)</label>
                  <input
                    type="number"
                    placeholder="1650"
                    value={monthlyCost}
                    onChange={(e) => setMonthlyCost(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Yearly Cost (₹)</label>
                  <input
                    type="number"
                    placeholder="19800"
                    value={yearlyCost}
                    onChange={(e) => setYearlyCost(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Renewal Date</label>
                  <input
                    type="date"
                    value={renewalDate}
                    onChange={(e) => setRenewalDate(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)] block">Auto Renewal</label>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setAutoRenewal(!autoRenewal)}
                      className="text-[var(--accent)]"
                    >
                      {autoRenewal ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-[var(--muted-foreground)]" />}
                    </button>
                    <span className="text-xs text-[var(--foreground)]">{autoRenewal ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border)]">
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
                  Save Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
