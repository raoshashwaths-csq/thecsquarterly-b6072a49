
CREATE TABLE public.faq_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_slug TEXT NOT NULL,
  item_slug TEXT NOT NULL,
  vote SMALLINT NOT NULL CHECK (vote IN (-1, 1)),
  locale TEXT NOT NULL DEFAULT 'en',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX faq_feedback_item_idx ON public.faq_feedback(section_slug, item_slug, vote);

GRANT INSERT ON public.faq_feedback TO anon;
GRANT INSERT, SELECT ON public.faq_feedback TO authenticated;
GRANT ALL ON public.faq_feedback TO service_role;

ALTER TABLE public.faq_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit faq feedback"
  ON public.faq_feedback FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read faq feedback"
  ON public.faq_feedback FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
