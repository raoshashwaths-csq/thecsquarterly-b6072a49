
# Tier-Personalised Copy: Plan

## Goal
Every feature card, paywall, and gated CTA should read its copy from a single tier-aware config so a signed-in Practitioner never sees "Unlocks at Practitioner", an Operator never sees "Upgrade to Operator", etc. Copy and logic only — no design, schema, or component-rename changes.

## What already exists (use as-is)
- `src/hooks/useSubscriptionTier.ts` — returns `{ tier, designation, dRank, isLoggedIn, canAccess* }`. Will be the single source of truth.
- `src/hooks/useEntitlements.ts` + `src/lib/entitlements.functions.ts` — server-side derivation from `subscriptions.designation`. Already invalidated on `onAuthStateChange` in `src/routes/__root.tsx`.
- `src/lib/tiers.ts` — canonical 8-state designation vocabulary (`visitor` + `reader`, `practitioner`, `operator`, `team`, `scale`, `enterprise`, `strategic_partner`). TIER_COPY will key off this.
- `src/components/site/PaywallOverlay.tsx` + `TierGateOverlay.tsx` — already tier-aware shells; will be re-pointed at TIER_COPY instead of inline strings.

## What to create
1. **`src/lib/tierCopy.ts`** — central `TIER_COPY` registry. Shape:
   ```ts
   type FeatureKey =
     | "csfactors" | "codex" | "lumi" | "ebrBuilder" | "expansionEngine"
     | "meetingIntel" | "reckoningLedger" | "operatorAnalytics"
     | "benchmarks" | "teamDashboard" | "apiAccess" | "community" | ...;
   type TierCopy = {
     state: "locked" | "unlocked" | "limited" | "owned";
     eyebrow: string;        // "PRACTITIONER" / "INCLUDED IN YOUR PLAN" / etc.
     headline: string;       // card title override (optional)
     body: string;           // explanatory line
     cta: { label: string; to: string; kind: "upgrade" | "open" | "manage" };
     showLock: boolean;
   };
   export const TIER_COPY: Record<FeatureKey, Record<Designation | "visitor", TierCopy>>;
   ```
   One entry per (feature × designation) — eight columns including visitor. Authoring covers all 8 so no fallback drift.

2. **`src/hooks/useTierCopy.ts`** — thin selector:
   ```ts
   const { designation, isLoggedIn } = useSubscriptionTier();
   return TIER_COPY[featureKey][isLoggedIn ? designation : "visitor"];
   ```
   Returns a stable object; no extra network calls.

## What to extend
- **`useSubscriptionTier.ts`** — verify it already exposes everything `useTierCopy` needs. Expected: no changes. If a field is missing for a specific card, add it without renaming existing fields.
- **`PaywallOverlay.tsx`** — replace inline `copyFor(...)` switch with a `useTierCopy(gate)` read; keep component API identical.
- **`TierGateOverlay.tsx`** — accept an optional `featureKey` prop; when provided, pull copy from `useTierCopy`. Existing prop-driven callers keep working.

## Sweep targets (replace static copy with `useTierCopy`)
Inline gated copy lives in these files (from grep + dependency scan):

Routes: `index.tsx`, `csfactors.tsx`, `csfactors.360.tsx`, `codex.index.tsx`, `insights.$slug.tsx`, `account.index.tsx`, `account.api.tsx`, `account.executive.analytics.tsx`, `account.analytics.{nrr-waterfall,retention-funnel,stakeholder-radar,team-leaderboard}.tsx`, `agent.framework.tsx`, `diagnostics.ai-readiness.survey.tsx`, `diagnostics.champion-dependency.tsx`, `pricing.tsx`, `admin.tsx`.

Components: `SiteHeader.tsx`, `PaywallOverlay.tsx`, `TierGateOverlay.tsx`, `ArticleSignalRow.tsx`, `csfactors/threeSixty/{TeamLeaderboardView,StakeholderRadarView,RetentionFunnelView,NrrWaterfallView}.tsx`.

Locale string: `src/locales/en/common.json:135` ("Unlock at Operator tier →") becomes a TIER_COPY entry, not a translation literal.

## What NOT to touch
- `subscriptions` / `profiles` / `user_roles` schema — `subscription_tier` column will NOT be added; designation lives where it already lives.
- `src/integrations/supabase/*` (auto-gen).
- Any colour token, font, spacing, animation, or component name.
- Realtime: per your decision, no new `postgres_changes` channel. Tier already refreshes on `onAuthStateChange` via query invalidation in `__root.tsx`.

## Conflicts already resolved with you
- Briefing said `users.subscription_tier`; reality is `subscriptions.designation`. Plan uses the existing `useSubscriptionTier` hook so call-sites never read columns directly.
- Briefing said 6 tiers; reality is 8. TIER_COPY will cover all 8 (visitor, reader, practitioner, operator, team, scale, enterprise, strategic_partner) per your answer.
- "free" in your briefing == `reader` in code. `useSubscriptionTier.tier` already exposes the `"free"` alias for back-compat; TIER_COPY keys on `designation` (canonical) to avoid drift.

## Validation
After sweep:
1. Visual smoke test at `/`, `/csfactors`, `/codex`, `/account`, `/insights/*`, `/diagnostics/*` as each persona (visitor → strategic_partner) — paid users see no upgrade prompts on features they own.
2. `tsgo` typecheck.
3. Grep for the original 7 strings + common phrasings (`unlock`, `upgrade to`, `requires `, `subscribe to`) — every remaining hit is intentional (pricing page, marketing copy) or routed through TIER_COPY.

## Out of scope (will not be done this session)
- New tiers, new features, new gates.
- Paddle webhook plumbing changes.
- Server-side authorization changes — `requireSupabaseAuth` + `assertAtLeast` stay as-is; this is UI copy only.
- Translations of the new copy (English only; i18n keys can be added later).
