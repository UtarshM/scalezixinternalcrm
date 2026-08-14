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

// Attendance Actions
export async function getAttendanceRecords(filterDate?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('attendance')
    .select('*, user:users(*), employee:employees(*)')
    .order('date', { ascending: false })

  if (filterDate) {
    query = query.eq('date', filterDate)
  }

  const { data, error } = await query

  if (error) {
    console.error('getAttendanceRecords error:', error)
    return []
  }
  return data
}

export async function getTodayAttendanceForUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const todayStr = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', todayStr)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('getTodayAttendanceForUser error:', error)
  }
  return data
}

export async function clockIn(notes?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const todayStr = new Date().toISOString().split('T')[0]
  const nowIso = new Date().toISOString()

  // Find linked employee ID if available
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  // Check if late (e.g. after 09:30 AM local time)
  const now = new Date()
  const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30)
  const initialStatus = isLate ? 'late' : 'present'

  const { data, error } = await supabase
    .from('attendance')
    .upsert({
      user_id: user.id,
      employee_id: employee?.id || null,
      date: todayStr,
      check_in: nowIso,
      status: initialStatus,
      notes: notes || null,
      updated_at: nowIso,
    }, { onConflict: 'user_id,date' })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/hr/attendance')
  return data
}

export async function clockOut(notes?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const todayStr = new Date().toISOString().split('T')[0]
  const nowIso = new Date().toISOString()

  // Fetch current check_in
  const { data: existing } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', todayStr)
    .single()

  if (!existing || !existing.check_in) {
    throw new Error('You must Clock In before Clocking Out.')
  }

  const checkInTime = new Date(existing.check_in).getTime()
  const checkOutTime = new Date(nowIso).getTime()
  const diffHours = Number(((checkOutTime - checkInTime) / (1000 * 60 * 60)).toFixed(2))

  const { data, error } = await supabase
    .from('attendance')
    .update({
      check_out: nowIso,
      total_hours: diffHours,
      notes: notes || existing.notes,
      updated_at: nowIso,
    })
    .eq('id', existing.id)
    .select()
    .single()

  if (error) throw error
  revalidatePath('/hr/attendance')
  return data
}

export async function saveAttendanceRecord(data: {
  id?: string
  user_id: string
  employee_id?: string | null
  date: string
  check_in?: string | null
  check_out?: string | null
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave' | 'remote'
  notes?: string | null
  total_hours?: number | null
}) {
  const supabase = await createClient()
  
  let totalHours = data.total_hours
  if (data.check_in && data.check_out && !totalHours) {
    const checkInTime = new Date(data.check_in).getTime()
    const checkOutTime = new Date(data.check_out).getTime()
    totalHours = Number(((checkOutTime - checkInTime) / (1000 * 60 * 60)).toFixed(2))
  }

  const payload = {
    user_id: data.user_id,
    employee_id: data.employee_id || null,
    date: data.date,
    check_in: data.check_in || null,
    check_out: data.check_out || null,
    status: data.status,
    notes: data.notes || null,
    total_hours: totalHours || null,
    updated_at: new Date().toISOString(),
  }

  let error
  if (data.id) {
    const result = await supabase.from('attendance').update(payload).eq('id', data.id)
    error = result.error
  } else {
    const result = await supabase.from('attendance').upsert(payload, { onConflict: 'user_id,date' })
    error = result.error
  }

  if (error) throw error
  revalidatePath('/hr/attendance')
}

export async function deleteAttendanceRecord(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('attendance').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/hr/attendance')
}

export async function getAllUsersWithEmployees() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*, employee:employees(*)')
    .order('full_name', { ascending: true })

  if (error) {
    console.error('getAllUsersWithEmployees error:', error)
    return []
  }
  return data
}

export async function getMonthlyAttendanceRecords(monthStr: string) {
  const supabase = await createClient()
  // monthStr format: YYYY-MM
  const startDate = `${monthStr}-01`
  // End of month date calculation
  const [year, month] = monthStr.split('-').map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${monthStr}-${String(lastDay).padStart(2, '0')}`

  const { data, error } = await supabase
    .from('attendance')
    .select('*, user:users(*), employee:employees(*)')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (error) {
    console.error('getMonthlyAttendanceRecords error:', error)
    return []
  }
  return data
}

export async function quickSetAttendanceStatus(
  userId: string,
  dateStr: string,
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave' | 'remote'
) {
  const supabase = await createClient()
  
  // Find linked employee ID if available
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  const nowIso = new Date().toISOString()
  let checkIn: string | null = null
  if (status === 'present' || status === 'late' || status === 'remote') {
    checkIn = `${dateStr}T09:00:00.000Z`
  }

  const { error } = await supabase
    .from('attendance')
    .upsert({
      user_id: userId,
      employee_id: employee?.id || null,
      date: dateStr,
      status: status,
      check_in: checkIn,
      updated_at: nowIso,
    }, { onConflict: 'user_id,date' })

  if (error) throw error
  revalidatePath('/hr/attendance')
}

export async function markBulkUnmarkedAbsent(dateStr: string) {
  const supabase = await createClient()
  
  // Fetch all users
  const { data: users } = await supabase.from('users').select('id')
  if (!users || users.length === 0) return

  // Fetch existing attendance for this date
  const { data: existing } = await supabase
    .from('attendance')
    .select('user_id')
    .eq('date', dateStr)

  const existingUserIds = new Set((existing || []).map(e => e.user_id))
  const unmarkedUsers = users.filter(u => !existingUserIds.has(u.id))

  if (unmarkedUsers.length === 0) return 0

  const nowIso = new Date().toISOString()
  const rowsToInsert = unmarkedUsers.map(u => ({
    user_id: u.id,
    date: dateStr,
    status: 'absent',
    notes: 'Auto-marked absent by Admin',
    updated_at: nowIso,
  }))

  const { error } = await supabase.from('attendance').upsert(rowsToInsert, { onConflict: 'user_id,date' })
  if (error) throw error
  revalidatePath('/hr/attendance')
  return unmarkedUsers.length
}


