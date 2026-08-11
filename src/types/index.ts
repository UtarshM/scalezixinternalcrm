// Type definitions for the Scalezix CRM

export type UserRole = 'admin' | 'project_manager' | 'team_member'

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  phone: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  company_name: string
  gst_number: string | null
  pan_number: string | null
  address: {
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  } | null
  website: string | null
  industry: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  contacts?: Contact[]
}

export interface Contact {
  id: string
  client_id: string
  name: string
  designation: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  birthday: string | null
  is_primary: boolean
  notes: string | null
  created_at: string
}

export type LeadSource = 'website' | 'referral' | 'linkedin' | 'cold_call' | 'social_media' | 'event' | 'other'
export type LeadStatus = 'new' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface Lead {
  id: string
  title: string
  company_name: string | null
  contact_name: string | null
  email: string | null
  phone: string | null
  source: LeadSource | null
  referred_by: string | null
  status: LeadStatus
  priority: Priority
  industry: string | null
  expected_budget: number | null
  expected_close_date: string | null
  lead_score: number
  owner_id: string | null
  client_id: string | null
  tags: string[]
  drive_link?: string | null
  custom_fields: Record<string, unknown>
  created_by: string | null
  created_at: string
  updated_at: string
  owner?: User
  notes?: LeadNote[]
  followups?: LeadFollowup[]
}

export interface LeadNote {
  id: string
  lead_id: string
  content: string
  created_by: string | null
  created_at: string
  user?: User
}

export interface LeadFollowup {
  id: string
  lead_id: string
  type: 'call' | 'email' | 'meeting' | 'whatsapp' | 'other'
  scheduled_at: string
  completed_at: string | null
  notes: string | null
  created_by: string | null
  created_at: string
}

export type ProjectCategory = 'client_project' | 'internal_project' | 'product' | 'saas_product'
export type ProjectType = 'website' | 'full_stack' | 'crm' | 'erp' | 'mobile_app' | 'saas' | 'ai_agent' | 'dashboard' | 'shopify_store' | 'automation_system' | 'internal_tool' | 'marketing' | 'seo' | 'cloud' | 'custom'
export type ProjectStatus = 'planning' | 'development' | 'testing' | 'live' | 'maintenance' | 'completed' | 'on_hold' | 'cancelled'

export interface Credential {
  id: string
  project_id: string
  service_name: string
  account_email: string | null
  username: string | null
  password: string | null
  recovery_email: string | null
  recovery_phone: string | null
  account_owner: string | null
  billing_owner: string | null
  two_factor_enabled: boolean
  notes: string | null
  created_at: string
  updated_at: string
  project?: Project
}

export interface HostingDeployment {
  id: string
  project_id: string
  frontend_tech: string | null
  backend_tech: string | null
  database_tech: string | null
  hosting_provider: string | null
  domain_provider: string | null
  ssl_provider: string | null
  cdn_provider: string | null
  storage_provider: string | null
  email_provider: string | null
  deployment_method: string | null
  branch_name: string | null
  environment_type: string | null
  deployment_notes: string | null
  deployment_checklist: { text: string; completed: boolean }[]
  production_checklist: { text: string; completed: boolean }[]
  created_at: string
  updated_at: string
  project?: Project
}

export interface BillingRenewal {
  id: string
  project_id: string
  service_name: string
  monthly_cost: number
  yearly_cost: number
  currency: string
  renewal_date: string | null
  billing_frequency: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'one_time'
  payment_status: 'paid' | 'pending' | 'overdue'
  paid_by: 'client' | 'scalezix' | 'shared'
  invoice_link: string | null
  notes: string | null
  created_at: string
  updated_at: string
  project?: Project
}

export interface Documentation {
  id: string
  project_id: string
  notes: string | null
  documentation: string | null
  deployment_instructions: string | null
  client_requirements: string | null
  important_instructions: string | null
  created_at: string
  updated_at: string
  project?: Project
}

