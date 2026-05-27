REVOKE SELECT ON public.job_listings FROM anon, authenticated;

GRANT SELECT (id, employer_name, job_title, description, apply_url, package_tier, status, pinned, featured, click_count, created_at, updated_at) ON public.job_listings TO anon, authenticated;

GRANT INSERT ON public.job_listings TO anon, authenticated;