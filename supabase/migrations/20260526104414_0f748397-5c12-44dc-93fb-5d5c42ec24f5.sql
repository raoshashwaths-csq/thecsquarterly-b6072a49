CREATE OR REPLACE FUNCTION public.grant_pending_vanguard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'sakthi@capitalfortunes.com' THEN
    INSERT INTO public.subscriptions (user_id, status, tier, current_period_end)
    VALUES (NEW.id, 'active', 'vanguard', now() + interval '1 year')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS grant_pending_vanguard_on_profile ON public.profiles;
CREATE TRIGGER grant_pending_vanguard_on_profile
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.grant_pending_vanguard();