DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'sakthi@capitalfortunes.com';
  IF uid IS NULL THEN
    RAISE NOTICE 'User sakthi@capitalfortunes.com has not signed up yet; skipping subscription grant.';
  ELSE
    IF EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = uid) THEN
      UPDATE public.subscriptions
        SET status = 'active',
            tier = 'vanguard',
            current_period_end = now() + interval '1 year',
            updated_at = now()
      WHERE user_id = uid;
    ELSE
      INSERT INTO public.subscriptions (user_id, status, tier, current_period_end)
      VALUES (uid, 'active', 'vanguard', now() + interval '1 year');
    END IF;
  END IF;

  INSERT INTO public.subscribers (email, source, segment)
  SELECT 'sakthi@capitalfortunes.com', 'manual-grant', 'leader'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.subscribers WHERE email = 'sakthi@capitalfortunes.com'
  );
END $$;