# Fix: 360 Dashboard looks like Pulse

## Diagnosis

`/csfactors` (Pulse) and `/csfactors/360` (360 Dashboard) feel like the same page because both follow the same shape: sidebar + back link + headline, a row of `MetricCard`s, a `SectionCard` with a short account list, then a grid of cards.

The original spec for the 360 Dashboard was to **stack all four analytics lenses inline** so the user reads the whole 360° in one scroll. The current 360 Dashboard only shows navigation cards that link back out to `/account/analytics/*`, which makes it a glorified link hub that mirrors Pulse's summary layout.

## Fix

Rebuild `/csfactors/360` so the 360 Dashboard actually consolidates the four analytics lenses inline.

### 1. Extract each analytics view into a presentational component

New folder `src/components/csfactors/threeSixty/`, one component per lens, each self-contained (own query, own loading / empty state, no page chrome, no tier gate):

```
NrrWaterfallView.tsx
RetentionFunnelView.tsx
StakeholderRadarView.tsx
TeamLeaderboardView.tsx
```

All four reuse the existing dashboard kit primitives (`MetricCard`, `SectionCard`, `ProgressGauge`, `HealthChip`, `RhythmBars`). No new tokens, fonts, or padding.

### 2. Rewrite `src/routes/csfactors.360.tsx` (the 360 Dashboard route)

- Editorial header: "Every lens, one page." — eyebrow reads `CSFactors / 360 Dashboard`.
- Sticky "Jump to" anchor strip: NRR · Retention · Stakeholders · Team.
- Four stacked `SectionCard`s, each rendering one of the new view components:
  1. `#nrr` — NRR Waterfall
  2. `#retention` — Retention Funnel
  3. `#stakeholders` — Stakeholder Radar
  4. `#team` — Team Leaderboard
- Each `SectionCard` gets a small "Standalone ↗" link in `actions` pointing to the corresponding `/account/analytics/*` route.
- No greeting, no Ask Q dock, no portfolio MetricGrid, no Master Account Matrix — those stay on Pulse.

### 3. Standalone analytics routes stay live, unchanged

`/account/analytics/nrr-waterfall`, `/retention-funnel`, `/stakeholder-radar`, `/team-leaderboard` keep working as today. (No refactor of those route files in this pass — the view components are net-new and the existing route files keep their current implementation. This avoids any risk to those pages.)

### 4. Clear visual distinction

| Surface | What it shows |
|---|---|
| Pulse (`/csfactors`) | Greeting, Ask Q, Burning Three, Command Centre, Account Matrix |
| 360 Dashboard (`/csfactors/360`) | NRR Waterfall + Retention Funnel + Stakeholder Radar + Team Leaderboard, stacked |

## Out of scope

- No changes to design tokens, fonts, padding, color palette, or theme default.
- No DB or server-function changes.
- No changes to Pulse beyond what already exists.
- No changes to the four standalone analytics routes.

## Files touched

- **New:** `src/components/csfactors/threeSixty/{NrrWaterfallView,RetentionFunnelView,StakeholderRadarView,TeamLeaderboardView}.tsx`
- **Rewrite:** `src/routes/csfactors.360.tsx`
