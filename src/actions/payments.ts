'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Payment } from '@/types'

export async function getPayments() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('*, client:clients(company_name), invoice:invoices(invoice_number)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getPayments error:', error)
    return []
  }
  return data as Payment[]
}

export async function createPaymentRecord(paymentData: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Insert payment record
  const { data: payment, error } = await supabase
    .from('payments')
    .insert({
      ...paymentData,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) throw error

  // 2. If linked to invoice, update invoice paid amount and status
  if (paymentData.invoice_id) {
    const { data: invoice } = await supabase
      .from('invoices')
      .select('total, amount_paid')
      .eq('id', paymentData.invoice_id)
      .single()

    if (invoice) {
      const newPaidAmount = (invoice.amount_paid || 0) + parseFloat(paymentData.amount)
      let newStatus = 'sent'
      if (newPaidAmount >= invoice.total) {
        newStatus = 'paid'
      } else if (newPaidAmount > 0) {
        newStatus = 'sent' // or partially paid
      }

      await supabase
        .from('invoices')
        .update({
          amount_paid: newPaidAmount,
          status: newStatus,
        })
        .eq('id', paymentData.invoice_id)
    }
  }

  revalidatePath('/payments')
  revalidatePath('/invoices')
  if (paymentData.invoice_id) {
    revalidatePath(`/invoices/${paymentData.invoice_id}`)
  }
}

export async function deletePaymentRecord(id: string) {
  const supabase = await createClient()

  // 1. Fetch payment details before deleting to check if it's linked to an invoice
  const { data: payment, error: fetchErr } = await supabase
    .from('payments')
    .select('invoice_id, amount')
    .eq('id', id)
    .single()

  if (fetchErr) throw fetchErr

  // 2. Remove payment from database
  const { error: deleteErr } = await supabase.from('payments').delete().eq('id', id)
  if (deleteErr) throw deleteErr

  // 3. Update invoice's amount_paid and status
  if (payment && payment.invoice_id) {
    const { data: invoice } = await supabase
      .from('invoices')
      .select('total')
      .eq('id', payment.invoice_id)
      .single()

    if (invoice) {
      // Fetch remaining payments for this invoice
      const { data: remainingPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('invoice_id', payment.invoice_id)

      const totalPaid = (remainingPayments || []).reduce((sum, p) => sum + parseFloat(p.amount), 0)
      
      let newStatus = 'sent'
      if (totalPaid >= invoice.total) {
        newStatus = 'paid'
      } else if (totalPaid > 0) {
        newStatus = 'sent'
      } else {
        newStatus = 'sent'
      }

      await supabase
        .from('invoices')
        .update({
          amount_paid: totalPaid,
          status: newStatus,
        })
        .eq('id', payment.invoice_id)
    }
  }

  revalidatePath('/payments')
  revalidatePath('/invoices')
  if (payment?.invoice_id) {
    revalidatePath(`/invoices/${payment.invoice_id}`)
  }
}
