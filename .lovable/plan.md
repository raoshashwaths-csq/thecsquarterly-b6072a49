## Goal

Ship an in-product enablement layer across the CS Command Centre and The CsQuarterly pages: a floating "Playbook" badge that opens a right-side drawer with route-aware Quick Tips, a searchable Feature Glossary, and an optional step-by-step guided tour. Premium feel, fully responsive, dismissible per-tip.

## Where it lives

- Mounted globally from `src/routes/__root.tsx` so it appears on every page, alongside the existing `<QAgentButton />`.
- Visibility rule: show on all `/csfactors*`, `/calculator`, `/benchmarks`, `/ai-readiness*`, `/retention-protocol`, `/account*`, and `/` (home). Hidden on auth screens (`/login`), checkout return, and raw API routes.
- The existing global Q button stays bottom-right; the new badge sits to its **left** (desktop) and **above** it (mobile) so the two never overlap.

## 1. Floating Playbook Badge (FAB)

- New component: `src/components/enablement/PlaybookBadge.tsx`.
- Round 48px button, glassmorphism (`backdrop-blur`, translucent `bg-card/70`, hairline `border-border`, soft `shadow-elegant`), subtle 2s pulsing ring using existing tokens (`--accent`).
- Icon: `Lightbulb` from lucide. Aria-label "Open Command Centre Playbook".
- Slight scale-on-hover (already in our button transition language). Respects `motion-reduce`.

## 2. Playbook & Quick Tips Drawer

- New component: `src/components/enablement/PlaybookDrawer.tsx`, built on existing `Sheet` (side="right"), width `sm:max-w-md`.
- Header: mono eyebrow "PLAYBOOK", display title "Command Centre Playbook & Quick Tips", short subtitle.
- Primary CTA row: **"Take a Quick Tour"** button (starts the tour, see §4) + secondary "Open Feature Glossary" button.
- Tabs (shadcn `Tabs`): **Quick Tips** (default) | **Glossary**.

### Quick Tips tab — route-aware

- Tip registry: `src/lib/enablement/tips.ts` exporting `TIPS: TipGroup[]` keyed by route matcher. Each tip: `{ id, title, body, cta?: { label, to } }`.
- `useRouteTips()` hook: reads `useRouterState().location.pathname` and returns the matching group (longest-prefix match, with `/` as fallback).
- Initial content per area:
  - `/` (home): CSF Box optimization tip + Workspace Selector tip.
  - `/csfactors`: how to read the CSF tiles, when to escalate.
  - `/csfactors/$accountId`: stakeholder map + contract vault hints.
  - `/benchmarks`: how to read NRR industry cohorts.
  - `/calculator`: simulate ideal contraction scenarios.
  - `/ai-readiness`: how to interpret the diagnostic score bands.
  - `/retention-protocol`: playbook navigation tip.
- Per-tip dismiss: checkbox **"Don't show this tip again"** persisted to `localStorage` under `enablement.dismissedTips` (a `Set<string>` of tip IDs). Dismissed tips are hidden but available via a footer link "Show all tips".
- Empty state: friendly message + link to glossary if no tips registered for the route.

### Glossary tab

- New component: `src/components/enablement/FeatureGlossary.tsx`.
- Live-filter `Input` at top (case-insensitive substring match across term + definition + tags).
- Results render as shadcn `Accordion` (single-open). Each item: term (display font), short executive definition, optional "Formula" block (mono), optional "Why it matters" line, optional `Link` to a deeper page (e.g. `/codex/<slug>` when relevant).
- Glossary registry: `src/lib/enablement/glossary.ts` (NEW — separate from existing `src/lib/glossary.ts`, which is the inline-tooltip acronym set). Seed entries:
  - **Net Retention Rate (NRR)** — formula + operational significance.
  - **Gross Retention Rate (GRR)** — difference from NRR.
  - **Critical Success Factors (CSF) Box** — what it tracks, why it sits on the homepage.
  - **AI Readiness Diagnostic** — framework for tech-stack maturity.
  - **Ask Q Engine** — how to prompt for analytics cuts.
  - **Time-to-Value (TTV)** — onboarding velocity.
  - Plus: True Health Index (THI), QBR/EBR, ROI Calculator, Workspace, CSQL.
