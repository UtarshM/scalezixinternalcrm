-- ============================================================
-- SCALEZIX OS CRM — Complete Database Schema
-- Version 1.0
-- ============================================================

-- ============================================================
-- 1. USERS & ROLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'team_member' CHECK (role IN ('admin', 'project_manager', 'team_member')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  module TEXT NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  scope TEXT DEFAULT 'all' CHECK (scope IN ('all', 'assigned', 'own', 'none')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. CRM — CLIENTS & CONTACTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  gst_number TEXT,
  pan_number TEXT,
  address JSONB DEFAULT '{}',
  website TEXT,
  industry TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  designation TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  birthday DATE,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. CRM — LEADS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company_name TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT CHECK (source IN ('website', 'referral', 'linkedin', 'cold_call', 'social_media', 'event', 'other')),
  referred_by TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  industry TEXT,
  expected_budget DECIMAL(12,2),
  expected_close_date DATE,
  lead_score INTEGER DEFAULT 0,
  owner_id UUID REFERENCES public.users(id),
  client_id UUID REFERENCES public.clients(id),
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lead_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('call', 'email', 'meeting', 'whatsapp', 'other')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. PROJECTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES public.clients(id),
  category TEXT DEFAULT 'client_project' CHECK (category IN ('client_project', 'internal_project', 'product', 'saas_product')),
  project_type TEXT CHECK (project_type IN ('website', 'full_stack', 'crm', 'erp', 'mobile_app', 'saas', 'ai_agent', 'dashboard', 'shopify_store', 'automation_system', 'internal_tool', 'marketing', 'seo', 'cloud', 'custom')),
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'development', 'testing', 'live', 'maintenance', 'completed', 'on_hold', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  start_date DATE,
  deadline DATE,
  budget DECIMAL(12,2),
  estimated_hours DECIMAL(8,2),
  actual_hours DECIMAL(8,2) DEFAULT 0,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  manager_id UUID REFERENCES public.users(id),
  production_url TEXT,
  staging_url TEXT,
  admin_panel_url TEXT,
  api_url TEXT,
  client_website_url TEXT,
  documentation_url TEXT,
  figma_url TEXT,
  notion_url TEXT,
  deployment_url TEXT,
  github_repo_url TEXT,
  github_org_url TEXT,
  github_username TEXT,
  github_email TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  github_access BOOLEAN DEFAULT false,
  vercel_access BOOLEAN DEFAULT false,
  supabase_access BOOLEAN DEFAULT false,
  railway_access BOOLEAN DEFAULT false,
  production_access BOOLEAN DEFAULT false,
  client_access BOOLEAN DEFAULT false,
  billing_access BOOLEAN DEFAULT false,
  UNIQUE(project_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  progress INTEGER DEFAULT 0,
  budget DECIMAL(12,2),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. TASKS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.users(id),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'testing', 'completed', 'blocked')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  estimated_hours DECIMAL(6,2),
  actual_hours DECIMAL(6,2) DEFAULT 0,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  parent_task_id UUID REFERENCES public.tasks(id),
  dependencies UUID[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  checklist JSONB DEFAULT '[]',
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id),
  content TEXT NOT NULL,
  mentions UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  is_billable BOOLEAN DEFAULT true,
  is_manual BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. VENDORS (must be before expenses due to FK)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  gst_number TEXT,
  address JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 7. INVOICES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  project_id UUID REFERENCES public.projects(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal DECIMAL(12,2) DEFAULT 0,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(12,2) DEFAULT 0,
  tax_type TEXT DEFAULT 'cgst_sgst',
  cgst_rate DECIMAL(4,2) DEFAULT 9.00,
  sgst_rate DECIMAL(4,2) DEFAULT 9.00,
  igst_rate DECIMAL(4,2) DEFAULT 18.00,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  terms TEXT,
  footer TEXT,
  qr_code_url TEXT,
  signature_url TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_interval TEXT,
  next_recurrence_date DATE,
  pdf_url TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  hsn_code TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 8. QUOTATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  lead_id UUID REFERENCES public.leads(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'expired')),
  version INTEGER DEFAULT 1,
  valid_until DATE,
  subtotal DECIMAL(12,2) DEFAULT 0,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  terms TEXT,
  converted_to_invoice_id UUID REFERENCES public.invoices(id),
  converted_to_project_id UUID REFERENCES public.projects(id),
  pdf_url TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 9. PAYMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id),
  client_id UUID REFERENCES public.clients(id),
  amount DECIMAL(12,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('upi', 'bank_transfer', 'cash', 'cheque', 'online')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partially_paid', 'paid', 'overdue', 'refunded')),
  payment_date DATE,
  reference_number TEXT,
  notes TEXT,
  receipt_url TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 10. FINANCE — EXPENSES & CONTRACTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT CHECK (category IN ('salary', 'office', 'software', 'hardware', 'travel', 'marketing', 'vendor', 'subscription', 'other')),
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  project_id UUID REFERENCES public.projects(id),
  vendor_id UUID REFERENCES public.vendors(id),
  receipt_url TEXT,
  notes TEXT,
  is_recurring BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  project_id UUID REFERENCES public.projects(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'expired', 'terminated')),
  start_date DATE,
  end_date DATE,
  value DECIMAL(12,2),
  document_url TEXT,
  signed_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 11. DOCUMENTS & FOLDERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.folders(id),
  type TEXT DEFAULT 'general' CHECK (type IN ('projects', 'invoices', 'contracts', 'hr', 'client_files', 'general')),
  project_id UUID REFERENCES public.projects(id),
  client_id UUID REFERENCES public.clients(id),
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  folder_id UUID REFERENCES public.folders(id),
  project_id UUID REFERENCES public.projects(id),
  client_id UUID REFERENCES public.clients(id),
  version INTEGER DEFAULT 1,
  is_shared BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  uploaded_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 12. HR — EMPLOYEES & LEAVES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  employee_id TEXT UNIQUE,
  department TEXT,
  designation TEXT,
  joining_date DATE,
  resignation_date DATE,
  salary DECIMAL(12,2),
  bank_details JSONB DEFAULT '{}',
  emergency_contact JSONB DEFAULT '{}',
  documents JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_notice', 'resigned', 'terminated')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id),
  leave_type TEXT CHECK (leave_type IN ('casual', 'sick', 'earned', 'unpaid', 'maternity', 'paternity')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 13. SYSTEM — ACTIVITIES, NOTIFICATIONS, CALENDAR, SETTINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  entity_name TEXT,
  description TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT,
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  is_email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('meeting', 'deadline', 'task', 'leave', 'invoice_due', 'follow_up', 'other')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  entity_type TEXT,
  entity_id UUID,
  attendees UUID[] DEFAULT '{}',
  location TEXT,
  google_event_id TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES public.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 14. TAGS & CUSTOM FIELDS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#6366f1',
  entity_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_type TEXT CHECK (field_type IN ('text', 'number', 'date', 'select', 'multiselect', 'boolean')),
  options JSONB,
  is_required BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 15. INDEXES for performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_owner ON public.leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_client ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON public.projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_client ON public.payments(client_id);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON public.activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON public.activities(created_by);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_time_logs_task ON public.time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_user ON public.time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder ON public.documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_time ON public.calendar_events(start_time);

-- ============================================================
-- 16. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if user is admin or PM
CREATE OR REPLACE FUNCTION public.is_admin_or_pm()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'project_manager'));
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- RLS POLICIES — USERS
-- ============================================================
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can manage users" ON public.users FOR ALL USING (public.is_admin());

