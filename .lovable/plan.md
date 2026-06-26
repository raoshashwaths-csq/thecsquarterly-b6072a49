
# Admin Pricing & Feature Control Panel

Today `src/lib/tiers.ts` is the hardcoded source of truth for tier copy, price, caps, and the bulleted "features" string list. There is no SKU concept — features are free-text bullets, so admin edits can't drive RBAC. This plan moves plans + features into the database, builds the admin editor, makes the pricing page read live, ties RBAC to a granular feature catalog, and grandfathers existing subscribers.

## 1. Granular SKU catalog (the "feature units")

Every entitlement becomes a row in a new `plan_features` table — one row = one toggleable SKU. The admin picks which SKUs belong to which tier; the pricing page renders the SKU's marketing label; the RBAC layer checks the SKU's `code`.

Proposed initial SKU list (admin can add/remove later — this is the seed):

```text
Content / Editorial
  feature.dispatch.weekly              Weekly Tuesday dispatch
  feature.archive.public               Public archive access
  feature.archive.premium              Full premium archive
  feature.tone.two_voice               Two-voice analytical/witty toggle
  feature.codex.playbooks              All Codex playbooks
  feature.codex.cobranded              Co-branded Codex content

Diagnostics & Benchmarks
  feature.ai_diagnostic.score          AI Diagnostic — score only
  feature.ai_diagnostic.blueprint      AI Diagnostic — full blueprint
  feature.benchmarks.quartiles         Retention Ledger quartile benchmarks
  feature.benchmarks.branded_pdf       Quarterly branded benchmark PDF
  feature.benchmarks.whitelabel        White-label benchmark reports
  feature.ledger.api                   Retention Ledger API access
  feature.ledger.api_full              Retention Ledger API — full segments

CSFactors / Dashboards
  feature.csfactors.personal           CSFactors personal dashboard
  feature.csfactors.operator_analytics Operator analytics (risk + waterfall)
  feature.csfactors.team_dashboard     Shared team CS dashboard
  feature.csfactors.advanced           Advanced (cohort + churn heatmap)
  feature.csfactors.admin_analytics    Admin usage analytics
  feature.csfactors.learning_paths     Assignable learning paths
  feature.csfactors.learning_custom    Custom learning paths + certs

Lumi (agent)
  feature.lumi.quota                   Lumi monthly session quota (numeric)
  feature.lumi.whiteboard              Whiteboard + URL paste
  feature.lumi.future_operator         Future Operator persona

Community & Jobs
  feature.community.vp                 VP+ community access
  feature.community.dedicated          Dedicated team community space
  feature.jobboard.candidate           Job board as candidate
  feature.jobboard.posts               Job board posting credits (numeric)

Ops / Admin
  feature.sso.prep                     SSO preparation
  feature.sso.saml                     SSO / SAML integration
  feature.notifications.priority       Priority content notifications
  feature.briefing.quarterly_call      Quarterly briefing call
  feature.partner.speaking_slot        Speaking slot at events
  feature.partner.footer_logo          Editorial footer logo placement
  feature.partner.integration_support  Dedicated integration support
```

Each SKU has: `code`, `label`, `category`, `kind` ('boolean' | 'numeric'), `default_value`, `description`, `display_order`, `is_active`. Numeric SKUs (Lumi quota, job posts) store a per-tier value; boolean SKUs are simple ON/OFF per tier.

## 2. Database schema

New migration adds three tables + a snapshot column:

```text
subscription_plans
  id (uuid pk), designation (text unique), label, tagline,
  band ('individual' | 'team' | 'partner'),
  price_monthly_cents (int), price_annual_cents (int nullable),
  price_monthly_display (text), price_annual_display (text nullable),
  seat_cap (int), seat_cap_display (text),
  cta_label, cta_kind ('free'|'checkout'|'contact'),
  highlight (bool), highlight_label (text nullable),
  contact_only (bool), display_order (int), is_active (bool),
  paddle_price_id (text nullable),    -- ties to existing Paddle catalog
  created_at, updated_at

plan_features
  id, code (text unique), label, category, kind ('boolean'|'numeric'),
  description, display_order, is_active

plan_feature_assignments
  plan_id (fk), feature_id (fk),
  enabled (bool), numeric_value (int nullable),
  marketing_label_override (text nullable),  -- override SKU label per tier
  PRIMARY KEY (plan_id, feature_id)

subscriptions
  + plan_snapshot (jsonb nullable)   -- frozen entitlements at purchase time
  + grandfathered_at (timestamptz nullable)
```

RLS:
- `subscription_plans`, `plan_features`, `plan_feature_assignments`: public `SELECT` to `anon` + `authenticated` (pricing page is public); `ALL` restricted to `has_role(auth.uid(),'admin')`.
- Grants follow the public-schema-grants rule.

Seed migration ports current `TIERS` content + the SKU list above and writes default assignments matching today's tiers exactly. After this runs, the live pricing page is unchanged byte-for-byte.

## 3. Server functions (`src/lib/plans.functions.ts`)

Public:
- `listPublishedPlans()` — returns plans + assignments + feature metadata for the pricing page. No auth.

Admin-only (`requireSupabaseAuth` + `has_role admin` check):
- `adminListPlans()`, `adminUpsertPlan(plan)`, `adminTogglePlanActive(id, active)`, `adminReorderPlans(ids)`
- `adminListFeatures()`, `adminUpsertFeature(feature)`, `adminToggleFeatureActive(id, active)`
- `adminSetAssignment({ planId, featureId, enabled, numeric_value, marketing_label_override })`
- `adminBulkSetAssignments(planId, rows[])` — used by the matrix editor

