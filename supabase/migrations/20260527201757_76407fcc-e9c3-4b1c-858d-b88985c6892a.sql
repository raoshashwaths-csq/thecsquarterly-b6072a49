
-- ============ user_annotations ============
CREATE TABLE public.user_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  slug TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('highlight','note')),
  text TEXT NOT NULL CHECK (char_length(text) <= 10000),
  note TEXT CHECK (note IS NULL OR char_length(note) <= 10000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_annotations_user ON public.user_annotations(user_id, created_at DESC);
CREATE INDEX idx_user_annotations_user_slug ON public.user_annotations(user_id, slug);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_annotations TO authenticated;
GRANT ALL ON public.user_annotations TO service_role;

ALTER TABLE public.user_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "annotations: owner read"   ON public.user_annotations FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "annotations: owner insert" ON public.user_annotations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "annotations: owner update" ON public.user_annotations FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "annotations: owner delete" ON public.user_annotations FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ user_workspace_items ============
CREATE TABLE public.user_workspace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('link','asset')),
  title TEXT NOT NULL CHECK (char_length(title) <= 500),
  url TEXT CHECK (url IS NULL OR char_length(url) <= 2000),
  size_bytes BIGINT,
  mime_type TEXT CHECK (mime_type IS NULL OR char_length(mime_type) <= 200),
  tag TEXT NOT NULL DEFAULT 'General' CHECK (char_length(tag) <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workspace_items_user ON public.user_workspace_items(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_workspace_items TO authenticated;
GRANT ALL ON public.user_workspace_items TO service_role;

ALTER TABLE public.user_workspace_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace: owner read"   ON public.user_workspace_items FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "workspace: owner insert" ON public.user_workspace_items FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "workspace: owner update" ON public.user_workspace_items FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "workspace: owner delete" ON public.user_workspace_items FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ soft caps ============
CREATE OR REPLACE FUNCTION public.enforce_annotation_cap()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c INT;
BEGIN
  SELECT count(*) INTO c FROM public.user_annotations WHERE user_id = NEW.user_id;
  IF c >= 5000 THEN RAISE EXCEPTION 'Annotation cap reached (5000). Delete older highlights first.'; END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_user_annotations_cap
BEFORE INSERT ON public.user_annotations
FOR EACH ROW EXECUTE FUNCTION public.enforce_annotation_cap();

CREATE OR REPLACE FUNCTION public.enforce_workspace_cap()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c INT;
BEGIN
  SELECT count(*) INTO c FROM public.user_workspace_items WHERE user_id = NEW.user_id;
  IF c >= 2000 THEN RAISE EXCEPTION 'Workspace cap reached (2000). Delete older items first.'; END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_user_workspace_items_cap
BEFORE INSERT ON public.user_workspace_items
FOR EACH ROW EXECUTE FUNCTION public.enforce_workspace_cap();

REVOKE EXECUTE ON FUNCTION public.enforce_annotation_cap() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_workspace_cap()  FROM PUBLIC, anon, authenticated;
