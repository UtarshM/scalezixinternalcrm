'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Client, Contact } from '@/types'

export async function getClients() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('company_name', { ascending: true })

  if (error) {
    console.error('getClients error:', error)
    return []
  }
  return data as Client[]
}

export async function getClientById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*, contacts(*), projects(*), invoices(*), payments(*)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getClientById error:', error)
    return null
  }
  return data as Client
}

export async function createClientRecord(formData: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('clients').insert({
    ...formData,
    created_by: user.id,
  })

  if (error) throw error

  revalidatePath('/clients')
}

export async function updateClientRecord(id: string, formData: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('clients').update(formData).eq('id', id)

  if (error) throw error

  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
}

export async function deleteClientRecord(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('clients').delete().eq('id', id)

  if (error) throw error

  revalidatePath('/clients')
}

export async function addClientContact(clientId: string, contactData: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('contacts').insert({
    ...contactData,
    client_id: clientId,
  })

  if (error) throw error

  revalidatePath(`/clients/${clientId}`)
}

export async function updateClientContact(contactId: string, clientId: string, contactData: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('contacts').update(contactData).eq('id', contactId)

  if (error) throw error

  revalidatePath(`/clients/${clientId}`)
}

export async function deleteClientContact(contactId: string, clientId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('contacts').delete().eq('id', contactId)

  if (error) throw error

  revalidatePath(`/clients/${clientId}`)
}
