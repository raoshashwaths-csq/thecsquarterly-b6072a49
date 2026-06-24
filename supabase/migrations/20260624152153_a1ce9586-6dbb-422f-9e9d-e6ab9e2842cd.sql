
-- 1. Dedupe existing rows: keep the oldest per (user, slug, kind, text, note)
WITH ranked AS (
  SELECT id,
    row_number() OVER (
      PARTITION BY user_id, slug, kind, text, COALESCE(note, '')
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.user_annotations
)
DELETE FROM public.user_annotations a
USING ranked r
WHERE a.id = r.id AND r.rn > 1;

-- 2. Prevent future duplicates via a unique expression index
CREATE UNIQUE INDEX IF NOT EXISTS user_annotations_dedupe_idx
  ON public.user_annotations (user_id, slug, kind, text, (COALESCE(note, '')));
