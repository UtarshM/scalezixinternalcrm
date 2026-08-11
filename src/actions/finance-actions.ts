'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { BankAccount, FounderWithdrawal, Subscription, Payment, Expense } from '@/types'

// 1. BANK ACCOUNTS
export async function getBankAccounts() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .order('bank_name')

  if (error) {
    console.error('getBankAccounts error:', error)
    return []
  }
  return data as BankAccount[]
}

export async function saveBankAccount(accountData: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const payload = {
    bank_name: accountData.bank_name,
    account_holder_name: accountData.account_holder_name,
    account_number: accountData.account_number || null,
    upi_id: accountData.upi_id || null,
    current_balance: parseFloat(accountData.current_balance || '0'),
    account_type: accountData.account_type || 'savings'
  }

  let error
  if (accountData.id) {
    const { error: err } = await supabase
      .from('bank_accounts')
      .update(payload)
      .eq('id', accountData.id)
    error = err
  } else {
    const { error: err } = await supabase
      .from('bank_accounts')
      .insert(payload)
    error = err
  }

  if (error) throw error

  revalidatePath('/finance/bank-accounts')
  revalidatePath('/finance')
}

export async function deleteBankAccount(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('bank_accounts').delete().eq('id', id)
  if (error) throw error

  revalidatePath('/finance/bank-accounts')
  revalidatePath('/finance')
}

// 2. FOUNDER WITHDRAWALS
export async function getFounderWithdrawals() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('founder_withdrawals')
    .select('*, bank_account:bank_accounts(*), user:users(*)')
    .order('date', { ascending: false })

  if (error) {
    console.error('getFounderWithdrawals error:', error)
    return []
  }
  return data as FounderWithdrawal[]
}

export async function saveFounderWithdrawal(withdrawalData: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const payload = {
    date: withdrawalData.date || new Date().toISOString().split('T')[0],
    amount: parseFloat(withdrawalData.amount),
    reason: withdrawalData.reason || null,
    account_used: withdrawalData.account_used || null,
    created_by: user.id
  }

  let error
  if (withdrawalData.id) {
    const { error: err } = await supabase
      .from('founder_withdrawals')
      .update(payload)
      .eq('id', withdrawalData.id)
    error = err
  } else {
    // 1. Insert withdrawal
    const { error: err } = await supabase
      .from('founder_withdrawals')
      .insert(payload)
    error = err

    // 2. Subtract from bank account balance if specified
    if (!err && withdrawalData.account_used) {
      const { data: acc } = await supabase
        .from('bank_accounts')
        .select('current_balance')
        .eq('id', withdrawalData.account_used)
        .single()
      if (acc) {
        const newBal = (acc.current_balance || 0) - payload.amount
        await supabase
          .from('bank_accounts')
          .update({ current_balance: newBal })
          .eq('id', withdrawalData.account_used)
      }
    }
  }

  if (error) throw error

  revalidatePath('/finance/founder-withdrawals')
  revalidatePath('/finance/bank-accounts')
  revalidatePath('/finance')
}

// 3. SAAS SUBSCRIPTIONS
export async function getSubscriptions() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .order('name')

  if (error) {
    console.error('getSubscriptions error:', error)
    return []
  }
  return data as Subscription[]
}

export async function saveSubscription(subData: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const payload = {
    name: subData.name,
    monthly_cost: parseFloat(subData.monthly_cost || '0'),
    yearly_cost: parseFloat(subData.yearly_cost || '0'),
    renewal_date: subData.renewal_date || null,
    auto_renewal: subData.auto_renewal ?? true,
    payment_method: subData.payment_method || null,
    category: subData.category || 'software'
  }

  let error
  if (subData.id) {
    const { error: err } = await supabase
      .from('subscriptions')
      .update(payload)
      .eq('id', subData.id)
    error = err
  } else {
    const { error: err } = await supabase
      .from('subscriptions')
      .insert(payload)
    error = err
  }

  if (error) throw error

  revalidatePath('/finance/subscriptions')
  revalidatePath('/finance')
}

export async function deleteSubscription(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('subscriptions').delete().eq('id', id)
  if (error) throw error

  revalidatePath('/finance/subscriptions')
  revalidatePath('/finance')
}

// 4. INCOME TRANSACTIONS CRUD OVERRIDE (FOR EXPANDED INCOME FIELDS)
export async function saveIncomeTransaction(paymentData: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const payload = {
    invoice_id: paymentData.invoice_id || null,
    client_id: paymentData.client_id || null,
    project_id: paymentData.project_id || null,
    amount: parseFloat(paymentData.amount),
    gst_amount: parseFloat(paymentData.gst_amount || '0'),
    total_amount_received: parseFloat(paymentData.total_amount_received || '0'),
    category: paymentData.category || 'Client Project Payment',
    payment_method: paymentData.payment_method || 'bank_transfer',
    payment_date: paymentData.payment_date || new Date().toISOString().split('T')[0],
    reference_number: paymentData.reference_number || null,
    received_in_account: paymentData.received_in_account || null,
    invoice_number: paymentData.invoice_number || null,
    notes: paymentData.notes || null,
    status: 'paid',
    created_by: user.id
  }

  let error
  if (paymentData.id) {
    const { error: err } = await supabase
      .from('payments')
      .update(payload)
      .eq('id', paymentData.id)
    error = err
  } else {
    // 1. Insert payment record
    const { error: err } = await supabase
      .from('payments')
      .insert(payload)
    error = err

    // 2. Add to bank account balance if specified
    if (!err && paymentData.received_in_account) {
      const { data: acc } = await supabase
        .from('bank_accounts')
        .select('current_balance')
        .eq('id', paymentData.received_in_account)
        .single()
      if (acc) {
        const newBal = (acc.current_balance || 0) + payload.total_amount_received
        await supabase
          .from('bank_accounts')
          .update({ current_balance: newBal })
          .eq('id', paymentData.received_in_account)
      }
    }
  }

  if (error) throw error

  revalidatePath('/finance/income')
  revalidatePath('/payments')
  revalidatePath('/finance')
  revalidatePath('/finance/bank-accounts')
}

// 5. EXPENSES OVERRIDE FOR EXPANDED FIELDS
export async function saveExpenseTransaction(expenseData: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const payload = {
    title: expenseData.title,
    category: expenseData.category || 'software',
    amount: parseFloat(expenseData.amount),
    gst_amount: parseFloat(expenseData.gst_amount || '0'),
    total_amount: parseFloat(expenseData.total_amount || '0'),
    date: expenseData.date || new Date().toISOString().split('T')[0],
    project_id: expenseData.project_id || null,
    vendor_id: expenseData.vendor_id || null,
    paid_to: expenseData.paid_to || null,
    paid_by: expenseData.paid_by || null,
    payment_method: expenseData.payment_method || 'bank_transfer',
    notes: expenseData.notes || null,
    status: expenseData.status || 'pending',
    created_by: user.id
  }

  let error
  if (expenseData.id) {
    const { error: err } = await supabase
      .from('expenses')
      .update(payload)
      .eq('id', expenseData.id)
    error = err
  } else {
    const { error: err } = await supabase
      .from('expenses')
      .insert(payload)
    error = err
  }

  if (error) throw error

  revalidatePath('/finance/expenses')
  revalidatePath('/finance')
}
