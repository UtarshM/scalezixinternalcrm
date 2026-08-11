'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Employee, LeaveRequest } from '@/types'

export async function getEmployees() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('employees')
    .select('*, user:users(*)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getEmployees error:', error)
    return []
  }
  return data as Employee[]
}

export async function getEmployeeById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('employees')
    .select('*, user:users(*), leave_requests(*)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getEmployeeById error:', error)
    return null
  }
  return data as Employee
}

export async function createEmployeeRecord(employeeData: any) {
  const supabase = await createClient()
  
  // Make sure we connect it to a valid users record
  const { error } = await supabase.from('employees').insert(employeeData)

  if (error) throw error
  revalidatePath('/hr/employees')
}

export async function deleteEmployeeRecord(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('employees').delete().eq('id', id)

  if (error) throw error
  revalidatePath('/hr/employees')
}

export async function getLeaveRequests() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*, employee:employees(*, user:users(*))')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getLeaveRequests error:', error)
    return []
  }
  return data as LeaveRequest[]
}

export async function createLeaveRequestRecord(leaveData: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Find employee profile linked to user
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!employee) throw new Error('You do not have an employee profile setup')

  const { error } = await supabase.from('leave_requests').insert({
    ...leaveData,
    employee_id: employee.id,
    status: 'pending',
  })

  if (error) throw error
  revalidatePath('/hr/leaves')
}

export async function updateLeaveRequestStatus(leaveId: string, status: 'approved' | 'rejected') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('leave_requests')
    .update({
      status,
      approved_by: user.id,
    })
    .eq('id', leaveId)

  if (error) throw error
  revalidatePath('/hr/leaves')
}

export async function updateEmployeeRecord(id: string, employeeData: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('employees').update(employeeData).eq('id', id)
  if (error) throw error
  revalidatePath('/hr/employees')
  revalidatePath('/hr/payroll')
}
