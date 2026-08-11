'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Task, Subtask, TaskComment, TimeLog } from '@/types'

export async function getTasks() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*, project:projects(name, project_id), assignee:users!tasks_assigned_to_fkey(full_name)')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('getTasks error:', error)
    return []
  }
  return data as Task[]
}

export async function getTaskById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*, project:projects(*), milestone:milestones(*), assignee:users!tasks_assigned_to_fkey(*), subtasks(*), comments:task_comments(*, user:users(*)), time_logs:time_logs(*, user:users(*))')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getTaskById error:', error)
    return null
  }
  return data as Task
}

export async function createTaskRecord(formData: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('tasks').insert({
    ...formData,
    created_by: user.id,
  })

  if (error) throw error

  revalidatePath('/tasks')
}

export async function updateTaskRecord(id: string, formData: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('tasks').update(formData).eq('id', id)

  if (error) throw error

  revalidatePath('/tasks')
  revalidatePath(`/tasks/${id}`)
  if (formData.project_id) {
    revalidatePath(`/projects/${formData.project_id}`)
  }
}

export async function updateTaskStatus(id: string, status: string, projectId?: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', id)

  if (error) throw error

  revalidatePath('/tasks')
  revalidatePath(`/tasks/${id}`)
  if (projectId) {
    revalidatePath(`/projects/${projectId}`)
  }
}

export async function deleteTaskRecord(id: string, projectId?: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('tasks').delete().eq('id', id)

  if (error) throw error

  revalidatePath('/tasks')
  if (projectId) {
    revalidatePath(`/projects/${projectId}`)
  }
}

export async function createTaskSubtask(taskId: string, title: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('subtasks').insert({
    task_id: taskId,
    title,
    is_completed: false,
  })

  if (error) throw error
  revalidatePath(`/tasks/${taskId}`)
}

export async function toggleTaskSubtask(subtaskId: string, isCompleted: boolean, taskId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('subtasks')
    .update({ is_completed: isCompleted })
    .eq('id', subtaskId)

  if (error) throw error
  revalidatePath(`/tasks/${taskId}`)
}

export async function deleteTaskSubtask(subtaskId: string, taskId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('subtasks').delete().eq('id', subtaskId)

  if (error) throw error
  revalidatePath(`/tasks/${taskId}`)
}

export async function createTaskComment(taskId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('task_comments').insert({
    task_id: taskId,
    content,
    user_id: user.id,
  })

  if (error) throw error
  revalidatePath(`/tasks/${taskId}`)
}

export async function startTaskTimer(taskId: string, isBillable = true) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Check if there is already a running timer for this user
  const { data: existing } = await supabase
    .from('time_logs')
    .select('id')
    .eq('user_id', user.id)
    .is('end_time', null)
    .limit(1)

  if (existing && existing.length > 0) {
    throw new Error('You already have an active timer running. Stop it first!')
  }

  const { data, error } = await supabase
    .from('time_logs')
    .insert({
      task_id: taskId,
      user_id: user.id,
      start_time: new Date().toISOString(),
      is_billable: isBillable,
      is_manual: false,
    })
    .select()
    .single()

  if (error) throw error
  revalidatePath(`/tasks/${taskId}`)
  return data.id
}

export async function stopTaskTimer(logId: string, notes?: string, taskId?: string) {
  const supabase = await createClient()
  
  // Get the start time to calculate duration
  const { data: log, error: fetchErr } = await supabase
    .from('time_logs')
    .select('start_time')
    .eq('id', logId)
    .single()

  if (fetchErr) throw fetchErr

  const endTime = new Date()
  const startTime = new Date(log.start_time)
  const durationMs = endTime.getTime() - startTime.getTime()
  const durationMinutes = Math.max(1, Math.round(durationMs / 60000))

  const { error } = await supabase
    .from('time_logs')
    .update({
      end_time: endTime.toISOString(),
      duration_minutes: durationMinutes,
      notes,
    })
    .eq('id', logId)

  if (error) throw error

  // If taskId is provided, update actual_hours on task
  if (taskId) {
    // 1. Fetch total hours logged
    const { data: logs } = await supabase
      .from('time_logs')
      .select('duration_minutes')
      .eq('task_id', taskId)
      .not('end_time', 'is', null)

    const totalMinutes = (logs || []).reduce((sum, item) => sum + (item.duration_minutes || 0), 0)
    const actualHours = parseFloat((totalMinutes / 60).toFixed(2))

    await supabase
      .from('tasks')
      .update({ actual_hours: actualHours })
      .eq('id', taskId)

    revalidatePath(`/tasks/${taskId}`)
  }
}

export async function addManualTimeLog(taskId: string, durationMinutes: number, isBillable = true, notes?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('time_logs').insert({
    task_id: taskId,
    user_id: user.id,
    start_time: new Date().toISOString(),
    end_time: new Date().toISOString(),
    duration_minutes: durationMinutes,
    is_billable: isBillable,
    is_manual: true,
    notes,
  })

  if (error) throw error

  // Update actual_hours on task
  const { data: logs } = await supabase
    .from('time_logs')
    .select('duration_minutes')
    .eq('task_id', taskId)
    .not('end_time', 'is', null)

  const totalMinutes = (logs || []).reduce((sum, item) => sum + (item.duration_minutes || 0), 0)
  const actualHours = parseFloat((totalMinutes / 60).toFixed(2))

  await supabase
    .from('tasks')
    .update({ actual_hours: actualHours })
    .eq('id', taskId)

  revalidatePath(`/tasks/${taskId}`)
}
