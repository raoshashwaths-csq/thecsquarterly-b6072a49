ALTER TABLE public.q_runs ADD COLUMN IF NOT EXISTS shared boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Users can view their own runs" ON public.q_runs;
DROP POLICY IF EXISTS "Users can view their own or shared runs" ON public.q_runs;
CREATE POLICY "Users can view their own or shared runs"
ON public.q_runs FOR SELECT
USING (auth.uid() = user_id OR shared = true);

DROP POLICY IF EXISTS "Users can update their own runs" ON public.q_runs;
CREATE POLICY "Users can update their own runs"
ON public.q_runs FOR UPDATE
USING (auth.uid() = user_id);