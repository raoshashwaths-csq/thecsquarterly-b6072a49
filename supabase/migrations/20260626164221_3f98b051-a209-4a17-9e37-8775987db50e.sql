-- =========================================================================
-- Future Operator — Lumi persona feature (Practitioner+)
-- =========================================================================

-- ---------- future_operator_profiles ----------
CREATE TABLE public.future_operator_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Future state
  future_nrr_target text,
  future_team_state text,
  future_acv_band text,
  core_commitments text[] NOT NULL DEFAULT ARRAY[]::text[],

  -- Current state
  current_biggest_risk text,
  current_focus_account text,
  pending_renewal_at timestamptz,
  last_checkin_at timestamptz,

  -- Quest tracking
  last_quest_generated_at timestamptz,
  active_quests jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Notification timing
  next_drift_signal_at timestamptz,
  notification_window_start time NOT NULL DEFAULT '08:00',
  notification_window_end time NOT NULL DEFAULT '21:00',
  timezone text NOT NULL DEFAULT 'UTC',

  -- Subscriber-controlled mute
  paused_until timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id),
  CONSTRAINT commitments_len CHECK (
    core_commitments IS NULL
    OR array_length(core_commitments, 1) IS NULL
    OR array_length(core_commitments, 1) BETWEEN 1 AND 3
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.future_operator_profiles TO authenticated;
GRANT ALL ON public.future_operator_profiles TO service_role;

ALTER TABLE public.future_operator_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fo_profiles_owner_select"
  ON public.future_operator_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "fo_profiles_owner_insert"
  ON public.future_operator_profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "fo_profiles_owner_update"
  ON public.future_operator_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "fo_profiles_owner_delete"
  ON public.future_operator_profiles FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER fo_profiles_set_updated_at
  BEFORE UPDATE ON public.future_operator_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- future_operator_notifications ----------
CREATE TABLE public.future_operator_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  type text NOT NULL CHECK (type IN (
    'daily-quest',
    'drift-signal',
    'reflection-prompt',
    'quest-completion-response',
    'intro'
  )),

  message text NOT NULL,
  subtext text,
  quest_id text,
  action_label text,
  action_route text,

  delivered_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  dismissed_at timestamptz,
  acted_on_at timestamptz,

  quest_completed boolean NOT NULL DEFAULT false,

  trigger_type text,
  trigger_context jsonb
);

GRANT SELECT, UPDATE ON public.future_operator_notifications TO authenticated;
GRANT ALL ON public.future_operator_notifications TO service_role;

ALTER TABLE public.future_operator_notifications ENABLE ROW LEVEL SECURITY;

-- Read + update own; no INSERT/DELETE for authenticated (server-only via service role).
CREATE POLICY "fo_notifications_owner_select"
  ON public.future_operator_notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "fo_notifications_owner_update"
  ON public.future_operator_notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_fo_notifications_user_unread
  ON public.future_operator_notifications(user_id, read_at)
  WHERE read_at IS NULL;
CREATE INDEX idx_fo_notifications_user_delivered
  ON public.future_operator_notifications(user_id, delivered_at DESC);

-- ---------- Seed admin budget row ----------
INSERT INTO public.app_settings (key, value)
VALUES (
  'future_operator.limits',
  jsonb_build_object(
    'daily_quest_calls_per_user_per_day', 1,
    'drift_signals_per_user_per_day', 2,
    'reflection_calls_per_user_per_day', 4,
    'monthly_global_cap', null
  )
)
ON CONFLICT (key) DO NOTHING;
