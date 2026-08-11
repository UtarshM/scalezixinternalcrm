'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import nodemailer from 'nodemailer'
import type { Invoice, InvoiceItem } from '@/types'

export async function getInvoices() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('*, client:clients(company_name), project:projects(name)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getInvoices error:', error)
    return []
  }
  return data as Invoice[]
}

export async function getInvoiceById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('*, client:clients(*, contacts(*)), project:projects(*), items:invoice_items(*)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getInvoiceById error:', error)
    return null
  }
  return data as Invoice
}

export async function createInvoiceRecord(invoiceData: any, items: any[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Insert invoice header
  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .insert({
      ...invoiceData,
      created_by: user.id,
    })
    .select()
    .single()

  if (invErr) throw invErr

  // 2. Insert invoice line items
  if (items.length > 0) {
    const itemsWithInvoiceId = items.map(item => ({
      ...item,
      invoice_id: invoice.id,
    }))
    const { error: itemsErr } = await supabase
      .from('invoice_items')
      .insert(itemsWithInvoiceId)

    if (itemsErr) throw itemsErr
  }

  revalidatePath('/invoices')
  return invoice.id
}

export async function updateInvoiceRecord(id: string, invoiceData: any, items: any[]) {
  const supabase = await createClient()

  // 1. Update invoice header
  const { error: invErr } = await supabase
    .from('invoices')
    .update(invoiceData)
    .eq('id', id)

  if (invErr) throw invErr

  // 2. Delete existing items
  const { error: delErr } = await supabase
    .from('invoice_items')
    .delete()
    .eq('invoice_id', id)

  if (delErr) throw delErr

  // 3. Insert new items
  if (items.length > 0) {
    const itemsWithInvoiceId = items.map(item => ({
      ...item,
      invoice_id: id,
    }))
    const { error: itemsErr } = await supabase
      .from('invoice_items')
      .insert(itemsWithInvoiceId)

    if (itemsErr) throw itemsErr
  }

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${id}`)
}

export async function deleteInvoiceRecord(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('invoices').delete().eq('id', id)

  if (error) throw error

  revalidatePath('/invoices')
}

export async function sendInvoiceEmail(invoiceId: string) {
  const supabase = await createClient()
  const invoice = await getInvoiceById(invoiceId)
  if (!invoice) throw new Error('Invoice not found')

  // Update invoice status to sent in DB
  await supabase.from('invoices').update({ status: 'sent' }).eq('id', invoiceId)
  revalidatePath(`/invoices/${invoiceId}`)

  return { 
    success: true, 
    message: 'We are adding this email configuration feature soon! (Invoice marked as Sent)' 
  }
}

export async function generateInvoiceFromMilestone(milestoneId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Fetch milestone
  const { data: milestone, error: milestoneErr } = await supabase
    .from('milestones')
    .select('*, project:projects(*)')
    .eq('id', milestoneId)
    .single()

  if (milestoneErr || !milestone) {
    throw new Error('Milestone not found')
  }

  // 2. Generate unique invoice number
  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`

  // 3. Create invoice header
  const invoiceData = {
    invoice_number: invoiceNumber,
    client_id: milestone.project.client_id,
    project_id: milestone.project.id,
    status: 'draft',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: milestone.budget || 0,
    discount_type: 'fixed',
    discount_value: 0,
    tax_type: 'none',
    cgst_rate: 0,
    sgst_rate: 0,
    igst_rate: 0,
    tax_amount: 0,
    total: milestone.budget || 0,
    notes: `Generated automatically from completed milestone: ${milestone.title}`,
    created_by: user.id
  }

  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .insert(invoiceData)
    .select()
    .single()

  if (invErr) throw invErr

  // 4. Create invoice line item
  const itemData = {
    invoice_id: invoice.id,
    description: `Milestone Deliverable: ${milestone.title}`,
    quantity: 1,
    unit_price: milestone.budget || 0,
    amount: milestone.budget || 0
  }

  const { error: itemErr } = await supabase
    .from('invoice_items')
    .insert(itemData)

  if (itemErr) throw itemErr

  // 5. Update milestone record to link or mark as invoiced
  await supabase
    .from('milestones')
    .update({ status: 'completed' })
    .eq('id', milestoneId)

  revalidatePath('/invoices')
  revalidatePath(`/projects/${milestone.project.id}`)
  return invoice.id
}
