
-- Operator profile fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS acv_band            text,
  ADD COLUMN IF NOT EXISTS company_arr_range   text,
  ADD COLUMN IF NOT EXISTS challenges          text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS difficult_account   text,
  ADD COLUMN IF NOT EXISTS onboarded_at        timestamptz;

-- pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Lumi memory table
CREATE TABLE IF NOT EXISTS public.lumi_memory (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type  text NOT NULL CHECK (memory_type IN ('situation','preference','account','framework','reading')),
  content      text NOT NULL CHECK (length(content) BETWEEN 1 AND 2000),
  source       text,
  source_ref   text,
  embedding    vector(1536),
  pinned       boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lumi_memory TO authenticated;
GRANT ALL ON public.lumi_memory TO service_role;

ALTER TABLE public.lumi_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lumi_memory select own"
  ON public.lumi_memory FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "lumi_memory insert own"
  ON public.lumi_memory FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "lumi_memory update own"
  ON public.lumi_memory FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "lumi_memory delete own"
  ON public.lumi_memory FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS lumi_memory_user_created_idx
  ON public.lumi_memory (user_id, created_at DESC);

-- HNSW cosine index on embedding (1536 dims is within pgvector HNSW limit of 2000)
CREATE INDEX IF NOT EXISTS lumi_memory_embedding_idx
  ON public.lumi_memory USING hnsw (embedding vector_cosine_ops);

-- Semantic similarity search scoped to one user. Returns the k closest rows
-- plus any pinned rows (deduped). Pinned rows surface even if cosine distance
-- is far.
CREATE OR REPLACE FUNCTION public.match_lumi_memory(
  _user_id uuid,
  _query   vector(1536),
  _k       int DEFAULT 6
)
RETURNS TABLE (
  id           uuid,
  memory_type  text,
  content      text,
  source       text,
  source_ref   text,
  pinned       boolean,
  created_at   timestamptz,
  similarity   float
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH semantic AS (
    SELECT m.id, m.memory_type, m.content, m.source, m.source_ref, m.pinned, m.created_at,
           1 - (m.embedding <=> _query) AS similarity
    FROM public.lumi_memory m
    WHERE m.user_id = _user_id
      AND m.embedding IS NOT NULL
    ORDER BY m.embedding <=> _query
    LIMIT GREATEST(_k, 1)
  ),
  pinned_rows AS (
    SELECT m.id, m.memory_type, m.content, m.source, m.source_ref, m.pinned, m.created_at,
           0.0::float AS similarity
    FROM public.lumi_memory m
    WHERE m.user_id = _user_id
      AND m.pinned = true
  )
  SELECT DISTINCT ON (id) id, memory_type, content, source, source_ref, pinned, created_at, similarity
  FROM (
    SELECT * FROM semantic
    UNION ALL
    SELECT * FROM pinned_rows
  ) u
  ORDER BY id, similarity DESC;
$$;
