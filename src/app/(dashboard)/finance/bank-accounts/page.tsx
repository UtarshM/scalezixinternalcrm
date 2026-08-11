'use client'

import * as React from 'react'
import { getBankAccounts, saveBankAccount, deleteBankAccount } from '@/actions/finance-actions'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, Trash2, Building, RefreshCw, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import type { BankAccount } from '@/types'

export default function BankAccountsPage() {
  const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [showAddModal, setShowAddModal] = React.useState(false)

  // Form states
  const [bankName, setBankName] = React.useState('')
  const [holderName, setHolderName] = React.useState('')
  const [accountNumber, setAccountNumber] = React.useState('')
  const [upiId, setUpiId] = React.useState('')
  const [balance, setBalance] = React.useState('')
  const [accountType, setAccountType] = React.useState<'savings' | 'current' | 'settlement' | 'credit_card' | 'other'>('current')

  const fetchBankData = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getBankAccounts()
      setBankAccounts(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchBankData()
  }, [fetchBankData])

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bankName || !holderName) return

    try {
      await saveBankAccount({
        bank_name: bankName,
        account_holder_name: holderName,
        account_number: accountNumber || null,
        upi_id: upiId || null,
        current_balance: balance || '0',
        account_type: accountType
      })

      toast.success('Bank Account profile registered successfully')
      setShowAddModal(false)
      // reset
      setBankName('')
      setHolderName('')
      setAccountNumber('')
      setUpiId('')
      setBalance('')
      setAccountType('current')
      fetchBankData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save bank account')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this bank account profile?')) return
    try {
      await deleteBankAccount(id)
      toast.success('Bank profile removed')
      fetchBankData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete profile')
    }
  }

  const filteredAccounts = bankAccounts.filter(acc =>
    acc.bank_name.toLowerCase().includes(search.toLowerCase()) ||
    acc.account_holder_name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading bank accounts...</div>

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Bank Account Management</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Manage business current accounts, Razorpay settlements, and current liquid balances</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
        >
          <Plus size={16} />
          Register Account
        </button>
      </div>

      {/* Stats and filter */}
      <div className="flex gap-4 items-center justify-between bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            placeholder="Search by bank name, holder..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
          />
        </div>
        <div className="text-xs text-[var(--muted-foreground)]">
          Total Liquid Balance: <span className="font-bold text-violet-500">{formatCurrency(filteredAccounts.reduce((sum, a) => sum + (a.current_balance || 0), 0))}</span>
        </div>
      </div>

      {/* Grid of Bank Accounts */}
      {filteredAccounts.length === 0 ? (
        <div className="py-20 bg-[var(--card)] rounded-xl border border-[var(--border)] text-center text-sm text-[var(--muted-foreground)] border-dashed">
          No bank accounts registered. Add your HDFC or ICICI Current accounts.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAccounts.map((acc) => (
            <div key={acc.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center rounded-lg">
                      <Building size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--foreground)] text-sm">{acc.bank_name}</h3>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--muted-foreground)]">{acc.account_type}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-500">{formatCurrency(acc.current_balance)}</span>
                </div>

                <div className="space-y-1.5 text-xs pt-3 mt-3 border-t border-[var(--border)]">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Holder Name:</span>
                    <span className="font-medium text-[var(--foreground)]">{acc.account_holder_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Account No:</span>
                    <span className="font-medium text-[var(--foreground)] font-mono">{acc.account_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">UPI ID:</span>
                    <span className="font-medium text-[var(--foreground)] font-mono">{acc.upi_id || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 mt-2 border-t border-[var(--border)]">
                <button
                  onClick={() => handleDelete(acc.id)}
                  className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1 hover:underline"
                >
                  <Trash2 size={13} />
                  Remove
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
              <h2 className="font-bold text-[var(--foreground)]">Register Bank Account</h2>
              <button onClick={() => setShowAddModal(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">✕</button>
            </div>
            <form onSubmit={handleAddAccount} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--muted-foreground)]">Bank Name *</label>
                <input
                  required
                  placeholder="e.g. HDFC Bank / Razorpay Settlement"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--muted-foreground)]">Account Holder Name *</label>
                <input
                  required
                  placeholder="e.g. Scalezix Private Limited"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Account Number</label>
                  <input
                    placeholder="50200012345678"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">UPI ID</label>
                  <input
                    placeholder="scalezix@hdfc"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Current Balance (₹)</label>
                  <input
                    type="number"
                    placeholder="500000"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--muted-foreground)]">Account Type</label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as any)}
                    className="w-full text-sm p-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="current">Current Account</option>
                    <option value="savings">Savings Account</option>
                    <option value="settlement">Razorpay / Settlement</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="other">Other Liquid Account</option>
                  </select>
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
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
