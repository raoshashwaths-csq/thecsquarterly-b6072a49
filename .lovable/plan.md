
# Multi-Tier Entitlement Engine

## 1. Schema: new `designation` column

Migration on `public.subscriptions`:

- Add `designation text` with check constraint over: `reader`, `practitioner`, `operator`, `team`, `scale`, `enterprise`, `strategic_partner`.
- Backfill from existing `tier`:
  - `free` → `reader`
  - `vanguard` / `vanguard-individual` → `practitioner`
  - `vanguard-pro` → `operator`
  - `team-starter` → `team`
  - `team-growth` → `scale`
  - `enterprise` → `enterprise`
- Admins (via `has_role`) resolve to `strategic_partner` in code, no DB change.
- Add `public.has_designation(_user uuid, _min designation_rank int)` security-definer helper that returns boolean, used by future RLS where needed.

## 2. Entitlements layer (code)

Extend `src/hooks/useEntitlements.ts`:

- Add `designation: Designation` and numeric `dRank`.
- Add booleans: `canExecAnalytics` (operator+), `canTeamScope` (team+), `canSSO` (scale+), `canApiKeys` (enterprise+), `qMonthlyCap` (number).
- Server mirror: `src/lib/entitlements.functions.ts` — `getMyDesignation()` returning the same shape; used by server-fn gates.

## 3. New gated routes

### `/account/executive/analytics`
- New route file `src/routes/account.executive.analytics.tsx`.
- Renders an embedded CSFactors-style command center (reuse `AccountsGrid`, `BurningThree`, `AnalyticsHeader` already in `src/components/csfactors/`).
- `beforeLoad` reads `useEntitlements`-equivalent server check; if designation < operator, mount a `<TierGateOverlay />` (blurred Parchment modal, `backdrop-blur`, copy from spec) instead of the analytics body.
- For `operator`: load grid scoped to current user only (already how `listAccounts` works).
- For `team`+: surface a new "Team scope" `<Select>` (placeholder data — `getTeamMembers` server-fn returns the user's `team_members` rows; switching scope is a no-op until a real team data model lands, but the dropdown renders).

### `/account/api`
- New route `src/routes/account.api.tsx`.
- Only visible if `canApiKeys`. Otherwise renders the same `<TierGateOverlay />` with enterprise copy.
- Tab inside `/account` shell with a "Generate bearer token" form (stub button → `toast.info("Available on Enterprise — contact us")` for now; no actual key minting).

### `/api/v1/*` guard
- Add server route `src/routes/api/v1.$.ts` that returns:
  ```json
  { "error": "unauthenticated", "message": "Enterprise API key required" }
  ```
  status 403, `Content-Type: application/json`. Covers any direct hit on `/api/v1/...` without a verified key. Existing `api/v1.benchmarks.nrr.ts` and `api/v1.retention-ledger.ticker.ts` remain (they're public read endpoints); the catch-all only handles unmatched `/api/v1/*` paths.

## 4. Q agent monthly cap

- New server-fn `src/lib/q-usage.functions.ts` → `getMonthlyQUsage()`:
  - `count(*) from q_runs where user_id = me and created_at >= date_trunc('month', now())`
  - returns `{ used, cap }` where cap derives from designation (reader 0, practitioner 30, operator 100, team 400, scale 1000, enterprise/strategic ∞).
- In `src/lib/csfactors-q.functions.ts` (and any other Q entry server-fn): call usage check before `q_runs` insert; throw `Error("Q monthly cap reached")` when exceeded.
- In both Q surfaces (`src/components/site/QAgentButton.tsx` and `src/components/csfactors/QAgentDrawer.tsx`):
  - Fetch usage via `useQuery`.
  - When `used >= cap`, render an inline notification block (uses `SectionCard` + accent border) above the composer: "You've used X / Y Q interactions this month. Upgrade to {next tier} for more."
  - Disable mic + send when capped.

## 5. Scale-tier stubs

- In `/account` shell add two cards behind `canSSO`:
  - **Single Sign-On (SAML)** — title + body + disabled "Configure SSO" button + small note: "Available on Scale and above". For tiers ≥ scale, button shows toast: "SSO setup is concierge — we'll reach out to provision WorkOS."
  - **Brand assets** — disabled file input + same gating. No upload wiring.
- Both rendered with `SectionCard` from the dashboard kit, Parchment styling.

## 6. Shared `<TierGateOverlay />`

`src/components/site/TierGateOverlay.tsx`:
- Full-bleed blurred backdrop over whatever it wraps (`backdrop-blur-xl bg-background/70`).
- Centered Parchment card: mono eyebrow "Tier required", display headline, body copy passed via props, two CTAs (Primary → `/pricing`, ghost → "Back").
- Used by `/account/executive/analytics`, `/account/api`, and any future gates.

## 7. Files touched

**New**
- `src/routes/account.executive.analytics.tsx`
- `src/routes/account.api.tsx`
- `src/routes/api/v1.$.ts`
- `src/components/site/TierGateOverlay.tsx`
- `src/lib/entitlements.functions.ts`
- `src/lib/q-usage.functions.ts`
- Migration: add `designation` + backfill + helper fn

**Edited**
- `src/hooks/useEntitlements.ts` (designation, new booleans, caps)
- `src/components/site/QAgentButton.tsx` + `src/components/csfactors/QAgentDrawer.tsx` (cap UI)
- `src/lib/csfactors-q.functions.ts` + `src/lib/q-agent.functions.ts` (server cap enforcement)
- `src/routes/account.index.tsx` (SSO + brand stubs + API tab link)

## Out of scope (explicit)
- Real WorkOS SAML wiring, real brand-asset storage, real API-key minting, real team aggregation queries.
- Renaming existing `tier` column or removing legacy values.
- Migrating existing RLS policies to use `designation` (the column is additive; current `tier`-based policies keep working).