Cache invalidation: every admin write also calls `queryClient.invalidateQueries(['plans:public'])` on the client; the pricing page uses a 30s `staleTime` so changes appear immediately on refetch/refocus.

## 4. Admin UI — `/admin/plans`

New route `src/routes/admin.plans.tsx` (linked from `admin.tsx` sidebar). Two tabs:

**Tab 1 — Plans**
- Table of plans with inline edit drawer: label, tagline, band, monthly/annual price (cents + display string), seat cap, CTA label/kind, highlight + highlight label, contact-only toggle, active toggle, display order, optional `paddle_price_id`.
- "New plan" button. Reorder via up/down arrows.

**Tab 2 — Feature Matrix**
- Rows = features (grouped by category, collapsible). Columns = active plans.
- Each cell: checkbox for boolean SKUs, number input for numeric SKUs, optional label-override popover.
- Sticky header, "Save" button shows pending diff count.
- "New feature SKU" button opens a side panel (code, label, category, kind, default, description).

**Tab 3 — SKU Reference**
- Read-only printable list of every SKU with its `code`, label, category, and which tiers currently include it. This is the "publish a clear SKU list" deliverable.

## 5. Pricing page goes live-driven

`src/routes/pricing.tsx` and `src/routes/subscribe.tsx`:
- Replace `import { TIERS } from "@/lib/tiers"` with a `useQuery(['plans:public'])` powered by `listPublishedPlans()`.
- Loader uses `ensureQueryData` so SSR still renders cards with metadata.
- A thin adapter shapes DB rows into the existing `Tier` type so the rest of the page (FAQ, comparison matrix, CTA buttons) keeps working.
- `src/lib/tiers.ts` stays as a typed fallback for offline/build-time rendering only; runtime always reads DB.

The comparison matrix at the bottom of `/pricing` now renders from `plan_feature_assignments` — every SKU that's marked `is_active` becomes a row, and a check / number / em-dash appears per tier column.

## 6. RBAC tied to SKUs (not tier names)

Today gating is `dRank >= 1` style checks. New helper in `src/lib/entitlements.ts`:

```ts
hasFeature(user, "feature.csfactors.personal"): boolean
featureValue(user, "feature.lumi.quota"): number
```

Implementation:
- New SQL function `public.user_has_feature(uid, code)` and `public.user_feature_value(uid, code)` (security definer). They read the user's active subscription, prefer the row's `plan_snapshot` if present (grandfathered users), otherwise read live `plan_feature_assignments`. Admins always return true / Infinity.
- Client hook `useEntitlements()` is extended to return `features: Record<code, boolean|number>` derived from the same source.
- Existing call sites that key off `dRank` keep working (designations stay), but new gates use `hasFeature()`. We migrate the high-traffic ones in this change: CSFactors gate, Future Operator gate, Codex playbook gate, Lumi quota lookup, job-board posting credits. Rest of the codebase migrates opportunistically.

## 7. Grandfathering existing users

On every successful Paddle webhook (`subscription.created` / `subscription.updated`) we now also write `plan_snapshot` = JSON of the plan's current feature assignments + price, and stamp `grandfathered_at = now()`.

When the admin edits a plan:
- Existing subscription rows are **not** mutated. They keep their `plan_snapshot`.
- `user_has_feature` / `user_feature_value` prefer `plan_snapshot` over live assignments, so grandfathered users keep what they bought even if the admin removes a feature from the tier.
- New signups after the edit get the new shape (no snapshot → reads live).
- Admin UI shows a "Grandfathered subscribers: N" counter per plan and a (dangerous) "Re-snapshot all active subscribers to current plan" button for the case where admin explicitly wants to push changes to everyone. Confirmation modal required.

Backfill migration: for every existing active subscription row, write a `plan_snapshot` based on the current tier so the grandfather guarantee covers everyone signed up before this rollout.

## 8. Out of scope (call-outs)

- Paddle price entities themselves: the admin can edit the displayed price + attach a `paddle_price_id`, but actual Paddle price creation still goes through `payments--create_price` (Paddle is the source of truth for what's actually charged). Plan editor surfaces a warning if `price_monthly_cents` differs from the linked Paddle price.
- Currency localization: handled by existing Paddle pricing-preview flow; admin only edits the base USD display.
- Per-user feature overrides ("comp this account up to Operator") — not in this change; can be added later as a `user_feature_overrides` table reusing `user_has_feature`.

## Files touched

```text
supabase/migrations/<ts>_plans_skus.sql        new
src/lib/plans.functions.ts                     new
src/lib/plans.server.ts                        new
src/lib/entitlements.ts                        extended (hasFeature)
src/hooks/useEntitlements.ts                   extended (features map)
src/routes/admin.plans.tsx                     new (3-tab editor)
src/routes/admin.tsx                           add nav link
src/routes/pricing.tsx                         read from DB
src/routes/subscribe.tsx                       read from DB
src/components/admin/PlanEditorDrawer.tsx      new
src/components/admin/FeatureMatrix.tsx         new
src/components/admin/SkuReference.tsx          new
src/routes/api/public/payments/webhook.ts      write plan_snapshot
src/lib/tiers.ts                               keep as typed fallback
```
