-- ============================================================
-- Felix & Nora Admin Rebuild — Sessions 1–3
-- ============================================================

-- 1. Storage bucket for comic strip panel images
INSERT INTO storage.buckets (id, name, public)
VALUES ('comic-strip-panels', 'comic-strip-panels', true)
ON CONFLICT (id) DO NOTHING;

-- Public read, admin-write
CREATE POLICY "Public read comic-strip-panels" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'comic-strip-panels');

CREATE POLICY "Admin insert comic-strip-panels" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'comic-strip-panels'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admin delete comic-strip-panels" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'comic-strip-panels'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- 2. strip_placements table
CREATE TABLE IF NOT EXISTS public.strip_placements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strip_id    uuid NOT NULL REFERENCES public.comic_strips(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('post','playbook')),
  target_slug text NOT NULL,
  placement   text NOT NULL CHECK (placement IN ('after-intro','after-section','end')),
  admin_note  text,
  confirmed   boolean NOT NULL DEFAULT false,
  ai_suggested boolean NOT NULL DEFAULT false,
  confidence  numeric CHECK (confidence BETWEEN 0 AND 1),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Admins can CRUD; no public read — only server-side via service_role
ALTER TABLE public.strip_placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage strip_placements"
  ON public.strip_placements
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_strip_placements_target
  ON public.strip_placements(target_type, target_slug)
  WHERE confirmed = true;

CREATE INDEX idx_strip_placements_strip
  ON public.strip_placements(strip_id);

CREATE TRIGGER trg_strip_placements_updated
  BEFORE UPDATE ON public.strip_placements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Add strip_placement_note to posts and playbooks
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS strip_placement_note text;

ALTER TABLE public.playbooks
  ADD COLUMN IF NOT EXISTS strip_placement_note text;
