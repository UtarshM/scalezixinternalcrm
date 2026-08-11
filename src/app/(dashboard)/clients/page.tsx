'use client'

import * as React from 'react'
import Link from 'next/link'
import { getClients, createClientRecord } from '@/actions/clients'
import { Plus, Search, Building2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import type { Client } from '@/types'

export default function ClientsPage() {
  const [clients, setClients] = React.useState<Client[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [showAddModal, setShowAddModal] = React.useState(false)

  // Form states
  const [companyName, setCompanyName] = React.useState('')
  const [gstNumber, setGstNumber] = React.useState('')
  const [panNumber, setPanNumber] = React.useState('')
  const [website, setWebsite] = React.useState('')
  const [industry, setIndustry] = React.useState('')
  const [notes, setNotes] = React.useState('')

  const fetchClients = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getClients()
      setClients(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createClientRecord({
        company_name: companyName,
        gst_number: gstNumber || null,
        pan_number: panNumber || null,
        website: website || null,
        industry: industry || null,
        notes: notes || null,
      })
      toast.success('Client registered successfully')
      setShowAddModal(false)
      // reset form
      setCompanyName('')
      setGstNumber('')
      setPanNumber('')
      setWebsite('')
      setIndustry('')
      setNotes('')
      fetchClients()
    } catch (err: any) {
      toast.error(err.message || 'Failed to register client')
    }
  }

  const filteredClients = clients.filter(client =>
    client.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (client.industry?.toLowerCase().includes(search.toLowerCase()) ?? false)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Clients</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Manage client profiles and associated services</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
        >
          <Plus size={16} />
          Add Client
        </button>
      </div>

      {/* Filter Header */}
      <div className="flex gap-4 bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading clients...</div>
      ) : filteredClients.length === 0 ? (
        <div className="py-20 bg-[var(--card)] rounded-xl border border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
          No clients found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <div key={client.id} className="card-hover bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <Link href={`/clients/${client.id}`} className="font-bold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors">
                      {client.company_name}
                    </Link>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{client.industry || 'General Industry'}</p>
                  </div>
                </div>
                {client.website && (
                  <a
                    href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-3"
                  >
                    <span>{client.website}</span>
                    <ExternalLink size={12} />
                  </a>
                )}
                {client.notes && (
                  <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 mt-2 bg-[var(--secondary)]/30 p-2.5 rounded-lg border border-[var(--border)]">
                    {client.notes}
                  </p>
                )}
              </div>
              <div className="mt-5 pt-3 border-t border-[var(--border)] flex justify-between items-center text-xs">
                <span className="text-[var(--muted-foreground)]">GST: {client.gst_number || 'None'}</span>
                <Link href={`/clients/${client.id}`} className="text-[var(--accent)] hover:underline font-semibold">
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--foreground)]">Register Client Company</h3>
            </div>
            <form onSubmit={handleAddClient} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Company Name *</label>
                <input
                  required
                  placeholder="e.g. Scalezix Technologies"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">GST Number (Indian GST)</label>
                  <input
                    placeholder="27AAAAA1111A1Z1"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">PAN Number</label>
                  <input
                    placeholder="ABCDE1234F"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Website</label>
                  <input
                    placeholder="www.scalezix.co"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Industry</label>
                  <input
                    placeholder="e.g. SaaS, Fintech"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Notes</label>
                <textarea
                  placeholder="Additional client background details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
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
