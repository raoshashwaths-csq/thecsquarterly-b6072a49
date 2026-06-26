
-- 1. lumi_knowledge: portfolio-wide distilled knowledge records
CREATE TABLE public.lumi_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_record_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  source_slug text,
  source_title text,
  content text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('principle','data_point','framework','case_study','heuristic')),
  language text NOT NULL DEFAULT 'en' CHECK (language IN ('en','ar','id','th','tl','vi')),
  tree_relevance text[] NOT NULL DEFAULT ARRAY[]::text[],
  topic_tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  embedding vector(1536),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lumi_knowledge_active_lang ON public.lumi_knowledge(language, is_active, content_type);
CREATE INDEX idx_lumi_knowledge_tree_relevance ON public.lumi_knowledge USING gin(tree_relevance);
CREATE INDEX idx_lumi_knowledge_embedding ON public.lumi_knowledge USING hnsw (embedding vector_cosine_ops);

GRANT ALL ON public.lumi_knowledge TO service_role;
ALTER TABLE public.lumi_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lumi_knowledge service_role only" ON public.lumi_knowledge
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER lumi_knowledge_updated_at
  BEFORE UPDATE ON public.lumi_knowledge
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. lumi_feedback: structured feedback on Lumi answers
CREATE TABLE public.lumi_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  run_id uuid REFERENCES public.q_runs(id) ON DELETE SET NULL,
  knowledge_record_id uuid REFERENCES public.lumi_knowledge(id) ON DELETE SET NULL,
  rating text NOT NULL CHECK (rating IN ('up','down')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lumi_feedback_record ON public.lumi_feedback(knowledge_record_id);
CREATE INDEX idx_lumi_feedback_created ON public.lumi_feedback(created_at DESC);

GRANT ALL ON public.lumi_feedback TO service_role;
ALTER TABLE public.lumi_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lumi_feedback service_role only" ON public.lumi_feedback
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- 3. knowledge_translation_queue
CREATE TABLE public.knowledge_translation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_record_id uuid NOT NULL REFERENCES public.lumi_knowledge(id) ON DELETE CASCADE,
  target_language text NOT NULL CHECK (target_language IN ('en','ar','id','th','tl','vi')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','done','error')),
  translated_record_id uuid REFERENCES public.lumi_knowledge(id) ON DELETE SET NULL,
  error_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(source_record_id, target_language)
);

CREATE INDEX idx_translation_queue_pending
  ON public.knowledge_translation_queue(status, target_language);

GRANT ALL ON public.knowledge_translation_queue TO service_role;
ALTER TABLE public.knowledge_translation_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "translation_queue service_role only" ON public.knowledge_translation_queue
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- 4. Extend q_runs
ALTER TABLE public.q_runs
  ADD COLUMN knowledge_records_injected integer,
  ADD COLUMN query_text text;

-- 5. Extend benchmark_drops with percentile columns
ALTER TABLE public.benchmark_drops
  ADD COLUMN p25 numeric,
  ADD COLUMN p50 numeric,
  ADD COLUMN p75 numeric;

-- 6. Latest-per-metric-segment view for benchmark injection
CREATE OR REPLACE VIEW public.benchmark_drops_latest AS
SELECT DISTINCT ON (metric, COALESCE(segment, ''))
  id, period, metric, segment, value, p25, p50, p75, notes, published, created_at
FROM public.benchmark_drops
WHERE published = true
ORDER BY metric, COALESCE(segment, ''), created_at DESC;

GRANT SELECT ON public.benchmark_drops_latest TO authenticated, anon, service_role;

-- 7. match_lumi_knowledge RPC (mirrors match_lumi_memory)
CREATE OR REPLACE FUNCTION public.match_lumi_knowledge(
  _query vector,
  _k integer DEFAULT 6,
  _tree_id text DEFAULT NULL,
  _language text DEFAULT 'en'
)
RETURNS TABLE (
  id uuid,
  source_slug text,
  source_title text,
  content text,
  content_type text,
  tree_relevance text[],
  topic_tags text[],
  similarity double precision
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT k.id, k.source_slug, k.source_title, k.content, k.content_type,
         k.tree_relevance, k.topic_tags,
         1 - (k.embedding <=> _query) AS similarity
  FROM public.lumi_knowledge k
  WHERE k.is_active = true
    AND k.embedding IS NOT NULL
    AND k.language = _language
    AND (_tree_id IS NULL OR _tree_id = ANY (k.tree_relevance))
  ORDER BY k.embedding <=> _query
  LIMIT GREATEST(1, LEAST(_k, 50));
$$;
