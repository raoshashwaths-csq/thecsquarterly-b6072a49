
-- Extend lumi_knowledge for article-ingestion records
ALTER TABLE public.lumi_knowledge DROP CONSTRAINT lumi_knowledge_content_type_check;
ALTER TABLE public.lumi_knowledge
  ADD CONSTRAINT lumi_knowledge_content_type_check
  CHECK (content_type IN ('principle','data_point','framework','case_study','heuristic','article_insight'));

ALTER TABLE public.lumi_knowledge
  ADD COLUMN source_type text NOT NULL DEFAULT 'article'
    CHECK (source_type IN ('article','benchmark','manual','external')),
  ADD COLUMN confidence_level text CHECK (confidence_level IN ('high','medium','low'));

-- Workflow run log
CREATE TABLE public.workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow text NOT NULL,
  articles_processed integer NOT NULL DEFAULT 0,
  records_created integer NOT NULL DEFAULT 0,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'ok' CHECK (status IN ('ok','partial','error')),
  run_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_workflow_runs_workflow_time ON public.workflow_runs(workflow, run_at DESC);

GRANT ALL ON public.workflow_runs TO service_role;
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workflow_runs service_role only" ON public.workflow_runs
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
-- Admins can read via service_role server functions; no direct authenticated SELECT.
