
-- =========================================================
-- Reckoning Ledger tables (team-scoped)
-- =========================================================

-- 1. rl_accounts
CREATE TABLE public.rl_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  name text NOT NULL,
  contract_value numeric NOT NULL DEFAULT 0,
  current_roi numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rl_accounts TO authenticated;
GRANT ALL ON public.rl_accounts TO service_role;
ALTER TABLE public.rl_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rl_accounts team read" ON public.rl_accounts
  FOR SELECT TO authenticated
  USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "rl_accounts team insert" ON public.rl_accounts
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND public.is_team_member(team_id, auth.uid()));
CREATE POLICY "rl_accounts team update" ON public.rl_accounts
  FOR UPDATE TO authenticated
  USING (public.is_team_member(team_id, auth.uid()))
  WITH CHECK (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "rl_accounts team delete" ON public.rl_accounts
  FOR DELETE TO authenticated
  USING (public.is_team_member(team_id, auth.uid()));

CREATE TRIGGER rl_accounts_updated_at
  BEFORE UPDATE ON public.rl_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX rl_accounts_team_idx ON public.rl_accounts(team_id);

-- 2. rl_stakeholders
CREATE TABLE public.rl_stakeholders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES public.rl_accounts(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  email text,
  current_title text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rl_stakeholders TO authenticated;
GRANT ALL ON public.rl_stakeholders TO service_role;
ALTER TABLE public.rl_stakeholders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rl_stakeholders team read" ON public.rl_stakeholders
  FOR SELECT TO authenticated
  USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "rl_stakeholders team insert" ON public.rl_stakeholders
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND public.is_team_member(team_id, auth.uid()));
CREATE POLICY "rl_stakeholders team update" ON public.rl_stakeholders
  FOR UPDATE TO authenticated
  USING (public.is_team_member(team_id, auth.uid()))
  WITH CHECK (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "rl_stakeholders team delete" ON public.rl_stakeholders
  FOR DELETE TO authenticated
  USING (public.is_team_member(team_id, auth.uid()));

CREATE INDEX rl_stakeholders_account_idx ON public.rl_stakeholders(account_id);

-- 3. rl_value_metrics
CREATE TABLE public.rl_value_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  metric_name text NOT NULL,
  hourly_multiplier numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rl_value_metrics TO authenticated;
GRANT ALL ON public.rl_value_metrics TO service_role;
ALTER TABLE public.rl_value_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rl_value_metrics team read" ON public.rl_value_metrics
  FOR SELECT TO authenticated
  USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "rl_value_metrics team insert" ON public.rl_value_metrics
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND public.is_team_member(team_id, auth.uid()));
CREATE POLICY "rl_value_metrics team update" ON public.rl_value_metrics
  FOR UPDATE TO authenticated
  USING (public.is_team_member(team_id, auth.uid()))
  WITH CHECK (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "rl_value_metrics team delete" ON public.rl_value_metrics
  FOR DELETE TO authenticated
  USING (public.is_team_member(team_id, auth.uid()));

-- 4. rl_value_ledger
CREATE TABLE public.rl_value_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES public.rl_accounts(id) ON DELETE CASCADE,
  metric_type text NOT NULL CHECK (metric_type IN ('Time Saved','Direct Revenue')),
  quantity_logged numeric NOT NULL DEFAULT 0,
  financial_value_override numeric,
  logged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rl_value_ledger TO authenticated;
GRANT ALL ON public.rl_value_ledger TO service_role;
ALTER TABLE public.rl_value_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rl_value_ledger team read" ON public.rl_value_ledger
  FOR SELECT TO authenticated
  USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "rl_value_ledger team insert" ON public.rl_value_ledger
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND public.is_team_member(team_id, auth.uid()));
CREATE POLICY "rl_value_ledger team update" ON public.rl_value_ledger
  FOR UPDATE TO authenticated
  USING (public.is_team_member(team_id, auth.uid()))
  WITH CHECK (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "rl_value_ledger team delete" ON public.rl_value_ledger
  FOR DELETE TO authenticated
  USING (public.is_team_member(team_id, auth.uid()));

CREATE INDEX rl_value_ledger_account_idx ON public.rl_value_ledger(account_id);
CREATE INDEX rl_value_ledger_logged_at_idx ON public.rl_value_ledger(logged_at DESC);

-- 5. rl_intelligence_signals
CREATE TABLE public.rl_intelligence_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES public.rl_accounts(id) ON DELETE CASCADE,
  signal_type text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL DEFAULT 'Medium' CHECK (severity IN ('Low','Medium','High')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','dismissed','actioned')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rl_intelligence_signals TO authenticated;
GRANT ALL ON public.rl_intelligence_signals TO service_role;
ALTER TABLE public.rl_intelligence_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rl_signals team read" ON public.rl_intelligence_signals
  FOR SELECT TO authenticated
  USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "rl_signals team insert" ON public.rl_intelligence_signals
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND public.is_team_member(team_id, auth.uid()));
CREATE POLICY "rl_signals team update" ON public.rl_intelligence_signals
  FOR UPDATE TO authenticated
  USING (public.is_team_member(team_id, auth.uid()))
  WITH CHECK (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "rl_signals team delete" ON public.rl_intelligence_signals
  FOR DELETE TO authenticated
  USING (public.is_team_member(team_id, auth.uid()));

CREATE INDEX rl_signals_account_idx ON public.rl_intelligence_signals(account_id);
CREATE INDEX rl_signals_created_idx ON public.rl_intelligence_signals(created_at DESC);
