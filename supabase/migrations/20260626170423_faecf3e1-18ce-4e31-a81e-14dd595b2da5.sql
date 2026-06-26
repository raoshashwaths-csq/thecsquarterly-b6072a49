-- Fix: submitter email exposed via public SELECT policy on job_listings.
-- Strategy: tighten the public SELECT policy to deny direct base-table reads of
-- sensitive columns, and expose a security_invoker view that omits the email
-- and submitter_id for anon/authenticated callers.

-- 1. Drop the broad public read policy on the base table.
DROP POLICY IF EXISTS "Active listings public read" ON public.job_listings;

-- 2. Replace it with an admin-only read policy on the base table; the public
--    surface goes through the view below. Service role (used by admin server
--    functions) continues to bypass RLS.
CREATE POLICY "Admins read all listings"
  ON public.job_listings
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. Public-safe view that excludes submitted_email + submitted_by.
DROP VIEW IF EXISTS public.job_listings_public;
CREATE VIEW public.job_listings_public
WITH (security_invoker = on) AS
  SELECT
    id, employer_name, job_title, description, apply_url,
    package_tier, status, pinned, featured, click_count,
    created_at, updated_at
  FROM public.job_listings
  WHERE status = 'active';

GRANT SELECT ON public.job_listings_public TO anon, authenticated;