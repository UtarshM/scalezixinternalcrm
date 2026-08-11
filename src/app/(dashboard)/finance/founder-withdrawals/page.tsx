'use client'

import * as React from 'react'
import { getFounderWithdrawals, saveFounderWithdrawal, getBankAccounts } from '@/actions/finance-actions'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Search, Trash2, ShieldAlert, ArrowDownCircle, RefreshCw, Wallet, User } from 'lucide-react'
import { toast } from 'sonner'
import type { FounderWithdrawal, BankAccount } from '@/types'

export default function FounderWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = React.useState<FounderWithdrawal[]>([])
  const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [showAddModal, setShowAddModal] = React.useState(false)

  // Form states
  const [date, setDate] = React.useState('')
  const [amount, setAmount] = React.useState('')
  const [reason, setReason] = React.useState('')
  const [accountUsed, setAccountUsed] = React.useState('')

  const fetchWithdrawalData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [wdData, bankData] = await Promise.all([
        getFounderWithdrawals(),
        getBankAccounts()
      ])
      setWithdrawals(wdData || [])
      setBankAccounts(bankData || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchWithdrawalData()
  }, [fetchWithdrawalData])

  const handleAddWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return

    try {
      await saveFounderWithdrawal({
        date: date || new Date().toISOString().split('T')[0],
        amount: parseFloat(amount),
        reason: reason || null,
        account_used: accountUsed || null
      })

      toast.success('Founder withdrawal draw registered')
      setShowAddModal(false)
      // reset
      setDate('')
      setAmount('')
      setReason('')
      setAccountUsed('')
      fetchWithdrawalData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to register withdrawal')
    }
  }

  const filteredWithdrawals = withdrawals.filter(w =>
    (w.reason?.toLowerCase().includes(search.toLowerCase()) ?? false)
  )

  if (loading) return <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading withdrawals log...</div>

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Founder & Team Withdrawals</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Track partner payout drawings, dividend claims, CA retainer withdrawals, and bonuses</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
        >
          <Plus size={16} />
          Log Withdrawal
        </button>
      </div>

      {/* Stats overview and filter */}
      <div className="flex gap-4 items-center justify-between bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            placeholder="Search by reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
          />
        </div>
        <div className="text-xs text-[var(--muted-foreground)]">
          Total Draws Registered: <span className="font-bold text-rose-500">{formatCurrency(filteredWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0))}</span>
        </div>
      </div>

      {/* Ledger Table */}
      {filteredWithdrawals.length === 0 ? (
        <div className="py-20 bg-[var(--card)] rounded-xl border border-[var(--border)] text-center text-sm text-[var(--muted-foreground)] border-dashed">
          No withdrawals logged yet.
        </div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50 text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Reason</th>
                  <th className="p-4 font-semibold">Account Used</th>
                  <th className="p-4 font-semibold">Logged By</th>
                  <th className="p-4 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--foreground)]">
                {filteredWithdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-[var(--secondary)]/30 transition-colors">
                    <td className="p-4">{formatDate(w.date)}</td>
                    <td className="p-4 font-semibold">{w.reason || 'Draw / Payout'}</td>
                    <td className="p-4">{w.bank_account?.bank_name || 'Direct / Cash'}</td>
                    <td className="p-4">
                      <div className="text-xs font-semibold">{w.user?.full_name || 'Admin'}</div>
                      <div className="text-[10px] text-[var(--muted-foreground)]">{w.user?.email || 'admin@scalezix.co'}</div>
                    </td>
                    <td className="p-4 font-bold text-rose-500">{formatCurrency(w.amount)}</td>
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
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-[var(--border)] flex justify-between items-center">
              <h2 className="font-bold text-[var(--foreground)] flex items-center gap-1.5"><User size={18} className="text-[var(--accent)]" /> Log Payout Draw</h2>
              <button onClick={() => setShowAddModal(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">✕</button>
            </div>
            <form onSubmit={handleAddWithdrawal} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Amount Drawn (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="100000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--muted-foreground)]">Account Used</label>
                <select
                  value={accountUsed}
                  onChange={(e) => setAccountUsed(e.target.value)}
                  className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                >
                  <option value="">Select Account</option>
                  {bankAccounts.map(b => (
                    <option key={b.id} value={b.id}>{b.bank_name} ({formatCurrency(b.current_balance)})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--muted-foreground)]">Reason / Note *</label>
                <textarea
                  required
                  placeholder="e.g. Founder Draw / Salary Advance payout"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none h-24"
                />
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
                  Log Drawing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
