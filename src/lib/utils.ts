import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const target = new Date(date)
  const diffMs = now.getTime() - target.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date)
}

export function generateId(prefix: string, number: number): string {
  return `${prefix}-${String(number).padStart(4, '0')}`
}

export function calculateGST(
  subtotal: number,
  taxType: 'cgst_sgst' | 'igst' | 'none',
  rate: number = 18
) {
  if (taxType === 'none') {
    return { cgst: 0, sgst: 0, igst: 0, total: subtotal }
  }
  if (taxType === 'igst') {
    const igst = (subtotal * rate) / 100
    return { cgst: 0, sgst: 0, igst, total: subtotal + igst }
  }
  const halfRate = rate / 2
  const cgst = (subtotal * halfRate) / 100
  const sgst = (subtotal * halfRate) / 100
  return { cgst, sgst, igst: 0, total: subtotal + cgst + sgst }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Lead statuses
    new: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    qualified: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    proposal: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    negotiation: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    won: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    lost: 'bg-red-500/10 text-red-500 border-red-500/20',
    // Project statuses
    planning: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    development: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
    testing: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    on_hold: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
    maintenance: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
    // Task statuses
    todo: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    in_progress: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    review: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    blocked: 'bg-red-500/10 text-red-500 border-red-500/20',
    // Invoice statuses
    draft: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    sent: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    paid: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    overdue: 'bg-red-500/10 text-red-500 border-red-500/20',
    // Payment statuses
    pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    partially_paid: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    refunded: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
    // Generic
    active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    inactive: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    approved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
    expired: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  }
  return colors[status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'bg-slate-500/10 text-slate-500',
    medium: 'bg-blue-500/10 text-blue-500',
    high: 'bg-orange-500/10 text-orange-500',
    urgent: 'bg-red-500/10 text-red-500',
  }
  return colors[priority] || 'bg-gray-500/10 text-gray-500'
}

export function getAppUrl(): string {
  let url =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '') ||
    'https://scrm.scalezix.com'

  url = url.includes('http') ? url : `https://${url}`
  return url.replace(/\/$/, '')
}

