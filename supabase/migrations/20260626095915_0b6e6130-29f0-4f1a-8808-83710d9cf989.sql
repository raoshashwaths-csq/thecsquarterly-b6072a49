-- Workflow 6: schema + cron for multilingual knowledge translation

-- 1) Unique pair so STEP 2's ON CONFLICT DO NOTHING is a real no-op on rerun
ALTER TABLE public.knowledge_translation_queue
  ADD CONSTRAINT knowledge_translation_queue_source_lang_unique
  UNIQUE (source_record_id, target_language);

-- 2) Editorial review flag on translated knowledge records
ALTER TABLE public.lumi_knowledge
  ADD COLUMN IF NOT EXISTS translation_reviewed BOOLEAN NOT NULL DEFAULT false;

-- 3) Schedule daily 07:30 UTC (90 min after Workflow 1)
SELECT cron.schedule(
  'lumi-translate-knowledge-daily',
  '30 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--c27c8cd5-f9e8-4a7e-ae58-891ca6953866.lovable.app/api/public/hooks/translate-knowledge',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'INGESTION_CRON_SECRET' LIMIT 1)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);