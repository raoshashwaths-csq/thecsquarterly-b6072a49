# Homepage flow redesign

Goal: hero → proof → product stages → editorial → CTA, with no orphan strips and no empty bands. Brand tokens, fonts, palette, and section copy all stay exactly as today. This is purely a composition + spacing + grouping pass on `src/routes/index.tsx`.Make sure its functional equalyy on mobile as well .

## What's wrong today

Measured page height ~11,600px. The flow currently is:

```
Hero headline + newsletter
   ↓ (mt-12)
4 destination cards (AI Readiness, CSFactors, Workspace, Canvas)
   ↓ ~96px
TierStrip (orphan band, low signal)
   ↓ ~96px
StickyScrollSection (3 stages × 100vh each = ~3 screens)
   ↓ mt-16 + hairline + py-16
Sections fill grid (5 section links)
   ↓ py-16 + hairline
[Recruiter-only OperatorTools, if shown]
   ↓
Featured article + sidebar pull-quote (py-20)
   ↓
Recent grid (pb-24)
   ↓
Footer
```

Problems:

1. Hero pads `pt-24 pb-12` then the card grid sits *inside* the header with another `mt-12`, so the first fold ends on whitespace before the cards.
2. TierStrip is a thin standalone band between the card grid and the sticky scroll — reads as filler.
3. The sticky scroll's three stages each take a full viewport and are followed by a hairline + 64px gap + another headline block, so scrolling feels like the page "restarts" twice.
4. SectionsFillGrid and the Featured article are separated by a hairline + 80px padding even though they're both "editorial discovery."
5. The page ends on a recent-articles grid with no CTA — the journey just stops.

## New flow

```
1. HERO (single fold)
   eyebrow · rotating headline · sub · newsletter / welcome
   tier chip row inline under the CTA  (TierStrip absorbed here, compact)

2. DESTINATION GRID (immediately under hero, no extra band)
   the 4 cards, tightened gap, kept as-is visually

3. PRODUCT STAGES (sticky scroll)
   reduce per-stage viewport from 100vh → 85vh
   remove the hairline + mt-16 after it; flow straight into the next section

4. EDITORIAL ROW  (merge sections grid + featured)
   left: SectionsFillGrid as a compact 5-tile rail (single section header)
   right / below: Featured article block, same column width
   one shared section header "Editorial", one bottom hairline

5. RECENT GRID  (kept, tighter top padding)

6. CLOSING CTA BAND  (new, replaces the dead-end ending)
   one full-width band: "Start free" + "See pricing" + newsletter inline for signed-out,
   "Open CSFactors" + "Open Workspace" for signed-in. Uses existing tokens, no new colors.

7. FOOTER
```

## Spacing rules applied throughout

- Section vertical rhythm collapses from `py-16` / `py-20` / `py-24` to a single `py-14` (desktop) / `py-10` (mobile) token.
- Remove the two standalone `h-px bg-border max-w-7xl` hairlines between sticky-scroll → sections → featured. Group boundaries are carried by the section eyebrow, not by a rule.
- Hero header drops `pb-12` → `pb-6`; destination grid drops `mt-12` → `mt-8`.
- TierStrip is no longer its own section; it renders as a single mono chip row inside the hero, right under the newsletter / welcome line.
- StickyScrollSection per-stage height: `100vh` → `85vh`, mobile already stacks so unchanged there.

## Technical changes (single file, plus 1 helper)

- `src/routes/index.tsx`
  - Remove the standalone `<TierStrip />` call between header and StickyScrollSection. Render a compact inline variant inside the hero `<header>` under the newsletter/welcome line.
  - Delete the two `h-px bg-border` hairline dividers (lines ~310 and ~329).
  - Wrap SectionsFillGrid + Featured article + sidebar pull-quote into one `<section>` with one shared eyebrow ("Editorial"), one bottom hairline. Pull-quote moves under the featured excerpt on mobile, stays in the right rail on desktop.
  - Normalize all section padding to `py-14 md:py-16`.
  - Append a new `<ClosingCTA />` block before `<SiteFooter />`.
- `src/components/shared/StickyScrollSection.tsx`
  - Change desktop stage height from `100vh` to `85vh` (single constant near the top). No API change.
- New `ClosingCTA` component inline in `index.tsx` (no new file needed): one centered band, mono eyebrow, two-line headline pulled from existing i18n keys where possible (or a single new key `home.closing.*` added to `src/locales/en/common.json`), and two buttons that branch on `useAuth().user`.

## Out of scope

- No palette, font, radius, or shadow changes.
- No copy rewrites beyond a small `home.closing.*` block for the new CTA.
- No changes to header, footer, sticky-scroll content, or destination card copy.
- No changes to other locales (they fall back to English for the new closing keys until translated).