export interface Project {
  id: string
  project_id: string
  name: string
  description: string | null
  client_id: string | null
  category: ProjectCategory
  project_type: ProjectType | null
  status: ProjectStatus
  priority: Priority
  start_date: string | null
  deadline: string | null
  budget: number | null
  estimated_hours: number | null
  actual_hours: number
  drive_link?: string | null
  progress: number
  manager_id: string | null
  production_url: string | null
  staging_url: string | null
  admin_panel_url: string | null
  api_url: string | null
  client_website_url: string | null
  documentation_url: string | null
  figma_url: string | null
  notion_url: string | null
  deployment_url: string | null
  github_repo_url: string | null
  github_org_url: string | null
  github_username: string | null
  github_email: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  client?: Client
  manager?: User
  members?: ProjectMember[]
  milestones?: Milestone[]
  tasks?: Task[]
  credentials?: Credential[]
  hosting?: HostingDeployment | null
  billing?: BillingRenewal[]
  documentation?: Documentation | null
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: string
  joined_at: string
  github_access: boolean
  vercel_access: boolean
  supabase_access: boolean
  railway_access: boolean
  production_access: boolean
  client_access: boolean
  billing_access: boolean
  user?: User
}

export interface Milestone {
  id: string
  project_id: string
  title: string
  description: string | null
  due_date: string | null
  status: 'pending' | 'in_progress' | 'completed'
  progress: number
  budget: number | null
  sort_order: number
  created_at: string
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'testing' | 'completed' | 'blocked'

export interface Task {
  id: string
  title: string
  description: string | null
  project_id: string | null
  milestone_id: string | null
  assigned_to: string | null
  status: TaskStatus
  priority: Priority
  due_date: string | null
  estimated_hours: number | null
  actual_hours: number
  is_recurring: boolean
  recurrence_rule: string | null
  parent_task_id: string | null
  dependencies: string[]
  sort_order: number
  checklist: { text: string; completed: boolean }[]
  created_by: string | null
  created_at: string
  updated_at: string
  project?: Project
  milestone?: Milestone
  assignee?: User
  subtasks?: Subtask[]
  comments?: TaskComment[]
  time_logs?: TimeLog[]
}

export interface Subtask {
  id: string
  task_id: string
  title: string
  is_completed: boolean
  sort_order: number
  created_at: string
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string | null
  content: string
  mentions: string[]
  created_at: string
  updated_at: string
  user?: User
}

export interface TimeLog {
  id: string
  task_id: string | null
  user_id: string | null
  start_time: string
  end_time: string | null
  duration_minutes: number | null
  is_billable: boolean
  is_manual: boolean
  notes: string | null
  created_at: string
  user?: User
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

export interface Invoice {
  id: string
  invoice_number: string
  client_id: string | null
  project_id: string | null
  status: InvoiceStatus
  issue_date: string
  due_date: string | null
  subtotal: number
  discount_type: 'percentage' | 'fixed' | null
  discount_value: number
  tax_type: string
  cgst_rate: number
  sgst_rate: number
  igst_rate: number
  tax_amount: number
  total: number
  amount_paid: number
  notes: string | null
  terms: string | null
  footer: string | null
  qr_code_url: string | null
  signature_url: string | null
  is_recurring: boolean
  recurrence_interval: string | null
  next_recurrence_date: string | null
  pdf_url: string | null
  drive_link?: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  client?: Client
  project?: Project
  items?: InvoiceItem[]
  payments?: Payment[]
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
  hsn_code: string | null
  sort_order: number
  created_at: string
}

export type QuotationStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired'

export interface Quotation {
  id: string
  quotation_number: string
  client_id: string | null
  lead_id: string | null
  status: QuotationStatus
  version: number
  valid_until: string | null
  subtotal: number
  discount_type: 'percentage' | 'fixed' | null
  discount_value: number
  tax_amount: number
  total: number
  notes: string | null
  terms: string | null
  converted_to_invoice_id: string | null
  converted_to_project_id: string | null
  pdf_url: string | null
  drive_link?: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  client?: Client
  lead?: Lead
  items?: QuotationItem[]
}

export interface QuotationItem {
  id: string
  quotation_id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
  sort_order: number
  created_at: string
}

export type PaymentMethod = 'upi' | 'bank_transfer' | 'cash' | 'cheque' | 'online'
export type PaymentStatus = 'pending' | 'partially_paid' | 'paid' | 'overdue' | 'refunded'

export interface Payment {
  id: string
  invoice_id: string | null
  client_id: string | null
  amount: number
  payment_method: PaymentMethod | null
  status: PaymentStatus
  payment_date: string | null
  reference_number: string | null
  notes: string | null
  receipt_url: string | null
  created_by: string | null
  created_at: string
  client?: Client
  invoice?: Invoice
  gst_amount?: number
  total_amount_received?: number
  category?: string
  received_in_account?: string | null
  invoice_number?: string
  project_id?: string | null
  project?: Project
  bank_account?: BankAccount
}

export interface Expense {
  id: string
  title: string
  category: string | null
  amount: number
  date: string
  project_id: string | null
  vendor_id: string | null
  receipt_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  notes: string | null
  is_recurring: boolean
  created_by: string | null
  created_at: string
  project?: Project
  vendor?: Vendor
  gst_amount?: number
  total_amount?: number
  paid_to?: string
  paid_by?: string
  payment_method?: string
}

export interface BankAccount {
  id: string
  bank_name: string
  account_holder_name: string
  account_number: string | null
  upi_id: string | null
  current_balance: number
  account_type: 'savings' | 'current' | 'settlement' | 'credit_card' | 'other'
  created_at: string
  updated_at: string
}

export interface FounderWithdrawal {
  id: string
  date: string
  amount: number
  reason: string | null
  account_used: string | null
  created_by: string | null
  created_at: string
  bank_account?: BankAccount
  user?: User
}

export interface Subscription {
  id: string
  name: string
  monthly_cost: number
  yearly_cost: number
  renewal_date: string | null
  auto_renewal: boolean
  payment_method: string | null
  category: 'software' | 'hosting' | 'marketing' | 'office' | 'other'
  created_at: string
  updated_at: string
}

export interface Vendor {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  gst_number: string | null
  address: Record<string, string> | null
  notes: string | null
  created_at: string
}

export interface Contract {
  id: string
  title: string
  client_id: string | null
  project_id: string | null
  status: 'draft' | 'active' | 'expired' | 'terminated'
  start_date: string | null
  end_date: string | null
  value: number | null
  document_url: string | null
  signed_url: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  client?: Client
  project?: Project
}

export interface Document {
  id: string
  name: string
  file_url: string
  file_type: string | null
  file_size: number | null
  folder_id: string | null
  project_id: string | null
  client_id: string | null
  version: number
  is_shared: boolean
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

export interface Folder {
  id: string
  name: string
  parent_id: string | null
  type: string
  project_id: string | null
  client_id: string | null
  created_by: string | null
  created_at: string
  children?: Folder[]
  documents?: Document[]
}

export interface Employee {
  id: string
  user_id: string | null
  employee_id: string | null
  department: string | null
  designation: string | null
  joining_date: string | null
  resignation_date: string | null
  salary: number | null
  bank_details: Record<string, string> | null
  emergency_contact: Record<string, string> | null
  documents: { name: string; url: string }[]
  status: 'active' | 'on_notice' | 'resigned' | 'terminated'
  created_at: string
  updated_at: string
  user?: User
}

export interface LeaveRequest {
  id: string
  employee_id: string
  leave_type: string
  start_date: string
  end_date: string
  reason: string | null
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  approved_by: string | null
  created_at: string
  employee?: Employee
}

export interface Activity {
  id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  entity_name: string | null
  details: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
  user?: User
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string | null
  type: string | null
  entity_type: string | null
  entity_id: string | null
  is_read: boolean
  is_email_sent: boolean
  created_at: string
}

export interface CalendarEvent {
  id: string
  title: string
  description: string | null
  type: 'meeting' | 'deadline' | 'task' | 'leave' | 'invoice_due' | 'follow_up' | 'other'
  start_time: string
  end_time: string | null
  all_day: boolean
  entity_type: string | null
  entity_id: string | null
  attendees: string[]
  location: string | null
  google_event_id: string | null
  created_by: string | null
  created_at: string
}

export interface Setting {
  id: string
  key: string
  value: Record<string, unknown>
  updated_by: string | null
  updated_at: string
}

// Dashboard widget types
export interface DashboardStats {
  totalRevenue: number
  monthlyRevenue: number
  activeProjects: number
  completedProjects: number
  openTasks: number
  overdueTasks: number
  pendingInvoices: number
  pendingPayments: number
  teamUtilization: number
  monthlyProfit: number
}
