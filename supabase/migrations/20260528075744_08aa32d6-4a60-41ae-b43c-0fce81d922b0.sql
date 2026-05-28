
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS designation text;

UPDATE public.subscriptions
SET designation = CASE tier
  WHEN 'free' THEN 'reader'
  WHEN 'vanguard' THEN 'practitioner'
  WHEN 'vanguard-individual' THEN 'practitioner'
  WHEN 'vanguard-pro' THEN 'operator'
  WHEN 'team-starter' THEN 'team'
  WHEN 'team-growth' THEN 'scale'
  WHEN 'enterprise' THEN 'enterprise'
  ELSE 'reader'
END
WHERE designation IS NULL;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_designation_chk
  CHECK (designation IS NULL OR designation IN ('reader','practitioner','operator','team','scale','enterprise','strategic_partner'));
