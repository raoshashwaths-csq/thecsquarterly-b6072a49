
-- Subscribers
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  segment TEXT,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can subscribe" ON public.subscribers FOR INSERT WITH CHECK (true);
-- No SELECT policy on purpose: emails are private.

-- Posts (public content)
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'The Editors',
  read_minutes INT NOT NULL DEFAULT 5,
  hero_prompt TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts readable by anyone" ON public.posts FOR SELECT USING (true);

-- Survey responses
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  company TEXT,
  role TEXT,
  answers JSONB NOT NULL,
  score INT NOT NULL,
  tier TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can submit survey" ON public.survey_responses FOR INSERT WITH CHECK (true);

-- Seed posts
INSERT INTO public.posts (slug, title, excerpt, body, category, author, read_minutes, hero_prompt) VALUES
('high-touch-cs-scaling-liability',
 'Why high-touch Customer Success is a scaling liability',
 'The industry has long romanticized the white-glove experience. For companies moving from $50M to $500M ARR, the human-centric model breaks.',
 E'The industry has long romanticized the white-glove experience. But for companies moving from $50M to $500M ARR, the human-centric model breaks. We examine the transition to algorithmic orchestration.\n\n## The cost of every conversation\n\nManual outreach scales linearly with headcount. Revenue does not. The math fails long before the org chart does.\n\n## What replaces it\n\nThree pillars: signal-driven engagement, productized playbooks, and CSMs deployed only where their judgment compounds.\n\n## Closing thesis\n\nCS is no longer a service department; it is a revenue engine that requires the same mechanical precision as an assembly line.',
 'Strategy', 'Sarah Chen', 8, 'Minimal architectural photo of concrete stairs with sharp shadows'),

('negotiators-dilemma-renewals',
 'The negotiator''s dilemma: winning renewals without discounting',
 'New data from over 400 enterprise renewals suggests firm boundaries create higher perceived value than flexibility.',
 E'Traditional CS wisdom suggests flexibility is the key to retention. New data from over 400 enterprise renewals suggests the opposite.\n\n## The discount trap\n\nEvery concession trains the buyer to push harder next cycle. Discounts compound; they do not stabilize.\n\n## A three-step counter\n\n1. Anchor on value delivered, not list price.\n2. Trade scope for term length, never price for term length.\n3. Walk away from one deal per quarter. Visibly.\n\n## Why it works\n\nFirmness signals confidence. Confidence signals product-market fit. Buyers reward both.',
 'Negotiation', 'Marcus Reyes', 12, 'Close up of an architect blueprint and a fountain pen'),

('stakeholder-mapping-frameworks',
 'Structural stakeholders: mapping power dynamics in enterprise accounts',
 'A guide to identifying the true decision-makers in complex post-sales cycles.',
 E'The org chart lies. The real power map is built from meeting attendance, Slack mentions, and who reschedules whom.\n\n## Three roles you must name\n\n- The Economic Buyer (signs)\n- The Technical Champion (defends)\n- The Quiet Veto (kills, silently)\n\nMiss any one and your renewal is theoretical.',
 'Stakeholder Management', 'Priya Anand', 9, 'Minimalist desk setup with a single notebook and a pen'),

('escalation-playbook-c-suite',
 'Managing the C-suite during enterprise escalations',
 'Three frameworks for maintaining executive trust when the stakes are at their highest.',
 E'Escalations are not failures. They are auditions for the next contract.\n\n## Framework 1: Pre-mortem the call\n\nBefore the bridge opens, decide what you will concede and what you will not. Write it down.\n\n## Framework 2: Time-box hope\n\nNo open-ended commitments. Every promise has a date and an owner.\n\n## Framework 3: Post-call dossier\n\nA written summary within 90 minutes. Always.',
 'Escalation', 'Jordan Ellis', 7, 'A professional boardroom window looking out over a city at dusk'),

('qualification-bridge-sales-cs',
 'Identifying churn risk before the contract is signed',
 'How to build a bridge between Sales and Success for better qualification.',
 E'The cheapest churn save happens in the sales cycle. The second cheapest happens in onboarding. After that, costs explode.\n\n## The qualification handshake\n\nCS sits in three deals per AE per quarter. Veto power on one.\n\n## What you are listening for\n\n- Misaligned success criteria\n- Single-threaded champion\n- Procurement-led timeline\n\nAny two of three: walk.',
 'Sales Qualification', 'Sarah Chen', 6, 'Modern glass office building reflecting the sky'),

('ai-orchestration-cs-org',
 'Algorithmic orchestration: the new CS operating model',
 'A practical blueprint for layering AI between signals and human judgment.',
 E'AI does not replace the CSM. It replaces the inbox.\n\n## What to automate first\n\n- Health scoring\n- Meeting recaps\n- First-draft QBRs\n\n## What never to automate\n\n- The escalation call\n- The renewal ask\n- The reference request\n\nThe rule: automate signal, preserve judgment.',
 'AI Deployment', 'Marcus Reyes', 10, 'Minimal abstract geometry in soft earth tones');
