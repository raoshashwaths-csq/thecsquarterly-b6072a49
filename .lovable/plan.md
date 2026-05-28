## Part 1 — Bring the admin dashboard onto the 7-tier model

Today the admin code still thinks the world is `free / vanguard / vanguard-pro / enterprise`. The new canonical matrix in `src/lib/tiers.ts` is **reader, practitioner, operator, team, scale, enterprise, strategic_partner** with $0 / $29 / $79 / $599 / $1499 / contact / contact. The DB `subscriptions` table already has a `designation` column for the new slug — we treat it as authoritative and fall back to legacy `tier` when null (so existing rows keep working).

### 1a. Shared tier constants

New file `src/lib/admin-tiers.ts`:
- Export `TIER_PRICE_CENTS` keyed by the seven designations + legacy aliases (`vanguard → practitioner`, `vanguard-pro → operator`).
- Export `TIER_LABEL` (Reader / Practitioner / Operator / Team / Scale / Enterprise / Strategic Partner) and `TIER_SEAT_CAP` + `TIER_Q_CAP` mirroring `src/lib/tiers.ts`.
- Export a `normalizeTier(row)` helper that returns `{ designation, label, priceCents, seatCap, qCap }` from `{ tier, designation }`.

This is the single source of truth for both the server fns and the React tables — no more hardcoded strings.

### 1b. `src/lib/control-panel.functions.ts`

- Replace the four-key `TIER_PRICE_CENTS` with an import from `admin-tiers.ts`.
- `getControlPanelOverview`: select `tier, designation` from `subscriptions`; compute MRR using `normalizeTier(row).priceCents` (excluding `reader`/legacy `free`). `subByUser` map stores the normalized designation, not the raw `tier`.
- `listMasterUsers`: select `tier, designation, current_period_end`; populate `u.tier` with the normalized designation; replace the hardcoded `seat_cap: 50` with `TIER_SEAT_CAP[designation]`; same for `q_cap`. Add `current_period_end` to the row so the UI can show renewal date.
- `manageUser`: extend the union to `grant-{practitioner|operator|team|scale|enterprise}` and a single `revoke-subscription` action that sets `status:'inactive'`, `tier:'free'`, `designation:null`. Keep `grant-admin` / `revoke-admin` / `revoke-sessions` unchanged. Audit-log details get the new `designation`.
- `schedulePost`: keep the existing `tier: 'free' | 'premium'` (DB column is a coarse flag), but add `min_designation` to `details` audit payload for traceability when we later wire per-tier gating server-side.

### 1c. `src/routes/admin.control-panel.tsx`

- **Overview metric strip**: keep the four `MetricCard`s, but expand the second one (`Active Paid Subscribers`) into a small breakdown chip row underneath showing counts per tier (Practitioner / Operator / Team / Scale / Enterprise / Strategic Partner). Add a fifth `MetricCard`: **ARR run-rate** = MRR × 12.
- **Latest registrations table**: tier badge uses `TIER_LABEL[designation]` instead of raw slug, and is colored: reader → secondary, practitioner/operator → default, team/scale → accent, enterprise/strategic_partner → emerald.
- **Users tab tier filter**: replace the four `SelectItem`s with the full seven plus "All tiers". Filter logic compares against the normalized designation.
- **Users table**: add **Renewal** column (formatted `current_period_end` or "—"). Show `sessions_used / q_cap` instead of the hardcoded `/50`. "Affiliation" column shows `team` / `scale` / `enterprise` / `strategic_partner` as `"Team seat"` etc., otherwise "—".
- **Manage dropdown**: replace the single Grant/Revoke Vanguard line with a `DropdownMenuSub` "Grant subscription →" listing all six paid tiers, plus a single "Revoke subscription" item below.
- **Article Composer `TIER_OPTIONS`**: replace `["Free", "Vanguard Individual", "Vanguard Pro", "Enterprise Team"]` with the seven canonical labels. Submit logic: `tier = "free"` only when the sole selection is "Reader"; otherwise `"premium"`. `tiers_allowed` ships the full label list.

### 1d. No DB migration

Schema already supports this — `subscriptions.tier` and `subscriptions.designation` both exist. The legacy `tier` values continue to work via `normalizeTier`. Skip migration unless the user later asks to enforce a check constraint on `designation`.

### Files touched (Part 1)

- new: `src/lib/admin-tiers.ts`
- edit: `src/lib/control-panel.functions.ts`
- edit: `src/routes/admin.control-panel.tsx`

---

## Part 2 — Payment infrastructure (kick off, await user input)

Lovable has two built-in providers (Paddle, Stripe-Lovable-managed) plus Shopify. I'll run the eligibility check first, then recommend exactly one and wait for confirmation before enabling — that is a separate tool call that the user must approve in a form.

### Step-by-step

1. **Call `recommend_payment_provider`** to classify the catalog (digital subscription + course/playbook content, no physical goods) against Paddle's acceptable-use policy. This determines the recommendation in step 2.
2. **Present one recommendation** based on the result (most likely Paddle for this catalog — global Merchant of Record handles VAT/GST/sales tax automatically, single 5% + 50¢ all-in, fits a digital SaaS + content subscription). I will *not* list all providers; I'll suggest the best fit and explain the trade-offs in a short paragraph.
3. **Confirm with you** before I call the enable tool. The enable tool opens a form where you fill in email / business name / etc. — I don't pass those.
4. **Enable** (`enable_paddle_payments` or `enable_stripe_payments` depending on step 1). Wait for it to complete; this provisions a sandbox automatically so we can wire checkout against test cards before any live verification.
5. **Create the seven products** (Reader $0 / Practitioner $29 / Operator $79 / Team $599 / Scale $1499 monthly + annual variants where applicable) via `batch_create_product`. Reader stays free — no product, just a sign-up flow. Enterprise and Strategic Partner stay contact-sales (no product).
6. **Wire checkout in the app**:
   - Replace the placeholder `startSubscriptionPlaceholder` in `src/lib/auth.functions.ts` with a real `createCheckoutSession` server fn that takes a `designation` and returns a hosted-checkout URL.
   - `src/routes/subscribe.tsx` already accepts `?tier=…` — point its CTA at the new server fn.
   - On success-redirect: write `tier` + `designation` + `current_period_end` to the `subscriptions` table from the webhook handler (server route under `src/routes/api/public/*`, signature-verified).
   - Wire a customer-portal link in `/account` for users to manage billing.

I'll do steps 1–4 in this loop after the plan is approved, then pause for the form. Steps 5–6 are a second build pass once payments are enabled and we know which provider's APIs to use.

### Files touched (Part 2, second pass after enable)

- edit: `src/lib/auth.functions.ts` (replace placeholders)
- new: `src/routes/api/public/payments-webhook.ts` (signature-verified)
- edit: `src/routes/subscribe.tsx` (real checkout call)
- edit: `src/routes/account.index.tsx` (customer-portal button)

### Open question

The 7-tier matrix has **Enterprise** and **Strategic Partner** as contact-sales only. Confirm those stay outside the checkout flow (mailto CTA only) rather than being created as Paddle/Stripe products — that's the default in the plan above.
