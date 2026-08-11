// App-wide constants
export const APP_NAME = 'Scalezix OS'
export const APP_DESCRIPTION = 'Internal CRM & Business Operations Platform'

// Navigation items for sidebar
export const NAV_ITEMS = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    title: 'CRM',
    icon: 'Target',
    children: [
      { title: 'Leads', href: '/crm/leads', icon: 'UserPlus' },
      { title: 'Pipeline', href: '/crm/pipeline', icon: 'GitBranch' },
    ],
  },
  {
    title: 'Clients',
    href: '/clients',
    icon: 'Building2',
  },
  {
    title: 'Projects',
    icon: 'FolderKanban',
    children: [
      { title: 'All Projects', href: '/projects', icon: 'FolderKanban' },
      { title: 'Client Projects', href: '/projects?category=client_project', icon: 'Building2' },
      { title: 'Internal Projects', href: '/projects?category=internal_project', icon: 'Store' },
    ],
  },
  {
    title: 'Credentials',
    href: '/credentials',
    icon: 'Key',
  },
  {
    title: 'URLs & Github',
    href: '/urls-github',
    icon: 'GitBranch',
  },
  {
    title: 'Hosting & Deployment',
    href: '/hosting-deployment',
    icon: 'Server',
  },
  {
    title: 'Billing & Renewals',
    href: '/billing-renewals',
    icon: 'Banknote',
  },
  {
    title: 'Team Access',
    href: '/team-access',
    icon: 'Users',
  },
  {
    title: 'Documentation & Notes',
    href: '/documentation-notes',
    icon: 'FileText',
  },
  {
    title: 'Activity Logs',
    href: '/activity-logs',
    icon: 'Activity',
  },
  {
    title: 'Tasks',
    href: '/tasks',
    icon: 'CheckSquare',
  },
  {
    title: 'Invoices',
    href: '/invoices',
    icon: 'FileText',
  },
  {
    title: 'Proposals & Quotes',
    href: '/quotations',
    icon: 'FileBadge',
  },
  {
    title: 'Payments',
    href: '/payments',
    icon: 'IndianRupee',
  },
  {
    title: 'Finance',
    icon: 'Wallet',
    children: [
      { title: 'Overview', href: '/finance', icon: 'PieChart' },
      { title: 'Income Management', href: '/finance/income', icon: 'ArrowUpCircle' },
      { title: 'Expense Management', href: '/finance/expenses', icon: 'ArrowDownCircle' },
      { title: 'Cash Flow', href: '/finance/cash-flow', icon: 'Activity' },
      { title: 'Project Profitability', href: '/finance/projects', icon: 'FolderKanban' },
      { title: 'Client Payments', href: '/finance/client-payments', icon: 'IndianRupee' },
      { title: 'Vendors', href: '/finance/vendors', icon: 'Store' },
      { title: 'Subscriptions', href: '/finance/subscriptions', icon: 'Calendar' },
      { title: 'Bank Accounts', href: '/finance/bank-accounts', icon: 'Building2' },
      { title: 'Founder Withdrawals', href: '/finance/founder-withdrawals', icon: 'Wallet' },
      { title: 'GST & Taxes', href: '/finance/gst-taxes', icon: 'FileText' },
      { title: 'Reports & Analytics', href: '/finance/reports', icon: 'BarChart3' },
    ],
  },
  {
    title: 'Documents',
    href: '/documents',
    icon: 'Files',
  },
  {
    title: 'HR',
    icon: 'Users',
    children: [
      { title: 'Overview', href: '/hr', icon: 'LayoutDashboard' },
      { title: 'Employees', href: '/hr/employees', icon: 'UserCog' },
      { title: 'Attendance', href: '/hr/attendance', icon: 'Clock' },
      { title: 'Leaves', href: '/hr/leaves', icon: 'CalendarOff' },
      { title: 'Payroll', href: '/hr/payroll', icon: 'Banknote' },
    ],
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: 'BarChart3',
  },
  {
    title: 'Calendar',
    href: '/calendar',
    icon: 'Calendar',
  },
  {
    title: 'Settings',
    icon: 'Settings',
    children: [
      { title: 'General', href: '/settings', icon: 'Settings' },
      { title: 'Company', href: '/settings/company', icon: 'Building' },
      { title: 'Invoice', href: '/settings/invoice', icon: 'FileText' },
      { title: 'Users', href: '/settings/users', icon: 'Users' },
      { title: 'Email', href: '/settings/email', icon: 'Mail' },
      { title: 'Integrations', href: '/settings/integrations', icon: 'Puzzle' },
    ],
  },
] as const

