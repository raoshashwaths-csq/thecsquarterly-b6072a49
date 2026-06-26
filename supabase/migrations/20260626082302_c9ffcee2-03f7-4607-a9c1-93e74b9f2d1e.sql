REVOKE SELECT (submitted_email, submitted_by) ON public.job_listings FROM anon;
REVOKE SELECT (submitted_email, submitted_by) ON public.job_listings FROM authenticated;