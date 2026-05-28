## Goal

Reposition The CS Quarterly from "premium publication + AI tooling" to "CS operating platform with the industry's intelligence layer built in." Rebuild the pricing matrix into 7 tiers, align entitlements/Q caps, and persist the new positioning to project memory. No competitor names anywhere in copy.

## 1. Memory updates (permanent knowledge)

Add a new memory file `mem://product/positioning-v4` capturing:
- Category shift: publication → CS operating platform + intelligence layer.
- Three buyer narratives (individual practitioner / CS teams / enterprise) — paraphrased, no competitor names.
- Five-layer moat (data, intelligence, platform, community, brand).
- The full 7-tier matrix below as the canonical pricing source of truth.
- Conversion levers: Operator unlocks the personal CS dashboard; Team unlocks shared dashboard + admin; Scale unlocks branded benchmark PDF + SSO; Enterprise unlocks white-label + API; Strategic Partner is co-branded data partnership.

Update `mem://index.md` Core with a one-liner: "Pricing follows the 7-tier matrix in product/positioning-v4. Operator ($79) is the dashboard unlock; never bundle the dashboard into Practitioner. Never name competitors in marketing copy."

## 2. Tier matrix (canonical)

| # | Designation | Price | Seats | Q sessions / mo | Headline unlock |
|---|---|---|---|---|---|
| 1 | reader | $0 | 1 | 0 | Weekly briefings, Ledger ticker, AI Diagnostic score only |
| 2 | practitioner | $29 / $290 yr | 1 | 30 | Full library, all Codex playbooks, AI blueprint, Q advisor |
| 3 | operator | $79 / $790 yr | 1 | 100 | Personal CS dashboard + benchmark comparison tool |
| 4 | team | $599 / $5,990 yr | up to 8 | 400 shared | Shared team dashboard, admin analytics, learning paths, 2 job credits/qtr, SSO prep |
| 5 | scale | $1,499 / $14,990 yr | up to 20 | 1,000 shared | Advanced dashboard (cohort, heatmap), quarterly branded benchmark PDF, quarterly briefing call, SSO/SAML, 4 job credits/qtr |
| 6 | enterprise | $3,500 / mo | up to 50 | unlimited | White-label benchmark reports, Ledger API access, custom learning paths + certificates, dedicated community space |
| 7 | strategic_partner | $8,000 / mo (annual) | unlimited | unlimited | Co-branded Codex content, full Ledger API, event speaking slot, editorial footer logo |

Caps already wired in `src/lib/entitlements.ts` — verify and adjust the numbers above (currently practitioner=30, operator=100, team=400, scale=1000, enterprise/strategic=∞) — these already match, so no code change to caps.

## 3. `/pricing` route rebuild

Rewrite `src/routes/pricing.tsx` as an editorial pricing page using existing parchment design language:

- **Hero**: mono eyebrow "THE PLATFORM", display headline "An operating system for the customer success profession." Subhead reframing the category (publication → platform), no competitor mentions.
- **Three-narrative band**: 3 short cards (Individual practitioner / CS teams / Enterprise) with the displacement story rewritten without naming competitors ("legacy enterprise CS suites", "mid-market platforms", "spreadsheet-based workflows").
- **Tier grid**: 7 cards in two rows.
  - Row A (individual): Reader, Practitioner, Operator — 3 columns, Operator highlighted as "Most popular for senior ICs".
  - Row B (teams): Team, Scale, Enterprise — 3 columns, Scale highlighted.
  - Strategic Partner: full-width contact-sales card at the bottom (oxblood accent, "Talk to editorial" CTA → mailto).
- Each card: tier name (display serif), price (annual + monthly), seat cap, Q-session cap, 5–7 bullet features, CTA. CTAs:
  - Reader → `/login` ("Start free")
  - Practitioner / Operator / Team / Scale → `/subscribe?tier=<designation>` ("Upgrade")
  - Enterprise / Strategic Partner → `mailto:hello@thecsquarterly.com?subject=...` ("Talk to editorial")
- **Comparison strip**: dense table with rows = capability, columns = tiers, checkmark grid. Capabilities grouped: Editorial, Codex & Diagnostic, Q advisor, Dashboard, Benchmarks, Community, Job board, Admin & integrations.
- **Moat band** (below grid): 5 short blocks — Data / Intelligence / Platform / Community / Brand — written as principles, not boasts.
- **FAQ**: 4 items (billing cadence, downgrades, seat overages, dashboard onboarding time).

Design constraints: semantic tokens only, mono eyebrows, hairline `border-border` dividers, no new color tokens. Highlighted cards use `--accent` ring + soft gold dot.

## 4. `/subscribe` flow

`src/routes/subscribe.tsx` — accept `?tier=` query param matching one of the seven designations; show a confirmation card with the selected tier's price and the same feature bullets, then a single "Continue to checkout" CTA (stub — payments not wired in this change). Keep existing UI shell; just data-drive it from a shared `TIERS` constant.

## 5. Shared tier metadata

Create `src/lib/tiers.ts` exporting a single `TIERS` array of `{ designation, label, priceMonthly, priceAnnual, seatCap, qCap, tagline, features[], cta, highlight }`. Both `pricing.tsx` and `subscribe.tsx` consume it so the matrix stays in one place. `useEntitlements` keeps its current shape — the new file is presentation metadata, not entitlement logic.

## 6. Header / footer copy touch-ups

- Footer: change any "Subscribe to the briefing" CTA blurb that implies pure newsletter into "Read the briefing. Run the platform." (one-line edit in the footer component only if such copy exists).
- No header changes (Pricing/Subscribe stay out of the header per existing rule).

## 7. Out of scope

- Real Stripe/Paddle wiring, seat-pooling logic, SSO provisioning, Ledger API tokens, learning-path engine, white-label PDF renderer — all remain stubs / placeholders behind the existing tier gates.
- No changes to the Q drawer, CSFactors dashboard, or `/account/executive/analytics` gating — they already read from the same `designation` field this plan reinforces.
- No competitor names will appear in any committed copy.

## Files touched

- New: `src/lib/tiers.ts`, `mem://product/positioning-v4`
- Edited: `src/routes/pricing.tsx`, `src/routes/subscribe.tsx`, `mem://index.md`
- Optional: footer component (one-line copy tweak) if a stale "subscribe to the briefing" line exists.
