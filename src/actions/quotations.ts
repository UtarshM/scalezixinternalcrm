'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createInvoiceRecord } from './invoices'
import { createProjectRecord } from './projects'
import type { Quotation, QuotationItem } from '@/types'

export async function getQuotations() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('quotations')
    .select('*, client:clients(company_name), lead:leads(title)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getQuotations error:', error)
    return []
  }
  return data as Quotation[]
}

export async function getQuotationById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('quotations')
    .select('*, client:clients(*), lead:leads(*), items:quotation_items(*)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getQuotationById error:', error)
    return null
  }
  return data as Quotation
}

export async function createQuotationRecord(quotationData: any, items: any[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Insert quotation header
  const { data: quote, error: quoteErr } = await supabase
    .from('quotations')
    .insert({
      ...quotationData,
      created_by: user.id,
    })
    .select()
    .single()

  if (quoteErr) throw quoteErr

  // 2. Insert items
  if (items.length > 0) {
    const itemsWithQuoteId = items.map(item => ({
      ...item,
      quotation_id: quote.id,
    }))
    const { error: itemsErr } = await supabase
      .from('quotation_items')
      .insert(itemsWithQuoteId)

    if (itemsErr) throw itemsErr
  }

  revalidatePath('/quotations')
  return quote.id
}

export async function updateQuotationRecord(id: string, quotationData: any, items: any[]) {
  const supabase = await createClient()

  // 1. Update quotation header
  const { error: quoteErr } = await supabase
    .from('quotations')
    .update(quotationData)
    .eq('id', id)

  if (quoteErr) throw quoteErr

  // 2. Delete existing items
  const { error: delErr } = await supabase
    .from('quotation_items')
    .delete()
    .eq('quotation_id', id)

  if (delErr) throw delErr

  // 3. Insert items
  if (items.length > 0) {
    const itemsWithQuoteId = items.map(item => ({
      ...item,
      quotation_id: id,
    }))
    const { error: itemsErr } = await supabase
      .from('quotation_items')
      .insert(itemsWithQuoteId)

    if (itemsErr) throw itemsErr
  }

  revalidatePath('/quotations')
  revalidatePath(`/quotations/${id}`)
}

export async function deleteQuotationRecord(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('quotations').delete().eq('id', id)

  if (error) throw error

  revalidatePath('/quotations')
}

export async function convertQuotationToInvoice(quoteId: string) {
  const quote = await getQuotationById(quoteId)
  if (!quote) throw new Error('Quotation not found')

  // Prepare invoice data
  const invoiceData = {
    invoice_number: `INV-AUTO-${Date.now().toString().slice(-6)}`,
    client_id: quote.client_id,
    subtotal: quote.subtotal,
    discount_type: quote.discount_type,
    discount_value: quote.discount_value,
    tax_amount: quote.tax_amount,
    total: quote.total,
    notes: `Converted from quotation ${quote.quotation_number}`,
    status: 'draft',
  }

  // Prepare line items
  const lineItems = (quote.items || []).map(item => ({
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    amount: item.amount,
  }))

  const invoiceId = await createInvoiceRecord(invoiceData, lineItems)

  // Update quote with reference and mark approved
  const supabase = await createClient()
  await supabase
    .from('quotations')
    .update({
      converted_to_invoice_id: invoiceId,
      status: 'approved',
    })
    .eq('id', quoteId)

  revalidatePath('/quotations')
  revalidatePath(`/quotations/${quoteId}`)
  revalidatePath('/invoices')

  return invoiceId
}

export async function convertQuotationToProject(quoteId: string, projectName: string) {
  const quote = await getQuotationById(quoteId)
  if (!quote) throw new Error('Quotation not found')

  // Prepare project data
  const projectData = {
    project_id: `PROJ-${Date.now().toString().slice(-4)}`,
    name: projectName,
    client_id: quote.client_id,
    budget: quote.total,
    status: 'planning',
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Create project record
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .insert({
      ...projectData,
      created_by: user.id,
    })
    .select()
    .single()

  if (projErr) throw projErr

  // Link quotation to project and mark approved
  await supabase
    .from('quotations')
    .update({
      converted_to_project_id: project.id,
      status: 'approved',
    })
    .eq('id', quoteId)

  revalidatePath('/quotations')
  revalidatePath(`/quotations/${quoteId}`)
  revalidatePath('/projects')

  return project.id
}
