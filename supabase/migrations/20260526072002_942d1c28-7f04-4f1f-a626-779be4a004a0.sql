-- Tighten playbooks SELECT policy: don't expose full body publicly via RLS.
-- All app access is routed through server functions using the service role
-- (supabaseAdmin), so restrict direct RLS reads to admins only. This is
-- defense in depth: server functions enforce entitlement before returning body.
DROP POLICY IF EXISTS "playbooks readable by anyone" ON public.playbooks;

CREATE POLICY "playbooks readable by admins"
ON public.playbooks
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));