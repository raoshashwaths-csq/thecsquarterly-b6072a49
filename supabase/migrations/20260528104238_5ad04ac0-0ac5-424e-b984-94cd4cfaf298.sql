CREATE TABLE public.user_daily_sentiment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  raw_text_feedback text NOT NULL,
  calculated_sentiment_score text NOT NULL CHECK (calculated_sentiment_score IN ('positive','neutral','negative')),
  flagged_keywords text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

GRANT SELECT, INSERT, UPDATE ON public.user_daily_sentiment TO authenticated;
GRANT ALL ON public.user_daily_sentiment TO service_role;

ALTER TABLE public.user_daily_sentiment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sentiment owner select"
  ON public.user_daily_sentiment FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "sentiment owner insert"
  ON public.user_daily_sentiment FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sentiment owner update"
  ON public.user_daily_sentiment FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_user_daily_sentiment_updated
  BEFORE UPDATE ON public.user_daily_sentiment
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_user_daily_sentiment_user_date
  ON public.user_daily_sentiment (user_id, date DESC);