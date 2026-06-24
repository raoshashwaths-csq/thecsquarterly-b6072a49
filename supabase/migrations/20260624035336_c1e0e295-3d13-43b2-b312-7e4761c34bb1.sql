ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS paddle_subscription_id text,
  ADD COLUMN IF NOT EXISTS paddle_customer_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_paddle_sub_unique
  ON public.subscriptions(paddle_subscription_id)
  WHERE paddle_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_customer
  ON public.subscriptions(paddle_customer_id);