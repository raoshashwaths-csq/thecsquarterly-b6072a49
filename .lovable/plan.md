# CSFactors Widget Mockup Sheets

Generate static mockup images only — no code changes. One composite sheet per widget, each showing 6 states laid out as a 3×2 grid (columns = Empty / Loading / Populated, rows = Dark / Light).

## Visual rules locked across every sheet

- **Corner radius:** 12px on all cards, panels, modals, drawers, badges, inputs
- **Buttons:** pill-shaped (fully rounded) for primary/secondary CTAs; 12px for icon buttons
- **Colors:** existing brand tokens only — Dark Navy `#1a1a1a` / midnight slate bg, Cream parchment for light, Gold accent (`#e0c58f`), Oxblood/crimson, Emerald, Teal
- **Typography:** Cormorant/Newsreader display, JetBrains Mono eyebrows, Source Serif body — matching current site
- **Hairline borders, paper grain background, mono eyebrow labels** stay intact
- **State conventions:** Empty = illustrated zero-state with rounded CTA; Loading = skeleton blocks with the same 12px radius shimmer; Populated = real-feeling data

## Widgets covered (10 composite sheets)

1. **KPI Strip** — NRR / GRR / Logo Churn / Portfolio Health four-card row with accent rails
2. **Burning Three** — at-risk account cards with avatar, ARR, days-to-renewal, escalation tag
3. **Reckoning Ledger** — timeline rail with timestamped entries (escalation, health, insight)
4. **Risk Heatmap** — 5×5 Impact × Likelihood grid with dot magnitude
5. **Trend Chart** — NRR/Health/Adoption/Risk multi-metric line chart with 30/90/180D toggle
6. **Accounts Grid** — 32-column matrix preview with sticky name/UCC, sentiment chips, sort
7. **Action Centre Panel** — task queue cards with priority, owner, due date
8. **Tagged Lumi Runs** — tagged AI assistant run cards with status pills
9. **Account Drawer** — right-side slide-over with stakeholder map, contract, timeline
10. **Workspace Pane** — full-screen workspace overlay with multi-panel layout

## Output

- 10 PNGs at 1600×1200 each, saved to `/mnt/documents/csfactors-mockups/`
- One overview contact sheet stitching all 10 widget thumbnails together for quick scanning
- Each sheet labeled with widget name + state grid headers

## Method

Use the `imagegen` tool (premium tier for legible UI text) with detailed prompts referencing the exact widget content, the locked design system tokens, and the 3×2 state grid layout. Inspect every generated sheet for clipped text / overlapping cards / wrong colors before delivering; regenerate any that fail QA.

## Not included

No code edits, no design token changes, no new components. Pure visual reference material to validate the 12px-rounded direction before any implementation.
