'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/lib/constants'
import {
  LayoutDashboard, Target, UserPlus, GitBranch, Building2, FolderKanban,
  CheckSquare, FileText, FileBadge, IndianRupee, Wallet, PieChart,
  ArrowDownCircle, ArrowUpCircle, Store, BarChart3, Files, Users,
  UserCog, Clock, CalendarOff, Banknote, Calendar, Settings, Building,
  Mail, Puzzle, ChevronLeft, ChevronDown, ChevronRight, X, Key, Server, Activity
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard, Target, UserPlus, GitBranch, Building2, FolderKanban,
  CheckSquare, FileText, FileBadge, IndianRupee, Wallet, PieChart,
  ArrowDownCircle, ArrowUpCircle, Store, BarChart3, Files, Users,
  UserCog, Clock, CalendarOff, Banknote, Calendar, Settings, Building,
  Mail, Puzzle, Key, Server, Activity,
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(['CRM', 'Finance', 'HR', 'Settings'])

  const toggleExpand = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    )
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-full bg-[var(--card)] border-r border-[var(--border)] z-50 transition-all duration-300 flex flex-col',
        collapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]',
        'lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--border)] shrink-0">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Scalezix" width={130} height={36} className="dark:invert" />
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="mx-auto">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white font-bold text-sm">
              S
            </div>
          </Link>
        )}

        {/* Mobile close */}
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1 rounded-md hover:bg-[var(--secondary)] text-[var(--muted-foreground)]"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard

          // Items with children (dropdown)
          if ('children' in item && item.children) {
            const isExpanded = expandedItems.includes(item.title)
            const hasActiveChild = item.children.some(child => isActive(child.href))

            return (
              <div key={item.title}>
                <button
                  onClick={() => !collapsed && toggleExpand(item.title)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    hasActiveChild
                      ? 'text-[var(--accent)] bg-[var(--accent)]/5'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]'
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.title}</span>
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </>
                  )}
                </button>

                {!collapsed && isExpanded && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-[var(--border)] pl-3">
                    {item.children.map((child) => {
                      const ChildIcon = iconMap[child.icon] || LayoutDashboard
                      const active = isActive(child.href)

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onMobileClose}
                          className={cn(
                            'flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-all',
                            active
                              ? 'text-[var(--accent)] bg-[var(--accent)]/5 font-medium'
                              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]'
                          )}
                        >
                          <ChildIcon size={15} className="shrink-0" />
                          <span>{child.title}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          // Regular items
          const active = 'href' in item && isActive(item.href as string)

          return (
            <Link
              key={item.title}
              href={'href' in item ? (item.href as string) : '#'}
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'text-[var(--accent)] bg-[var(--accent)]/10'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]'
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.title}</span>}
              {active && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Collapse button */}
      <div className="hidden lg:flex items-center justify-center p-3 border-t border-[var(--border)] shrink-0">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-[var(--secondary)] text-[var(--muted-foreground)] transition-all"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft size={18} className={cn('transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>
    </aside>
  )
}
