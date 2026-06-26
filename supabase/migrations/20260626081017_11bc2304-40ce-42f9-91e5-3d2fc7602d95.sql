
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- No policies: all access goes through admin-gated server functions via service role.

INSERT INTO public.app_settings (key, value)
VALUES ('situation_room.limits', '{"max_prompts": 5, "window": "month"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
