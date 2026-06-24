# Build Plan — Next 3 Workstreams

Confirmed scope from your answers:
1. Build **2-E CTA Engine** next.
2. Follow Bible pricing tiers as-is (adds a new **Reader $19** tier between Free and Practitioner).
3. Migrate payments **Stripe → Paddle**.
4. Hold 4-A.
5. One-time housekeeping commit to mark the Bible's status indicators.

To keep risk low, these will ship in **three separate sessions** in this order. Trying to do all three at once would tangle the CTA migration with the payment migration.

---

## Session 1 (this turn) — 2-E CTA Engine + tier matrix update + Bible status sync

### A. Tier matrix update (small, prerequisite for CTA team-leader checks)

`src/lib/tiers.ts` + `src/lib/entitlements.ts`:
- Insert **Reader** tier between Free and Practitioner: $19/mo, 20 Lumi/mo, full Codex + premium archive, **no CSFactors**.
- Keep Practitioner $39 / Operator $89 / pools 500-2000-5000 (already correct).
- `useSubscriptionTier`: extend `tier` union to include `'reader'`, set its Lumi cap to 20/mo, `canAccessCSFactors=false`, `canAccessCommunity=true`.
- Update `PaywallOverlay` Reader-on-CSFactors variant (Bible's State C copy).
- Update Codex banner copy: Reader+ gets "All 6 playbooks included" (currently Practitioner+).
- Add new DB column `profiles.is_team_leader boolean default false` in a migration; expose via `useSubscriptionTier`. (Bible says `users.is_team_leader`; this project's user-facing table is `profiles` — same effect, correct location.)

Update memory `mem://index.md` to reflect Reader $19 + revised gating.

### B. 2-E CTA Engine

**Migration** (`supabase/migrations/...`)
- `public.ctas` table per Bible schema, with two adjustments to match this project:
  - `account_id uuid REFERENCES public.cs_accounts(id)` (Bible says `accounts`; our table is `cs_accounts`).
  - `created_by` / `assigned_to` reference `auth.users(id)`, not a public `users` table.
- Add `profiles.is_team_leader` (from section A).
- GRANTs for `authenticated` + `service_role`; RLS:
  - SELECT: row creator OR assignee OR `team_wide=true` for same-team viewers (via `is_team_member`).
  - INSERT: authenticated users; `created_by = auth.uid()` enforced.
  - UPDATE: creator, assignee, or `has_role(auth.uid(),'admin')`.
  - DELETE: creator only.
- Indexes on `(status, due_date)`, `(account_id, status)`, `(assigned_to, status)`.

**Server functions** — `src/lib/ctas.functions.ts`
- `listCtas({ scope, status?, accountId?, assigneeId? })`
- `getCta(id)`
- `createCta(input)` (used by Create modal + Pulse "+" + Lumi push)
- `updateCta({ id, patch })` (status, assignee, priority, due_date, description)
- `completeCta({ id, outcome, note })`
- `bulkUpdate({ ids, patch })` for list-view bulk actions
- `pushLumiActions({ accountId?, runId, steps[3] })` — Lumi resolution drawer hook (3 inserts)
All gated by `requireSupabaseAuth`.

**Components** — `src/components/csfactors/ctas/`
- `CtaConfig.ts` — `CTA_CONFIG` and `PRIORITY_CONFIG`. **Colors mapped to existing semantic tokens** (`--accent`, `--secondary-accent`, emerald, destructive, muted). Bible's hex values are reference only; we do not introduce them per the locked design-system rule.
- `ActionCentrePanel.tsx` — Surface A, embedded in Pulse below existing content. Uses `SectionCard` + `HealthChip` primitives.
- `AccountCtaTab.tsx` — Surface B, embedded as a tab on `csfactors.$accountId.tsx`.
- `CtaCreateDrawer.tsx`, `CtaDetailDrawer.tsx`, `QuickCompleteModal.tsx`, `TeamAssignmentModal.tsx`.
- `CtaListView.tsx`, `CtaBoardView.tsx` (HTML5 drag).

**Routes**
- `src/routes/csfactors.ctas.tsx` — Surface C (`/csfactors/ctas`). Metric strip + LIST/BOARD toggle.
- Sidebar: insert "ACTION CENTRE" entry in `CSFactorsSidebar.tsx` **between Pulse and Accounts**, with badge for open count + red dot when overdue.
- Path note: Bible says `/ctas`. This project namespaces CSFactors features under `/csfactors/*` (locked convention); we'll use `/csfactors/ctas`. Calling out so you can override if you'd rather break convention.

**Integrations**
- `PulseDashboard.tsx` — render `<ActionCentrePanel />` below existing content (additive, no rewrite).
- `AccountsGrid` / `csfactors.$accountId.tsx` — "Next Best Action" chip pulls from `ctas` with the Bible's ordering; falls back to "+" trigger that opens Create drawer pre-filled with `account_id`.
- `AskLumiDrawer` resolution footer — add "PUSH TO ACTION CENTRE" button next to existing actions; uses `pushLumiActions`.
- Home "Open CTAs" tile (Practitioner state) — now reads live count.

**Out of scope** (Bible mentions but we won't build here):
- Email/push notifications — toasts only, per Bible §7.
- Bridge to MAP Engine "linked CTAs" — separate work.

### C. Bible status housekeeping commit

A single commit that updates the Bible markdown in-place:
- 0-A, 0-B, 1-E, 2-A, 2-B, 2-C → ✅ BUILT
- 2-E → ✅ BUILT (after this session)
- Add a note at the top: "Tier matrix updated to include Reader $19 (Jun 2026)."

Stored at `docs/CS-Quarterly-Build-Bible.md` so it lives with the repo. Tell me if you'd rather keep it outside the repo.

---

## Session 2 (next) — Stripe → Paddle migration

Large and risky; isolate from feature work. High-level outline only here.

1. **You disconnect Stripe** from the Payments dashboard (three-dots menu → Disconnect Stripe). I cannot do this step.
2. Enable Lovable's seamless Paddle integration (`enable_paddle_payments`).
3. Recreate products + prices in Paddle for: Free (no price), **Reader $19/mo**, Practitioner $39/mo, Operator $89/mo, Team, Scale, Enterprise — monthly + annual where applicable.
4. Replace Stripe code in one pass:
   - Delete `src/lib/stripe.server.ts`, `src/lib/payments.functions.ts` (Stripe variant), `src/components/StripeEmbeddedCheckout.tsx`, `PaymentTestModeBanner.tsx`.
   - Rewrite checkout server fn for Paddle; rewrite `/subscribe` to use Paddle's checkout component.
   - Replace webhook at `src/routes/api/public/payments/webhook.ts` with Paddle signature verification + Paddle event names (`subscription.created/updated/canceled`).
   - Update `subscriptions` table writer to store Paddle's `customer_id` / `subscription_id` shape.
5. Keep `subscriptions` table schema; add `provider text default 'paddle'` column for clarity. Existing Stripe rows stay readable but inactive.
6. Remove Stripe env vars from references; leave secrets in place (managed by connector).
7. Verify go-live readiness for Paddle, then publish.

**Trade-offs to acknowledge before starting:** existing Stripe subscribers don't migrate automatically — they remain on Stripe until they cancel/resubscribe. If you want them moved, that's a manual customer-by-customer process outside the codebase.

---

## Session 3 (later) — your call

Slots open for: 1-C completion (AI Readiness blueprint paywall), 2-D EBR Builder, 1-F/G/H homepage animations, 3-A Lumi trees 9–13, or 3-C WhatsApp (needs `ctas` table → unblocked by Session 1).

---

## Open questions before I start Session 1

1. **Route path:** `/csfactors/ctas` (project convention) vs `/ctas` (Bible literal). OK with `/csfactors/ctas`?
2. **Reader tier in Stripe:** while Stripe is still live, do you want me to also add a Reader $19 price in Stripe so it's purchasable during the interim before Paddle goes live — or skip the Stripe wiring entirely and only enable Reader once Paddle is live?
3. **Bible file location:** OK to commit the status-synced Bible to `docs/CS-Quarterly-Build-Bible.md`?

Once you confirm 1–3 I'll execute Session 1 end-to-end.
