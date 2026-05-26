INSERT INTO public.email_unsubscribe_tokens (email, token)
VALUES (
  'sakthi@capitalfortunes.com',
  replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','')
)
ON CONFLICT (email) DO NOTHING;