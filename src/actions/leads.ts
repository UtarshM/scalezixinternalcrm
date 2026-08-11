'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Lead, LeadNote, LeadFollowup } from '@/types'

export async function getLeads() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*, owner:users!leads_owner_id_fkey(*)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getLeads error:', error)
    return []
  }
  return data as Lead[]
}

export async function getLeadById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*, owner:users!leads_owner_id_fkey(*), notes:lead_notes(*, user:users(*)), followups:lead_followups(*)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getLeadById error:', error)
    return null
  }
  return data as Lead
}

import { logActivity } from '@/actions/activities'

export async function createLead(formData: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase.from('leads').insert({
    ...formData,
    owner_id: formData.owner_id || user.id,
    created_by: user.id,
  }).select().single()

  if (error) throw error

  await logActivity('crm', 'lead_create', data?.id, `Lead "${formData.title || formData.contact_name}" registered by user`)

  revalidatePath('/crm/leads')
  revalidatePath('/crm/pipeline')
}

export async function updateLead(id: string, formData: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('leads').update(formData).eq('id', id)

  if (error) throw error

  revalidatePath('/crm/leads')
  revalidatePath(`/crm/leads/${id}`)
  revalidatePath('/crm/pipeline')
}

export async function deleteLead(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('leads').delete().eq('id', id)

  if (error) throw error

  revalidatePath('/crm/leads')
  revalidatePath('/crm/pipeline')
}

export async function updateLeadStatus(id: string, status: string) {
  const supabase = await createClient()
  const { data: lead } = await supabase.from('leads').select('title').eq('id', id).single()

  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', id)

  if (error) throw error

  if (lead) {
    await logActivity('crm', 'lead_status_update', id, `Lead "${lead.title}" status moved to ${status}`)
  }

  revalidatePath('/crm/leads')
  revalidatePath(`/crm/leads/${id}`)
  revalidatePath('/crm/pipeline')
}

export async function addLeadNote(leadId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('lead_notes').insert({
    lead_id: leadId,
    content,
    created_by: user.id,
  })

  if (error) throw error
  revalidatePath(`/crm/leads/${leadId}`)
}

export async function addLeadFollowup(leadId: string, type: string, scheduledAt: string, notes?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('lead_followups').insert({
    lead_id: leadId,
    type,
    scheduled_at: scheduledAt,
    notes,
    created_by: user.id,
  })

  if (error) throw error
  revalidatePath(`/crm/leads/${leadId}`)
}

export async function convertLeadToClient(leadId: string, companyName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Fetch the lead
  const lead = await getLeadById(leadId)
  if (!lead) throw new Error('Lead not found')

  // 2. Create the client
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .insert({
      company_name: companyName,
      created_by: user.id,
      notes: `Converted from lead: ${lead.title}`,
    })
    .select()
    .single()

  if (clientErr) throw clientErr

  // 3. Create the contact person from lead info
  if (lead.contact_name || lead.email || lead.phone) {
    await supabase.from('contacts').insert({
      client_id: client.id,
      name: lead.contact_name || 'Primary Contact',
      email: lead.email,
      phone: lead.phone,
      is_primary: true,
    })
  }

  // 4. Update the lead to link to client and mark as won
  await supabase
    .from('leads')
    .update({
      client_id: client.id,
      status: 'won',
    })
    .eq('id', leadId)

  revalidatePath('/crm/leads')
  revalidatePath(`/crm/leads/${leadId}`)
  revalidatePath('/clients')
  
  return client.id
}
