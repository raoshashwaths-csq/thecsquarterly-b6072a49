
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS series_slug text,
  ADD COLUMN IF NOT EXISTS series_title text,
  ADD COLUMN IF NOT EXISTS series_part integer,
  ADD COLUMN IF NOT EXISTS series_total integer,
  ADD COLUMN IF NOT EXISTS sources text;

CREATE INDEX IF NOT EXISTS posts_series_slug_part_idx
  ON public.posts (series_slug, series_part)
  WHERE series_slug IS NOT NULL;

-- Replace the public read policy to also gate by scheduled publish time
DROP POLICY IF EXISTS "posts readable with tier check" ON public.posts;

CREATE POLICY "posts readable with tier check"
ON public.posts
FOR SELECT
USING (
  (
    published = true
    AND published_at <= now()
    AND (
      (tier = 'free' AND is_premium = false)
      OR EXISTS (
        SELECT 1 FROM public.subscriptions s
        WHERE s.user_id = auth.uid()
          AND s.status = 'active'
          AND s.tier = 'vanguard'
      )
    )
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);