-- ============================================================
-- RLS POLICIES — PERMISSIONS
-- ============================================================
CREATE POLICY "Anyone can view permissions" ON public.permissions FOR SELECT USING (true);
CREATE POLICY "Admins can manage permissions" ON public.permissions FOR ALL USING (public.is_admin());

-- ============================================================
-- RLS POLICIES — CLIENTS
-- ============================================================
CREATE POLICY "Admin/PM can view clients" ON public.clients FOR SELECT USING (public.is_admin_or_pm());
CREATE POLICY "Team members can view clients" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Admin/PM can manage clients" ON public.clients FOR INSERT USING (public.is_admin_or_pm());
CREATE POLICY "Admin/PM can update clients" ON public.clients FOR UPDATE USING (public.is_admin_or_pm());
CREATE POLICY "Admins can delete clients" ON public.clients FOR DELETE USING (public.is_admin());

-- ============================================================
-- RLS POLICIES — CONTACTS
-- ============================================================
CREATE POLICY "All authenticated can view contacts" ON public.contacts FOR SELECT USING (true);
CREATE POLICY "Admin/PM can manage contacts" ON public.contacts FOR INSERT USING (public.is_admin_or_pm());
CREATE POLICY "Admin/PM can update contacts" ON public.contacts FOR UPDATE USING (public.is_admin_or_pm());
CREATE POLICY "Admins can delete contacts" ON public.contacts FOR DELETE USING (public.is_admin());

