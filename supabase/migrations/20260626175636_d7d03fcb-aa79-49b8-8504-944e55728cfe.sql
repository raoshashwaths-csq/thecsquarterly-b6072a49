-- Defense-in-depth: prevent submitter email exposure via PostgREST.
-- All legitimate access to job_listings goes through server functions using the
-- service_role key, so the authenticated/anon roles should not be able to read
-- submitted_email even if a future SELECT policy is added.

REVOKE SELECT ON public.job_listings FROM authenticated;
REVOKE SELECT ON public.job_listings FROM anon;

GRANT SELECT (
  id,
  employer_name,
  job_title,
  description,
  apply_url,
  package_tier,
  status,
  pinned,
  featured,
  click_count,
  submitted_by,
  created_at,
  updated_at
) ON public.job_listings TO authenticated;
