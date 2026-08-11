'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function logActivity(module: string, action: string, entityId: string | null, description: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('activities').insert({
    module,
    action,
    entity_id: entityId || null,
    description,
    created_by: user?.id || null,
  })

  if (error) {
    console.error('Failed to log activity:', error)
  } else {
    revalidatePath('/dashboard')
  }
}

export async function getRecentActivities(limit = 10) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('activities')
    .select('*, user:users(*)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to get recent activities:', error)
    return []
  }
  return data
}
