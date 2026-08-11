'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// 1. Credentials
export async function saveCredential(projectId: string, credentialData: any) {
  const supabase = await createClient()
  const id = credentialData.id

  let error
  if (id) {
    // Update
    const { error: err } = await supabase
      .from('project_credentials')
      .update({
        service_name: credentialData.service_name,
        account_email: credentialData.account_email || null,
        username: credentialData.username || null,
        password: credentialData.password || null,
        recovery_email: credentialData.recovery_email || null,
        recovery_phone: credentialData.recovery_phone || null,
        account_owner: credentialData.account_owner || null,
        billing_owner: credentialData.billing_owner || null,
        two_factor_enabled: !!credentialData.two_factor_enabled,
        notes: credentialData.notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
    error = err
  } else {
    // Insert
    const { error: err } = await supabase
      .from('project_credentials')
      .insert({
        project_id: projectId,
        service_name: credentialData.service_name,
        account_email: credentialData.account_email || null,
        username: credentialData.username || null,
        password: credentialData.password || null,
        recovery_email: credentialData.recovery_email || null,
        recovery_phone: credentialData.recovery_phone || null,
        account_owner: credentialData.account_owner || null,
        billing_owner: credentialData.billing_owner || null,
        two_factor_enabled: !!credentialData.two_factor_enabled,
        notes: credentialData.notes || null
      })
    error = err
  }

  if (error) throw error
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/credentials')
}

export async function deleteCredential(id: string, projectId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('project_credentials').delete().eq('id', id)
  if (error) throw error
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/credentials')
}

// 2. Hosting & Deployments
export async function saveHostingDeployment(projectId: string, data: any) {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('project_hosting_deployments')
    .select('id')
    .eq('project_id', projectId)
    .single()

  let error
  if (existing) {
    const { error: err } = await supabase
      .from('project_hosting_deployments')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('project_id', projectId)
    error = err
  } else {
    const { error: err } = await supabase
      .from('project_hosting_deployments')
      .insert({
        project_id: projectId,
        ...data
      })
    error = err
  }

  if (error) throw error
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/hosting-deployment')
}

// 3. Billing & Renewals
export async function saveBillingRenewal(projectId: string, billingData: any) {
  const supabase = await createClient()
  const id = billingData.id

  let error
  if (id) {
    const { error: err } = await supabase
      .from('project_billing_renewals')
      .update({
        service_name: billingData.service_name,
        monthly_cost: billingData.monthly_cost ? parseFloat(billingData.monthly_cost) : 0,
        yearly_cost: billingData.yearly_cost ? parseFloat(billingData.yearly_cost) : 0,
        currency: billingData.currency || 'INR',
        renewal_date: billingData.renewal_date || null,
        billing_frequency: billingData.billing_frequency,
        payment_status: billingData.payment_status,
        paid_by: billingData.paid_by,
        invoice_link: billingData.invoice_link || null,
        notes: billingData.notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
    error = err
  } else {
    const { error: err } = await supabase
      .from('project_billing_renewals')
      .insert({
        project_id: projectId,
        service_name: billingData.service_name,
        monthly_cost: billingData.monthly_cost ? parseFloat(billingData.monthly_cost) : 0,
        yearly_cost: billingData.yearly_cost ? parseFloat(billingData.yearly_cost) : 0,
        currency: billingData.currency || 'INR',
        renewal_date: billingData.renewal_date || null,
        billing_frequency: billingData.billing_frequency,
        payment_status: billingData.payment_status,
        paid_by: billingData.paid_by,
        invoice_link: billingData.invoice_link || null,
        notes: billingData.notes || null
      })
    error = err
  }

  if (error) throw error
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/billing-renewals')
}

export async function deleteBillingRenewal(id: string, projectId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('project_billing_renewals').delete().eq('id', id)
  if (error) throw error
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/billing-renewals')
}

// 4. Documentation
export async function saveProjectDocumentation(projectId: string, data: any) {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('project_documentation')
    .select('id')
    .eq('project_id', projectId)
    .single()

  let error
  if (existing) {
    const { error: err } = await supabase
      .from('project_documentation')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('project_id', projectId)
    error = err
  } else {
    const { error: err } = await supabase
      .from('project_documentation')
      .insert({
        project_id: projectId,
        ...data
      })
    error = err
  }

  if (error) throw error
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/documentation-notes')
}

// 5. Team Permissions
export async function updateMemberPermissions(memberId: string, projectId: string, permissions: any) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('project_members')
    .update(permissions)
    .eq('id', memberId)

  if (error) throw error
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/team-access')
}