-- ============================================================
-- RLS POLICIES — LEADS
-- ============================================================
CREATE POLICY "Admin/PM can view all leads" ON public.leads FOR SELECT USING (public.is_admin_or_pm());
CREATE POLICY "Team sees own leads" ON public.leads FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Admin/PM can create leads" ON public.leads FOR INSERT USING (public.is_admin_or_pm());
CREATE POLICY "Admin/PM can update leads" ON public.leads FOR UPDATE USING (public.is_admin_or_pm());
CREATE POLICY "Admins can delete leads" ON public.leads FOR DELETE USING (public.is_admin());

-- ============================================================
-- RLS POLICIES — LEAD NOTES & FOLLOWUPS
-- ============================================================
CREATE POLICY "All can view lead notes" ON public.lead_notes FOR SELECT USING (true);
CREATE POLICY "Admin/PM can manage lead notes" ON public.lead_notes FOR ALL USING (public.is_admin_or_pm());
CREATE POLICY "All can view lead followups" ON public.lead_followups FOR SELECT USING (true);
CREATE POLICY "Admin/PM can manage lead followups" ON public.lead_followups FOR ALL USING (public.is_admin_or_pm());

-- ============================================================
-- RLS POLICIES — PROJECTS
-- ============================================================
CREATE POLICY "Admin/PM can view all projects" ON public.projects FOR SELECT USING (public.is_admin_or_pm());
CREATE POLICY "Team sees assigned projects" ON public.projects FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = projects.id AND user_id = auth.uid())
);
CREATE POLICY "Admin/PM can manage projects" ON public.projects FOR INSERT USING (public.is_admin_or_pm());
CREATE POLICY "Admin/PM can update projects" ON public.projects FOR UPDATE USING (public.is_admin_or_pm());
CREATE POLICY "Admins can delete projects" ON public.projects FOR DELETE USING (public.is_admin());

-- ============================================================
-- RLS POLICIES — PROJECT MEMBERS & MILESTONES
-- ============================================================
CREATE POLICY "All can view project members" ON public.project_members FOR SELECT USING (true);
CREATE POLICY "Admin/PM can manage members" ON public.project_members FOR ALL USING (public.is_admin_or_pm());
CREATE POLICY "All can view milestones" ON public.milestones FOR SELECT USING (true);
CREATE POLICY "Admin/PM can manage milestones" ON public.milestones FOR ALL USING (public.is_admin_or_pm());

-- ============================================================
-- RLS POLICIES — TASKS
-- ============================================================
CREATE POLICY "Admin/PM can view all tasks" ON public.tasks FOR SELECT USING (public.is_admin_or_pm());
CREATE POLICY "Team sees assigned tasks" ON public.tasks FOR SELECT USING (assigned_to = auth.uid());
CREATE POLICY "Admin/PM can create tasks" ON public.tasks FOR INSERT USING (public.is_admin_or_pm());
CREATE POLICY "Assigned can update tasks" ON public.tasks FOR UPDATE USING (assigned_to = auth.uid() OR public.is_admin_or_pm());
CREATE POLICY "Admins can delete tasks" ON public.tasks FOR DELETE USING (public.is_admin());

