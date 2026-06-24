ALTER TABLE public.q_runs
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.cs_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tagged_stakeholder text,
  ADD COLUMN IF NOT EXISTS tagged_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_q_runs_account_id ON public.q_runs(account_id);