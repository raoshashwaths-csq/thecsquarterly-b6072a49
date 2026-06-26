
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  designation text NOT NULL UNIQUE,
  label text NOT NULL,
  tagline text NOT NULL DEFAULT '',
  band text NOT NULL DEFAULT 'individual',
  price_monthly_cents integer NOT NULL DEFAULT 0,
  price_annual_cents integer,
  price_monthly_display text NOT NULL DEFAULT '$0',
  price_annual_display text,
  seat_cap integer NOT NULL DEFAULT 1,
  seat_cap_display text NOT NULL DEFAULT '1 seat',
  q_cap_display text NOT NULL DEFAULT '',
  cta_label text NOT NULL DEFAULT 'Subscribe',
  cta_kind text NOT NULL DEFAULT 'checkout',
  highlight boolean NOT NULL DEFAULT false,
  highlight_label text,
  contact_only boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  paddle_price_id_monthly text,
  paddle_price_id_annual text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscription_plans TO anon;
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT ALL ON public.subscription_plans TO service_role;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscription_plans public read" ON public.subscription_plans FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "subscription_plans admin write" ON public.subscription_plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_subscription_plans_updated BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.plan_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  kind text NOT NULL DEFAULT 'boolean',
  description text NOT NULL DEFAULT '',
  default_value integer,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plan_features TO anon;
