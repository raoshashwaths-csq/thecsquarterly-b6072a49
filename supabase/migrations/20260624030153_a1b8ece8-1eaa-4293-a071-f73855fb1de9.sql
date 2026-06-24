
-- Add team-leader flag (used by CTA assignment modal)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_team_leader boolean NOT NULL DEFAULT false;

-- CTA Engine ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ctas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  cta_type text NOT NULL CHECK (cta_type IN ('call','email','meeting','task','escalation','renewal','expansion','other')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical','high','medium','low')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','completed','dismissed')),
  account_id uuid REFERENCES public.cs_accounts(id) ON DELETE SET NULL,
  account_name text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by_name text,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to_name text,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  team_wide boolean NOT NULL DEFAULT false,
  due_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','lumi','renewal_war_room','expansion_engine','health_alert')),
  source_ref text,
  completion_note text,
  outcome text CHECK (outcome IN ('resolved','escalated','deferred','no_action_needed'))
);

CREATE INDEX IF NOT EXISTS ctas_status_due_idx ON public.ctas (status, due_date);
CREATE INDEX IF NOT EXISTS ctas_account_status_idx ON public.ctas (account_id, status);
CREATE INDEX IF NOT EXISTS ctas_assignee_status_idx ON public.ctas (assigned_to, status);
CREATE INDEX IF NOT EXISTS ctas_creator_idx ON public.ctas (created_by);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ctas TO authenticated;
GRANT ALL ON public.ctas TO service_role;

ALTER TABLE public.ctas ENABLE ROW LEVEL SECURITY;

-- Read: creator, assignee, or any member of the team for team-wide rows
CREATE POLICY "ctas_select_own_or_team"
  ON public.ctas FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR (team_wide AND team_id IS NOT NULL AND public.is_team_member(team_id, auth.uid()))
  );

-- Insert: any authenticated user, must set themselves as creator
CREATE POLICY "ctas_insert_self"
  ON public.ctas FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Update: creator, assignee, or admin
CREATE POLICY "ctas_update_participants"
  ON public.ctas FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

-- Delete: creator only
CREATE POLICY "ctas_delete_creator"
  ON public.ctas FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- updated_at trigger
CREATE TRIGGER ctas_updated_at
  BEFORE UPDATE ON public.ctas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
