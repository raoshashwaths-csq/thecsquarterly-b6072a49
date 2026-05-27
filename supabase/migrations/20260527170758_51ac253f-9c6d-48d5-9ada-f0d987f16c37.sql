
CREATE TABLE public.job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  description TEXT,
  apply_url TEXT,
  package_tier INTEGER NOT NULL DEFAULT 299,
  status TEXT NOT NULL DEFAULT 'pending',
  pinned BOOLEAN NOT NULL DEFAULT false,
  featured BOOLEAN NOT NULL DEFAULT false,
  click_count INTEGER NOT NULL DEFAULT 0,
  submitted_by UUID,
  submitted_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_listings TO authenticated;
GRANT ALL ON public.job_listings TO service_role;
GRANT SELECT ON public.job_listings TO anon;

ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active listings public read" ON public.job_listings
  FOR SELECT USING (status = 'active' OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can submit listing" ON public.job_listings
  FOR INSERT WITH CHECK (status = 'pending');

CREATE POLICY "Admins update listings" ON public.job_listings
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete listings" ON public.job_listings
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_job_listings_status ON public.job_listings(status, created_at DESC);
