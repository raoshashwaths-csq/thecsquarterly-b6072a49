
CREATE TABLE IF NOT EXISTS public.translation_glossary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL UNIQUE,
  protection_type text NOT NULL CHECK (protection_type IN ('never_translate', 'fixed_translation')),
  category text CHECK (category IN ('brand', 'metric', 'feature_name', 'role', 'jargon')),
  fixed_translations jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  pending_review boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.translation_glossary TO authenticated;
GRANT ALL ON public.translation_glossary TO service_role;
ALTER TABLE public.translation_glossary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage glossary" ON public.translation_glossary
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_glossary_term ON public.translation_glossary(term);
CREATE INDEX IF NOT EXISTS idx_glossary_category ON public.translation_glossary(category);
CREATE INDEX IF NOT EXISTS idx_glossary_pending ON public.translation_glossary(pending_review);

CREATE TRIGGER update_translation_glossary_updated_at
  BEFORE UPDATE ON public.translation_glossary
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.article_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid,
  language_code text NOT NULL CHECK (language_code IN ('ar','id','vi','th')),
  translated_title text,
  translated_subtitle text,
  translated_content text,
  source_content_hash text,
  translated_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','pending_review','current','stale')),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (article_id, language_code)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_translations TO authenticated;
GRANT ALL ON public.article_translations TO service_role;
ALTER TABLE public.article_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage article translations" ON public.article_translations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_translations_article ON public.article_translations(article_id, language_code);
CREATE INDEX IF NOT EXISTS idx_translations_status ON public.article_translations(status);

CREATE TRIGGER update_article_translations_updated_at
  BEFORE UPDATE ON public.article_translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
