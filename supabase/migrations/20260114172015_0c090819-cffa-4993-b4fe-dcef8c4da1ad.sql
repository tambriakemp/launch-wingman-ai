-- Remove the last overly permissive "always true" INSERT policy
-- Edge functions using service role key bypass RLS automatically
DROP POLICY IF EXISTS "Service role can insert activity" ON public.user_activity;