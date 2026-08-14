'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import { toast } from 'sonner'
import type { User } from '@/types'

import { SettingsNav } from '@/components/layout/settings-nav'

export default function UsersSettingsPage() {
  const supabase = createClient()
  const { user: currentUser } = useAuth()

  const [usersList, setUsersList] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchUsers = React.useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: true })
      if (error) throw error
      setUsersList(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  React.useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (userId === currentUser?.id) {
      toast.error('You cannot change your own system permission role!')
      return
    }
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
      toast.success('User role updated successfully')
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user role')
    }
  }

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    if (userId === currentUser?.id) {
      toast.error('You cannot deactivate yourself!')
      return
    }
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !currentActive })
        .eq('id', userId)

      if (error) throw error
      toast.success('User status updated')
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">User Management</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Manage CRM system roles, view email access, and toggle active logins.</p>
      </div>

      <SettingsNav />


      {loading ? (
        <div className="py-20 text-center text-sm text-[var(--muted-foreground)]">Loading system users...</div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50">
                <th className="p-4 font-semibold text-[var(--muted-foreground)]">Full Name</th>
                <th className="p-4 font-semibold text-[var(--muted-foreground)]">Email Address</th>
                <th className="p-4 font-semibold text-[var(--muted-foreground)]">System Role</th>
                <th className="p-4 font-semibold text-[var(--muted-foreground)]">Status</th>
                <th className="p-4 font-semibold text-[var(--muted-foreground)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {usersList.map((usr) => (
                <tr key={usr.id} className="hover:bg-[var(--secondary)]/30 transition-colors">
                  <td className="p-4 font-semibold text-[var(--foreground)]">{usr.full_name}</td>
                  <td className="p-4 text-[var(--foreground)]">{usr.email}</td>
                  <td className="p-4">
                    <select
                      value={usr.role}
                      onChange={(e) => handleRoleChange(usr.id, e.target.value)}
                      disabled={usr.id === currentUser?.id}
                      className="px-2 py-1 text-xs bg-[var(--secondary)] border border-[var(--border)] rounded text-[var(--foreground)] focus:outline-none disabled:opacity-50"
                    >
                      <option value="admin">Administrator</option>
                      <option value="project_manager">Project Manager</option>
                      <option value="team_member">Team Member</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                      usr.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {usr.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleToggleActive(usr.id, usr.is_active)}
                      disabled={usr.id === currentUser?.id}
                      className={`text-xs font-semibold hover:underline ${
                        usr.is_active ? 'text-red-500' : 'text-emerald-500'
                      } disabled:opacity-30`}
                    >
                      {usr.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
