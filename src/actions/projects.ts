'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Project, Milestone } from '@/types'

export async function getProjects() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*, client:clients(company_name), manager:users!projects_manager_id_fkey(full_name)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getProjects error:', error)
    return []
  }
  return data as Project[]
}

export async function getProjectById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*, client:clients(*), manager:users!projects_manager_id_fkey(*), milestones(*), members:project_members(*, user:users(*)), tasks(*, assignee:users!tasks_assigned_to_fkey(*)), credentials:project_credentials(*), hosting:project_hosting_deployments(*), billing:project_billing_renewals(*), documentation:project_documentation(*)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getProjectById error:', error)
    return null
  }
  return data as Project
}

export async function createProjectRecord(formData: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('projects').insert({
    ...formData,
    created_by: user.id,
  })

  if (error) throw error

  revalidatePath('/projects')
  revalidatePath('/dashboard')
  revalidatePath('/clients')
  if (formData.client_id) {
    revalidatePath(`/clients/${formData.client_id}`)
  }
}

export async function updateProjectRecord(id: string, formData: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('projects').update(formData).eq('id', id)

  if (error) throw error

  revalidatePath('/projects')
  revalidatePath(`/projects/${id}`)
  revalidatePath('/dashboard')
  revalidatePath('/clients')
  if (formData.client_id) {
    revalidatePath(`/clients/${formData.client_id}`)
  }
}

export async function deleteProjectRecord(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('projects').delete().eq('id', id)

  if (error) throw error

  revalidatePath('/projects')
  revalidatePath('/dashboard')
  revalidatePath('/clients')
}

export async function addProjectMember(projectId: string, userId: string, role = 'member') {
  const supabase = await createClient()
  const { error } = await supabase.from('project_members').insert({
    project_id: projectId,
    user_id: userId,
    role,
  })

  if (error) throw error
  revalidatePath(`/projects/${projectId}`)
}

export async function removeProjectMember(projectId: string, userId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId)

  if (error) throw error
  revalidatePath(`/projects/${projectId}`)
}

export async function createProjectMilestone(projectId: string, milestoneData: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('milestones').insert({
    ...milestoneData,
    project_id: projectId,
  })

  if (error) throw error
  revalidatePath(`/projects/${projectId}`)
}

export async function updateProjectMilestone(milestoneId: string, projectId: string, milestoneData: any) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('milestones')
    .update(milestoneData)
    .eq('id', milestoneId)

  if (error) throw error
  revalidatePath(`/projects/${projectId}`)
}

export async function deleteProjectMilestone(milestoneId: string, projectId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('milestones').delete().eq('id', milestoneId)

  if (error) throw error
  revalidatePath(`/projects/${projectId}`)
}
