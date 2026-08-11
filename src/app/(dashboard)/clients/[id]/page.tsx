'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getClientById, addClientContact, deleteClientContact } from '@/actions/clients'
import { createProjectRecord } from '@/actions/projects'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { ArrowLeft, UserPlus, Phone, Mail, Globe, MapPin, Building, Trash2, Calendar, FileText, IndianRupee, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { Client } from '@/types'

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [client, setClient] = React.useState<Client | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<'profile' | 'contacts' | 'projects' | 'invoices' | 'payments'>('profile')

  // Contact form state
  const [showAddContact, setShowAddContact] = React.useState(false)
  const [contactName, setContactName] = React.useState('')
  const [designation, setDesignation] = React.useState('')
  const [contactEmail, setContactEmail] = React.useState('')
  const [contactPhone, setContactPhone] = React.useState('')
  const [contactWhatsapp, setContactWhatsapp] = React.useState('')

  // Add Project form state
  const [showAddProject, setShowAddProject] = React.useState(false)
  const [projectName, setProjectName] = React.useState('')
  const [projectCode, setProjectCode] = React.useState('')
  const [projectDesc, setProjectDesc] = React.useState('')
  const [projectBudget, setProjectBudget] = React.useState('')
  const [projectDeadline, setProjectDeadline] = React.useState('')

  const fetchClient = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getClientById(id)
      setClient(data)
    } catch (e) {
      console.error(e)
      toast.error('Failed to load client profile')
    } finally {
      setLoading(false)
    }
  }, [id])

  React.useEffect(() => {
    fetchClient()
  }, [fetchClient])

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectName || !projectCode) return
    try {
      await createProjectRecord({
        name: projectName,
        project_id: projectCode,
        description: projectDesc || null,
        client_id: id,
        project_type: 'custom',
        priority: 'medium',
        budget: projectBudget ? parseFloat(projectBudget) : null,
        deadline: projectDeadline || null,
        status: 'planning',
      })
      toast.success('Project created successfully')
      setShowAddProject(false)
      // reset
      setProjectName('')
      setProjectCode('')
      setProjectDesc('')
      setProjectBudget('')
      setProjectDeadline('')
      fetchClient()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create project')
    }
  }

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addClientContact(id, {
        name: contactName,
        designation: designation || null,
        email: contactEmail || null,
        phone: contactPhone || null,
        whatsapp: contactWhatsapp || null,
      })
      toast.success('Contact added')
      setShowAddContact(false)
      // reset
      setContactName('')
      setDesignation('')
      setContactEmail('')
      setContactPhone('')
      setContactWhatsapp('')
      fetchClient()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return
    try {
      await deleteClientContact(contactId, id)
      toast.success('Contact deleted')
      fetchClient()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (loading) return <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading client profile...</div>
  if (!client) return <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Client not found.</div>

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => router.push('/clients')}
          className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Back to Clients
        </button>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{client.company_name}</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border)] overflow-x-auto pb-px">
        {(['profile', 'contacts', 'projects', 'invoices', 'payments'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-semibold capitalize border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Details */}
          <div className="md:col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-6">
            <h3 className="font-bold text-[var(--foreground)] text-lg">Company Info</h3>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-[var(--muted-foreground)] block mb-1">Company Name</span>
                  <span className="text-[var(--foreground)] font-semibold">{client.company_name}</span>
                </div>
                <div>
                  <span className="text-xs text-[var(--muted-foreground)] block mb-1">GST Number</span>
                  <span className="text-[var(--foreground)] font-mono font-semibold">{client.gst_number || 'Not registered'}</span>
                </div>
                <div>
                  <span className="text-xs text-[var(--muted-foreground)] block mb-1">PAN Number</span>
                  <span className="text-[var(--foreground)] font-mono font-semibold">{client.pan_number || 'Not registered'}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-[var(--muted-foreground)] block mb-1">Industry</span>
                  <span className="text-[var(--foreground)]">{client.industry || 'Not set'}</span>
                </div>
                {client.website && (
                  <div>
                    <span className="text-xs text-[var(--muted-foreground)] block mb-1">Website</span>
                    <a
                      href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--accent)] hover:underline"
                    >
                      {client.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
            {client.notes && (
              <div className="pt-4 border-t border-[var(--border)]">
                <span className="text-xs text-[var(--muted-foreground)] block mb-1">Internal Notes</span>
                <p className="text-sm text-[var(--foreground)] bg-[var(--secondary)]/30 p-3 rounded-lg border border-[var(--border)]">
                  {client.notes}
                </p>
              </div>
            )}
          </div>

          {/* Quick facts */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4 text-sm h-fit">
            <h3 className="font-bold text-[var(--foreground)]">Financial Snapshot</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--muted-foreground)]">Total Invoiced</span>
                <span className="font-bold text-[var(--foreground)]">
                  {formatCurrency((client as any).invoices?.reduce((sum: number, inv: any) => sum + inv.total, 0) || 0)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
                <span className="text-[var(--muted-foreground)]">Payments Received</span>
                <span className="font-bold text-emerald-500">
                  {formatCurrency((client as any).payments?.reduce((sum: number, pay: any) => sum + pay.amount, 0) || 0)}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[var(--muted-foreground)]">Pending Dues</span>
                <span className="font-bold text-red-500">
                  {formatCurrency(
                    ((client as any).invoices?.reduce((sum: number, inv: any) => sum + inv.total, 0) || 0) -
                    ((client as any).payments?.reduce((sum: number, pay: any) => sum + pay.amount, 0) || 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'contacts' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-[var(--foreground)] text-lg">Contact Persons</h3>
            <button
              onClick={() => setShowAddContact(true)}
              className="flex items-center gap-2 bg-[var(--secondary)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--foreground)] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            >
              <UserPlus size={14} />
              Add Contact
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {client.contacts?.length === 0 ? (
              <div className="col-span-full py-12 text-center text-sm text-[var(--muted-foreground)] bg-[var(--card)] rounded-xl border border-[var(--border)]">
                No contacts registered yet.
              </div>
            ) : (
              client.contacts?.map((contact) => (
                <div key={contact.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 flex justify-between items-start">
                  <div className="space-y-2">
                    <div>
                      <h4 className="font-bold text-[var(--foreground)] text-base">{contact.name}</h4>
                      <p className="text-xs text-[var(--muted-foreground)]">{contact.designation || 'Staff Member'}</p>
                    </div>
                    <div className="space-y-1 text-xs text-[var(--muted-foreground)]">
                      {contact.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={12} />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                      {contact.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={12} />
                          <span>{contact.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="p-1.5 rounded-md hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add Contact Modal */}
          {showAddContact && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="fixed inset-0" onClick={() => setShowAddContact(false)} />
              <div className="relative w-full max-w-sm bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                <div className="p-6 border-b border-[var(--border)]">
                  <h3 className="text-lg font-bold text-[var(--foreground)]">Add Contact Person</h3>
                </div>
                <form onSubmit={handleAddContact} className="p-6 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Name *</label>
                    <input
                      required
                      placeholder="Contact person name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Designation</label>
                    <input
                      placeholder="e.g. Project Lead, CEO"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Email</label>
                      <input
                        type="email"
                        placeholder="email@company.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Phone</label>
                      <input
                        placeholder="Phone number"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddContact(false)}
                      className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-semibold"
                    >
                      Add Contact
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-[var(--foreground)] text-lg">Associated Projects</h3>
            <button
              onClick={() => {
                setProjectCode(`PRJ-${Date.now().toString().slice(-4)}`)
                setShowAddProject(true)
              }}
              className="flex items-center gap-1.5 bg-[var(--accent)] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-all"
            >
              <Plus size={14} />
              Add Project
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {((client as any).projects || []).length === 0 ? (
              <div className="col-span-full py-12 text-center text-sm text-[var(--muted-foreground)] bg-[var(--card)] rounded-xl border border-[var(--border)]">
                No projects active for this client.
              </div>
            ) : (
              ((client as any).projects || []).map((project: any) => (
                <div key={project.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-mono text-[var(--muted-foreground)]">{project.project_id}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-[var(--foreground)] text-base mb-1">{project.name}</h4>
                    <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">{project.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-between items-center text-xs">
                    <span className="text-[var(--muted-foreground)]">Budget: {project.budget ? formatCurrency(project.budget) : 'Not specified'}</span>
                    <span className="font-medium text-[var(--foreground)]">{project.progress}% Complete</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Project Modal */}
          {showAddProject && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="fixed inset-0" onClick={() => setShowAddProject(false)} />
              <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                <div className="p-6 border-b border-[var(--border)]">
                  <h3 className="text-lg font-bold text-[var(--foreground)]">Launch New Project</h3>
                </div>
                <form onSubmit={handleAddProject} className="p-6 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Project Name *</label>
                    <input
                      required
                      placeholder="e.g. Website Redesign"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Project Code/ID *</label>
                      <input
                        required
                        placeholder="e.g. PRJ-101"
                        value={projectCode}
                        onChange={(e) => setProjectCode(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Budget (INR)</label>
                      <input
                        type="number"
                        placeholder="e.g. 50000"
                        value={projectBudget}
                        onChange={(e) => setProjectBudget(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Deadline</label>
                    <input
                      type="date"
                      value={projectDeadline}
                      onChange={(e) => setProjectDeadline(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Description</label>
                    <textarea
                      rows={3}
                      placeholder="Describe the scope of work..."
                      value={projectDesc}
                      onChange={(e) => setProjectDesc(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-3 justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddProject(false)}
                      className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-semibold hover:opacity-90"
                    >
                      Launch
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-bold text-[var(--foreground)]">Billing Invoices</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50">
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Invoice #</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Issue Date</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Due Date</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Total</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Paid</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {((client as any).invoices || []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[var(--muted-foreground)]">
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  ((client as any).invoices || []).map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-[var(--secondary)]/30 transition-colors">
                      <td className="p-4 font-mono text-[var(--accent)] font-semibold">{inv.invoice_number}</td>
                      <td className="p-4 text-[var(--foreground)]">{formatDate(inv.issue_date)}</td>
                      <td className="p-4 text-[var(--foreground)]">{inv.due_date ? formatDate(inv.due_date) : '-'}</td>
                      <td className="p-4 text-[var(--foreground)] font-semibold">{formatCurrency(inv.total)}</td>
                      <td className="p-4 text-[var(--foreground)]">{formatCurrency(inv.amount_paid)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getStatusColor(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-bold text-[var(--foreground)]">Payments Ledger</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50">
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Ref/Transaction #</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Date</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Amount</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Payment Method</th>
                  <th className="p-4 font-semibold text-[var(--muted-foreground)]">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {((client as any).payments || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[var(--muted-foreground)]">
                      No payments recorded.
                    </td>
                  </tr>
                ) : (
                  ((client as any).payments || []).map((pay: any) => (
                    <tr key={pay.id} className="hover:bg-[var(--secondary)]/30 transition-colors">
                      <td className="p-4 font-mono text-[var(--foreground)]">{pay.reference_number || 'N/A'}</td>
                      <td className="p-4 text-[var(--foreground)]">{pay.payment_date ? formatDate(pay.payment_date) : formatDate(pay.created_at)}</td>
                      <td className="p-4 font-semibold text-emerald-500">{formatCurrency(pay.amount)}</td>
                      <td className="p-4 text-[var(--foreground)] capitalize">{pay.payment_method?.replace('_', ' ') || '-'}</td>
                      <td className="p-4 text-[var(--muted-foreground)]">{pay.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
