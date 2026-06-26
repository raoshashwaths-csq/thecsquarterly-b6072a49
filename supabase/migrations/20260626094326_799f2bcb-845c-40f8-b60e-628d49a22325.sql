
ALTER TABLE public.lumi_feedback
  ADD COLUMN IF NOT EXISTS processed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS processed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_lumi_feedback_unprocessed
  ON public.lumi_feedback (created_at) WHERE processed = false;

ALTER TABLE public.workflow_runs
  ADD COLUMN IF NOT EXISTS output jsonb;

ALTER TABLE public.lumi_knowledge DROP CONSTRAINT IF EXISTS lumi_knowledge_content_type_check;
ALTER TABLE public.lumi_knowledge ADD CONSTRAINT lumi_knowledge_content_type_check
  CHECK (content_type = ANY (ARRAY['principle','data_point','framework','case_study','heuristic','article_insight','benchmark_data','external_intelligence','interaction_pattern']));

ALTER TABLE public.lumi_knowledge DROP CONSTRAINT IF EXISTS lumi_knowledge_source_type_check;
ALTER TABLE public.lumi_knowledge ADD CONSTRAINT lumi_knowledge_source_type_check
  CHECK (source_type = ANY (ARRAY['article','benchmark','manual','external','interaction_analysis']));

SELECT cron.unschedule('lumi-interaction-analysis-weekly') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='lumi-interaction-analysis-weekly');

SELECT cron.schedule(
  'lumi-interaction-analysis-weekly',
  '0 8 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://thecsquarterly.lovable.app/api/public/hooks/analyze-interactions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14ZnRlamhxdnlqcGFlaWNtYWJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NjI0NzcsImV4cCI6MjA5NTAzODQ3N30.JKJf7rQDkgnysGLXhQ03iOtHJTYln9Oj1dz-5CzSHfY',
      'x-cron-secret', 'uizdpO68mfkI0obbFQZfbprCf-oBi3eHGWL4LtLAknMQAQuR'
    ),
    body := '{}'::jsonb
  );
  $$
);