-- ============================================================
-- RLS POLICIES — SUBTASKS, COMMENTS, TIME LOGS
-- ============================================================
CREATE POLICY "All can view subtasks" ON public.subtasks FOR SELECT USING (true);
CREATE POLICY "All can manage subtasks" ON public.subtasks FOR ALL USING (true);
CREATE POLICY "All can view comments" ON public.task_comments FOR SELECT USING (true);
CREATE POLICY "All can create comments" ON public.task_comments FOR INSERT USING (true);
CREATE POLICY "Own comments can update" ON public.task_comments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Own/admin can delete comments" ON public.task_comments FOR DELETE USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "All can view time logs" ON public.time_logs FOR SELECT USING (true);
CREATE POLICY "All can create time logs" ON public.time_logs FOR INSERT USING (true);
CREATE POLICY "Own time logs can update" ON public.time_logs FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES — INVOICES
-- ============================================================
CREATE POLICY "Admin/PM can view invoices" ON public.invoices FOR SELECT USING (public.is_admin_or_pm());
CREATE POLICY "Admin/PM can manage invoices" ON public.invoices FOR INSERT USING (public.is_admin_or_pm());
CREATE POLICY "Admin/PM can update invoices" ON public.invoices FOR UPDATE USING (public.is_admin_or_pm());
CREATE POLICY "Admins can delete invoices" ON public.invoices FOR DELETE USING (public.is_admin());

CREATE POLICY "All can view invoice items" ON public.invoice_items FOR SELECT USING (true);
CREATE POLICY "Admin/PM can manage invoice items" ON public.invoice_items FOR ALL USING (public.is_admin_or_pm());

-- ============================================================
-- RLS POLICIES — QUOTATIONS
-- ============================================================
CREATE POLICY "Admin/PM can view quotations" ON public.quotations FOR SELECT USING (public.is_admin_or_pm());
CREATE POLICY "Admin/PM can manage quotations" ON public.quotations FOR ALL USING (public.is_admin_or_pm());
CREATE POLICY "All can view quotation items" ON public.quotation_items FOR SELECT USING (true);
CREATE POLICY "Admin/PM can manage quotation items" ON public.quotation_items FOR ALL USING (public.is_admin_or_pm());

-- ============================================================
-- RLS POLICIES — PAYMENTS
-- ============================================================
CREATE POLICY "Admin/PM can view payments" ON public.payments FOR SELECT USING (public.is_admin_or_pm());
CREATE POLICY "Admin/PM can manage payments" ON public.payments FOR ALL USING (public.is_admin_or_pm());

-- ============================================================
-- RLS POLICIES — EXPENSES, VENDORS, CONTRACTS
-- ============================================================
CREATE POLICY "Admin can view expenses" ON public.expenses FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin can manage expenses" ON public.expenses FOR ALL USING (public.is_admin());
CREATE POLICY "All can view vendors" ON public.vendors FOR SELECT USING (true);
CREATE POLICY "Admin can manage vendors" ON public.vendors FOR ALL USING (public.is_admin());
CREATE POLICY "Admin/PM can view contracts" ON public.contracts FOR SELECT USING (public.is_admin_or_pm());
CREATE POLICY "Admin can manage contracts" ON public.contracts FOR ALL USING (public.is_admin());

