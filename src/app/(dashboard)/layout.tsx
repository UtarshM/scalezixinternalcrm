'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className="print:hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
      </div>

      {/* Main content */}
      <div
        className="transition-all duration-300 ease-in-out print:!ml-0"
        style={{
          marginLeft: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        }}
      >
        <div className="print:hidden">
          <Topbar
            onMenuClick={() => setMobileSidebarOpen(true)}
          />
        </div>
        <main className="p-6 min-h-[calc(100vh-64px)] print:p-0">
          {children}
        </main>
      </div>

      {/* Mobile sidebar margin override */}
      <style jsx>{`
        @media (max-width: 1023px) {
          div[style] {
            margin-left: 0 !important;
          }
        }
        @media print {
          div[style] {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}
