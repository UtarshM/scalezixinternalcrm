'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings, Building, FileText, Users, Cpu, Mail } from 'lucide-react'

const SETTINGS_TABS = [
  { name: 'General', href: '/settings', icon: Settings },
  { name: 'Company Branding', href: '/settings/company', icon: Building },
  { name: 'Invoice & Billing', href: '/settings/invoice', icon: FileText },
  { name: 'Users & Roles', href: '/settings/users', icon: Users },
  { name: 'Integrations', href: '/settings/integrations', icon: Cpu },
  { name: 'Email & SMTP', href: '/settings/email', icon: Mail },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <div className="border-b border-[var(--border)] pb-4 mb-6">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = pathname === tab.href

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'bg-[var(--secondary)]/60 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]'
              }`}
            >
              <Icon size={15} />
              {tab.name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
