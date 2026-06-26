
ALTER TABLE public.lumi_knowledge DROP CONSTRAINT IF EXISTS lumi_knowledge_content_type_check;
ALTER TABLE public.lumi_knowledge ADD CONSTRAINT lumi_knowledge_content_type_check
  CHECK (content_type = ANY (ARRAY['principle','data_point','framework','case_study','heuristic','article_insight','benchmark_data','external_intelligence']));

SELECT cron.unschedule('lumi-external-intel-weekly') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='lumi-external-intel-weekly');

SELECT cron.schedule(
  'lumi-external-intel-weekly',
  '0 7 * * 3',
  $$
  SELECT net.http_post(
    url := 'https://thecsquarterly.lovable.app/api/public/hooks/pull-external-intel',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14ZnRlamhxdnlqcGFlaWNtYWJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NjI0NzcsImV4cCI6MjA5NTAzODQ3N30.JKJf7rQDkgnysGLXhQ03iOtHJTYln9Oj1dz-5CzSHfY',
      'x-cron-secret', 'uizdpO68mfkI0obbFQZfbprCf-oBi3eHGWL4LtLAknMQAQuR'
    ),
    body := '{}'::jsonb
  );
  $$
);
