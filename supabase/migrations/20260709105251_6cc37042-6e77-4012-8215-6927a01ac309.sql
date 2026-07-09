ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS strip_placement_note text,
  ADD COLUMN IF NOT EXISTS signal_quote text;