'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  getProjectById, 
  addProjectMember, 
  removeProjectMember, 
  updateProjectRecord,
  createProjectMilestone,
  updateProjectMilestone,
  deleteProjectMilestone
} from '@/actions/projects'
import { 
  saveCredential, 
  deleteCredential, 
  saveHostingDeployment, 
  saveBillingRenewal, 
  deleteBillingRenewal, 
  saveProjectDocumentation, 
  updateMemberPermissions 
} from '@/actions/project-modules'
import { generateInvoiceFromMilestone } from '@/actions/invoices'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { 
  ArrowLeft, UserPlus, Trash2, Calendar, FileText, CheckCircle2, 
  IndianRupee, Users, Shield, Plus, ExternalLink, Clock, Eye, 
  EyeOff, Copy, Search, Globe, Server, CheckSquare, Edit, 
  Key, Lock, Mail, AlertTriangle, FileBadge, Save
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Project, User, Credential, BillingRenewal, ProjectMember, Milestone } from '@/types'

const Github = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
)

const DYNAMIC_SERVICES = [
  'Supabase', 'Github', 'Vercel', 'Railway', 'Shopify', 'AWS', 
  'Cloudflare', 'OpenAI', 'Resend', 'Hostinger', 'Firebase', 
  'MongoDB', 'Google Workspace', 'Razorpay', 'Stripe'
]

