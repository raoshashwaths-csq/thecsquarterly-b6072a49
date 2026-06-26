
CREATE TABLE public.post_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK (reaction IN ('applied','language','confirmed','disagree')),
  disagree_session_id UUID NULL REFERENCES public.situation_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE INDEX idx_post_reactions_post ON public.post_reactions(post_id);
CREATE INDEX idx_post_reactions_user ON public.post_reactions(user_id);
CREATE INDEX idx_post_reactions_created ON public.post_reactions(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_reactions TO authenticated;
GRANT ALL ON public.post_reactions TO service_role;

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own reactions" ON public.post_reactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins read all reactions" ON public.post_reactions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own reactions" ON public.post_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own reactions" ON public.post_reactions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own reactions" ON public.post_reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER post_reactions_updated_at
  BEFORE UPDATE ON public.post_reactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public aggregate readout. No PII. Callable by anon + authenticated.
CREATE OR REPLACE FUNCTION public.get_post_reaction_stats(_post_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH c AS (
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE reaction = 'applied')::int AS applied,
      count(*) FILTER (WHERE reaction = 'language')::int AS language,
      count(*) FILTER (WHERE reaction = 'confirmed')::int AS confirmed,
      count(*) FILTER (WHERE reaction = 'disagree')::int AS disagree
    FROM public.post_reactions
    WHERE post_id = _post_id
  )
  SELECT jsonb_build_object(
    'total', total,
    'counts', jsonb_build_object(
      'applied', applied,
      'language', language,
      'confirmed', confirmed,
      'disagree', disagree
    )
  )
  FROM c;
$$;

REVOKE ALL ON FUNCTION public.get_post_reaction_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_post_reaction_stats(uuid) TO anon, authenticated, service_role;

-- Admin aggregate across many posts. Admin-only via has_role check inside.
CREATE OR REPLACE FUNCTION public.admin_post_reaction_aggregates(_since timestamptz DEFAULT (now() - interval '30 days'), _limit int DEFAULT 50)
RETURNS TABLE (
  post_id uuid,
  slug text,
  title text,
  section text,
  total int,
  applied int,
  language int,
  confirmed int,
  disagree int,
  latest_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  RETURN QUERY
  SELECT
    p.id,
    p.slug,
    p.title,
    p.section,
    count(r.*)::int,
    count(r.*) FILTER (WHERE r.reaction = 'applied')::int,
    count(r.*) FILTER (WHERE r.reaction = 'language')::int,
    count(r.*) FILTER (WHERE r.reaction = 'confirmed')::int,
    count(r.*) FILTER (WHERE r.reaction = 'disagree')::int,
    max(r.created_at)
  FROM public.post_reactions r
  JOIN public.posts p ON p.id = r.post_id
  WHERE r.created_at >= _since
  GROUP BY p.id, p.slug, p.title, p.section
  ORDER BY count(r.*) DESC
  LIMIT greatest(1, least(_limit, 200));
END;
$$;

REVOKE ALL ON FUNCTION public.admin_post_reaction_aggregates(timestamptz, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_post_reaction_aggregates(timestamptz, int) TO authenticated, service_role;
