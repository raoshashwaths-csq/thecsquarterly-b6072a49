
CREATE TABLE public.situation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  situation text NOT NULL,
  dispatches jsonb NOT NULL DEFAULT '[]'::jsonb,
  benchmark jsonb,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  saved_to_workspace boolean NOT NULL DEFAULT false,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX situation_sessions_user_created_idx
  ON public.situation_sessions (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.situation_sessions TO authenticated;
GRANT ALL ON public.situation_sessions TO service_role;

ALTER TABLE public.situation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own situation sessions"
  ON public.situation_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own situation sessions"
  ON public.situation_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own situation sessions"
  ON public.situation_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own situation sessions"
  ON public.situation_sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_situation_sessions_updated_at
  BEFORE UPDATE ON public.situation_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