GRANT SELECT ON public.plan_features TO authenticated;
GRANT ALL ON public.plan_features TO service_role;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_features public read" ON public.plan_features FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "plan_features admin write" ON public.plan_features FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_plan_features_updated BEFORE UPDATE ON public.plan_features
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.plan_feature_assignments (
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  feature_id uuid NOT NULL REFERENCES public.plan_features(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  numeric_value integer,
  marketing_label_override text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (plan_id, feature_id)
);
GRANT SELECT ON public.plan_feature_assignments TO anon;
GRANT SELECT ON public.plan_feature_assignments TO authenticated;
GRANT ALL ON public.plan_feature_assignments TO service_role;
ALTER TABLE public.plan_feature_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_feature_assignments public read" ON public.plan_feature_assignments FOR SELECT USING (true);
CREATE POLICY "plan_feature_assignments admin write" ON public.plan_feature_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_plan_feature_assignments_updated BEFORE UPDATE ON public.plan_feature_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS grandfathered_at timestamptz;

CREATE OR REPLACE FUNCTION public.user_has_feature(_user_id uuid, _code text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_snapshot jsonb; v_designation text; v_enabled boolean;
BEGIN
  IF _user_id IS NULL THEN RETURN false; END IF;
  IF public.has_role(_user_id, 'admin') THEN RETURN true; END IF;
  SELECT plan_snapshot, COALESCE(designation, tier) INTO v_snapshot, v_designation
  FROM public.subscriptions WHERE user_id = _user_id
    AND status IN ('active','trialing','past_due')
  ORDER BY created_at DESC LIMIT 1;
  IF v_snapshot IS NOT NULL THEN
    RETURN COALESCE((v_snapshot -> 'features' -> _code ->> 'enabled')::boolean, false);
  END IF;
  IF v_designation IS NULL THEN RETURN false; END IF;
  SELECT a.enabled INTO v_enabled
  FROM public.plan_feature_assignments a
  JOIN public.subscription_plans p ON p.id = a.plan_id
  JOIN public.plan_features f ON f.id = a.feature_id
  WHERE p.designation = v_designation AND f.code = _code AND f.is_active = true;
  RETURN COALESCE(v_enabled, false);
END; $$;

CREATE OR REPLACE FUNCTION public.user_feature_value(_user_id uuid, _code text)
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_snapshot jsonb; v_designation text; v_value integer;
BEGIN
  IF _user_id IS NULL THEN RETURN 0; END IF;
  IF public.has_role(_user_id, 'admin') THEN RETURN 2147483647; END IF;
  SELECT plan_snapshot, COALESCE(designation, tier) INTO v_snapshot, v_designation
  FROM public.subscriptions WHERE user_id = _user_id
    AND status IN ('active','trialing','past_due')
  ORDER BY created_at DESC LIMIT 1;
  IF v_snapshot IS NOT NULL THEN
    RETURN COALESCE((v_snapshot -> 'features' -> _code ->> 'value')::integer, 0);
  END IF;
  IF v_designation IS NULL THEN RETURN 0; END IF;
  SELECT a.numeric_value INTO v_value
  FROM public.plan_feature_assignments a
  JOIN public.subscription_plans p ON p.id = a.plan_id
  JOIN public.plan_features f ON f.id = a.feature_id
  WHERE p.designation = v_designation AND f.code = _code AND f.is_active = true AND a.enabled = true;
  RETURN COALESCE(v_value, 0);
END; $$;

INSERT INTO public.subscription_plans
  (designation,label,tagline,band,price_monthly_cents,price_annual_cents,price_monthly_display,price_annual_display,seat_cap,seat_cap_display,q_cap_display,cta_label,cta_kind,highlight,highlight_label,contact_only,display_order)
VALUES
  ('reader','Reader','The weekly briefing and a baseline diagnostic. No card required.','individual',0,NULL,'$0','Free forever',1,'1 seat','1 session / week','Start free','free',false,NULL,false,1),
  ('practitioner','Practitioner','Full library, every Codex playbook, CSFactors dashboard, and Lumi.','individual',3900,39000,'$39','$390 / year',1,'1 seat','50 / month','Become a Practitioner','checkout',true,'Most popular for individuals',false,2),
  ('operator','Operator','Advanced operator analytics, benchmarks, and more Lumi headroom.','individual',8900,89000,'$89','$890 / year',1,'1 seat','100 / month','Become an Operator','checkout',false,NULL,false,3),
  ('team','Team','Shared team dashboard, admin analytics, and a 500-session Lumi pool.','team',59900,599000,'$599','$5,990 / year',8,'Up to 8 seats','500 pooled / month','Start a team','checkout',false,NULL,false,4),
  ('scale','Scale','Advanced dashboard, branded benchmark PDF, and a 2,000-session pool.','team',149900,1499000,'$1,499','$14,990 / year',20,'Up to 20 seats','2,000 pooled / month','Scale the team','checkout',true,'Most popular for mid-market CS',false,5),
  ('enterprise','Enterprise','White-label benchmarks, Ledger API, and a 5,000-session pool.','team',350000,NULL,'$3,500','Custom annual contract',50,'Up to 50 seats','5,000 pooled / month','Talk to editorial','contact',false,NULL,false,6),
  ('strategic_partner','Strategic Partner','Co-branded Codex content, full Ledger API, and an editorial partnership.','partner',800000,NULL,'$8,000','Annual contract required',9999,'Unlimited seats','Unlimited','Talk to editorial','contact',false,NULL,true,7);

INSERT INTO public.plan_features (code,label,category,kind,description,display_order) VALUES
  ('feature.dispatch.weekly','Weekly Tuesday dispatch','Editorial','boolean','The free weekly newsletter delivered every Tuesday.',10),
  ('feature.archive.public','Public archive access','Editorial','boolean','Access to public posts in the archive.',20),
  ('feature.archive.premium','Full premium archive','Editorial','boolean','All paywalled essays and back catalogue.',30),
  ('feature.tone.two_voice','Two-voice analytical/witty toggle','Editorial','boolean','Inline switch between analytical and narrative tone.',40),
  ('feature.codex.playbooks','All Codex playbooks','Editorial','boolean','Every published Codex playbook + frameworks.',50),
  ('feature.codex.cobranded','Co-branded Codex content','Editorial','boolean','Co-branded Codex pieces distributed to the community.',60),
  ('feature.ai_diagnostic.score','AI Diagnostic — score only','Diagnostics','boolean','Top-line score from the AI Readiness diagnostic.',110),
  ('feature.ai_diagnostic.blueprint','AI Diagnostic — full blueprint','Diagnostics','boolean','Full 12-page custom blueprint.',120),
  ('feature.benchmarks.quartiles','Retention Ledger quartile benchmarks','Diagnostics','boolean','Compare against Retention Ledger quartiles.',130),
  ('feature.benchmarks.branded_pdf','Quarterly branded benchmark PDF','Diagnostics','boolean','Quarterly board-ready benchmark PDF.',140),
  ('feature.benchmarks.whitelabel','White-label benchmark reports','Diagnostics','boolean','White-label quarterly benchmark reports.',150),
  ('feature.ledger.api','Retention Ledger API access','Diagnostics','boolean','API access to Retention Ledger data.',160),
  ('feature.ledger.api_full','Retention Ledger API — full segments','Diagnostics','boolean','Full segment + metric access via API.',170),
  ('feature.csfactors.personal','CSFactors personal dashboard','CSFactors','boolean','Personal CSFactors dashboard.',210),
  ('feature.csfactors.operator_analytics','Operator analytics (risk + waterfall)','CSFactors','boolean','Risk register and renewal waterfall.',220),
  ('feature.csfactors.team_dashboard','Shared team CS dashboard','CSFactors','boolean','Portfolio + renewal pipeline for the team.',230),
  ('feature.csfactors.advanced','Advanced (cohort + churn heatmap)','CSFactors','boolean','Cohort analysis + churn signal heatmap.',240),
  ('feature.csfactors.admin_analytics','Admin usage analytics','CSFactors','boolean','Usage, reads, and agent activity for admins.',250),
  ('feature.csfactors.learning_paths','Assignable learning paths','CSFactors','boolean','Assignable learning paths for teams.',260),
  ('feature.csfactors.learning_custom','Custom learning paths + certs','CSFactors','boolean','Custom learning paths with completion certificates.',270),
  ('feature.lumi.quota','Lumi monthly session quota','Lumi','numeric','Lumi sessions per month (0 = no access, 9999 = unlimited).',310),
  ('feature.lumi.whiteboard','Whiteboard + URL paste','Lumi','boolean','Whiteboard for article notes and pasted URLs.',320),
  ('feature.lumi.future_operator','Future Operator persona','Lumi','boolean','Access to the Future Operator persona.',330),
  ('feature.community.vp','VP+ community access','Community','boolean','VP+ community space.',410),
  ('feature.community.dedicated','Dedicated team community space','Community','boolean','Dedicated community space for your team.',420),
  ('feature.jobboard.candidate','Job board as candidate','Community','boolean','Apply to roles on the job board.',430),
  ('feature.jobboard.posts','Job board posting credits / quarter','Community','numeric','Number of job posting credits per quarter.',440),
  ('feature.sso.prep','SSO preparation','Ops','boolean','SSO setup preparation.',510),
  ('feature.sso.saml','SSO / SAML integration','Ops','boolean','Full SSO / SAML integration.',520),
  ('feature.notifications.priority','Priority content notifications','Ops','boolean','Priority alerts when premium content drops.',530),
  ('feature.briefing.quarterly_call','Quarterly briefing call','Ops','boolean','Quarterly call with the editorial team.',540),
  ('feature.partner.speaking_slot','Speaking slot at events','Ops','boolean','Speaking slot at quarterly community events.',550),
  ('feature.partner.footer_logo','Editorial footer logo placement','Ops','boolean','Logo placement in the editorial footer.',560),
  ('feature.partner.integration_support','Dedicated integration support','Ops','boolean','Dedicated integration + onboarding support.',570);

INSERT INTO public.plan_feature_assignments (plan_id, feature_id, enabled, numeric_value)
SELECT p.id, f.id, true, CASE WHEN f.code = 'feature.lumi.quota' THEN 4 END
FROM public.subscription_plans p, public.plan_features f
WHERE p.designation = 'reader'
  AND f.code IN ('feature.dispatch.weekly','feature.archive.public','feature.ai_diagnostic.score','feature.lumi.quota','feature.jobboard.candidate');

INSERT INTO public.plan_feature_assignments (plan_id, feature_id, enabled, numeric_value)
SELECT p.id, f.id, true, CASE WHEN f.code = 'feature.lumi.quota' THEN 50 END
FROM public.subscription_plans p, public.plan_features f
WHERE p.designation = 'practitioner'
  AND f.code IN ('feature.dispatch.weekly','feature.archive.public','feature.archive.premium','feature.tone.two_voice','feature.codex.playbooks','feature.ai_diagnostic.score','feature.ai_diagnostic.blueprint','feature.csfactors.personal','feature.lumi.quota','feature.lumi.whiteboard','feature.jobboard.candidate');

INSERT INTO public.plan_feature_assignments (plan_id, feature_id, enabled, numeric_value)
SELECT p.id, f.id, true, CASE WHEN f.code = 'feature.lumi.quota' THEN 100 END
FROM public.subscription_plans p, public.plan_features f
WHERE p.designation = 'operator'
  AND f.code IN ('feature.dispatch.weekly','feature.archive.public','feature.archive.premium','feature.tone.two_voice','feature.codex.playbooks','feature.ai_diagnostic.score','feature.ai_diagnostic.blueprint','feature.benchmarks.quartiles','feature.csfactors.personal','feature.csfactors.operator_analytics','feature.lumi.quota','feature.lumi.whiteboard','feature.lumi.future_operator','feature.community.vp','feature.notifications.priority','feature.jobboard.candidate');

INSERT INTO public.plan_feature_assignments (plan_id, feature_id, enabled, numeric_value)
SELECT p.id, f.id, true,
       CASE WHEN f.code = 'feature.lumi.quota' THEN 500 WHEN f.code = 'feature.jobboard.posts' THEN 2 END
FROM public.subscription_plans p, public.plan_features f
WHERE p.designation = 'team'
  AND f.code IN ('feature.dispatch.weekly','feature.archive.public','feature.archive.premium','feature.tone.two_voice','feature.codex.playbooks','feature.ai_diagnostic.score','feature.ai_diagnostic.blueprint','feature.benchmarks.quartiles','feature.csfactors.personal','feature.csfactors.operator_analytics','feature.csfactors.team_dashboard','feature.csfactors.admin_analytics','feature.csfactors.learning_paths','feature.lumi.quota','feature.lumi.whiteboard','feature.lumi.future_operator','feature.community.vp','feature.notifications.priority','feature.jobboard.candidate','feature.jobboard.posts','feature.sso.prep');

INSERT INTO public.plan_feature_assignments (plan_id, feature_id, enabled, numeric_value)
SELECT p.id, f.id, true,
       CASE WHEN f.code = 'feature.lumi.quota' THEN 2000 WHEN f.code = 'feature.jobboard.posts' THEN 4 END
FROM public.subscription_plans p, public.plan_features f
WHERE p.designation = 'scale'
  AND f.code IN ('feature.dispatch.weekly','feature.archive.public','feature.archive.premium','feature.tone.two_voice','feature.codex.playbooks','feature.ai_diagnostic.score','feature.ai_diagnostic.blueprint','feature.benchmarks.quartiles','feature.benchmarks.branded_pdf','feature.csfactors.personal','feature.csfactors.operator_analytics','feature.csfactors.team_dashboard','feature.csfactors.advanced','feature.csfactors.admin_analytics','feature.csfactors.learning_paths','feature.lumi.quota','feature.lumi.whiteboard','feature.lumi.future_operator','feature.community.vp','feature.notifications.priority','feature.briefing.quarterly_call','feature.jobboard.candidate','feature.jobboard.posts','feature.sso.saml');

INSERT INTO public.plan_feature_assignments (plan_id, feature_id, enabled, numeric_value)
SELECT p.id, f.id, true, CASE WHEN f.code = 'feature.lumi.quota' THEN 5000 END
FROM public.subscription_plans p, public.plan_features f
WHERE p.designation = 'enterprise'
  AND f.code IN ('feature.dispatch.weekly','feature.archive.public','feature.archive.premium','feature.tone.two_voice','feature.codex.playbooks','feature.ai_diagnostic.score','feature.ai_diagnostic.blueprint','feature.benchmarks.quartiles','feature.benchmarks.branded_pdf','feature.benchmarks.whitelabel','feature.ledger.api','feature.csfactors.personal','feature.csfactors.operator_analytics','feature.csfactors.team_dashboard','feature.csfactors.advanced','feature.csfactors.admin_analytics','feature.csfactors.learning_paths','feature.csfactors.learning_custom','feature.lumi.quota','feature.lumi.whiteboard','feature.lumi.future_operator','feature.community.vp','feature.community.dedicated','feature.notifications.priority','feature.briefing.quarterly_call','feature.jobboard.candidate','feature.sso.saml');

INSERT INTO public.plan_feature_assignments (plan_id, feature_id, enabled, numeric_value)
SELECT p.id, f.id, true, CASE WHEN f.code = 'feature.lumi.quota' THEN 9999 END
FROM public.subscription_plans p, public.plan_features f
WHERE p.designation = 'strategic_partner'
  AND f.code IN ('feature.dispatch.weekly','feature.archive.public','feature.archive.premium','feature.tone.two_voice','feature.codex.playbooks','feature.codex.cobranded','feature.ai_diagnostic.score','feature.ai_diagnostic.blueprint','feature.benchmarks.quartiles','feature.benchmarks.branded_pdf','feature.benchmarks.whitelabel','feature.ledger.api','feature.ledger.api_full','feature.csfactors.personal','feature.csfactors.operator_analytics','feature.csfactors.team_dashboard','feature.csfactors.advanced','feature.csfactors.admin_analytics','feature.csfactors.learning_paths','feature.csfactors.learning_custom','feature.lumi.quota','feature.lumi.whiteboard','feature.lumi.future_operator','feature.community.vp','feature.community.dedicated','feature.notifications.priority','feature.briefing.quarterly_call','feature.partner.speaking_slot','feature.partner.footer_logo','feature.partner.integration_support','feature.jobboard.candidate','feature.sso.saml');

-- Grandfather backfill (inline tier->designation mapping)
UPDATE public.subscriptions s
SET plan_snapshot = jsonb_build_object(
      'designation', p.designation,
      'label', p.label,
      'price_monthly_cents', p.price_monthly_cents,
      'snapshot_at', now(),
      'features', (
        SELECT COALESCE(jsonb_object_agg(
          f.code,
          jsonb_build_object('enabled', a.enabled, 'value', a.numeric_value, 'kind', f.kind)
        ), '{}'::jsonb)
        FROM public.plan_feature_assignments a
        JOIN public.plan_features f ON f.id = a.feature_id
        WHERE a.plan_id = p.id
      )
    ),
    grandfathered_at = COALESCE(s.grandfathered_at, now())
FROM public.subscription_plans p
WHERE p.designation = COALESCE(
  s.designation,
  CASE s.tier
    WHEN 'vanguard' THEN 'practitioner'
    WHEN 'vanguard-individual' THEN 'practitioner'
    WHEN 'vanguard-pro' THEN 'operator'
    WHEN 'team-starter' THEN 'team'
    WHEN 'team-growth' THEN 'scale'
    WHEN 'enterprise' THEN 'enterprise'
    WHEN 'free' THEN 'reader'
    ELSE s.tier
  END
)
AND s.status IN ('active','trialing','past_due')
AND s.plan_snapshot IS NULL;
