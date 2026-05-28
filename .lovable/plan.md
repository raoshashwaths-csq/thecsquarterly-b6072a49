## Analytics dashboard templates — visual mockups

Four full-page mockups, each rendered as a 1600×1200 PNG in the CSQ editorial system (parchment bg, oxblood accent, patina gold secondary, Newsreader display, JetBrains Mono eyebrows). Each mockup composes the existing dashboard primitives — `MetricCard`, `SectionCard`, `ProgressGauge`, `HealthChip`, `RhythmBars` — so the eventual build is a layout exercise, not new component design.

Mockups will be saved under `/mnt/documents/analytics-templates/` and delivered as `<presentation-artifact>` tags so you can scroll through them inline.

### Template 1 — Retention Funnel
A cohort drop-off page for tracking customers stage-by-stage from onboarded → activated → expanded → renewed.

- Header band: greeting + cohort selector chip row (`Q1 '26`, `Q4 '25`, `Q3 '25`)
- 4 KPI cards across the top: Starting cohort ARR, Activation rate %, Mid-funnel survival %, Renewed ARR
- **Funnel block**: 5 horizontal bars in oxblood, each labeled with stage name (mono eyebrow), absolute count, and drop-off % vs prior stage in patina gold
- Side panel: "Where they leak" — 3 ranked reasons with `HealthChip`-style severity tags
- Bottom: stage-by-stage table (cohort, stage, count, conversion, median days-to-next)

### Template 2 — NRR Waterfall
The canonical waterfall: Starting ARR → + Expansion → − Contraction → − Churn = Ending ARR, with period-over-period comparison.

- Header: period toggle (`This quarter` / `Last quarter` / `TTM`)
- 3 KPI cards: Net Retention %, Gross Retention %, Net New ARR
- **Waterfall chart**: 5 vertical columns. Starting (neutral) → expansion (emerald, +) → contraction (gold, −) → churn (oxblood, −) → ending (neutral). Numeric callouts above each column, connector lines between
- Sub-grid: 2 `SectionCard`s side by side — "Top 5 expansions" and "Top 5 churns" with account name, ARR delta, CSM owner
- Footer strip: 8-quarter NRR trend in `RhythmBars`

### Template 3 — Stakeholder Health Radar
Multi-axis view of one account's relationship health — engagement, sentiment, executive coverage, product depth, tenure.

- Header: account picker + `HealthChip` showing composite score
- **Radar/pentagon chart** centered: 5 axes scored 0–100, plotted as a filled oxblood polygon over a parchment grid. The 5 axes use JetBrains Mono labels
- Right column: stakeholder roster — 6 contact cards with role, influence score (gauge), last-touched timestamp, sentiment dot (emerald/gold/oxblood)
- Below: 30-day interaction trace — sparkline of meetings, replies, ticket volume
- Bottom band: 3 "next moves" — Q-style recommendations as bordered tiles

### Template 4 — Team Performance Leaderboard
CSM-level comparison across an entire team's book of business.

- Header: scope toggle (`This week` / `This month` / `This quarter`) + team filter
- 4 KPI cards: Team NRR, Team QBR compliance, Total at-risk ARR, Avg health score
- **Leaderboard table** as the hero block: ranked rows for each CSM with avatar/initials, book ARR, accounts count, avg health (HealthChip), QBR compliance gauge inline, at-risk ARR, trend arrow vs last period
- Right rail: "Movers this week" — top 3 climbers and top 3 fallers as compact cards
- Bottom: 12-week team NRR trend in `RhythmBars`

### Generation approach
Each mockup is rendered with `imagegen` (premium tier for typographic legibility, since the editorial type matters here) using a prompt that locks the design system: cream parchment bg `#F4EFE2`, ink foreground, oxblood accent `#7A2E2E`, patina gold `#A57B2C`, Newsreader serif headlines, JetBrains Mono uppercase eyebrows at `tracking-[0.3em]`, hairline borders, generous whitespace, no purple/blue/teal.

### What happens next
After you pick which mockups to ship as real pages, build them as new routes under `/account/analytics/{slug}` using existing primitives. No new components needed; no backend changes — they all read from `listAccounts` (already in `csfactors.functions.ts`) plus any aggregations done client-side. Estimated build: ~1 route file per template, ~150–250 LOC each.

### Out of scope for this pass
- No new color tokens, no new chart libraries (radar + waterfall done in inline SVG to match the editorial aesthetic)
- No backend schema changes
- No edits to header/nav, CSFactors page, or existing dashboards
