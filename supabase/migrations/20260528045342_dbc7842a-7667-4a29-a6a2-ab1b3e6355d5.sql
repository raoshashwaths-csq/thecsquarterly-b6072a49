-- 1. Extend cs_accounts with 28 new fields (all nullable; safe for existing rows)
ALTER TABLE public.cs_accounts
  ADD COLUMN IF NOT EXISTS ucc TEXT,
  ADD COLUMN IF NOT EXISTS account_manager TEXT,
  ADD COLUMN IF NOT EXISTS csm_name TEXT,
  ADD COLUMN IF NOT EXISTS associate_director TEXT,
  ADD COLUMN IF NOT EXISTS backup_owner TEXT,
  ADD COLUMN IF NOT EXISTS customer_success TEXT,
  ADD COLUMN IF NOT EXISTS key_account_manager TEXT,
  ADD COLUMN IF NOT EXISTS contract_renewal_date DATE,
  ADD COLUMN IF NOT EXISTS carr NUMERIC,
  ADD COLUMN IF NOT EXISTS invoiced_arr NUMERIC,
  ADD COLUMN IF NOT EXISTS journey_stage TEXT,
  ADD COLUMN IF NOT EXISTS cs_transition_start DATE,
  ADD COLUMN IF NOT EXISTS customer_city TEXT,
  ADD COLUMN IF NOT EXISTS csm_sentiment TEXT,
  ADD COLUMN IF NOT EXISTS active_headcount INTEGER,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS sub_region TEXT,
  ADD COLUMN IF NOT EXISTS actual_go_live DATE,
  ADD COLUMN IF NOT EXISTS planned_go_live DATE,
  ADD COLUMN IF NOT EXISTS implementation_progress INTEGER,
  ADD COLUMN IF NOT EXISTS da_project_manager TEXT,
  ADD COLUMN IF NOT EXISTS project_manager_ii TEXT,
  ADD COLUMN IF NOT EXISTS server_location TEXT,
  ADD COLUMN IF NOT EXISTS server_name TEXT,
  ADD COLUMN IF NOT EXISTS marquee_client BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS existing_erp TEXT,
  ADD COLUMN IF NOT EXISTS existing_crm TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS payroll_service_type TEXT,
  ADD COLUMN IF NOT EXISTS final_cs_nps INTEGER,
  ADD COLUMN IF NOT EXISTS industry TEXT;

-- 2. Stakeholders table
CREATE TABLE IF NOT EXISTS public.cs_stakeholders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.cs_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  contact_name TEXT NOT NULL,
  title TEXT,
  buying_role TEXT NOT NULL DEFAULT 'end_user',
  influence TEXT NOT NULL DEFAULT 'medium',
  sentiment TEXT NOT NULL DEFAULT 'neutral',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cs_stakeholders_account ON public.cs_stakeholders(account_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cs_stakeholders TO authenticated;
GRANT ALL ON public.cs_stakeholders TO service_role;
ALTER TABLE public.cs_stakeholders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stakeholders owner select" ON public.cs_stakeholders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "stakeholders owner insert" ON public.cs_stakeholders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stakeholders owner update" ON public.cs_stakeholders
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stakeholders owner delete" ON public.cs_stakeholders
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. Contracts table
CREATE TABLE IF NOT EXISTS public.cs_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.cs_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  doc_type TEXT NOT NULL DEFAULT 'MSA',
  file_path TEXT,
  file_name TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  signed_value_cents BIGINT,
  executed_on DATE,
  auto_renewal BOOLEAN NOT NULL DEFAULT FALSE,
  notice_days INTEGER NOT NULL DEFAULT 90,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cs_contracts_account ON public.cs_contracts(account_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cs_contracts TO authenticated;
GRANT ALL ON public.cs_contracts TO service_role;
ALTER TABLE public.cs_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contracts owner select" ON public.cs_contracts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "contracts owner insert" ON public.cs_contracts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contracts owner update" ON public.cs_contracts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contracts owner delete" ON public.cs_contracts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Storage bucket for contract files (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('cs-contracts', 'cs-contracts', FALSE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "cs-contracts owner read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'cs-contracts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "cs-contracts owner insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cs-contracts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "cs-contracts owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'cs-contracts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "cs-contracts owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'cs-contracts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. updated_at triggers
CREATE TRIGGER update_cs_stakeholders_updated_at BEFORE UPDATE ON public.cs_stakeholders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cs_contracts_updated_at BEFORE UPDATE ON public.cs_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();