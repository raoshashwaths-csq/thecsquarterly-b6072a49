## Goal

Every metric, chart, and table on both admin surfaces (`/admin` classic + `/admin/control-panel`) should compute against live data and reflect the current 7-tier model. No fabricated values, no stale labels.

## Issues found

**Classic `/admin` (src/lib/admin.functions.ts → src/routes/admin.tsx)**

1. `getAdminStats.revenueCents` filters `purchases.status = 'completed'`, but the `purchases` table only writes `'pending'` (no completion path yet). Revenue silently reads $0 forever — misleading. Should switch to MRR×12 from `subscriptions` (same source as control panel) until Paddle/Stripe webhooks land.
2. `listSubscriptions` selects `tier` only — UI shows legacy strings like `vanguard` / `vanguard-pro` instead of the new labels (Practitioner, Operator, …).
3. `getQAdminStats` is fine but the "active vanguard" entitlement in `listQEntitlementsAdmin` filters `tier='vanguard'` — misses everyone on the new `designation` field (operator/team/scale/enterprise/strategic_partner). Result: paid operators don't show as entitled.

**Control Panel `/admin/control-panel` (src/lib/control-panel.functions.ts)**

4. `getControlPanelOverview.tierBreakdown` label fallback — when a tier has 0 subs, `paidSubs.find(...)?.label` returns undefined and the chip shows the raw designation string instead of the human label. Use `TIER_LABEL[d]` directly.
5. `latestRegistrations.method` is hard-coded `"Email"` for everyone — Google sign-ins are invisible. Use `supabaseAdmin.auth.admin.listUsers()` (or `getUserById` per id) to read `identities[].provider` and surface `Google` / `Email`.
6. `getAgentObservability` labels two metrics as facts but they are heuristics: "Total Token Burn" (`runs × 2400`) and "Compute Profit Margin" (`runs × $0.50` revenue). Either (a) relabel the tiles "Estimated" and add a small "heuristic" footnote, or (b) gate them behind a feature flag until real per-run token/latency columns exist on `q_runs`. Recommended: relabel + footnote now; add real columns later when payments land.
7. `getAgentObservability.avgLatencyMs` is computed from JSON payload size — same heuristic problem. Relabel "Est. response size proxy" or remove until we persist latency.
8. Sessions-vs-Registrations chart caps `q_runs` query at 5000 rows in 30 days — once we cross that volume the series under-reports. Switch to a `select count() group by date` via an RPC, or page through with `range()`.

**UX / wiring**

9. Overview's "Refresh" button calls `refetch()` but doesn't invalidate dependent queries (latest regs uses same query — fine). Verify in browser after fix.
10. `qCountsRes` in `listMasterUsers` pulls every `q_runs` row to count per user — fine at small scale but should move to a grouped count RPC before this list gets long. Flag only; not fixing now.

## Changes

### `src/lib/admin.functions.ts`
- `getAdminStats`: replace `revenueCents` calc with MRR×12 via `normalizeTier` over active subscriptions (re-use `admin-tiers`). Return `mrrCents` and `arrCents` alongside.
- `listSubscriptions`: select `designation` too; map through `normalizeTier` server-side so UI gets `{ tier, designation, label }`.
- `listQEntitlementsAdmin`: drop the `tier='vanguard'` filter; instead include any active subscription whose normalized designation is paid (`isPaid(...)`).

### `src/routes/admin.tsx`
- Update the revenue tile label/value to read MRR (monthly) and ARR (annual) from the new stats response.
- Update the subscriptions table to render the normalized `label` from the server.

### `src/lib/control-panel.functions.ts`
- `getControlPanelOverview`:
  - Fix `tierBreakdown` label fallback → `TIER_LABEL[d]`.
  - Replace `methodByUser` stub with real auth-provider lookup using `supabaseAdmin.auth.admin.getUserById(id)` (parallelized, capped at 25 ids = latest list).
- `getAgentObservability`:
  - Round-trip "Total Token Burn" / "Compute Profit Margin" / "Avg Response Latency" but mark them `estimated: true` in the payload.

### `src/routes/admin.control-panel.tsx`
- Overview: no UI change beyond the tier label bug auto-fixing.
- Diagnostics: append "Estimated" suffix to the three heuristic tiles and a 1-line footnote under the metric strip: "Token, cost and latency are heuristics until per-run telemetry is captured."

## Out of scope (call out, don't build)

- Real revenue once Paddle/Stripe is enabled — will replace the MRR fallback with `purchases.status='completed'` aggregate + active-sub MRR.
- Persisting real `latency_ms`, `tokens_in`, `tokens_out` columns on `q_runs` — needs a migration + writer change in the Q agent path. Recommend doing it together with the payments work so the cost/margin numbers stop being estimates.
- Replacing the per-user `q_runs` count with a grouped RPC for `listMasterUsers`.

## Verification

After build:
1. Open `/admin` — revenue tile shows non-zero (MRR $58 / ARR $696 with current data: 2 practitioner subs × $29).
2. Subscriptions table shows "Practitioner" label, not `vanguard`.
3. Open `/admin/control-panel` Overview — tier chips show all 6 paid labels even when count=0, Method column shows `Google` for Google sign-ins (verify with one known Google user).
4. Diagnostics tiles read "Total Token Burn (est.)" etc., with footnote visible.
5. `psql` spot-check: `select count(*) from q_runs` matches "Total Runs (all-time)".
