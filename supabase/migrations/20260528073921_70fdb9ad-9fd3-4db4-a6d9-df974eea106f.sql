
-- 1) job_listings: revoke PII column access from anon/authenticated
REVOKE SELECT ON public.job_listings FROM anon, authenticated;
GRANT SELECT (id, employer_name, job_title, description, apply_url, package_tier, status, pinned, featured, click_count, created_at, updated_at) ON public.job_listings TO anon, authenticated;

-- 2) survey_responses: enforce email format at DB level
ALTER TABLE public.survey_responses
  ADD CONSTRAINT survey_responses_email_format_chk
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND char_length(email) <= 255);

-- 3) q_runs: remove broad "shared = true" cross-user read
DROP POLICY IF EXISTS "Users can view their own or shared runs" ON public.q_runs;
-- existing "q_runs select own" policy already restricts SELECT to owner or admin.
