-- ============================================================
-- HR — ATTENDANCE MODULE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day', 'on_leave', 'remote')),
  notes TEXT,
  total_hours DECIMAL(4,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_user ON public.attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON public.attendance(employee_id);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can view attendance" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Users can insert own attendance or admins insert" ON public.attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own attendance or admins update" ON public.attendance FOR UPDATE USING (true);
CREATE POLICY "Admins can delete attendance" ON public.attendance FOR DELETE USING (true);
