## What the pricing cards do today

`TierCard` in `src/routes/pricing.tsx` uses the `.card-lift` utility defined in `src/styles.css`:

- 320ms `cubic-bezier(0.22, 0.61, 0.36, 1)` transition on `transform`, `box-shadow`, and `border-color`.
- On hover: `translate3d(0, -4px, 0)`, a soft layered shadow built from `--color-foreground` mixes, and a slightly darker border.
- Honors `prefers-reduced-motion` (no transform, no transition).
- No color/background changes — keeps brand tokens intact in light and dark.

This is the canonical "card/widget hover" we want everywhere.

## Goal

Apply the same hover treatment to every card/widget surface across the site without touching brand tokens, layout, spacing, or copy.

## Approach

Rather than hand-editing ~110 files, broaden `.card-lift` into a shared primitive and attach it everywhere via two mechanisms:

1. **Keep `.card-lift` as the explicit opt-in** (already used by pricing + lumi badge demo).
2. **Add an automatic application** for the two patterns that account for nearly every card in the codebase:
   - Dashboard primitives in `src/components/dashboard/` — `MetricCard`, `SectionCard`, `ProgressGauge`, `HealthChip` shells.
   - Editorial/article cards using the `border + bg-card` pattern.

   For these we'll add `card-lift` directly to the component shells (single edit per primitive, fans out everywhere they're used).
3. **Exclude surfaces where lift would hurt**: sticky nav, drawers/dialogs/sheets/popovers, paywall overlays, toast, MAP timeline rails, focused/active Lumi tree card (already has its own focus animation), and the `RunAccountTagger` dropdown card.

## Files to change

- `src/styles.css`
  - No change to `.card-lift` itself.
  - Add a sibling `.widget-lift` alias (identical rules) so dashboard primitives can use a semantically clearer name; both classes share one declaration block.
- `src/components/dashboard/MetricCard.tsx`, `SectionCard.tsx`, `ProgressGauge.tsx`, `HealthChip.tsx` — add `widget-lift` to root className.
- `src/components/csfactors/TaggedLumiRunsWidget.tsx` and the analytics lens widgets under `src/components/csfactors/` — append `widget-lift` to the outer card div.
- `src/routes/pricing.tsx` — no change (already uses `card-lift`).
- Editorial cards on:
  - `src/routes/index.tsx` (three buyer narrative cards, Closing CTA cards, dispatch teaser cards)
  - `src/routes/insights.index.tsx` (article list cards)
  - `src/routes/codex.index.tsx` (playbook + diagnostics tiles)
  - `src/routes/diagnostics.index.tsx` (diagnostic option cards)
  - `src/routes/vanguard.tsx`, `retention-protocol.tsx`, `outcome-forum.tsx` via the shared `SectionPage` card renderer
  - `src/components/site/RelatedIntelligencePanel.tsx` (three related items)
  - `src/components/site/ResumeRunPrompt.tsx`
  - `src/components/csfactors/AccountDrawer.tsx` inner stat cards (not the drawer chrome)
- Explicit no-touch list (call out in the diff): `SiteHeader`, `MobileNavDrawer`, dialogs/sheets/popovers, `Paywall`, toasts, sticky `smart-nav`, Lumi focus-mode active card.

## Verification

- Spot-check hover on: pricing tier card (baseline), `/csfactors` MetricCard, `/insights` article card, homepage buyer-narrative card, related-intelligence panel item.
- Confirm reduced-motion still disables the transform via the existing `@media (prefers-reduced-motion: reduce)` block (extend selector to include `.widget-lift`).
- Typecheck after edits.

## Out of scope

- No new color tokens, no shadow color changes, no layout/spacing edits.
- Buttons keep `.cta-lift`; we are not unifying buttons into card lift.
- No motion library changes (no Framer additions for this pass).
