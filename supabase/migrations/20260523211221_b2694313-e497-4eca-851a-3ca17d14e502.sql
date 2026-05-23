ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS title_mckinsey TEXT,
  ADD COLUMN IF NOT EXISTS body_mckinsey TEXT,
  ADD COLUMN IF NOT EXISTS title_wodehouse TEXT,
  ADD COLUMN IF NOT EXISTS body_wodehouse TEXT;