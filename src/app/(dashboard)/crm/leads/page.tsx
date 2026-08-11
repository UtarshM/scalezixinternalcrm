'use client'

import * as React from 'react'
import Link from 'next/link'
import { getLeads, createLead, updateLead, updateLeadStatus } from '@/actions/leads'
import { getStatusColor, getPriorityColor, formatCurrency } from '@/lib/utils'
import { Plus, Search, Table as TableIcon, List as ListIcon, Calendar, ArrowRight, User } from 'lucide-react'
import { toast } from 'sonner'
import type { Lead } from '@/types'

export default function LeadsPage() {
  const [leads, setLeads] = React.useState<Lead[]>([])
  const [loading, setLoading] = React.useState(true)
  const [view, setView] = React.useState<'table' | 'list'>('table')
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [showAddModal, setShowAddModal] = React.useState(false)
  
  // Edit State
  const [showEditModal, setShowEditModal] = React.useState(false)
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null)
  const [editTitle, setEditTitle] = React.useState('')
  const [editCompanyName, setEditCompanyName] = React.useState('')
  const [editContactName, setEditContactName] = React.useState('')
  const [editEmail, setEditEmail] = React.useState('')
  const [editPhone, setEditPhone] = React.useState('')
  const [editSource, setEditSource] = React.useState('website')
  const [editPriority, setEditPriority] = React.useState('medium')
  const [editBudget, setEditBudget] = React.useState('')
  const [editReferredBy, setEditReferredBy] = React.useState('')

  // Import State
  const [showImportModal, setShowImportModal] = React.useState(false)
  const [csvText, setCsvText] = React.useState('')

  // Form State for Add
  const [title, setTitle] = React.useState('')
  const [companyName, setCompanyName] = React.useState('')
  const [contactName, setContactName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [source, setSource] = React.useState('website')
  const [priority, setPriority] = React.useState('medium')
  const [budget, setBudget] = React.useState('')
  const [referredBy, setReferredBy] = React.useState('')

  const fetchLeads = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getLeads()
      setLeads(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createLead({
        title,
        company_name: companyName || null,
        contact_name: contactName || null,
        email: email || null,
        phone: phone || null,
        source,
        referred_by: source === 'referral' ? (referredBy || null) : null,
        priority,
        expected_budget: budget ? parseFloat(budget) : null,
        status: 'new',
      })
      toast.success('Lead created successfully')
      setShowAddModal(false)
      // reset form
      setTitle('')
      setCompanyName('')
      setContactName('')
      setEmail('')
      setPhone('')
      setSource('website')
      setReferredBy('')
      setPriority('medium')
      setBudget('')
      fetchLeads()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create lead')
    }
  }

  const handleOpenEdit = (lead: Lead) => {
    setSelectedLead(lead)
    setEditTitle(lead.title)
    setEditCompanyName(lead.company_name || '')
    setEditContactName(lead.contact_name || '')
    setEditEmail(lead.email || '')
    setEditPhone(lead.phone || '')
    setEditSource(lead.source || 'website')
    setEditReferredBy(lead.referred_by || '')
    setEditPriority(lead.priority || 'medium')
    setEditBudget(lead.expected_budget ? String(lead.expected_budget) : '')
    setShowEditModal(true)
  }

  const handleEditLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLead) return
    try {
      await updateLead(selectedLead.id, {
        title: editTitle,
        company_name: editCompanyName || null,
        contact_name: editContactName || null,
        email: editEmail || null,
        phone: editPhone || null,
        source: editSource,
        referred_by: editSource === 'referral' ? (editReferredBy || null) : null,
        priority: editPriority,
        expected_budget: editBudget ? parseFloat(editBudget) : null,
      })
      toast.success('Lead updated successfully')
      setShowEditModal(false)
      fetchLeads()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update lead')
    }
  }

  const handleCSVImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!csvText.trim()) return
    const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length <= 1) {
      toast.error('CSV data must contain a header row and at least one data row')
      return
    }

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim())
    let successCount = 0
    let errorCount = 0

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const rowData: any = {}
      headers.forEach((header, index) => {
        const val = values[index]
        if (!val) return
        if (header === 'title') rowData.title = val
        else if (header === 'company' || header === 'company_name') rowData.company_name = val
        else if (header === 'contact' || header === 'contact_name') rowData.contact_name = val
        else if (header === 'email') rowData.email = val
        else if (header === 'phone') rowData.phone = val
        else if (header === 'budget' || header === 'expected_budget') rowData.expected_budget = parseFloat(val) || null
      })

      if (!rowData.title) {
        rowData.title = rowData.contact_name || `Imported Lead ${i}`
      }

      try {
        await createLead({
          ...rowData,
          status: 'new',
          priority: 'medium',
        })
        successCount++
      } catch (err) {
        errorCount++
      }
    }

    toast.success(`Import finished: ${successCount} leads added! ${errorCount ? `${errorCount} failed.` : ''}`)
    setShowImportModal(false)
    setCsvText('')
    fetchLeads()
  }

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.title.toLowerCase().includes(search.toLowerCase()) ||
      (lead.company_name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (lead.contact_name?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Leads</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Manage and track your business opportunities</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[var(--border)] transition-all"
          >
            Import CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
          >
            <Plus size={16} />
            Add Lead
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-[var(--card)] p-4 rounded-xl border border-[var(--border)]">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-[var(--secondary)] rounded-lg self-end sm:self-auto">
          <button
            onClick={() => setView('table')}
            className={`p-1.5 rounded-md transition-all ${
              view === 'table' ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm' : 'text-[var(--muted-foreground)]'
            }`}
          >
            <TableIcon size={16} />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded-md transition-all ${
              view === 'list' ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm' : 'text-[var(--muted-foreground)]'
            }`}
          >
            <ListIcon size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading leads...</div>
      ) : filteredLeads.length === 0 ? (
        <div className="py-20 bg-[var(--card)] rounded-xl border border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
          No leads found matching query.
        </div>
      ) : view === 'table' ? (
         /* Table View */
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50">
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Title</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Company</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Contact Person</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Expected Budget</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Status</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Priority</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Owner</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-[var(--secondary)]/30 transition-colors">
                    <td className="p-4">
                      <Link href={`/crm/leads/${lead.id}`} className="font-medium text-[var(--accent)] hover:underline">
                        {lead.title}
                      </Link>
                    </td>
                    <td className="p-4 text-[var(--foreground)]">{lead.company_name || '-'}</td>
                    <td className="p-4 text-[var(--foreground)]">{lead.contact_name || '-'}</td>
                    <td className="p-4 text-[var(--foreground)]">
                      {lead.expected_budget ? formatCurrency(lead.expected_budget) : '-'}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${getPriorityColor(lead.priority)}`}>
                        {lead.priority}
                      </span>
                    </td>
                    <td className="p-4 text-[var(--foreground)]">
                      {lead.owner ? lead.owner.full_name : '-'}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(lead)}
                        className="text-xs text-[var(--accent)] hover:underline font-semibold"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => (
            <div key={lead.id} className="card-hover bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${getPriorityColor(lead.priority)}`}>
                    {lead.priority}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </div>
                <Link href={`/crm/leads/${lead.id}`} className="font-bold text-[var(--foreground)] text-lg hover:text-[var(--accent)]">
                  {lead.title}
                </Link>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">{lead.company_name || 'No company'}</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                    <User size={14} />
                    <span>{lead.contact_name || 'No contact name'}</span>
                  </div>
                  {lead.expected_budget && (
                    <div className="text-sm font-semibold text-[var(--foreground)]">
                      Budget: {formatCurrency(lead.expected_budget)}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                <button
                  onClick={() => handleOpenEdit(lead)}
                  className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-semibold"
                >
                  Edit
                </button>
                <Link href={`/crm/leads/${lead.id}`} className="flex items-center gap-1 text-xs text-[var(--accent)] font-semibold hover:underline">
                  View Detail
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--foreground)]">Add New Lead</h3>
            </div>
            <form onSubmit={handleAddLead} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Title/Opportunity Name *</label>
                <input
                  required
                  placeholder="e.g. Website Redesign for Scalezix"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Company Name</label>
                  <input
                    placeholder="e.g. Scalezix Corp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Contact Name</label>
                  <input
                    placeholder="e.g. Jiya"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Email</label>
                  <input
                    type="email"
                    placeholder="name@company.com"
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
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="website">Website</option>
                    <option value="referral">Referral</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="cold_call">Cold Call</option>
                    <option value="social_media">Social Media</option>
                    <option value="event">Event</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Budget (INR)</label>
                  <input
                    type="number"
                    placeholder="Expected"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>
              {source === 'referral' && (
                <div className="animate-fade-in">
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Referral Person Name</label>
                  <input
                    placeholder="e.g. John Doe"
                    value={referredBy}
                    onChange={(e) => setReferredBy(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
              )}
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setShowEditModal(false)} />
          <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--foreground)]">Edit Lead details</h3>
            </div>
            <form onSubmit={handleEditLeadSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Title/Opportunity Name *</label>
                <input
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Company Name</label>
                  <input
                    value={editCompanyName}
                    onChange={(e) => setEditCompanyName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Contact Name</label>
                  <input
                    value={editContactName}
                    onChange={(e) => setEditContactName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Phone</label>
                  <input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Source</label>
                  <select
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="website">Website</option>
                    <option value="referral">Referral</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="cold_call">Cold Call</option>
                    <option value="social_media">Social Media</option>
                    <option value="event">Event</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Budget (INR)</label>
                  <input
                    type="number"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              </div>
              {editSource === 'referral' && (
                <div className="animate-fade-in">
                  <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Referral Person Name</label>
                  <input
                    placeholder="e.g. John Doe"
                    value={editReferredBy}
                    onChange={(e) => setEditReferredBy(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
              )}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-semibold hover:opacity-90"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setShowImportModal(false)} />
          <div className="relative w-full max-w-lg bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--foreground)]">Import Leads from CSV</h3>
            </div>
            <form onSubmit={handleCSVImportSubmit} className="p-6 space-y-4">
              <div className="text-xs text-[var(--muted-foreground)] leading-relaxed space-y-1 bg-[var(--secondary)] p-3 rounded-lg border border-[var(--border)]">
                <p className="font-semibold text-[var(--foreground)]">Required Header Format:</p>
                <code className="block font-mono bg-black/30 p-1.5 rounded">title,company_name,contact_name,email,phone,expected_budget</code>
                <p>Paste your comma-separated rows below, starting with the header row.</p>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Paste CSV Data *</label>
                <textarea
                  required
                  rows={8}
                  placeholder="title,company_name,contact_name,email,phone,expected_budget&#10;CRM Development,Scalezix,Jiya Patel,jiya@scalezix.co,,75000"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-xs bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-semibold hover:opacity-90"
                >
                  Start Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
