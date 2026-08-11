'use client'

import * as React from 'react'
import { getVendors, createVendorRecord, deleteVendorRecord } from '@/actions/expenses'
import { Plus, Search, Trash2, Store } from 'lucide-react'
import { toast } from 'sonner'
import type { Vendor } from '@/types'

export default function VendorsPage() {
  const [vendors, setVendors] = React.useState<Vendor[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [showAddModal, setShowAddModal] = React.useState(false)

  // Form states
  const [name, setName] = React.useState('')
  const [company, setCompany] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [gstNumber, setGstNumber] = React.useState('')
  const [notes, setNotes] = React.useState('')

  const fetchVendorsData = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getVendors()
      setVendors(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchVendorsData()
  }, [fetchVendorsData])

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    try {
      await createVendorRecord({
        name,
        company: company || null,
        email: email || null,
        phone: phone || null,
        gst_number: gstNumber || null,
        notes: notes || null,
      })
      toast.success('Vendor registered successfully')
      setShowAddModal(false)
      // reset
      setName('')
      setCompany('')
      setEmail('')
      setPhone('')
      setGstNumber('')
      setNotes('')
      fetchVendorsData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to register vendor')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Unregister this vendor?')) return
    try {
      await deleteVendorRecord(id)
      toast.success('Vendor profile removed')
      fetchVendorsData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const filteredVendors = vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    (v.company?.toLowerCase().includes(search.toLowerCase()) ?? false)
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Vendors</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Manage third-party contractors, suppliers, and service vendors</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
        >
          <Plus size={16} />
          Add Vendor
        </button>
      </div>

      {/* Search Filter */}
      <div className="flex gap-4 bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            placeholder="Search by vendor name or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading vendors...</div>
      ) : filteredVendors.length === 0 ? (
        <div className="py-20 bg-[var(--card)] rounded-xl border border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
          No vendors registered.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVendors.map((vendor) => (
            <div key={vendor.id} className="card-hover bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                    <Store size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--foreground)]">{vendor.name}</h4>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{vendor.company || 'Independent Contractor'}</p>
                  </div>
                </div>
                {(vendor.email || vendor.phone) && (
                  <div className="space-y-1.5 text-xs text-[var(--muted-foreground)] mb-3">
                    {vendor.email && <p>Email: {vendor.email}</p>}
                    {vendor.phone && <p>Phone: {vendor.phone}</p>}
                  </div>
                )}
                {vendor.notes && (
                  <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 mt-2 bg-[var(--secondary)]/30 p-2.5 rounded-lg border border-[var(--border)]">
                    {vendor.notes}
                  </p>
                )}
              </div>
              <div className="mt-5 pt-3 border-t border-[var(--border)] flex justify-between items-center text-xs">
                <span className="text-[var(--muted-foreground)]">GST: {vendor.gst_number || 'N/A'}</span>
                <button
                  onClick={() => handleDelete(vendor.id)}
                  className="text-red-500 hover:underline flex items-center gap-1.5"
                >
                  <Trash2 size={12} />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vendor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--foreground)]">Register Vendor Profile</h3>
            </div>
            <form onSubmit={handleAddVendor} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Vendor Name *</label>
                <input
                  required
                  placeholder="e.g. John Doe or Microsoft Corp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Company Name</label>
                  <input
                    placeholder="e.g. Microsoft India"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">GST Number</label>
                  <input
                    placeholder="27AAAAA1111A1Z1"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Email</label>
                  <input
                    type="email"
                    placeholder="billing@vendor.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Phone</label>
                  <input
                    placeholder="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Notes</label>
                <textarea
                  placeholder="Brief details about contract terms..."
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
                  Register Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
