-- 1. Restrict q_runs public-role policy to owner-only (remove shared OR clause)
DROP POLICY IF EXISTS "q_runs select own" ON public.q_runs;
CREATE POLICY "q_runs select own"
  ON public.q_runs FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

-- 2. Job listings: revoke column-level SELECT on PII from anon/authenticated.
-- All app access goes through supabaseAdmin (service_role), so this is safe.
REVOKE SELECT (submitted_email, submitted_by) ON public.job_listings FROM anon, authenticated;

-- 3. Playbooks: allow vanguard subscribers to read published playbooks
CREATE POLICY "playbooks vanguard read"
  ON public.playbooks FOR SELECT
  TO authenticated
  USING (
    published = true AND EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.user_id = auth.uid()
        AND s.status = 'active'
        AND s.tier = 'vanguard'
    )
  );