-- ============================================================
-- RLS POLICIES — DOCUMENTS, FOLDERS, ATTACHMENTS
-- ============================================================
CREATE POLICY "All can view folders" ON public.folders FOR SELECT USING (true);
CREATE POLICY "Admin/PM can manage folders" ON public.folders FOR ALL USING (public.is_admin_or_pm());
CREATE POLICY "All can view documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "All can upload documents" ON public.documents FOR INSERT USING (true);
CREATE POLICY "Admin/PM can manage documents" ON public.documents FOR UPDATE USING (public.is_admin_or_pm());
CREATE POLICY "Admins can delete documents" ON public.documents FOR DELETE USING (public.is_admin());
CREATE POLICY "All can view attachments" ON public.attachments FOR SELECT USING (true);
CREATE POLICY "All can upload attachments" ON public.attachments FOR INSERT USING (true);

-- ============================================================
-- RLS POLICIES — HR
-- ============================================================
CREATE POLICY "Admin can view all employees" ON public.employees FOR SELECT USING (public.is_admin());
CREATE POLICY "Own employee record" ON public.employees FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin can manage employees" ON public.employees FOR ALL USING (public.is_admin());
CREATE POLICY "Admin can view all leaves" ON public.leave_requests FOR SELECT USING (public.is_admin());
CREATE POLICY "Own leave requests" ON public.leave_requests FOR SELECT USING (
  employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);
CREATE POLICY "All can create leave requests" ON public.leave_requests FOR INSERT USING (true);
CREATE POLICY "Admin can manage leaves" ON public.leave_requests FOR UPDATE USING (public.is_admin());

-- ============================================================
-- RLS POLICIES — SYSTEM
-- ============================================================
CREATE POLICY "All can view activities" ON public.activities FOR SELECT USING (true);
CREATE POLICY "All can create activities" ON public.activities FOR INSERT USING (true);
CREATE POLICY "Own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT USING (true);
CREATE POLICY "Own can update notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "All can view calendar events" ON public.calendar_events FOR SELECT USING (true);
CREATE POLICY "All can create calendar events" ON public.calendar_events FOR INSERT USING (true);
CREATE POLICY "Creator can update events" ON public.calendar_events FOR UPDATE USING (created_by = auth.uid() OR public.is_admin());
CREATE POLICY "All can view settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admin can manage settings" ON public.settings FOR ALL USING (public.is_admin());
CREATE POLICY "All can view tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Admin can manage tags" ON public.tags FOR ALL USING (public.is_admin());
CREATE POLICY "All can view custom fields" ON public.custom_fields FOR SELECT USING (true);
CREATE POLICY "Admin can manage custom fields" ON public.custom_fields FOR ALL USING (public.is_admin());

-- ============================================================
-- 17. AUTO-UPDATE TIMESTAMPS
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_clients BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_leads BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_projects BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_tasks BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_invoices BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_quotations BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_contracts BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_documents BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_employees BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_task_comments BEFORE UPDATE ON public.task_comments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 18. AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 19. DEFAULT SETTINGS
-- ============================================================

INSERT INTO public.settings (key, value) VALUES
  ('company', '{"name": "Scalezix", "email": "", "phone": "", "website": "https://scalezix.co", "address": {}, "gst_number": "", "pan_number": ""}'),
  ('invoice', '{"prefix": "INV", "next_number": 1, "default_due_days": 30, "default_tax_type": "cgst_sgst", "default_gst_rate": 18, "default_terms": "Payment is due within 30 days of invoice date.", "default_footer": "Thank you for your business!"}'),
  ('branding', '{"primary_color": "#0f172a", "accent_color": "#6366f1", "logo_url": "/logo.png"}')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 20. DEFAULT PERMISSIONS
-- ============================================================

