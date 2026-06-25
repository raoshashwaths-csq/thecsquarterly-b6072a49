CREATE TABLE public.diagnostic_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  company text NOT NULL,
  title text NOT NULL,
  segment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_diagnostic_leads_slug ON public.diagnostic_leads(slug);
CREATE INDEX idx_diagnostic_leads_email ON public.diagnostic_leads(email);

GRANT ALL ON public.diagnostic_leads TO service_role;
ALTER TABLE public.diagnostic_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages diagnostic leads"
  ON public.diagnostic_leads FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');