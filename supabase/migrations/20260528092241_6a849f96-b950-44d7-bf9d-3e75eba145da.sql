ALTER TABLE public.q_runs
  ADD COLUMN IF NOT EXISTS tokens_in integer,
  ADD COLUMN IF NOT EXISTS tokens_out integer,
  ADD COLUMN IF NOT EXISTS latency_ms integer,
  ADD COLUMN IF NOT EXISTS cost_micros bigint,
  ADD COLUMN IF NOT EXISTS model text;

CREATE INDEX IF NOT EXISTS q_runs_created_at_idx ON public.q_runs (created_at DESC);