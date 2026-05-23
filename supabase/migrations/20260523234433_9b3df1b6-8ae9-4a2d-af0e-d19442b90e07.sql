
-- 1) Tighten posts SELECT: hide premium rows from anon / non-subscribers
DROP POLICY IF EXISTS "posts readable by anyone" ON public.posts;

CREATE POLICY "posts readable with tier check"
ON public.posts
FOR SELECT
TO public
USING (
  published = true
  AND (
    tier = 'free'
    AND is_premium = false
    OR has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.user_id = auth.uid()
        AND s.status = 'active'
        AND s.tier = 'vanguard'
    )
  )
);

-- 2) Restrict has_role execution to RLS / service contexts
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;

-- 3) Constrain purchases INSERT to pending-status only for end users
DROP POLICY IF EXISTS "purchases insert own" ON public.purchases;

CREATE POLICY "purchases insert own pending"
ON public.purchases
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
);
