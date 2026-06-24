## What's broken today

1. **Sidebar navigation regresses to Pulse.** `CSFactorsSidebar.tsx` renders every TOP_LINK as a raw `<a href>`. That triggers a full document reload, which on the published bundle re-runs the root layout — combined with the hash-anchor entries (`/csfactors#accounts`, `/csfactors#renewals`) sharing the same path as Pulse, the visual result is "everything snaps back to Pulse." MAP Engine, Action Centre, and 360 Dashboard each have real routes (`/csfactors/maps`, `/csfactors/ctas`, `/csfactors/360`) but never benefit from client-side routing.
2. **Analytics lenses are orphaned.** `NrrWaterfallView`, `RetentionFunnelView`, `StakeholderRadarView`, `TeamLeaderboardView`, and `account.executive.analytics` exist and are mounted on `/csfactors/360`, but the CSFactors sidebar has no entries pointing at the individual standalone lenses. From the user's POV they "disappeared" when the account section was reorganised.
3. **No staleness signal.** Widgets that haven't refreshed in over a week look identical to fresh ones, so users can't tell when the portfolio data underneath has gone cold.
4. **Widgets feel inert on hover.** No affordance that a card is a unit you can interact with.

## Redesign — scope and rules

- Brand tokens only (`--accent`, `--secondary-accent`, `--border`, `--card`, `--muted`, `--foreground`, emerald/destructive for health). No new colours.
- Original editorial layout preserved: same grid, same dashboard kit (`MetricCard`, `SectionCard`, `ProgressGauge`, `HealthChip`), same eyebrow/heading typography.
- Pure presentation + nav wiring. No business-logic changes.

### 1. Sidebar nav restructure (`src/components/csfactors/csfactorsNav.tsx` + `CSFactorsSidebar.tsx`)

Three labelled groups, all rendered as TanStack `<Link to>` (or hash-aware Link with `hash` prop) — never raw `<a href>`:

```text
COMMAND
  Pulse                /csfactors
  Action Centre        /csfactors/ctas
  Accounts             /csfactors#accounts
  Renewals             /csfactors#renewals

PLANNING
  MAP Engine           /csfactors/maps
  Playbooks            /csfactors  (existing standalone, kept)

ANALYTICS LENSES
  360 Dashboard        /csfactors/360                          (emphasised)
  Portfolio Command    /account/executive/analytics
  NRR Waterfall        /account/analytics/nrr-waterfall
  Retention Funnel     /account/analytics/retention-funnel
  Stakeholder Radar    /account/analytics/stakeholder-radar
  Team Leaderboard     /account/analytics/team-leaderboard

MODULES  (unchanged STANDALONE_LINKS — AI Readiness, ROI Calculator, NRR Benchmarks, Directory, Teams, Workspace)
```

Hash entries use `<Link to="/csfactors" hash="accounts">` so the route stays mounted and only the hash changes — no more full reloads.

`MobileNavDrawer` mirrors the same groups.

### 2. Stale-widget soft glow

New helper `src/components/dashboard/useFreshness.ts` exposing `useFreshness(updatedAt?: string | Date | null)` returning `{ stale: boolean, daysSince: number }`. Threshold: `> 7 days` or missing/null `updated_at`.

Add an optional `updatedAt` prop to `SectionCard` and `MetricCard`. When stale, the outer wrapper gains a `data-stale="true"` attribute and a `stale-glow` class. Glow defined once in `src/styles.css`:

```css
.stale-glow {
  box-shadow:
    0 0 0 1px color-mix(in oklab, var(--secondary-accent) 40%, transparent),
    0 0 24px -4px color-mix(in oklab, var(--secondary-accent) 35%, transparent);
  animation: stale-pulse 4s ease-in-out infinite;
}
@keyframes stale-pulse {
  0%, 100% { box-shadow: 0 0 0 1px color-mix(in oklab, var(--secondary-accent) 30%, transparent),
                        0 0 18px -4px color-mix(in oklab, var(--secondary-accent) 25%, transparent); }
  50%      { box-shadow: 0 0 0 1px color-mix(in oklab, var(--secondary-accent) 50%, transparent),
                        0 0 28px -4px color-mix(in oklab, var(--secondary-accent) 45%, transparent); }
}
@media (prefers-reduced-motion: reduce) { .stale-glow { animation: none; } }
```

A tiny mono tooltip pill in the card's top-right: `STALE · {n}D` (uses `--secondary-accent` text, transparent bg). No layout shift.

Widgets wired with `updatedAt`:
- Pulse Dashboard cards (Reckoning Ledger, Risk Heatmap, Pulse Header summary)
- `BurningThree`, `AnalyticsHeader`, Master Account Matrix on `/csfactors/360`
- Each lens section on `/csfactors/360` (NRR / Retention / Stakeholder / Team) — `updatedAt` derived from the freshest underlying account row (`max(updated_at)` from accounts), since these views are read-models of the portfolio
- `TaggedLumiRunsWidget` (uses latest `tagged_at`)
- Action Centre list (latest CTA `updated_at`)

Source of `updatedAt`: existing `accounts.updated_at`, `q_runs.tagged_at`, `ctas.updated_at`. No schema changes.

### 3. Hover lift (every CSFactors widget)

In `SectionCard` and `MetricCard` outer wrapper add:

```text
transition: transform 220ms ease, box-shadow 220ms ease;
hover: translateY(-2px) scale(1.005);
```

No colour or border change. Combines cleanly with the stale glow (transform + box-shadow are independent). Disabled under `prefers-reduced-motion`.

### 4. `/csfactors/360` polish

- Keep the existing five-section layout. Each `SectionCard` receives the derived `updatedAt` so the same hover/glow rules apply.
- Add a small "Last refreshed" mono caption under each lens heading using the same value, so the glow has a visible cause.

## Files touched

- `src/components/csfactors/csfactorsNav.tsx` — regrouped link arrays.
- `src/components/csfactors/CSFactorsSidebar.tsx` — `<Link>` + group rendering + active-state logic for hash links.
- `src/components/csfactors/MobileNavDrawer.tsx` — mirror groups.
- `src/components/dashboard/SectionCard.tsx` — `updatedAt` prop, hover + stale wrapper, stale pill.
- `src/components/dashboard/MetricCard.tsx` — same.
- `src/components/dashboard/useFreshness.ts` — new tiny hook.
- `src/styles.css` — `.stale-glow`, `@keyframes stale-pulse`, hover transition utility class.
- `src/routes/csfactors.tsx`, `src/routes/csfactors.360.tsx`, `src/routes/csfactors.ctas.tsx`, `src/components/csfactors/pulse/*`, `src/components/csfactors/TaggedLumiRunsWidget.tsx`, `src/components/csfactors/ctas/ActionCentrePanel.tsx` — pass `updatedAt` through.

## Out of scope

- No changes to colours, fonts, spacing scale, or copy beyond the new "Last refreshed" caption.
- No new data, no new tables, no new server functions.
- No changes to `/account/analytics/*` route files themselves — only re-exposing them from the CSFactors sidebar.

## Open question

The four analytics lenses currently live at `/account/analytics/*`. Plan above keeps them there and links to them from the CSFactors sidebar. **Confirm** that's preferred, vs. mirroring them under `/csfactors/analytics/*` (would require new route files that re-export the same view components). I recommend keeping the `/account/analytics/*` URLs as the canonical home and just linking — zero duplication, no SEO split.
