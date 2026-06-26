
ALTER TABLE public.benchmark_drops
  ADD COLUMN sample_size integer,
  ADD COLUMN last_calculated_at timestamptz;

-- Backfill last_calculated_at from created_at for any existing rows.
UPDATE public.benchmark_drops SET last_calculated_at = created_at WHERE last_calculated_at IS NULL;

-- Unique key powering the weekly upsert.
CREATE UNIQUE INDEX benchmark_drops_metric_segment_period_key
  ON public.benchmark_drops (metric, segment, period);

-- Allow benchmark_data content_type.
ALTER TABLE public.lumi_knowledge DROP CONSTRAINT lumi_knowledge_content_type_check;
ALTER TABLE public.lumi_knowledge
  ADD CONSTRAINT lumi_knowledge_content_type_check
  CHECK (content_type IN ('principle','data_point','framework','case_study','heuristic','article_insight','benchmark_data'));

-- Human-readable change summary for ops review (Slack-less notification surface).
ALTER TABLE public.workflow_runs ADD COLUMN notice text;