INSERT INTO public.permissions (role, module, can_view, can_create, can_edit, can_delete, scope) VALUES
  -- Admin: full access
  ('admin', 'dashboard', true, true, true, true, 'all'),
  ('admin', 'crm', true, true, true, true, 'all'),
  ('admin', 'clients', true, true, true, true, 'all'),
  ('admin', 'projects', true, true, true, true, 'all'),
  ('admin', 'tasks', true, true, true, true, 'all'),
  ('admin', 'invoices', true, true, true, true, 'all'),
  ('admin', 'quotations', true, true, true, true, 'all'),
  ('admin', 'payments', true, true, true, true, 'all'),
  ('admin', 'finance', true, true, true, true, 'all'),
  ('admin', 'documents', true, true, true, true, 'all'),
  ('admin', 'hr', true, true, true, true, 'all'),
  ('admin', 'reports', true, true, true, true, 'all'),
  ('admin', 'settings', true, true, true, true, 'all'),
  -- Project Manager
  ('project_manager', 'dashboard', true, true, true, false, 'all'),
  ('project_manager', 'crm', true, true, true, false, 'all'),
  ('project_manager', 'clients', true, true, true, false, 'all'),
  ('project_manager', 'projects', true, true, true, false, 'all'),
  ('project_manager', 'tasks', true, true, true, false, 'all'),
  ('project_manager', 'invoices', true, true, true, false, 'all'),
  ('project_manager', 'quotations', true, true, true, false, 'all'),
  ('project_manager', 'payments', true, false, false, false, 'all'),
  ('project_manager', 'finance', true, false, false, false, 'all'),
  ('project_manager', 'documents', true, true, true, false, 'all'),
  ('project_manager', 'hr', false, false, false, false, 'none'),
  ('project_manager', 'reports', true, false, false, false, 'all'),
  ('project_manager', 'settings', false, false, false, false, 'none'),
  -- Team Member
  ('team_member', 'dashboard', true, false, false, false, 'own'),
  ('team_member', 'crm', true, false, false, false, 'own'),
  ('team_member', 'clients', true, false, false, false, 'own'),
  ('team_member', 'projects', true, false, false, false, 'assigned'),
  ('team_member', 'tasks', true, true, true, false, 'assigned'),
  ('team_member', 'invoices', false, false, false, false, 'none'),
  ('team_member', 'quotations', false, false, false, false, 'none'),
  ('team_member', 'payments', false, false, false, false, 'none'),
  ('team_member', 'finance', false, false, false, false, 'none'),
  ('team_member', 'documents', true, true, false, false, 'assigned'),
  ('team_member', 'hr', true, false, false, false, 'own'),
  ('team_member', 'reports', false, false, false, false, 'none'),
  ('team_member', 'settings', false, false, false, false, 'none')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 21. STORAGE BUCKETS (run via Supabase Dashboard or API)
-- ============================================================
-- Note: Storage buckets are created via the Supabase Dashboard:
-- 1. avatars (public)
-- 2. documents (private)
-- 3. invoices (private)
-- 4. project-files (private)
-- 5. company-assets (public)

-- ============================================================
-- 22. PRD COMPLIANCE — EXTRA MODULES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.project_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  account_email TEXT,
  username TEXT,
  password TEXT,
  recovery_email TEXT,
  recovery_phone TEXT,
  account_owner TEXT,
  billing_owner TEXT,
  two_factor_enabled BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_hosting_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE,
  frontend_tech TEXT,
  backend_tech TEXT,
  database_tech TEXT,
  hosting_provider TEXT,
  domain_provider TEXT,
  ssl_provider TEXT,
  cdn_provider TEXT,
  storage_provider TEXT,
  email_provider TEXT,
  deployment_method TEXT,
  branch_name TEXT,
  environment_type TEXT,
  deployment_notes TEXT,
  deployment_checklist JSONB DEFAULT '[]',
  production_checklist JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_billing_renewals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  monthly_cost DECIMAL(12,2) DEFAULT 0,
  yearly_cost DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  renewal_date DATE,
  billing_frequency TEXT CHECK (billing_frequency IN ('monthly', 'quarterly', 'half_yearly', 'yearly', 'one_time')),
  payment_status TEXT CHECK (payment_status IN ('paid', 'pending', 'overdue')),
  paid_by TEXT CHECK (paid_by IN ('client', 'scalezix', 'shared')),
  invoice_link TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_documentation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE,
  notes TEXT,
  documentation TEXT,
  deployment_instructions TEXT,
  client_requirements TEXT,
  important_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

