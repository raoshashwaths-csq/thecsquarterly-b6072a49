
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============ maps ============
CREATE TABLE IF NOT EXISTS public.maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  account_id uuid REFERENCES public.cs_accounts(id) ON DELETE SET NULL,
  account_name text,
  csm_id uuid NOT NULL,
  csm_name text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','completed','archived')),
  contract_start_date date,
  target_value_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  benchmark_ttv_days integer,
  actual_ttv_days integer,
  share_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  share_enabled boolean NOT NULL DEFAULT false,
  customer_email text,
  last_customer_view timestamptz,
  lumi_generated boolean NOT NULL DEFAULT false,
  account_tier text,
  account_industry text
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.maps TO authenticated;
GRANT ALL ON public.maps TO service_role;
ALTER TABLE public.maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "maps owner read" ON public.maps FOR SELECT TO authenticated USING (auth.uid() = csm_id);
CREATE POLICY "maps owner insert" ON public.maps FOR INSERT TO authenticated WITH CHECK (auth.uid() = csm_id);
CREATE POLICY "maps owner update" ON public.maps FOR UPDATE TO authenticated USING (auth.uid() = csm_id) WITH CHECK (auth.uid() = csm_id);
CREATE POLICY "maps owner delete" ON public.maps FOR DELETE TO authenticated USING (auth.uid() = csm_id);

CREATE INDEX IF NOT EXISTS idx_maps_account ON public.maps(account_id);
CREATE INDEX IF NOT EXISTS idx_maps_csm ON public.maps(csm_id);
CREATE INDEX IF NOT EXISTS idx_maps_status ON public.maps(status);

CREATE TRIGGER trg_maps_updated_at BEFORE UPDATE ON public.maps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ map_phases ============
CREATE TABLE IF NOT EXISTS public.map_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id uuid NOT NULL REFERENCES public.maps(id) ON DELETE CASCADE,
  title text NOT NULL,
  phase_order integer NOT NULL,
  is_value_milestone boolean NOT NULL DEFAULT false,
  color text NOT NULL DEFAULT '#C4A45A',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.map_phases TO authenticated;
GRANT ALL ON public.map_phases TO service_role;
ALTER TABLE public.map_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "map_phases owner all" ON public.map_phases FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.maps m WHERE m.id = map_phases.map_id AND m.csm_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.maps m WHERE m.id = map_phases.map_id AND m.csm_id = auth.uid()));

-- ============ map_milestones ============
CREATE TABLE IF NOT EXISTS public.map_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id uuid NOT NULL REFERENCES public.maps(id) ON DELETE CASCADE,
  phase_id uuid NOT NULL REFERENCES public.map_phases(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  milestone_order integer NOT NULL,
  owner text NOT NULL DEFAULT 'shared' CHECK (owner IN ('csm','customer','shared')),
  assigned_to text,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed','blocked')),
  due_days_from_start integer,
  completed_at timestamptz,
  health_score_impact integer NOT NULL DEFAULT 0,
  completion_note text,
  blocked_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.map_milestones TO authenticated;
GRANT ALL ON public.map_milestones TO service_role;
ALTER TABLE public.map_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "map_milestones owner all" ON public.map_milestones FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.maps m WHERE m.id = map_milestones.map_id AND m.csm_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.maps m WHERE m.id = map_milestones.map_id AND m.csm_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_milestones_map ON public.map_milestones(map_id);
CREATE INDEX IF NOT EXISTS idx_milestones_phase ON public.map_milestones(phase_id, milestone_order);

-- ============ map_comments ============
CREATE TABLE IF NOT EXISTS public.map_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id uuid NOT NULL REFERENCES public.maps(id) ON DELETE CASCADE,
  milestone_id uuid REFERENCES public.map_milestones(id) ON DELETE CASCADE,
  author_type text NOT NULL CHECK (author_type IN ('csm','customer')),
  author_name text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.map_comments TO authenticated;
GRANT ALL ON public.map_comments TO service_role;
ALTER TABLE public.map_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "map_comments owner read" ON public.map_comments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.maps m WHERE m.id = map_comments.map_id AND m.csm_id = auth.uid()));
CREATE POLICY "map_comments owner write" ON public.map_comments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.maps m WHERE m.id = map_comments.map_id AND m.csm_id = auth.uid()) AND author_type = 'csm');
