-- homepage_headlines
CREATE TABLE public.homepage_headlines (
  day_index SMALLINT PRIMARY KEY CHECK (day_index BETWEEN 0 AND 6),
  slug TEXT NOT NULL UNIQUE,
  phrases TEXT[] NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT NOT NULL,
  full_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (array_length(phrases, 1) >= 2)
);

GRANT SELECT ON public.homepage_headlines TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homepage_headlines TO authenticated;
GRANT ALL ON public.homepage_headlines TO service_role;

ALTER TABLE public.homepage_headlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "homepage_headlines_public_read"
  ON public.homepage_headlines FOR SELECT
  USING (true);

CREATE POLICY "homepage_headlines_admin_write"
  ON public.homepage_headlines FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_homepage_headlines_updated_at
  BEFORE UPDATE ON public.homepage_headlines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- comic_strips
CREATE TABLE public.comic_strips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  tag TEXT NOT NULL,
  hover_text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  panels JSONB NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX comic_strips_sort_idx ON public.comic_strips (sort_order);

GRANT SELECT ON public.comic_strips TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comic_strips TO authenticated;
GRANT ALL ON public.comic_strips TO service_role;

ALTER TABLE public.comic_strips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comic_strips_public_read"
  ON public.comic_strips FOR SELECT
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "comic_strips_admin_write"
  ON public.comic_strips FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_comic_strips_updated_at
  BEFORE UPDATE ON public.comic_strips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed: homepage headlines
INSERT INTO public.homepage_headlines (day_index, slug, phrases, line1, line2, full_text) VALUES
(0, 'sunday-commanding-officer',
  ARRAY['Nobody appointed you the commanding officer of your portfolio.','You already are one.'],
  'Nobody appointed you the commanding officer of your portfolio.',
  'You already are one.',
  'Nobody appointed you the commanding officer of your portfolio. You already are one.'),
(1, 'monday-nrr-gap',
  ARRAY['The gap between 94% NRR and 120% NRR is not headcount.','It is system design.'],
  'The gap between 94% NRR and 120% NRR',
  'is not headcount. It is system design.',
  'The gap between 94% NRR and 120% NRR is not headcount. It is system design.'),
(2, 'tuesday-leverage-treadmill',
  ARRAY['Forty accounts without leverage is not a job.','It''s a treadmill with a title.'],
  'Forty accounts without leverage is not a job.',
  'It''s a treadmill with a title.',
  'Forty accounts without leverage is not a job. It''s a treadmill with a title.'),
(3, 'wednesday-silence-before-churn',
  ARRAY['Anyone can read a churn report.','Almost nobody can read the silence that preceded it.'],
  'Anyone can read a churn report.',
  'Almost nobody can read the silence that preceded it.',
  'Anyone can read a churn report. Almost nobody can read the silence that preceded it.'),
(4, 'thursday-118-vs-104',
  ARRAY['118% NRR is not fourteen points better than 104%.','Over five years, it''s a different company.'],
  '118% NRR is not fourteen points better than 104%.',
  'Over five years, it''s a different company.',
  '118% NRR is not fourteen points better than 104%. Over five years, it''s a different company.'),
(5, 'friday-long-game-renewals',
  ARRAY['Every renewal looks like a short-term game.','The CSMs who win were quietly playing the long one.'],
  'Every renewal looks like a short-term game.',
  'The CSMs who win were quietly playing the long one.',
  'Every renewal looks like a short-term game. The CSMs who win were quietly playing the long one.'),
(6, 'saturday-structural-churn',
  ARRAY['Why do your best accounts still churn?','The answer is structural.','So is the fix.'],
  'Why do your best accounts still churn?',
  'The answer is structural. So is the fix.',
  'Why do your best accounts still churn? The answer is structural. So is the fix.');

-- Seed: comic strips (matches current src/data/strips.ts)
INSERT INTO public.comic_strips (slug, title, tag, hover_text, sort_order, panels) VALUES
('the-single-thread', 'The Single Thread', 'STAKEHOLDER COVERAGE',
 'A champion with no backup is not a relationship. It is a dependency with an expiration date you cannot read.',
 10,
 '[
   {"type":"illustration","imageAlt":"Nora at her desk, upbeat, monitors behind her","bubbles":[{"character":"NORA","text":"Keller Group is in great shape. Marcus loves us. We talk every week. He sends me memes sometimes.","position":"bottom"}]},
   {"type":"illustration","imageAlt":"Felix at his desk, not looking up from legal pad","bubbles":[{"character":"FELIX","text":"Does anyone else at Keller know who you are?","position":"top"}]},
   {"type":"illustration","imageAlt":"Nora thinking, slight uncertainty crossing her face","bubbles":[{"character":"NORA","text":"Marcus knows everyone. He says he''s our internal champion.","position":"bottom"}]},
   {"type":"dialogue","stageDirection":"Felix does not respond. He looks at Nora. His expression is unreadable.","bubbles":[{"character":"NORA","text":"He sent me a very funny cat meme last Tuesday.","position":"top"},{"character":"FELIX","text":"Go find their Head of Finance.","position":"bottom"}]}
 ]'::jsonb),
('the-toast', 'The Toast', 'THE WARM REVERSAL',
 'He puts the sticky note in his desk drawer. He does not throw it away.',
 20,
 '[
   {"type":"illustration","imageAlt":"Felix on a difficult call, listening, expression unreadable. Nora at her adjacent desk, overhearing.","bubbles":[]},
   {"type":"illustration","imageAlt":"Nora slides a sticky note across to Felix without looking up from her own screen","stageDirection":"Nora slides a sticky note across without looking up.","bubbles":[{"character":"NORA","text":"She just promoted the person the product was supposed to replace. She''s embarrassed. Don''t mention the original use case.","position":"bottom"}]},
   {"type":"illustration","imageAlt":"Felix glances at the note. Into the phone, his posture shifts slightly.","bubbles":[{"character":"FELIX","text":"The situation''s changed. Let''s talk about what you''re solving for now.","position":"top"}]},
   {"type":"dialogue","stageDirection":"He hangs up. He looks at the sticky note for a moment. Then he puts it in his desk drawer. He does not throw it away.","bubbles":[{"character":"FELIX","text":"How did you know that?","position":"top"},{"character":"NORA","text":"She mentioned her performance review twice and didn''t mention the product once.","position":"bottom"}]}
 ]'::jsonb),
('the-qbr', 'The QBR', 'EXECUTIVE ENGAGEMENT',
 'The EBR that wins renewals has the economic buyer in the room. The one that loses it has 52 slides.',
 30,
 '[
   {"type":"illustration","imageAlt":"Nora rehearsing, standing, very animated, gesturing at her laptop screen","bubbles":[{"character":"NORA","text":"Okay. I have 52 slides. Company highlights, product updates, roadmap preview, integration announcements—","position":"bottom"}]},
   {"type":"illustration","imageAlt":"Felix, still seated, one eyebrow slightly raised","bubbles":[{"character":"FELIX","text":"When do you talk about their business?","position":"top"}]},
   {"type":"illustration","imageAlt":"Nora scrolling through slides on her screen, finding slide 47","bubbles":[{"character":"NORA","text":"Slide 47. It''s called \"Your Journey With Us So Far.\"","position":"bottom"}]},
   {"type":"illustration","imageAlt":"Felix picking up his tea. Nora watching him, realising.","bubbles":[{"character":"FELIX","text":"Their CFO is going to look at the first slide and make a decision.","position":"top"},{"character":"NORA","text":"About the renewal?","position":"bottom"}]}
 ]'::jsonb);
