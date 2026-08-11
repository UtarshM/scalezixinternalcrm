-- ============================================================
-- DB Migration: Finance, Accounts & Cash Flow Management Module
-- ============================================================

-- 1. BANK ACCOUNTS
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  account_number TEXT,
  upi_id TEXT,
  current_balance DECIMAL(12,2) DEFAULT 0.00,
  account_type TEXT DEFAULT 'savings' CHECK (account_type IN ('savings', 'current', 'settlement', 'credit_card', 'other')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- Select/Insert/Update/Delete policies for authenticated users
DROP POLICY IF EXISTS "Allow all actions for authenticated users on bank_accounts" ON public.bank_accounts;
CREATE POLICY "Allow all actions for authenticated users on bank_accounts" 
  ON public.bank_accounts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. FOUNDER WITHDRAWALS & TEAM PAYMENTS
CREATE TABLE IF NOT EXISTS public.founder_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(12,2) NOT NULL,
  reason TEXT,
  account_used UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.founder_withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all actions for authenticated users on founder_withdrawals" ON public.founder_withdrawals;
CREATE POLICY "Allow all actions for authenticated users on founder_withdrawals" 
  ON public.founder_withdrawals
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. SAAS & SOFTWARE SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  monthly_cost DECIMAL(12,2) DEFAULT 0.00,
  yearly_cost DECIMAL(12,2) DEFAULT 0.00,
  renewal_date DATE,
  auto_renewal BOOLEAN DEFAULT true,
  payment_method TEXT,
  category TEXT DEFAULT 'software' CHECK (category IN ('software', 'hosting', 'marketing', 'office', 'other')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all actions for authenticated users on subscriptions" ON public.subscriptions;
CREATE POLICY "Allow all actions for authenticated users on subscriptions" 
  ON public.subscriptions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. ALTER PAYMENTS (INCOME TRANSACTIONS)
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS total_amount_received DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS received_in_account UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- 5. ALTER EXPENSES
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS total_amount DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS paid_to TEXT;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS paid_by TEXT;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Drop constraints if altering constraint validation checks is needed (Next.js client fallback takes care of options list values)
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_category_check;
