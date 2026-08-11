'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Expense, Vendor } from '@/types'

export async function getExpenses() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expenses')
    .select('*, project:projects(name), vendor:vendors(name)')
    .order('date', { ascending: false })

  if (error) {
    console.error('getExpenses error:', error)
    return []
  }
  return data as Expense[]
}

export async function createExpenseRecord(expenseData: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('expenses').insert({
    ...expenseData,
    created_by: user.id,
  })

  if (error) throw error

  revalidatePath('/finance/expenses')
}

export async function deleteExpenseRecord(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('expenses').delete().eq('id', id)

  if (error) throw error

  revalidatePath('/finance/expenses')
}

export async function getVendors() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('getVendors error:', error)
    return []
  }
  return data as Vendor[]
}

export async function createVendorRecord(vendorData: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('vendors').insert(vendorData)

  if (error) throw error

  revalidatePath('/finance/vendors')
}

export async function deleteVendorRecord(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('vendors').delete().eq('id', id)

  if (error) throw error

  revalidatePath('/finance/vendors')
}

export async function updateExpenseRecord(id: string, expenseData: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('expenses').update(expenseData).eq('id', id)

  if (error) throw error

  revalidatePath('/finance/expenses')
}
