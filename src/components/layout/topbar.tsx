'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { getInitials } from '@/lib/utils'
import { Menu, Search, Bell, Moon, Sun, LogOut, User } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch and subscribe to realtime notifications
  useEffect(() => {
    if (!user) return

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      setNotifications(data || [])
    }

    fetchNotifications()

    // Realtime listener
    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  const handleNotificationClick = async (id: string) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (e) {
      console.error(e)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <header className="h-16 border-b border-[var(--border)] bg-[var(--card)] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-[var(--secondary)] text-[var(--muted-foreground)]"
        >
          <Menu size={20} />
        </button>

        {/* Search */}
        <button
          id="global-search-trigger"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--secondary)] text-[var(--muted-foreground)] text-sm hover:bg-[var(--border)] transition-all w-64 max-w-[280px]"
        >
          <Search size={16} />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-[var(--background)] rounded border border-[var(--border)]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        {mounted && (
          <button
            id="theme-toggle"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-[var(--secondary)] text-[var(--muted-foreground)] transition-all"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            id="notification-bell"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg hover:bg-[var(--secondary)] text-[var(--muted-foreground)] transition-all relative"
          >
            <Bell size={18} />
            {notifications.some(n => !n.is_read) && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--accent)] pulse-dot" />
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-lg shadow-black/10 z-50 py-1.5 animate-fade-in max-h-96 overflow-y-auto">
                <div className="px-4 py-2 border-b border-[var(--border)] flex justify-between items-center">
                  <span className="text-xs font-bold text-[var(--foreground)]">Notifications</span>
                  {notifications.some(n => !n.is_read) && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] text-[var(--accent)] hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[var(--muted-foreground)]">
                      No notifications recorded
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n.id)}
                        className={`p-3 text-xs cursor-pointer hover:bg-[var(--secondary)]/40 transition-colors flex flex-col gap-1 ${
                          !n.is_read ? 'bg-[var(--secondary)]/20' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-semibold text-[var(--foreground)]">{n.title}</span>
                          {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-1.5" />}
                        </div>
                        <p className="text-[var(--muted-foreground)] leading-relaxed">{n.message}</p>
                        <span className="text-[9px] text-[var(--muted-foreground)]/80 self-end mt-1">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            id="user-menu"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--secondary)] transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-semibold">
              {user ? getInitials(user.full_name) : '?'}
            </div>
            {user && (
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-[var(--foreground)] leading-tight">
                  {user.full_name}
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)] capitalize">
                  {user.role?.replace('_', ' ')}
                </p>
              </div>
            )}
          </button>

          {/* Dropdown */}
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-lg shadow-black/10 z-50 py-1 animate-fade-in">
                {user && (
                  <div className="px-4 py-3 border-b border-[var(--border)]">
                    <p className="text-sm font-medium text-[var(--foreground)]">{user.full_name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{user.email}</p>
                  </div>
                )}
                <Link
                  href="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
                >
                  <User size={15} />
                  Profile & Settings
                </Link>
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    signOut()
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-500/5"
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
