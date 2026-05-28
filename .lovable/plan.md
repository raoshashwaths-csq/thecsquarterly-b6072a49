## 1. Promote the AI Readiness Audit on the home page

Today the AI Readiness Audit lives only in the sidebar of the featured essay (`src/routes/index.tsx`, the dark "2026 AI Readiness Audit" block inside the `<aside>`). It needs to become a primary hero CTA.

**New "AI Readiness Audit" card component** — built inline in `src/routes/index.tsx` (same visual language as the CSF card, but distinct so it doesn't read as a duplicate):

- Left rail color: `border-l-4 border-l-secondary-accent` (gold) to differentiate from CSF (oxblood).
- Badge tile: gold `bg-secondary-accent` with `AR` monogram (matching the CSF "CSF" tile).
- Eyebrow: `AI READINESS · DIAGNOSTIC`.
- Title: `Benchmark your CS org in 5 minutes`.
- Body: "11 dimensions, 44 metrics. See where you sit between Reactive, Operational and Predictive — and what to fix first."
- CTA line: `Take the free diagnostic →` linking to `/ai-readiness`.
- `data-tour="ai-readiness-box"` for the tour registry.

**Placement rules** (both logged-in and logged-out share the same vertical order, only the slot above differs):

- Logged-out users: `Hero copy → NewsletterInline → AI Readiness card → CSF Command Centre card → Workspace anchor`.
- Logged-in users: `Hero copy → "Welcome back" line → AI Readiness card → CSF Command Centre card → Workspace anchor`.

This satisfies "between the executive-email field and the CSF dashboard button" for first-time visitors, and keeps a consistent stack for returning members.

**Remove the duplicate** AI Readiness promo from the featured-article `<aside>` so we don't repeat the CTA twice on the same page. The aside keeps only "The Thesis" pull-quote.

## 2. Q hints on the home page

Two pieces:

**2a. Tip registry additions** in `src/lib/enablement/tips.ts`, `/` group:

- `home-ai-readiness` — title "Start with the diagnostic", body explains what the audit reveals (current band, weakest of the 11 dimensions, the one fix that moves the band), CTA → `/ai-readiness`.
- One tip per section card: Vanguard, Retention Protocol, Outcome Forum, Codex, Diagnostic — each one sentence on what the section is for and when to open it. These power the Quick Tips panel inside Q for `/`.

**2b. Inline Q hint chips on the home page cards.** A small reusable presentational component `src/components/site/QHint.tsx`:

- Renders a `<QMark />` glyph + a one-line hint in `font-mono text-xs uppercase tracking-[0.22em]` under the card body.
- Pure presentation, no Q state, no drawer wiring (keeps the home page server-renderable and avoids re-render churn).
- Variant: `inline` (under card body) and `floating` (top-right of a section card).

Wire one hint to:
- **AI Readiness card** — "Q: the 5-min audit pinpoints your weakest of 11 dimensions."
- **CSF Command Centre card** — "Q: your daily operator console — start here every morning."
- **Workspace anchor** — "Q: notes you drop here sharpen every answer Q gives you."
- **Each of the 5 section cards** — one-line Q hint matching the new tip text, rendered as `floating` so it sits in the card's top-right and doesn't push layout.

All copy is fixed strings sourced from the tip registry so Quick Tips inside Q and the inline chips stay in sync.

## 3. Mobile layout shift / glitch between pages

Root causes I've confirmed in the codebase:

1. `useSmartNav` (`src/hooks/useSmartNav.ts`) toggles `smart-nav-hidden` (`transform: translate3d(0,-110%,0)`) on every scroll-down. On mobile, momentum scrolling fires this repeatedly during route transitions, so the header pops in/out while the new route's `animate-fade-up` content is mounting — reads as a "glitch".
2. The home page applies `animate-fade-up` to the hero `<header>`, the sections strip, and the featured `<main>` simultaneously, each ~600ms with staggered delays. On a 400px viewport with the smart-nav animating, all four transforms run together.
3. No scroll reset on route change, so navigating back to `/` lands mid-page and immediately triggers the hide-header path.

**Fixes:**

- **Disable hide-on-scroll under `md` (768px).** In `useSmartNav`, gate the `visible=false` branch behind `window.matchMedia("(min-width: 768px)").matches`. Mobile keeps `scrolled` (frost) behavior but the header never translates off-screen. This single change eliminates the dominant cause.
- **Pin the hero block height on mobile** by removing `animate-fade-up` from the hero `<header>` on `<md` (keep on desktop via a `md:animate-fade-up` swap). Hero content is above the fold and doesn't need an entrance animation on small screens — the fade is what visibly "jumps" when the smart-nav also moves.
- **Add a scroll-to-top on route change** in `src/routes/__root.tsx` using TanStack's `useRouterState` to watch `location.pathname` and call `window.scrollTo({ top: 0 })` synchronously in a `useLayoutEffect`. Prevents landing mid-page and re-triggering the nav-hide.
- **Stabilize the section-card grid on mobile**: current grid uses `gap-5` with cards that have a top hairline absolutely positioned at `left-6 right-6`. With the new floating Q-hint chip added, switch the section card to `relative pt-8` and place the chip inside normal flow (top-right via `absolute top-2 right-3`) so it doesn't change card height between paint passes.

## 4. Files touched

- `src/routes/index.tsx` — reorder the hero stack; add AI Readiness card; remove duplicate aside promo; mount `QHint` on cards; swap `animate-fade-up` → `md:animate-fade-up` on the hero block.
- `src/components/site/QHint.tsx` — new presentational component.
- `src/lib/enablement/tips.ts` — add `home-ai-readiness` and one tip per section card in the `/` group.
- `src/hooks/useSmartNav.ts` — gate hide-on-scroll behind `min-width: 768px`.
- `src/routes/__root.tsx` — `useLayoutEffect` scroll-to-top on pathname change.

## 5. Out of scope (call out before building)

- No backend changes, no new server functions, no schema migrations.
- No change to the Q drawer itself — these are passive hint chips, not new Q actions.
- No change to the CSF Command Centre card copy or destination.
- No header / nav reorganization beyond the mobile hide-on-scroll gate.

## 6. Open question

The AI Readiness card on the home page: should it stay visible to **already-subscribed Vanguard members** too, or should it collapse to a thinner "Re-take the diagnostic →" line once a user has taken the audit at least once? Default in this plan is "always visible, same card for everyone" — confirm or override before I build.
