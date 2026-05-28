
# CSFactors Command Centre Upgrade

Scope is **only** `/csfactors` and its sidebar. The main CS Quarterly site (theme, typography, palette, paddings) is untouched. Inside `/csfactors`, the existing parchment/onyx tokens, MetricCard / SectionCard / ProgressGauge primitives, frozen-column AccountsGrid styling, and mono-eyebrow tracking are reused verbatim — no new colors, no new fonts.

---

## 1. Sidebar — collapse Analytics into "360 Dashboard"

`src/components/csfactors/csfactorsNav.tsx`:
- Remove the four analytics children (Executive Portfolio, Retention Analysis, Account Health Matrix, Churn Risk & Expansion).
- Replace with a single top-level item **"360 Dashboard"** linking to a new `/csfactors/360` route.
- `/account/analytics/*` routes stay live and accessible (per your answer).
- Apply the same change to `MobileNavDrawer.tsx`.

New route `src/routes/csfactors.360.tsx`:
- Reuses `CSFactorsSidebar` + page chrome.
- Renders, in one cohesive page, the four existing analytics views as stacked `SectionCard`s:
  Executive Portfolio → NRR Waterfall → Stakeholder Radar → Retention Funnel.
- Refactor each `account.analytics.*.tsx` page body into a presentational sub-component (e.g. `<ExecutiveAnalyticsPanel />`) so both the old route and the new 360 view import it — no duplicated logic.

## 2. Rename "Rewrite with Q." → "Powered by Q"

`src/components/csfactors/BurningThree.tsx` line ~70. Keep the existing `Sparkles`/star icon and styling.

## 3. CS Factors Command Centre — new section under "Today's burning three"

Inserted into `src/routes/csfactors.tsx` between `<BurningThree>` and `<AnalyticsHeader>`. Three blocks, all built with existing `SectionCard` / `MetricCard` / accent tokens — no new visual language.

### A. The Reckoning Ledger
- Two `MetricCard`s side by side:
  - **Cumulative Value Realized** = `Σ direct_revenue + (time_saved_qty × hourly_multiplier)` (override wins when set). Accent = `accent`.
  - **QoQ Value Velocity** = % change vs prior quarter, with arrow + `ProgressGauge`. Accent = `secondary`.
- Header actions on the SectionCard: `[Log a Win]` (opens `LogWinDialog`) and `[Bulk CSV Ingestion]` (opens `IngestLedgerDialog`, mirrors existing `ImportCsvDialog` UX).

### B. Account & Competitor Radar — left column (5/12)
- Scrolling feed of `account_intelligence_signals` rows, newest first.
- Each row: severity badge (`HealthChip` reused — red for HIGH/risk, emerald for EXPANSION, secondary-accent for MEDIUM), account name, signal_type, one-line description, relative timestamp.
- Selecting a row sets local `selectedSignalId` → drives Action Engine.

### C. The Action Engine — right column (7/12)
- Dark-console framed editable `<textarea>` (uses existing `bg-card` + border tokens; "console aesthetic" = mono font + accent caret, no new colors).
- Template selection logic (hardcoded, deterministic):
  - signal_type contains "competitor" → **STATE A** template.
  - signal_type contains "promotion" / "executive_change" → **STATE B** template.
  - Anything else → a neutral fallback we'll add (e.g. renewal nudge) so the panel is never empty.
- Token substitution before render: `[Stakeholder First Name]`, `[Account Name]`, `[Insert Calculated Value]` (from Reckoning Ledger for that account), `[Insert Title]`, `[Magic Link URL]`.
- Footer buttons:
  - **Copy to Clipboard** — copies the rendered subject + body.
  - **Share Link** — calls `createShareLink` server fn that returns a mock 7-day signed payload `{ token, expires_at }` and copies a `/csfactors/share/<token>` URL to clipboard (route stub returns 410 for now; visible "MOCK" badge in toast).

Empty states: if no signal selected, panel shows a quiet prompt "Select a signal from the radar to generate a tailored outreach." in the same muted style as other CSFactors empty states.

## 4. Database (Supabase migration)

Five new tables, all **team-scoped** via `is_team_member(team_id, auth.uid())` (per your answer). Reuse `is_team_member` helper. New parallel `rl_accounts` table (per your answer) — keeps Reckoning Ledger isolated from existing `cs_accounts`.

```
rl_accounts            (id, team_id, owner_id, name, contract_value, current_roi, created_at, updated_at)
rl_stakeholders        (id, team_id, owner_id, account_id→rl_accounts, first_name, email, current_title, created_at)
rl_value_metrics       (id, team_id, owner_id, metric_name, hourly_multiplier, created_at)
                       seed: ("Time Saved", 150), ("Direct Revenue", 1)
rl_value_ledger        (id, team_id, owner_id, account_id, metric_type CHECK IN ('Time Saved','Direct Revenue'),
                        quantity_logged numeric, financial_value_override numeric NULL, logged_at, created_at)
rl_intelligence_signals(id, team_id, owner_id, account_id, signal_type, description, severity CHECK IN ('Low','Medium','High'),
                        status CHECK IN ('open','dismissed','actioned') default 'open', created_at)
```

All tables get:
- GRANT SELECT/INSERT/UPDATE/DELETE to `authenticated`, ALL to `service_role`.
- RLS enabled. Policies:
  - `team_member_read` — `is_team_member(team_id, auth.uid())`
  - `owner_write` — `owner_id = auth.uid() AND is_team_member(team_id, auth.uid())` (insert/update/delete)
- `updated_at` trigger where applicable.

Seed data on first load (per logged-in user with a team): if their team has zero rows, seed two demo accounts + 2 signals (Acme/competitor + Initech/promotion) so the UI is never blank during the demo.

## 5. Server functions

`src/lib/reckoning.functions.ts` (uses `requireSupabaseAuth`):
- `listLedgerSummary({ teamId })` — returns cumulative + QoQ velocity per account + portfolio totals.
- `logWin({ accountId, metricType, quantity, override? })`
- `bulkIngestLedger({ csvRows })`
- `listSignals({ teamId })`
- `listStakeholders({ accountId })`
- `createShareLink({ accountId, stakeholderId, signalId })` — returns mock signed payload, persists nothing yet.

All consumed via `useServerFn` + `useQuery` / `useMutation`, following the established CSFactors pattern.

## 6. What is explicitly NOT changing

- Global theme, fonts, accents, paddings — untouched anywhere outside `/csfactors`.
- No theme default flip — Parchment stays the default; the existing dark toggle still works.
- `/account/analytics/*` routes remain accessible.
- Existing CSFactors header, Ask Q dock, accounts matrix, Burning Three layout — unchanged except for the button label and the new section inserted below Burning Three.

## Technical notes

- `is_team_member` and `teams`/`team_members` already exist — reused as-is.
- All new UI uses only `--accent`, `--secondary-accent`, emerald, destructive (dashboard kit rule).
- New components live in `src/components/csfactors/reckoning/` (`ReckoningLedger.tsx`, `RadarFeed.tsx`, `ActionEngine.tsx`, `LogWinDialog.tsx`, `IngestLedgerDialog.tsx`).
- Templates A/B live as plain string constants in `src/lib/reckoning-templates.ts` — easy to edit later.
- Operator-tier gate already protects `/csfactors`; same gate covers the new section and `/csfactors/360`.
