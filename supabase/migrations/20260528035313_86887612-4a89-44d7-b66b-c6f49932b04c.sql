
CREATE TABLE public.cs_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'Mid-Market',
  arr NUMERIC NOT NULL DEFAULT 0,
  health INTEGER NOT NULL DEFAULT 70,
  qbr_status TEXT NOT NULL DEFAULT 'Scheduled',
  renewal_quarter TEXT NOT NULL DEFAULT 'Q4-2026',
  champion TEXT,
  economic_buyer TEXT,
  blocker TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cs_accounts TO authenticated;
GRANT ALL ON public.cs_accounts TO service_role;

ALTER TABLE public.cs_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cs_accounts owner select" ON public.cs_accounts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "cs_accounts owner insert" ON public.cs_accounts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cs_accounts owner update" ON public.cs_accounts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cs_accounts owner delete" ON public.cs_accounts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_cs_accounts_user ON public.cs_accounts(user_id);

CREATE TRIGGER update_cs_accounts_updated_at
  BEFORE UPDATE ON public.cs_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.cs_account_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.cs_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cs_account_events TO authenticated;
GRANT ALL ON public.cs_account_events TO service_role;

ALTER TABLE public.cs_account_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cs_events owner select" ON public.cs_account_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "cs_events owner insert" ON public.cs_account_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cs_events owner update" ON public.cs_account_events
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cs_events owner delete" ON public.cs_account_events
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_cs_events_account ON public.cs_account_events(account_id);
CREATE INDEX idx_cs_events_user_time ON public.cs_account_events(user_id, occurred_at DESC);