- "No results" state with a CTA to ask Q instead (deep-links to opening the Q drawer with the search text prefilled — out of scope if wiring is heavy; fall back to a plain message).

### "Command Centre Feature Glossary" modal variant

- The glossary tab is the primary surface. We also expose the same `FeatureGlossary` component inside a `Dialog` triggered by the header button "Open Feature Glossary" for users who want a focused, larger modal view. Single source of truth for content.

## 3. Guided Tour

- New component: `src/components/enablement/PlaybookTour.tsx`.
- Lightweight, no new dep — uses shadcn `Popover` anchored to elements by `data-tour="step-id"` attributes; we add these attributes to the target elements:
  - `data-tour="workspace-icon"` on the Workspace icon on `/`.
  - `data-tour="csf-box"` on the CSFactors Command Centre card on `/`.
  - `data-tour="analytics-dropdown"` on the analytics nav entry in `CSFactorsSidebar`.
  - `data-tour="standalone-modules"` on the modules row (ROI calc / benchmarks / AI readiness).
  - `data-tour="ask-q"` on the `AskQInline` panel inside `/csfactors`.
- Tour state machine in a small `useTour()` hook: ordered step list, each with `{ id, route, title, body }`. On step change, the tour:
  1. Navigates to the step's route if not already there (via `useNavigate`).
  2. Waits one frame, finds the `data-tour` element, opens a `Popover` anchored to it with `Next`, `Skip`, `Finish` controls and a "Step X of Y" indicator.
  3. Scrolls element into view smoothly; falls back to a centered modal card if the target is missing.
- Completion / skip persisted to `localStorage` (`enablement.tourCompleted`). First-time users on `/csfactors` see a subtle one-shot toast suggesting the tour (only once).
- Motion: fade + 4px slide-in on each popover; `motion-reduce` disables.

## 4. Visibility & layout integration

- In `__root.tsx`, render `<PlaybookBadge />` (and its drawer) inside the same visibility guard used today for `<QAgentButton />`. Position: `fixed bottom-6 right-24` on desktop (Q button stays at `right-6`), `bottom-24 right-6` on mobile (stacked above Q).
- On `/csfactors` we already hide the global Q button — the Playbook badge stays visible there because CSFactors needs it most.

## 5. Persistence & state

- All state is client-side (`localStorage`); no schema changes.
- Keys: `enablement.dismissedTips`, `enablement.tourCompleted`, `enablement.tourSeenSuggestion`.
- A tiny `src/lib/enablement/storage.ts` wraps reads/writes with SSR-safe guards.

## 6. Responsive & a11y

- Drawer width clamps to full-width below `sm`. Tabs stay sticky at the top of the sheet on scroll.
- Glossary accordion items collapse cleanly on mobile; search input is `type="search"` with clear button.
- Tour popovers use `Popover` (already a11y-correct), and the FAB has visible focus ring (`ring-ring`).
- All copy uses semantic tokens (`text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`, `text-accent` for the eyebrow period treatment) — no raw hex.

## File map

New:

- `src/components/enablement/PlaybookBadge.tsx`
- `src/components/enablement/PlaybookDrawer.tsx`
- `src/components/enablement/FeatureGlossary.tsx`
- `src/components/enablement/PlaybookTour.tsx`
- `src/lib/enablement/tips.ts`
- `src/lib/enablement/glossary.ts`
- `src/lib/enablement/storage.ts`
- `src/hooks/useRouteTips.ts`
- `src/hooks/useTour.ts`

Edited (minimal, additive):

- `src/routes/__root.tsx` — mount badge + drawer + tour provider with visibility guard.
- `src/routes/index.tsx` — add `data-tour` attrs on Workspace icon + CSF box.
- `src/components/csfactors/CSFactorsSidebar.tsx` — `data-tour` on analytics nav.
- `src/routes/csfactors.tsx` — `data-tour` on standalone modules + Ask Q panel.

## Out of scope

- No backend changes, no new dependencies (uses existing shadcn `Sheet`, `Dialog`, `Tabs`, `Accordion`, `Popover`, `Input`, `Checkbox`, lucide icons, and current Tailwind animation utilities).
- Glossary content is the seed set above; we can grow it later from the same registry file without touching components.