// Lead sources
export const LEAD_SOURCES = [
  'website', 'referral', 'linkedin', 'cold_call', 'social_media', 'event', 'other',
] as const

// Lead pipeline stages
export const LEAD_STAGES = [
  { id: 'new', label: 'New', color: '#3b82f6' },
  { id: 'qualified', label: 'Qualified', color: '#8b5cf6' },
  { id: 'proposal', label: 'Proposal', color: '#f59e0b' },
  { id: 'negotiation', label: 'Negotiation', color: '#f97316' },
  { id: 'won', label: 'Won', color: '#10b981' },
  { id: 'lost', label: 'Lost', color: '#ef4444' },
] as const

// Project categories
export const PROJECT_CATEGORIES = [
  { id: 'client_project', label: 'Client Project' },
  { id: 'internal_project', label: 'Internal Project' },
  { id: 'product', label: 'Product' },
  { id: 'saas_product', label: 'SaaS Product' },
] as const

// Project types
export const PROJECT_TYPES = [
  'website', 'full_stack', 'crm', 'erp', 'mobile_app', 'saas', 'ai_agent', 'dashboard', 'shopify_store', 'automation_system', 'internal_tool', 'marketing', 'seo', 'cloud', 'custom',
] as const

// Project statuses
export const PROJECT_STATUSES = [
  'planning', 'development', 'testing', 'live', 'maintenance', 'completed', 'on_hold', 'cancelled',
] as const

// Task statuses
export const TASK_STATUSES = [
  { id: 'todo', label: 'To Do', color: '#64748b' },
  { id: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { id: 'review', label: 'Review', color: '#8b5cf6' },
  { id: 'testing', label: 'Testing', color: '#f59e0b' },
  { id: 'completed', label: 'Completed', color: '#10b981' },
  { id: 'blocked', label: 'Blocked', color: '#ef4444' },
] as const

// Priority levels
export const PRIORITIES = [
  { id: 'low', label: 'Low', color: '#64748b' },
  { id: 'medium', label: 'Medium', color: '#3b82f6' },
  { id: 'high', label: 'High', color: '#f97316' },
  { id: 'urgent', label: 'Urgent', color: '#ef4444' },
] as const

// Invoice statuses
export const INVOICE_STATUSES = [
  'draft', 'sent', 'paid', 'overdue', 'cancelled',
] as const

// Payment methods
export const PAYMENT_METHODS = [
  'upi', 'bank_transfer', 'cash', 'cheque', 'online',
] as const

// GST rates
export const GST_RATES = [
  { value: 0, label: 'No Tax (0%)' },
  { value: 5, label: 'GST 5%' },
  { value: 12, label: 'GST 12%' },
  { value: 18, label: 'GST 18%' },
  { value: 28, label: 'GST 28%' },
] as const

// User roles
export const USER_ROLES = [
  { id: 'admin', label: 'Admin', description: 'Full access to everything' },
  { id: 'project_manager', label: 'Project Manager', description: 'Manage projects, tasks, invoices' },
  { id: 'team_member', label: 'Team Member', description: 'Assigned tasks and own projects only' },
] as const

// Expense categories
export const EXPENSE_CATEGORIES = [
  'salary', 'office', 'software', 'hardware', 'travel', 'marketing', 'vendor', 'subscription', 'other',
] as const

// Leave types
export const LEAVE_TYPES = [
  'casual', 'sick', 'earned', 'unpaid', 'maternity', 'paternity',
] as const

// Notification types
export const NOTIFICATION_TYPES = [
  'task_assigned', 'invoice_paid', 'deadline', 'comment', 'mention', 'reminder',
  'lead_assigned', 'payment_received', 'project_update',
] as const
