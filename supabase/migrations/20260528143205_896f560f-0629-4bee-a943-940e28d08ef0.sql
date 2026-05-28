
-- 1) Column-level lockdown for submitter PII on job_listings
REVOKE SELECT (submitted_email, submitted_by) ON public.job_listings FROM anon;
REVOKE SELECT (submitted_email, submitted_by) ON public.job_listings FROM authenticated;

-- 2) Scope purchases insert policy to authenticated role
DROP POLICY IF EXISTS "purchases insert own pending" ON public.purchases;
CREATE POLICY "purchases insert own pending"
  ON public.purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- 3) Scope q_runs insert policy to authenticated role
DROP POLICY IF EXISTS "q_runs insert own" ON public.q_runs;
CREATE POLICY "q_runs insert own"
  ON public.q_runs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