type ActiveTabType = 
  | 'overview' 
  | 'milestones'
  | 'credentials' 
  | 'urls' 
  | 'github' 
  | 'hosting' 
  | 'billing' 
  | 'client' 
  | 'team' 
  | 'documentation' 
  | 'notes'

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClient()

  const [project, setProject] = React.useState<Project | null>(null)
  const [systemUsers, setSystemUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<ActiveTabType>('overview')

  // Overview edit state
  const [isEditingOverview, setIsEditingOverview] = React.useState(false)
  const [editName, setEditName] = React.useState('')
  const [editDesc, setEditDesc] = React.useState('')
  const [editCategory, setEditCategory] = React.useState('')
  const [editType, setEditType] = React.useState('')
  const [editBudget, setEditBudget] = React.useState('')
  const [editProgress, setEditProgress] = React.useState(0)

  // Team states
  const [showAddMember, setShowAddMember] = React.useState(false)
  const [selectedUserId, setSelectedUserId] = React.useState('')
  const [memberRole, setMemberRole] = React.useState('developer')

  // Credentials states
  const [credSearch, setCredSearch] = React.useState('')
  const [credServiceFilter, setCredServiceFilter] = React.useState('')
  const [showAddCred, setShowAddCred] = React.useState(false)
  const [editingCred, setEditingCred] = React.useState<Credential | null>(null)
  const [visiblePasswords, setVisiblePasswords] = React.useState<Record<string, boolean>>({})
  
  // Credential form states
  const [credService, setCredService] = React.useState('Supabase')
  const [credEmail, setCredEmail] = React.useState('')
  const [credUsername, setCredUsername] = React.useState('')
  const [credPassword, setCredPassword] = React.useState('')
  const [credRecoveryEmail, setCredRecoveryEmail] = React.useState('')
  const [credRecoveryPhone, setCredRecoveryPhone] = React.useState('')
  const [credOwner, setCredOwner] = React.useState('')
  const [credBillingOwner, setCredBillingOwner] = React.useState('')
  const [cred2fa, setCred2fa] = React.useState(false)
  const [credNotes, setCredNotes] = React.useState('')

  // URLs edit state
  const [isEditingUrls, setIsEditingUrls] = React.useState(false)
  const [urlProd, setUrlProd] = React.useState('')
  const [urlStaging, setUrlStaging] = React.useState('')
  const [urlAdmin, setUrlAdmin] = React.useState('')
  const [urlApi, setUrlApi] = React.useState('')
  const [urlClient, setUrlClient] = React.useState('')
  const [urlDoc, setUrlDoc] = React.useState('')
  const [urlFigma, setUrlFigma] = React.useState('')
  const [urlNotion, setUrlNotion] = React.useState('')
  const [urlDeploy, setUrlDeploy] = React.useState('')

  // Github edit state
  const [isEditingGithub, setIsEditingGithub] = React.useState(false)
  const [gitRepo, setGitRepo] = React.useState('')
  const [gitOrg, setGitOrg] = React.useState('')
  const [gitUser, setGitUser] = React.useState('')
  const [gitEmail, setGitEmail] = React.useState('')

  // Hosting states
  const [isEditingHosting, setIsEditingHosting] = React.useState(false)
  const [hostFrontend, setHostFrontend] = React.useState('')
  const [hostBackend, setHostBackend] = React.useState('')
  const [hostDatabase, setHostDatabase] = React.useState('')
  const [hostProvider, setHostProvider] = React.useState('')
  const [hostDomain, setHostDomain] = React.useState('')
  const [hostSsl, setHostSsl] = React.useState('')
  const [hostCdn, setHostCdn] = React.useState('')
  const [hostStorage, setHostStorage] = React.useState('')
  const [hostEmail, setHostEmail] = React.useState('')
  const [hostMethod, setHostMethod] = React.useState('')
  const [hostBranch, setHostBranch] = React.useState('')
  const [hostEnv, setHostEnv] = React.useState('')
  const [hostNotes, setHostNotes] = React.useState('')
  const [hostDeployChecklist, setHostDeployChecklist] = React.useState<{text: string, completed: boolean}[]>([])
  const [hostProdChecklist, setHostProdChecklist] = React.useState<{text: string, completed: boolean}[]>([])
  const [newChecklistItem, setNewChecklistItem] = React.useState('')
  const [checklistType, setChecklistType] = React.useState<'deploy' | 'prod'>('deploy')

  // Billing states
  const [showAddBilling, setShowAddBilling] = React.useState(false)
  const [editingBilling, setEditingBilling] = React.useState<BillingRenewal | null>(null)
  const [billService, setBillService] = React.useState('')
  const [billMonthly, setBillMonthly] = React.useState('')
  const [billYearly, setBillYearly] = React.useState('')
  const [billCurrency, setBillCurrency] = React.useState('INR')
  const [billRenewalDate, setBillRenewalDate] = React.useState('')
  const [billFrequency, setBillFrequency] = React.useState<'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'one_time'>('monthly')
  const [billStatus, setBillStatus] = React.useState<'paid' | 'pending' | 'overdue'>('pending')
  const [billPaidBy, setBillPaidBy] = React.useState<'client' | 'scalezix' | 'shared'>('scalezix')
  const [billInvoiceLink, setBillInvoiceLink] = React.useState('')
  const [billNotes, setBillNotes] = React.useState('')

  // Documentation and Notes states
  const [docNotes, setDocNotes] = React.useState('')
  const [docMain, setDocMain] = React.useState('')
  const [docDeploy, setDocDeploy] = React.useState('')
  const [docRequirements, setDocRequirements] = React.useState('')
  const [docImportant, setDocImportant] = React.useState('')

  // Milestones states
  const [showAddMilestone, setShowAddMilestone] = React.useState(false)
  const [editingMilestone, setEditingMilestone] = React.useState<Milestone | null>(null)
  const [msTitle, setMsTitle] = React.useState('')
  const [msDescription, setMsDescription] = React.useState('')
  const [msDueDate, setMsDueDate] = React.useState('')
  const [msStatus, setMsStatus] = React.useState<'pending' | 'in_progress' | 'completed'>('pending')
  const [msProgress, setMsProgress] = React.useState(0)
  const [msBudget, setMsBudget] = React.useState('')

  const fetchProjectAndUsers = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getProjectById(id)
      setProject(data)

      if (data) {
        // Initialize Overview states
        setEditName(data.name || '')
        setEditDesc(data.description || '')
        setEditCategory(data.category || 'client_project')
        setEditType(data.project_type || 'website')
        setEditBudget(data.budget ? String(data.budget) : '')
        setEditProgress(data.progress || 0)

        // Initialize URL states
        setUrlProd(data.production_url || '')
        setUrlStaging(data.staging_url || '')
        setUrlAdmin(data.admin_panel_url || '')
        setUrlApi(data.api_url || '')
        setUrlClient(data.client_website_url || '')
        setUrlDoc(data.documentation_url || '')
        setUrlFigma(data.figma_url || '')
        setUrlNotion(data.notion_url || '')
        setUrlDeploy(data.deployment_url || '')

        // Initialize Github states
        setGitRepo(data.github_repo_url || '')
        setGitOrg(data.github_org_url || '')
        setGitUser(data.github_username || '')
        setGitEmail(data.github_email || '')

        // Initialize Hosting states
        const h = data.hosting
        setHostFrontend(h?.frontend_tech || '')
        setHostBackend(h?.backend_tech || '')
        setHostDatabase(h?.database_tech || '')
        setHostProvider(h?.hosting_provider || '')
        setHostDomain(h?.domain_provider || '')
        setHostSsl(h?.ssl_provider || '')
        setHostCdn(h?.cdn_provider || '')
        setHostStorage(h?.storage_provider || '')
        setHostEmail(h?.email_provider || '')
        setHostMethod(h?.deployment_method || '')
        setHostBranch(h?.branch_name || '')
        setHostEnv(h?.environment_type || '')
        setHostNotes(h?.deployment_notes || '')
        setHostDeployChecklist(h?.deployment_checklist || [])
        setHostProdChecklist(h?.production_checklist || [])

        // Initialize Documentation states
        const doc = data.documentation
        setDocNotes(doc?.notes || '')
        setDocMain(doc?.documentation || '')
        setDocDeploy(doc?.deployment_instructions || '')
        setDocRequirements(doc?.client_requirements || '')
        setDocImportant(doc?.important_instructions || '')
      }

      // Fetch all system users to add to team
      const { data: users } = await supabase.from('users').select('*')
      setSystemUsers(users || [])
    } catch (e) {
      console.error(e)
      toast.error('Failed to load project details')
    } finally {
      setLoading(false)
    }
  }, [id, supabase])

  React.useEffect(() => {
    fetchProjectAndUsers()
  }, [fetchProjectAndUsers])

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateProjectRecord(id, { status: newStatus })
      toast.success(`Project status updated to ${newStatus}`)
      fetchProjectAndUsers()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Overview edit submit
  const handleOverviewSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateProjectRecord(id, {
        name: editName,
        description: editDesc,
        category: editCategory,
        project_type: editType,
        budget: editBudget ? parseFloat(editBudget) : null,
        progress: editProgress
      })
      toast.success('Project details updated')
      setIsEditingOverview(false)
      fetchProjectAndUsers()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // URLs save submit
  const handleUrlsSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateProjectRecord(id, {
        production_url: urlProd || null,
        staging_url: urlStaging || null,
        admin_panel_url: urlAdmin || null,
        api_url: urlApi || null,
        client_website_url: urlClient || null,
        documentation_url: urlDoc || null,
        figma_url: urlFigma || null,
        notion_url: urlNotion || null,
        deployment_url: urlDeploy || null
      })
      toast.success('URLs updated successfully')
      setIsEditingUrls(false)
      fetchProjectAndUsers()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Github save submit
  const handleGithubSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateProjectRecord(id, {
        github_repo_url: gitRepo || null,
        github_org_url: gitOrg || null,
        github_username: gitUser || null,
        github_email: gitEmail || null
      })
      toast.success('Github details updated')
      setIsEditingGithub(false)
      fetchProjectAndUsers()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Hosting save submit
  const handleHostingSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await saveHostingDeployment(id, {
        frontend_tech: hostFrontend || null,
        backend_tech: hostBackend || null,
        database_tech: hostDatabase || null,
        hosting_provider: hostProvider || null,
        domain_provider: hostDomain || null,
        ssl_provider: hostSsl || null,
        cdn_provider: hostCdn || null,
        storage_provider: hostStorage || null,
        email_provider: hostEmail || null,
        deployment_method: hostMethod || null,
        branch_name: hostBranch || null,
        environment_type: hostEnv || null,
        deployment_notes: hostNotes || null,
        deployment_checklist: hostDeployChecklist,
        production_checklist: hostProdChecklist
      })
      toast.success('Hosting details updated')
      setIsEditingHosting(false)
      fetchProjectAndUsers()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleToggleChecklist = async (type: 'deploy' | 'prod', index: number) => {
    let updatedList = []
    if (type === 'deploy') {
      updatedList = [...hostDeployChecklist]
      updatedList[index].completed = !updatedList[index].completed
      setHostDeployChecklist(updatedList)
    } else {
      updatedList = [...hostProdChecklist]
      updatedList[index].completed = !updatedList[index].completed
      setHostProdChecklist(updatedList)
    }
    try {
      await saveHostingDeployment(id, {
        deployment_checklist: type === 'deploy' ? updatedList : hostDeployChecklist,
        production_checklist: type === 'prod' ? updatedList : hostProdChecklist
      })
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChecklistItem.trim()) return
    const newItem = { text: newChecklistItem.trim(), completed: false }
    let updatedList = []
    if (checklistType === 'deploy') {
      updatedList = [...hostDeployChecklist, newItem]
      setHostDeployChecklist(updatedList)
    } else {
      updatedList = [...hostProdChecklist, newItem]
      setHostProdChecklist(updatedList)
    }
    setNewChecklistItem('')
    try {
      await saveHostingDeployment(id, {
        deployment_checklist: checklistType === 'deploy' ? updatedList : hostDeployChecklist,
        production_checklist: checklistType === 'prod' ? updatedList : hostProdChecklist
      })
      toast.success('Checklist item added')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleRemoveChecklistItem = async (type: 'deploy' | 'prod', index: number) => {
    let updatedList = []
    if (type === 'deploy') {
      updatedList = hostDeployChecklist.filter((_, i) => i !== index)
      setHostDeployChecklist(updatedList)
    } else {
      updatedList = hostProdChecklist.filter((_, i) => i !== index)
      setHostProdChecklist(updatedList)
    }
    try {
      await saveHostingDeployment(id, {
        deployment_checklist: type === 'deploy' ? updatedList : hostDeployChecklist,
        production_checklist: type === 'prod' ? updatedList : hostProdChecklist
      })
      toast.success('Checklist item removed')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Documentation save submit
  const handleDocumentationSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await saveProjectDocumentation(id, {
        notes: docNotes || null,
        documentation: docMain || null,
        deployment_instructions: docDeploy || null,
        client_requirements: docRequirements || null,
        important_instructions: docImportant || null
      })
      toast.success('Documentation updated')
      fetchProjectAndUsers()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Team Member and Permission Management
  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) return
    try {
      await addProjectMember(id, selectedUserId, memberRole)
      toast.success('Team member added to project')
      setShowAddMember(false)
      setSelectedUserId('')
      fetchProjectAndUsers()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleRemoveMemberSubmit = async (userId: string) => {
    if (!confirm('Remove member from project?')) return
    try {
      await removeProjectMember(id, userId)
      toast.success('Member removed')
      fetchProjectAndUsers()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handlePermissionToggle = async (member: ProjectMember, field: string, val: boolean) => {
    try {
      const updatedPerms = {
        github_access: field === 'github' ? val : member.github_access,
        vercel_access: field === 'vercel' ? val : member.vercel_access,
        supabase_access: field === 'supabase' ? val : member.supabase_access,
        railway_access: field === 'railway' ? val : member.railway_access,
        production_access: field === 'production' ? val : member.production_access,
        client_access: field === 'client' ? val : member.client_access,
        billing_access: field === 'billing' ? val : member.billing_access
      }
      await updateMemberPermissions(member.id, id, updatedPerms)
      toast.success('Permissions updated')
      fetchProjectAndUsers()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Milestones actions
  const handleMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!msTitle.trim()) {
      toast.error('Milestone title is required')
      return
    }

    try {
      const milestoneData = {
        title: msTitle,
        description: msDescription || null,
        due_date: msDueDate || null,
        status: msStatus,
        progress: msProgress,
        budget: msBudget ? parseFloat(msBudget) : null,
      }

      if (editingMilestone) {
        await updateProjectMilestone(editingMilestone.id, id, milestoneData)
        toast.success('Milestone updated successfully')
      } else {
        await createProjectMilestone(id, milestoneData)
        toast.success('Milestone created successfully')
      }

      setShowAddMilestone(false)
      setEditingMilestone(null)
      // Reset form
      setMsTitle('')
      setMsDescription('')
      setMsDueDate('')
      setMsStatus('pending')
      setMsProgress(0)
      setMsBudget('')
      fetchProjectAndUsers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save milestone')
    }
  }

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm('Are you sure you want to delete this milestone?')) return
    try {
      await deleteProjectMilestone(milestoneId, id)
      toast.success('Milestone deleted')
      fetchProjectAndUsers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete milestone')
    }
  }

  const handleGenerateInvoice = async (milestoneId: string) => {
    const toastId = toast.loading('Generating draft invoice from milestone...')
    try {
      const invId = await generateInvoiceFromMilestone(milestoneId)
      toast.success('Draft invoice generated successfully!', { id: toastId })
      router.push(`/invoices/${invId}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate invoice', { id: toastId })
    }
  }

  // Credentials actions
  const handleCredSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await saveCredential(id, {
        id: editingCred?.id,
        service_name: credService,
        account_email: credEmail,
        username: credUsername,
        password: credPassword,
        recovery_email: credRecoveryEmail,
        recovery_phone: credRecoveryPhone,
        account_owner: credOwner,
        billing_owner: credBillingOwner,
        two_factor_enabled: cred2fa,
        notes: credNotes
      })
      toast.success(editingCred ? 'Credential updated' : 'Credential added')
      setShowAddCred(false)
      setEditingCred(null)
      // Reset form
      setCredService('Supabase')
      setCredEmail('')
      setCredUsername('')
      setCredPassword('')
      setCredRecoveryEmail('')
      setCredRecoveryPhone('')
      setCredOwner('')
      setCredBillingOwner('')
      setCred2fa(false)
      setCredNotes('')
      fetchProjectAndUsers()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleEditCredOpen = (cred: Credential) => {
    setEditingCred(cred)
    setCredService(cred.service_name)
    setCredEmail(cred.account_email || '')
    setCredUsername(cred.username || '')
    setCredPassword(cred.password || '')
    setCredRecoveryEmail(cred.recovery_email || '')
    setCredRecoveryPhone(cred.recovery_phone || '')
    setCredOwner(cred.account_owner || '')
    setCredBillingOwner(cred.billing_owner || '')
    setCred2fa(cred.two_factor_enabled)
    setCredNotes(cred.notes || '')
    setShowAddCred(true)
  }

  const handleDeleteCred = async (credId: string) => {
    if (!confirm('Are you sure you want to delete this credential?')) return
    try {
      await deleteCredential(credId, id)
      toast.success('Credential deleted successfully')
      fetchProjectAndUsers()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Billing actions
  const handleBillingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await saveBillingRenewal(id, {
        id: editingBilling?.id,
        service_name: billService,
        monthly_cost: billMonthly,
        yearly_cost: billYearly,
        currency: billCurrency,
        renewal_date: billRenewalDate,
        billing_frequency: billFrequency,
        payment_status: billStatus,
        paid_by: billPaidBy,
        invoice_link: billInvoiceLink,
        notes: billNotes
      })
      toast.success(editingBilling ? 'Billing entry updated' : 'Billing entry added')
      setShowAddBilling(false)
      setEditingBilling(null)
      // Reset form
      setBillService('')
      setBillMonthly('')
      setBillYearly('')
      setBillCurrency('INR')
      setBillRenewalDate('')
      setBillFrequency('monthly')
      setBillStatus('pending')
      setBillPaidBy('scalezix')
      setBillInvoiceLink('')
      setBillNotes('')
      fetchProjectAndUsers()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleEditBillingOpen = (bill: BillingRenewal) => {
    setEditingBilling(bill)
    setBillService(bill.service_name)
    setBillMonthly(bill.monthly_cost ? String(bill.monthly_cost) : '')
    setBillYearly(bill.yearly_cost ? String(bill.yearly_cost) : '')
    setBillCurrency(bill.currency)
    setBillRenewalDate(bill.renewal_date || '')
    setBillFrequency(bill.billing_frequency)
    setBillStatus(bill.payment_status)
    setBillPaidBy(bill.paid_by)
    setBillInvoiceLink(bill.invoice_link || '')
    setBillNotes(bill.notes || '')
    setShowAddBilling(true)
  }

  const handleDeleteBilling = async (billId: string) => {
    if (!confirm('Are you sure you want to delete this billing entry?')) return
    try {
      await deleteBillingRenewal(billId, id)
      toast.success('Billing entry deleted successfully')
      fetchProjectAndUsers()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleCopyText = (text: string, label = 'Text') => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const togglePasswordVisibility = (credId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [credId]: !prev[credId]
    }))
  }

  if (loading) return <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading project details...</div>
  if (!project) return <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Project not found.</div>

  // Filtered credentials list
  const filteredCredentials = (project.credentials || []).filter(cred => {
    const matchSearch = cred.service_name.toLowerCase().includes(credSearch.toLowerCase()) ||
                        (cred.account_email || '').toLowerCase().includes(credSearch.toLowerCase()) ||
                        (cred.username || '').toLowerCase().includes(credSearch.toLowerCase())
    const matchService = credServiceFilter ? cred.service_name === credServiceFilter : true
    return matchSearch && matchService
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="space-y-1">
          <button
            onClick={() => router.push('/projects')}
            className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors w-fit"
          >
            <ArrowLeft size={16} />
            Back to Projects
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{project.name}</h1>
            <span className="text-xs font-mono text-[var(--muted-foreground)]">({project.project_id})</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
              {project.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={project.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3 py-2 text-sm bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
          >
            <option value="planning">Planning</option>
            <option value="development">Development</option>
            <option value="testing">Testing</option>
            <option value="live">Live</option>
            <option value="maintenance">Maintenance</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* 11 PRD Tabs */}
      <div className="flex gap-2 border-b border-[var(--border)] overflow-x-auto pb-px scrollbar-none">
        {(
          [
            'overview', 'milestones', 'credentials', 'urls', 'github', 'hosting', 
            'billing', 'client', 'team', 'documentation', 'notes'
          ] as const
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap capitalize ${
              activeTab === tab
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            {tab === 'urls' ? 'URLs' : tab === 'github' ? 'GitHub' : tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tab contents */}
      {/* 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-4">
              <h3 className="font-bold text-[var(--foreground)] text-lg">Project Details</h3>
              <button
                onClick={() => setIsEditingOverview(!isEditingOverview)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)] text-sm text-[var(--foreground)]"
              >
                <Edit size={14} />
                {isEditingOverview ? 'Cancel' : 'Edit Info'}
              </button>
            </div>

            {isEditingOverview ? (
              <form onSubmit={handleOverviewSave} className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Project Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Budget</label>
                    <input
                      type="number"
                      value={editBudget}
                      onChange={(e) => setEditBudget(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                    >
                      <option value="client_project">Client Project</option>
                      <option value="internal_project">Internal Project</option>
                      <option value="product">Product</option>
                      <option value="saas_product">SaaS Product</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Project Type</label>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                    >
                      <option value="website">Website</option>
                      <option value="full_stack">Full Stack</option>
                      <option value="crm">CRM</option>
                      <option value="erp">ERP</option>
                      <option value="mobile_app">Mobile App</option>
                      <option value="saas">SaaS</option>
                      <option value="ai_agent">AI Agent</option>
                      <option value="dashboard">Dashboard</option>
                      <option value="shopify_store">Shopify Store</option>
                      <option value="automation_system">Automation System</option>
                      <option value="internal_tool">Internal Tool</option>
                      <option value="marketing">Marketing</option>
                      <option value="seo">SEO</option>
                      <option value="cloud">Cloud</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Progress ({editProgress}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={editProgress}
                      onChange={(e) => setEditProgress(parseInt(e.target.value))}
                      className="w-full accent-[var(--accent)]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Description</label>
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-lg font-semibold flex items-center gap-1.5"
                  >
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-[var(--muted-foreground)] block mb-1">Client Company</span>
                    <span className="text-[var(--foreground)] font-semibold">{project.client?.company_name || 'No Client Linked'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[var(--muted-foreground)] block mb-1">Project Category</span>
                    <span className="text-[var(--foreground)] capitalize font-semibold">{project.category?.replace('_', ' ') || 'Client Project'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[var(--muted-foreground)] block mb-1">Start Date</span>
                    <span className="text-[var(--foreground)]">{project.start_date ? formatDate(project.start_date) : '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[var(--muted-foreground)] block mb-1">Target Deadline</span>
                    <span className="text-[var(--foreground)] font-semibold">{project.deadline ? formatDate(project.deadline) : '-'}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-[var(--muted-foreground)] block mb-1">Project Type</span>
                    <span className="text-[var(--foreground)] capitalize">{project.project_type || 'General'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[var(--muted-foreground)] block mb-1">Budget</span>
                    <span className="text-[var(--foreground)] font-semibold">{project.budget ? formatCurrency(project.budget) : 'Not Specified'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[var(--muted-foreground)] block mb-1">Progress</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-[var(--secondary)] rounded-full h-2 overflow-hidden max-w-[120px]">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-500"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-[var(--foreground)]">{project.progress}%</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-[var(--muted-foreground)] block mb-1">Manager</span>
                    <span className="text-[var(--foreground)] font-semibold">{project.manager?.full_name || 'Unassigned'}</span>
                  </div>
                </div>
                {project.description && (
                  <div className="col-span-2 pt-4 border-t border-[var(--border)]">
                    <span className="text-xs text-[var(--muted-foreground)] block mb-1">Description</span>
                    <p className="text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">{project.description}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-[var(--foreground)] text-sm border-b border-[var(--border)] pb-2">Quick Stats</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Status:</span>
                  <span className="font-semibold capitalize text-[var(--foreground)]">{project.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Priority:</span>
                  <span className="font-semibold capitalize text-[var(--foreground)]">{project.priority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Total Billing Items:</span>
                  <span className="font-semibold text-[var(--foreground)]">{(project.billing || []).length} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Total Monthly Costs:</span>
                  <span className="font-semibold text-rose-500">
                    {formatCurrency((project.billing || []).reduce((sum, b) => sum + (b.monthly_cost || 0), 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1.5 MILESTONES */}
      {activeTab === 'milestones' && (
        <div className="space-y-6">
          {/* Milestone Metrics Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm space-y-1">
              <span className="text-xs text-[var(--muted-foreground)] block font-medium">Total Milestones</span>
              <span className="text-2xl font-bold text-[var(--foreground)]">
                {project.milestones?.length || 0}
              </span>
            </div>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm space-y-1">
              <span className="text-xs text-[var(--muted-foreground)] block font-medium">Total Allocated Budget</span>
              <span className="text-2xl font-bold text-emerald-500">
                {formatCurrency(
                  project.milestones?.reduce((sum, m) => sum + (m.budget || 0), 0) || 0
                )}
              </span>
            </div>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm space-y-1">
              <span className="text-xs text-[var(--muted-foreground)] block font-medium">Overall Progress</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-[var(--secondary)] rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{
                      width: `${
                        project.milestones?.length
                          ? Math.round(
                              project.milestones.reduce((sum, m) => sum + (m.progress || 0), 0) /
                                project.milestones.length
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <span className="text-sm font-bold text-[var(--foreground)]">
                  {project.milestones?.length
                    ? Math.round(
                        project.milestones.reduce((sum, m) => sum + (m.progress || 0), 0) /
                          project.milestones.length
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Action Header */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-[var(--foreground)] text-lg">Project Milestones</h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Track deliverables, stages, and billable items</p>
            </div>
            <button
              onClick={() => {
                setEditingMilestone(null)
                setMsTitle('')
                setMsDescription('')
                setMsDueDate('')
                setMsStatus('pending')
                setMsProgress(0)
                setMsBudget('')
                setShowAddMilestone(true)
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-lg text-sm font-semibold transition-all shrink-0"
            >
              <Plus size={16} />
              Add Milestone
            </button>
          </div>

          {/* Milestones List */}
          {!project.milestones || project.milestones.length === 0 ? (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-10 text-center text-sm text-[var(--muted-foreground)]">
              No milestones registered for this project. Click "Add Milestone" to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {project.milestones.map((m) => (
                <div
                  key={m.id}
                  className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm space-y-4 hover:border-[var(--accent)]/30 transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-[var(--foreground)] text-base">{m.title}</h4>
                      {m.description && (
                        <p className="text-xs text-[var(--muted-foreground)] max-w-2xl">{m.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingMilestone(m)
                          setMsTitle(m.title)
                          setMsDescription(m.description || '')
                          setMsDueDate(m.due_date ? m.due_date.split('T')[0] : '')
                          setMsStatus(m.status)
                          setMsProgress(m.progress)
                          setMsBudget(m.budget ? String(m.budget) : '')
                          setShowAddMilestone(true)
                        }}
                        className="p-1.5 border border-[var(--border)] text-[var(--muted-foreground)] rounded hover:bg-[var(--secondary)] transition-all"
                        title="Edit Milestone"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteMilestone(m.id)}
                        className="p-1.5 border border-red-500/20 text-red-500 rounded hover:bg-red-500/5 transition-all"
                        title="Delete Milestone"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-[var(--muted-foreground)] block">Status</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-semibold border mt-1 text-[10px] uppercase ${getStatusColor(m.status)}`}>
                        {m.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--muted-foreground)] block">Due Date</span>
                      <span className="text-[var(--foreground)] font-semibold block mt-1.5">
                        {m.due_date ? formatDate(m.due_date) : 'No due date'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--muted-foreground)] block">Budget</span>
                      <span className="text-[var(--foreground)] font-bold block mt-1.5">
                        {m.budget ? formatCurrency(m.budget) : 'Not specified'}
                      </span>
                    </div>
                    <div className="flex flex-col justify-end">
                      <span className="text-[var(--muted-foreground)] block mb-1">Progress ({m.progress}%)</span>
                      <div className="flex-1 bg-[var(--secondary)] rounded-full h-2 overflow-hidden w-full max-w-[150px] mt-1">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-300"
                          style={{ width: `${m.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Linked Tasks List */}
                  <div className="mt-4 border-t border-[var(--border)] pt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h5 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                        <CheckSquare size={12} />
                        Linked Tasks
                      </h5>
                      <Link
                        href={`/tasks/new?project_id=${project.id}&milestone_id=${m.id}`}
                        className="text-[10px] text-[var(--accent)] font-semibold hover:underline flex items-center gap-1"
                      >
                        <Plus size={10} /> Add Task
                      </Link>
                    </div>

                    {!(project.tasks || []).filter(t => t.milestone_id === m.id).length ? (
                      <p className="text-[11px] text-[var(--muted-foreground)] italic pl-1">No tasks linked to this milestone yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                        {(project.tasks || []).filter(t => t.milestone_id === m.id).map(t => (
                          <div
                            key={t.id}
                            className="bg-[var(--secondary)]/20 border border-[var(--border)] rounded-lg p-2.5 flex items-center justify-between text-xs hover:border-[var(--accent)]/30 transition-colors"
                          >
                            <div className="space-y-1">
                              <Link
                                href={`/tasks/${t.id}`}
                                className="font-semibold text-[var(--foreground)] hover:underline block"
                              >
                                {t.title}
                              </Link>
                              <div className="flex items-center gap-2 text-[10px] text-[var(--muted-foreground)]">
                                <span>Assignee: {t.assignee?.full_name || 'Unassigned'}</span>
                                <span>•</span>
                                <span className="capitalize">{t.status}</span>
                              </div>
                            </div>
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-semibold border ${getStatusColor(t.status)}`}>
                              {t.status.toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {m.budget && m.budget > 0 && (
                    <div className="flex justify-end border-t border-[var(--border)] pt-3 mt-2">
                      {m.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-500 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                          <CheckCircle2 size={14} />
                          Milestone Fully Delivered & Invoiced
                        </span>
                      ) : (
                        <button
                          onClick={() => handleGenerateInvoice(m.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-all"
                        >
                          <FileText size={14} />
                          Deliver & Generate Invoice
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add/Edit Milestone Modal */}
          {showAddMilestone && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
              <div className="fixed inset-0" onClick={() => setShowAddMilestone(false)} />
              <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                <div className="p-6 border-b border-[var(--border)]">
                  <h3 className="text-lg font-bold text-[var(--foreground)]">
                    {editingMilestone ? 'Edit Milestone' : 'Add Project Milestone'}
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)]">Set deliverables, timelines, and payment budgets.</p>
                </div>
                <form onSubmit={handleMilestoneSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Milestone Title *</label>
                    <input
                      required
                      value={msTitle}
                      onChange={(e) => setMsTitle(e.target.value)}
                      placeholder="e.g. Phase 1: Prototype Sign-off"
                      className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Description</label>
                    <textarea
                      value={msDescription}
                      onChange={(e) => setMsDescription(e.target.value)}
                      placeholder="Describe the deliverables for this milestone..."
                      className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none h-20 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Due Date</label>
                      <input
                        type="date"
                        value={msDueDate}
                        onChange={(e) => setMsDueDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Budget (INR)</label>
                      <input
                        type="number"
                        value={msBudget}
                        onChange={(e) => setMsBudget(e.target.value)}
                        placeholder="e.g. 50000"
                        className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Status</label>
                      <select
                        value={msStatus}
                        onChange={(e) => setMsStatus(e.target.value as any)}
                        className="w-full px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">Progress ({msProgress}%)</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={msProgress}
                        onChange={(e) => setMsProgress(parseInt(e.target.value))}
                        className="w-full h-10 accent-[var(--accent)]"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-4 border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => setShowAddMilestone(false)}
                      className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-lg text-sm font-semibold"
                    >
                      Save Milestone
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. CREDENTIALS */}
      {activeTab === 'credentials' && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-[var(--foreground)] text-lg">Development Credentials</h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Secure dynamic database credentials vault</p>
            </div>
            <button
              onClick={() => {
                setEditingCred(null)
                setCredService('Supabase')
                setCredEmail('')
                setCredUsername('')
                setCredPassword('')
                setCredRecoveryEmail('')
                setCredRecoveryPhone('')
                setCredOwner('')
                setCredBillingOwner('')
                setCred2fa(false)
                setCredNotes('')
                setShowAddCred(true)
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-lg text-sm font-semibold transition-all shrink-0"
            >
              <Plus size={16} />
              Add Credential
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
              <input
                type="text"
                placeholder="Search credentials..."
                value={credSearch}
                onChange={(e) => setCredSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
              />
            </div>
            <select
              value={credServiceFilter}
              onChange={(e) => setCredServiceFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
            >
              <option value="">All Services</option>
              {DYNAMIC_SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* List Table */}
          <div className="border border-[var(--border)] rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-left text-[var(--foreground)]">
              <thead className="bg-[var(--secondary)] text-xs text-[var(--muted-foreground)] font-semibold uppercase border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Account Email</th>
                  <th className="px-4 py-3">Username / Owner</th>
                  <th className="px-4 py-3">Password</th>
                  <th className="px-4 py-3">2FA</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredCredentials.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-xs text-[var(--muted-foreground)]">
                      No credentials registered. Click "Add Credential" to secure service access logins.
                    </td>
                  </tr>
                ) : (
                  filteredCredentials.map(cred => (
                    <tr key={cred.id} className="hover:bg-[var(--secondary)]/30">
                      <td className="px-4 py-3 font-semibold text-[var(--foreground)]">{cred.service_name}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">{cred.account_email || '-'}</td>
                      <td className="px-4 py-3 text-xs">
                        {cred.username && <span className="block font-semibold">{cred.username}</span>}
                        {cred.account_owner && <span className="block text-[var(--muted-foreground)]">Owner: {cred.account_owner}</span>}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <div className="flex items-center gap-2">
                          <input
                            type={visiblePasswords[cred.id] ? 'text' : 'password'}
                            value={cred.password || ''}
                            readOnly
                            className="bg-transparent border-none text-xs w-[120px] focus:outline-none"
                          />
                          <button
                            onClick={() => togglePasswordVisibility(cred.id)}
                            className="p-1 hover:bg-[var(--secondary)] rounded text-[var(--muted-foreground)]"
                          >
                            {visiblePasswords[cred.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          {cred.password && (
                            <button
                              onClick={() => handleCopyText(cred.password || '', 'Password')}
                              className="p-1 hover:bg-[var(--secondary)] rounded text-[var(--muted-foreground)]"
                            >
                              <Copy size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          cred.two_factor_enabled 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {cred.two_factor_enabled ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleEditCredOpen(cred)}
                            className="p-1.5 border border-[var(--border)] hover:bg-[var(--secondary)] rounded-lg text-[var(--foreground)]"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteCred(cred.id)}
                            className="p-1.5 border border-red-500/20 hover:bg-red-500/10 text-rose-500 rounded-lg"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Add/Edit Credential Modal */}
          {showAddCred && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-lg overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
                <div className="p-5 border-b border-[var(--border)] flex justify-between items-center">
                  <h4 className="font-bold text-[var(--foreground)]">{editingCred ? 'Edit Credential' : 'Add Credential'}</h4>
                  <button onClick={() => setShowAddCred(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Cancel</button>
                </div>
                <form onSubmit={handleCredSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Service Name</label>
                      <select
                        value={credService}
                        onChange={(e) => setCredService(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                      >
                        {DYNAMIC_SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Account Email</label>
                      <input
                        type="email"
                        value={credEmail}
                        onChange={(e) => setCredEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Username (Optional)</label>
                      <input
                        type="text"
                        value={credUsername}
                        onChange={(e) => setCredUsername(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Password</label>
                      <input
                        type="text"
                        value={credPassword}
                        onChange={(e) => setCredPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Recovery Email</label>
                      <input
                        type="email"
                        value={credRecoveryEmail}
                        onChange={(e) => setCredRecoveryEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Recovery Mobile Number</label>
                      <input
                        type="text"
                        value={credRecoveryPhone}
                        onChange={(e) => setCredRecoveryPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Account Owner</label>
                      <input
                        type="text"
                        value={credOwner}
                        onChange={(e) => setCredOwner(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Billing Owner</label>
                      <input
                        type="text"
                        value={credBillingOwner}
                        onChange={(e) => setCredBillingOwner(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        id="2fa_check"
                        checked={cred2fa}
                        onChange={(e) => setCred2fa(e.target.checked)}
                        className="rounded accent-[var(--accent)]"
                      />
                      <label htmlFor="2fa_check" className="text-xs font-semibold text-[var(--foreground)]">Two Factor Enabled (Yes/No)</label>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Notes</label>
                      <textarea
                        value={credNotes}
                        onChange={(e) => setCredNotes(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-lg font-semibold flex items-center gap-1.5"
                    >
                      <Save size={16} /> Save Credential
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. URLS */}
      {activeTab === 'urls' && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-[var(--border)] pb-4">
            <div>
              <h3 className="font-bold text-[var(--foreground)] text-lg">Project Links & Access URLs</h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Quick access URLs for production, staging, and admin platforms</p>
            </div>
            <button
              onClick={() => setIsEditingUrls(!isEditingUrls)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)] text-sm text-[var(--foreground)]"
            >
              <Edit size={14} />
              {isEditingUrls ? 'Cancel' : 'Edit Links'}
            </button>
          </div>

          {isEditingUrls ? (
            <form onSubmit={handleUrlsSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Production URL', val: urlProd, setter: setUrlProd },
                { label: 'Staging URL', val: urlStaging, setter: setUrlStaging },
                { label: 'Admin Panel URL', val: urlAdmin, setter: setUrlAdmin },
                { label: 'API URL', val: urlApi, setter: setUrlApi },
                { label: 'Client Website URL', val: urlClient, setter: setUrlClient },
                { label: 'Documentation URL', val: urlDoc, setter: setUrlDoc },
                { label: 'Figma URL', val: urlFigma, setter: setUrlFigma },
                { label: 'Notion URL', val: urlNotion, setter: setUrlNotion },
                { label: 'Deployment URL', val: urlDeploy, setter: setUrlDeploy }
              ].map((field, idx) => (
                <div key={idx}>
                  <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">{field.label}</label>
                  <input
                    type="text"
                    value={field.val}
                    onChange={(e) => field.setter(e.target.value)}
                    placeholder="https://"
                    className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                  />
                </div>
              ))}
              <div className="sm:col-span-2 flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-lg font-semibold flex items-center gap-1.5"
                >
                  <Save size={16} /> Save Links
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {[
                { label: 'Production URL', val: project.production_url, icon: <Globe size={18} /> },
                { label: 'Staging URL', val: project.staging_url, icon: <Globe size={18} /> },
                { label: 'Admin Panel URL', val: project.admin_panel_url, icon: <Lock size={18} /> },
                { label: 'API URL', val: project.api_url, icon: <Server size={18} /> },
                { label: 'Client Website URL', val: project.client_website_url, icon: <Globe size={18} /> },
                { label: 'Documentation URL', val: project.documentation_url, icon: <FileText size={18} /> },
                { label: 'Figma URL', val: project.figma_url, icon: <FileBadge size={18} /> },
                { label: 'Notion URL', val: project.notion_url, icon: <FileText size={18} /> },
                { label: 'Deployment URL', val: project.deployment_url, icon: <Server size={18} /> }
              ].map((link, idx) => (
                <div key={idx} className="bg-[var(--secondary)]/20 border border-[var(--border)] rounded-xl p-4 flex flex-col justify-between h-[110px] hover:shadow-sm transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-[var(--muted-foreground)]">{link.label}</span>
                    <span className="text-[var(--accent)]">{link.icon}</span>
                  </div>
                  {link.val ? (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-semibold truncate flex-1 text-[var(--foreground)]">{link.val}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleCopyText(link.val || '', link.label)}
                          className="p-1 hover:bg-[var(--secondary)] rounded text-[var(--muted-foreground)]"
                          title="Copy Link"
                        >
                          <Copy size={13} />
                        </button>
                        <a
                          href={link.val}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 hover:bg-[var(--secondary)] rounded text-[var(--muted-foreground)]"
                          title="Open Link"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--muted-foreground)] italic mt-2">Not Configured</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. GITHUB */}
      {activeTab === 'github' && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-[var(--border)] pb-4">
            <div>
              <h3 className="font-bold text-[var(--foreground)] text-lg">GitHub Repository Details</h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Manage source code and repository access endpoints</p>
            </div>
            <button
              onClick={() => setIsEditingGithub(!isEditingGithub)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)] text-sm text-[var(--foreground)]"
            >
              <Edit size={14} />
              {isEditingGithub ? 'Cancel' : 'Edit Details'}
            </button>
          </div>

          {isEditingGithub ? (
            <form onSubmit={handleGithubSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">GitHub Repository URL</label>
                <input
                  type="text"
                  value={gitRepo}
                  onChange={(e) => setGitRepo(e.target.value)}
                  placeholder="https://github.com/org/repo"
                  className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">GitHub Organization URL</label>
                <input
                  type="text"
                  value={gitOrg}
                  onChange={(e) => setGitOrg(e.target.value)}
                  placeholder="https://github.com/org"
                  className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">GitHub Username</label>
                <input
                  type="text"
                  value={gitUser}
                  onChange={(e) => setGitUser(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">GitHub Account Email</label>
                <input
                  type="email"
                  value={gitEmail}
                  onChange={(e) => setGitEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-lg font-semibold flex items-center gap-1.5"
                >
                  <Save size={16} /> Save Github Info
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="bg-[var(--secondary)]/10 border border-[var(--border)] rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Github size={24} className="text-[var(--foreground)]" />
                  <div>
                    <h4 className="font-bold text-[var(--foreground)]">Repository</h4>
                    <p className="text-xs text-[var(--muted-foreground)]">Code location endpoints</p>
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <div>
                    <span className="text-xs text-[var(--muted-foreground)] block">Repo Link</span>
                    {project.github_repo_url ? (
                      <div className="flex items-center gap-2 mt-0.5">
                        <a href={project.github_repo_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[var(--accent)] hover:underline truncate flex-1">{project.github_repo_url}</a>
                        <button onClick={() => handleCopyText(project.github_repo_url || '', 'GitHub URL')} className="p-1 hover:bg-[var(--secondary)] rounded text-[var(--muted-foreground)]"><Copy size={12} /></button>
                      </div>
                    ) : <span className="text-xs text-[var(--muted-foreground)] italic">Not Set</span>}
                  </div>
                  <div>
                    <span className="text-xs text-[var(--muted-foreground)] block">Organization</span>
                    {project.github_org_url ? (
                      <div className="flex items-center gap-2 mt-0.5">
                        <a href={project.github_org_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[var(--foreground)] hover:underline truncate flex-1">{project.github_org_url}</a>
                        <button onClick={() => handleCopyText(project.github_org_url || '', 'Organization URL')} className="p-1 hover:bg-[var(--secondary)] rounded text-[var(--muted-foreground)]"><Copy size={12} /></button>
                      </div>
                    ) : <span className="text-xs text-[var(--muted-foreground)] italic">Not Set</span>}
                  </div>
                </div>
              </div>

              <div className="bg-[var(--secondary)]/10 border border-[var(--border)] rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Lock size={24} className="text-[var(--foreground)]" />
                  <div>
                    <h4 className="font-bold text-[var(--foreground)]">Account Settings</h4>
                    <p className="text-xs text-[var(--muted-foreground)]">Assigned credentials settings</p>
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <div>
                    <span className="text-xs text-[var(--muted-foreground)] block">Username</span>
                    <span className="text-xs font-semibold text-[var(--foreground)] mt-0.5 block">{project.github_username || <span className="italic text-[var(--muted-foreground)]">Not Configured</span>}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[var(--muted-foreground)] block">Account Email</span>
                    <span className="text-xs font-semibold text-[var(--foreground)] mt-0.5 block">{project.github_email || <span className="italic text-[var(--muted-foreground)]">Not Configured</span>}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. HOSTING */}
      {activeTab === 'hosting' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-4">
              <div>
                <h3 className="font-bold text-[var(--foreground)] text-lg">Hosting & Deployment Platform</h3>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Details of infrastructure, hosting, and pipeline setups</p>
              </div>
              <button
                onClick={() => setIsEditingHosting(!isEditingHosting)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)] text-sm text-[var(--foreground)] shrink-0"
              >
                <Edit size={14} />
                {isEditingHosting ? 'Cancel' : 'Edit Setup'}
              </button>
            </div>

            {isEditingHosting ? (
              <form onSubmit={handleHostingSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Frontend Tech Stack</label>
                  <input type="text" value={hostFrontend} onChange={(e) => setHostFrontend(e.target.value)} placeholder="e.g. Next.js, React" className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Backend Tech Stack</label>
                  <input type="text" value={hostBackend} onChange={(e) => setHostBackend(e.target.value)} placeholder="e.g. NodeJs, FastAPI" className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Database Tech</label>
                  <input type="text" value={hostDatabase} onChange={(e) => setHostDatabase(e.target.value)} placeholder="e.g. PostgreSQL, MongoDB" className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Hosting Provider</label>
                  <input type="text" value={hostProvider} onChange={(e) => setHostProvider(e.target.value)} placeholder="e.g. Vercel, Railway, AWS" className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Domain Provider</label>
                  <input type="text" value={hostDomain} onChange={(e) => setHostDomain(e.target.value)} placeholder="e.g. GoDaddy, Hostinger" className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">SSL Provider</label>
                  <input type="text" value={hostSsl} onChange={(e) => setHostSsl(e.target.value)} placeholder="e.g. Cloudflare, Let's Encrypt" className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">CDN Provider</label>
                  <input type="text" value={hostCdn} onChange={(e) => setHostCdn(e.target.value)} className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Storage Provider</label>
                  <input type="text" value={hostStorage} onChange={(e) => setHostStorage(e.target.value)} className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Email Provider</label>
                  <input type="text" value={hostEmail} onChange={(e) => setHostEmail(e.target.value)} className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Deployment Method</label>
                  <input type="text" value={hostMethod} onChange={(e) => setHostMethod(e.target.value)} className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Branch Name</label>
                  <input type="text" value={hostBranch} onChange={(e) => setHostBranch(e.target.value)} className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Environment Type</label>
                  <input type="text" value={hostEnv} onChange={(e) => setHostEnv(e.target.value)} placeholder="e.g. Staging, Production" className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Deployment Notes</label>
                  <textarea value={hostNotes} onChange={(e) => setHostNotes(e.target.value)} rows={3} className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none" />
                </div>
                <div className="sm:col-span-2 flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                  <button type="submit" className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-lg font-semibold flex items-center gap-1.5"><Save size={16} /> Save Setup</button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                {[
                  { label: 'Frontend Technology', val: hostFrontend },
                  { label: 'Backend Technology', val: hostBackend },
                  { label: 'Database Technology', val: hostDatabase },
                  { label: 'Hosting Provider', val: hostProvider },
                  { label: 'Domain Registrar', val: hostDomain },
                  { label: 'SSL Provider', val: hostSsl },
                  { label: 'CDN Provider', val: hostCdn },
                  { label: 'Storage Provider', val: hostStorage },
                  { label: 'Email Provider', val: hostEmail },
                  { label: 'Deployment Method', val: hostMethod },
                  { label: 'Deploy Branch', val: hostBranch },
                  { label: 'Environment Type', val: hostEnv }
                ].map((item, idx) => (
                  <div key={idx} className="border-b border-[var(--border)] pb-2">
                    <span className="text-xs text-[var(--muted-foreground)] block">{item.label}</span>
                    <span className="font-semibold text-[var(--foreground)] mt-0.5 block">{item.val || '-'}</span>
                  </div>
                ))}
                {hostNotes && (
                  <div className="sm:col-span-2 bg-[var(--secondary)]/10 p-4 rounded-xl border border-[var(--border)] mt-2">
                    <span className="text-xs text-[var(--muted-foreground)] font-bold block mb-1">Deployment Notes</span>
                    <p className="text-xs leading-relaxed text-[var(--foreground)] whitespace-pre-wrap">{hostNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Checklists Sidebar */}
          <div className="space-y-6">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-[var(--foreground)] text-sm border-b border-[var(--border)] pb-2 flex items-center gap-2"><CheckSquare size={16} /> Deploy Checklist</h3>
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {hostDeployChecklist.length === 0 ? (
                  <p className="text-xs text-[var(--muted-foreground)] italic">No tasks added.</p>
                ) : (
                  hostDeployChecklist.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 justify-between py-1 text-xs">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleToggleChecklist('deploy', idx)}
                          className="rounded accent-[var(--accent)]"
                        />
                        <span className={item.completed ? 'line-through text-[var(--muted-foreground)]' : 'text-[var(--foreground)]'}>{item.text}</span>
                      </div>
                      <button onClick={() => handleRemoveChecklistItem('deploy', idx)} className="text-rose-500 hover:text-rose-700"><Trash2 size={12} /></button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-[var(--foreground)] text-sm border-b border-[var(--border)] pb-2 flex items-center gap-2"><CheckSquare size={16} /> Production Checklist</h3>
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {hostProdChecklist.length === 0 ? (
                  <p className="text-xs text-[var(--muted-foreground)] italic">No tasks added.</p>
                ) : (
                  hostProdChecklist.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 justify-between py-1 text-xs">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleToggleChecklist('prod', idx)}
                          className="rounded accent-[var(--accent)]"
                        />
                        <span className={item.completed ? 'line-through text-[var(--muted-foreground)]' : 'text-[var(--foreground)]'}>{item.text}</span>
                      </div>
                      <button onClick={() => handleRemoveChecklistItem('prod', idx)} className="text-rose-500 hover:text-rose-700"><Trash2 size={12} /></button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick add checklist items */}
            <form onSubmit={handleAddChecklistItem} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 space-y-3">
              <span className="text-xs font-semibold text-[var(--foreground)] block">Add Checklist Item</span>
              <input
                type="text"
                placeholder="Item text..."
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-[var(--card)] border border-[var(--border)] rounded text-[var(--foreground)] focus:outline-none"
              />
              <div className="flex justify-between items-center">
                <select
                  value={checklistType}
                  onChange={(e) => setChecklistType(e.target.value as any)}
                  className="px-2 py-1 text-[10px] bg-[var(--card)] border border-[var(--border)] rounded text-[var(--foreground)]"
                >
                  <option value="deploy">Deployment</option>
                  <option value="prod">Production</option>
                </select>
                <button type="submit" className="px-3 py-1 bg-[var(--accent)] text-white text-[10px] font-bold rounded">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. BILLING */}
      {activeTab === 'billing' && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-[var(--foreground)] text-lg">Billing & Recurring Subscriptions</h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Track domain names, hosting, SaaS subscriptions, and costs</p>
            </div>
            <button
              onClick={() => {
                setEditingBilling(null)
                setBillService('')
                setBillMonthly('')
                setBillYearly('')
                setBillCurrency('INR')
                setBillRenewalDate('')
                setBillFrequency('monthly')
                setBillStatus('pending')
                setBillPaidBy('scalezix')
                setBillInvoiceLink('')
                setBillNotes('')
                setShowAddBilling(true)
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-lg text-sm font-semibold transition-all shrink-0"
            >
              <Plus size={16} />
              Add Cost Record
            </button>
          </div>

          {/* Costs Table */}
          <div className="border border-[var(--border)] rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-left text-[var(--foreground)]">
              <thead className="bg-[var(--secondary)] text-xs text-[var(--muted-foreground)] font-semibold uppercase border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-3">Service Name</th>
                  <th className="px-4 py-3">Frequency</th>
                  <th className="px-4 py-3">Paid By</th>
                  <th className="px-4 py-3">Renewal Date</th>
                  <th className="px-4 py-3">Cost Details</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {(project.billing || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-xs text-[var(--muted-foreground)]">
                      No recurring subscription costs logged. Click "Add Cost Record" to trace operational costs.
                    </td>
                  </tr>
                ) : (
                  (project.billing || []).map(bill => (
                    <tr key={bill.id} className="hover:bg-[var(--secondary)]/30">
                      <td className="px-4 py-3 font-semibold text-[var(--foreground)]">
                        {bill.service_name}
                        {bill.invoice_link && (
                          <a href={bill.invoice_link} target="_blank" rel="noreferrer" className="inline-flex items-center text-[10px] text-[var(--accent)] hover:underline ml-1.5"><ExternalLink size={10} className="mr-0.5" /> Invoice</a>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs capitalize">{bill.billing_frequency?.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-xs capitalize">{bill.paid_by}</td>
                      <td className="px-4 py-3 text-xs font-medium text-[var(--foreground)]">
                        {bill.renewal_date ? formatDate(bill.renewal_date) : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold">
                        <span className="block text-[var(--foreground)]">{bill.currency} {bill.monthly_cost}/mo</span>
                        <span className="block text-[var(--muted-foreground)] font-medium">{bill.currency} {bill.yearly_cost}/yr</span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          bill.payment_status === 'paid' 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : bill.payment_status === 'pending'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        }`}>
                          {bill.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleEditBillingOpen(bill)}
                            className="p-1.5 border border-[var(--border)] hover:bg-[var(--secondary)] rounded-lg text-[var(--foreground)]"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteBilling(bill.id)}
                            className="p-1.5 border border-red-500/20 hover:bg-red-500/10 text-rose-500 rounded-lg"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Add/Edit Billing Modal */}
          {showAddBilling && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-lg overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
                <div className="p-5 border-b border-[var(--border)] flex justify-between items-center">
                  <h4 className="font-bold text-[var(--foreground)]">{editingBilling ? 'Edit Cost Record' : 'Add Cost Record'}</h4>
                  <button onClick={() => setShowAddBilling(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Cancel</button>
                </div>
                <form onSubmit={handleBillingSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Service / Host Name</label>
                      <input
                        type="text"
                        value={billService}
                        onChange={(e) => setBillService(e.target.value)}
                        placeholder="e.g. Domain Name, Supabase Pro"
                        required
                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Renewal Date</label>
                      <input
                        type="date"
                        value={billRenewalDate}
                        onChange={(e) => setBillRenewalDate(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Monthly Cost</label>
                      <input
                        type="number"
                        step="0.01"
                        value={billMonthly}
                        onChange={(e) => setBillMonthly(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Yearly Cost</label>
                      <input
                        type="number"
                        step="0.01"
                        value={billYearly}
                        onChange={(e) => setBillYearly(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Currency</label>
                      <input
                        type="text"
                        value={billCurrency}
                        onChange={(e) => setBillCurrency(e.target.value)}
                        placeholder="INR, USD"
                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Billing Frequency</label>
                      <select
                        value={billFrequency}
                        onChange={(e) => setBillFrequency(e.target.value as any)}
                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="half_yearly">Half Yearly</option>
                        <option value="yearly">Yearly</option>
                        <option value="one_time">One Time</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Payment Status</label>
                      <select
                        value={billStatus}
                        onChange={(e) => setBillStatus(e.target.value as any)}
                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                      >
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Paid By</label>
                      <select
                        value={billPaidBy}
                        onChange={(e) => setBillPaidBy(e.target.value as any)}
                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                      >
                        <option value="client">Client</option>
                        <option value="scalezix">Scalezix</option>
                        <option value="shared">Shared</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Invoice Receipt URL</label>
                      <input
                        type="text"
                        value={billInvoiceLink}
                        onChange={(e) => setBillInvoiceLink(e.target.value)}
                        placeholder="https://"
                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Notes</label>
                      <textarea
                        value={billNotes}
                        onChange={(e) => setBillNotes(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-lg font-semibold flex items-center gap-1.5"
                    >
                      <Save size={16} /> Save Record
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. CLIENT */}
      {activeTab === 'client' && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-6">
          <h3 className="font-bold text-[var(--foreground)] text-lg border-b border-[var(--border)] pb-4">Client Company Details</h3>
          {project.client ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
              <div>
                <span className="text-xs text-[var(--muted-foreground)] block">Company Name</span>
                <span className="font-bold text-[var(--foreground)] mt-0.5 block">{project.client.company_name}</span>
              </div>
              <div>
                <span className="text-xs text-[var(--muted-foreground)] block">Website</span>
                <span className="font-semibold text-[var(--foreground)] mt-0.5 block">
                  {project.client.website ? (
                    <a href={project.client.website} target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline flex items-center gap-1">{project.client.website} <ExternalLink size={12} /></a>
                  ) : '-'}
                </span>
              </div>
              <div>
                <span className="text-xs text-[var(--muted-foreground)] block">Industry</span>
                <span className="font-semibold text-[var(--foreground)] mt-0.5 block">{project.client.industry || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-[var(--muted-foreground)] block">GST Number</span>
                <span className="font-mono text-[var(--foreground)] mt-0.5 block">{project.client.gst_number || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-[var(--muted-foreground)] block">PAN Number</span>
                <span className="font-mono text-[var(--foreground)] mt-0.5 block">{project.client.pan_number || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-[var(--muted-foreground)] block">Billing / Company Address</span>
                <span className="font-semibold text-[var(--foreground)] mt-0.5 block">
                  {project.client.address 
                    ? `${project.client.address.street || ''}, ${project.client.address.city || ''}, ${project.client.address.state || ''} ${project.client.address.zip || ''}`
                    : '-'
                  }
                </span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[var(--muted-foreground)]">
              No Client linked to this project.
            </div>
          )}
        </div>
      )}

      {/* 8. TEAM ACCESS */}
      {activeTab === 'team' && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-[var(--border)] pb-4">
            <div>
              <h3 className="font-bold text-[var(--foreground)] text-lg">Team Access Management</h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Manage access permissions for developer members on the team</p>
            </div>
            <button
              onClick={() => setShowAddMember(!showAddMember)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-lg text-sm font-semibold transition-all shrink-0"
            >
              <UserPlus size={16} /> Add Developer
            </button>
          </div>

          {showAddMember && (
            <form onSubmit={handleAddMemberSubmit} className="bg-[var(--secondary)]/15 border border-[var(--border)] rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-end text-sm">
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Select Developer</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                >
                  <option value="">Choose User...</option>
                  {systemUsers
                    .filter(u => !(project.members || []).some(m => m.user_id === u.id))
                    .map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>)
                  }
                </select>
              </div>
              <div className="w-full sm:w-[150px]">
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">Project Role</label>
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
                >
                  <option value="project_manager">Manager</option>
                  <option value="developer">Developer</option>
                  <option value="intern">Intern</option>
                </select>
              </div>
              <button type="submit" className="px-4 py-2 bg-[var(--accent)] text-white font-semibold rounded-lg shrink-0">Add Member</button>
            </form>
          )}

          {/* Members Permissions Table */}
          <div className="border border-[var(--border)] rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-left text-[var(--foreground)]">
              <thead className="bg-[var(--secondary)] text-xs text-[var(--muted-foreground)] font-semibold uppercase border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-3">Team Member</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">GitHub</th>
                  <th className="px-4 py-3">Vercel</th>
                  <th className="px-4 py-3">Supabase</th>
                  <th className="px-4 py-3">Railway</th>
                  <th className="px-4 py-3">Prod Env</th>
                  <th className="px-4 py-3">Billing</th>
                  <th className="px-4 py-3 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {(project.members || []).length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-xs text-[var(--muted-foreground)]">
                      No developers assigned to this project. Add users above.
                    </td>
                  </tr>
                ) : (
                  (project.members || []).map(member => (
                    <tr key={member.id} className="hover:bg-[var(--secondary)]/30">
                      <td className="px-4 py-3 font-semibold text-[var(--foreground)]">
                        {member.user?.full_name}
                        <span className="block text-[10px] text-[var(--muted-foreground)] font-normal">{member.user?.email}</span>
                      </td>
                      <td className="px-4 py-3 text-xs capitalize font-medium">{member.role}</td>
                      {[
                        { name: 'github', val: member.github_access },
                        { name: 'vercel', val: member.vercel_access },
                        { name: 'supabase', val: member.supabase_access },
                        { name: 'railway', val: member.railway_access },
                        { name: 'production', val: member.production_access },
                        { name: 'billing', val: member.billing_access }
                      ].map((perm, idx) => (
                        <td key={idx} className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={perm.val}
                            onChange={(e) => handlePermissionToggle(member, perm.name, e.target.checked)}
                            className="rounded accent-[var(--accent)] cursor-pointer"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRemoveMemberSubmit(member.user_id)}
                          className="p-1 hover:bg-rose-500/10 text-rose-500 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 9. DOCUMENTATION */}
      {activeTab === 'documentation' && (
        <form onSubmit={handleDocumentationSave} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-[var(--border)] pb-4">
            <div>
              <h3 className="font-bold text-[var(--foreground)] text-lg">Documentation & Setup Guides</h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Deployment instructions, setup parameters, and client guidelines</p>
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-lg text-sm font-semibold transition-all shrink-0"
            >
              <Save size={16} /> Save Documentation
            </button>
          </div>

          <div className="space-y-6 text-sm">
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1 uppercase tracking-wider">Production Deployment Instructions</label>
              <textarea
                value={docDeploy}
                onChange={(e) => setDocDeploy(e.target.value)}
                placeholder="Step-by-step guides for builds, environments, hooks..."
                rows={4}
                className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1 uppercase tracking-wider">Client Requirements & Specifications</label>
              <textarea
                value={docRequirements}
                onChange={(e) => setDocRequirements(e.target.value)}
                placeholder="Product outlines, SaaS configurations, custom requests..."
                rows={4}
                className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1 uppercase tracking-wider">Important Operations Instructions</label>
              <textarea
                value={docImportant}
                onChange={(e) => setDocImportant(e.target.value)}
                placeholder="API limits, security policies, critical dependencies..."
                rows={4}
                className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1 uppercase tracking-wider">Project General Documentation</label>
              <textarea
                value={docMain}
                onChange={(e) => setDocMain(e.target.value)}
                placeholder="Overview architectures, frameworks, APIs documentation..."
                rows={6}
                className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none"
              />
            </div>
          </div>
        </form>
      )}

      {/* 10. NOTES */}
      {activeTab === 'notes' && (
        <form onSubmit={handleDocumentationSave} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-[var(--border)] pb-4">
            <div>
              <h3 className="font-bold text-[var(--foreground)] text-lg">Project Notes</h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Freeform project notes and operation memos</p>
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-lg text-sm font-semibold transition-all shrink-0"
            >
              <Save size={16} /> Save Notes
            </button>
          </div>

          <textarea
            value={docNotes}
            onChange={(e) => setDocNotes(e.target.value)}
            placeholder="Type any miscellaneous notes, links, passwords helper info here..."
            rows={12}
            className="w-full px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] text-sm focus:outline-none"
          />
        </form>
      )}
    </div>
  )
}
