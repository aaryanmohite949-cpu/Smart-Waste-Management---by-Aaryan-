
-- Fix overly permissive INSERT policy on daily_waste_records
DROP POLICY "Insert records via API" ON public.daily_waste_records;

-- IoT data insertion happens via edge function with service role key (bypasses RLS)
-- Users should not be able to insert records directly
CREATE POLICY "Admins can insert records" ON public.daily_waste_records
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
