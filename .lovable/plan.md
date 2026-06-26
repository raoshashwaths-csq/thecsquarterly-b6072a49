## Goal

1. Remove the Stage 01/02/03 reveal entirely from the homepage (`/`).
2. Show it on `/csfactors` only for visitors and signed-in users who don't have CSFactors access (currently: below Operator).
3. Restore `StageRevealSection` to the original sticky-scroll-container behavior we had before today's carousel rewrite.

## 1. Homepage — remove the stages

File: `src/routes/index.tsx`

- Drop the import of `StageRevealSection`.
- Delete `stagesAtTop` / `stagesAtBottom`, both render slots (lines ~215 and ~333), the loading-state skeleton spacer, and the `HomeStages` / `StageCta` / `StageMock` helper functions plus their imports (icons, `useFeatureGate`, mock assets that are only used by them).
- Leave the rest of the homepage (hero, editorial grid, OperatorTools, ClosingCTA, etc.) in its current order, unchanged.

## 2. CSFactors — gate non-access users to a landing page

File: `src/routes/csfactors.tsx`

Today the route shows `TierGateOverlay` to anyone below Operator and a sign-in nudge to anonymous users. Replace both of those branches with a single `<CSFactorsLanding />` component so visitors **and** below-tier signed-in users get the same marketing surface.

Gating rule (matches Core memory: "CSFactors gates at Practitioner+"):

- `!user` → landing
- signed in but `rank[designation] < rank.practitioner` → landing
- otherwise → existing command center

The landing page (new file `src/components/csfactors/CSFactorsLanding.tsx`) renders:

1. CSFactors logo + headline + sub (short editorial intro pulled from the existing route metadata).
2. `<StageRevealSection stages={[...]} />` — same three stages content as currently defined in `HomeStages`, moved into this file.
3. A single primary CTA row: "Start free → /pricing" for visitors, "Upgrade to Practitioner → /pricing" for below-tier signed-in users.
4. "Back to The CS Quarterly" link (kept).  
  
5.Brief insight  cards into the headline feature set of the cs factors dashboard(Lumi Possibilities ,Burning Three ,Mutual Action Plan etc  beneath the stages surfaced with a afde up after stage reveal animation is completed and user scrolls further down .  


Forces dark theme (already done at route level via the `useMemo` document.documentElement add). No sidebar, no workspace, no Lumi drawer — the landing renders before `LumiDrawerProvider`'s consumers are needed (move `LumiDrawerProvider` so it only wraps the authenticated command center, not the landing).

## 3. StageRevealSection — restore the original sticky scroll container

File: `src/components/home/StageRevealSection.tsx` (full rewrite back to the pre-today shape)

End-state visual restored:

- Outer wrapper: `relative` section with internal scroll spacer `h-[300vh]` (3 phases × viewport).
- Inner: `sticky top-0 h-screen` container holding a two-column grid — left = stacked stage cards layered on top of each other, right = vertical list of three captions/CTAs that highlight as their stage activates.
- Scroll progress (via `useScroll` + `useTransform` from framer-motion, or a plain scroll listener reading `getBoundingClientRect()` against the sticky parent) maps section progress 0→1 into phases 1/2/3.
- Cards cross-fade and translate-up `8px → 0`; previous card drops to `opacity-0` + `pointer-events-none` (stacked, not laid out side-by-side).
- Right-side caption list: each row gets `data-active` styling (accent border-left, brighter text) when its stage is active; clicking a row jumps the page scroll to that phase's offset.
- Progress rail: thin vertical hairline on the far left of the sticky container with 3 dots; active dot filled with `--accent`.
- Mobile / reduced-motion fallback: render the three stages as a normal vertical stack (no sticky, no scroll lock) — same fallback we had originally.

Explicitly **not** doing:

- No horizontal `snap-x` carousel end state.
- No `IntersectionObserver` scroll lock, no `document.body.style.overflow = "hidden"`, no wheel/key/touch interception, no 6s safety net.
- No alternating left/right slide-in entrance choreography.

Props stay the same: `stages: [StageItem, StageItem, StageItem]` with `label`, `caption`, `mock`, so the call site in `CSFactorsLanding.tsx` doesn't need a different shape.

## Files touched

- `src/routes/index.tsx` — remove stages block + helpers + imports.
- `src/routes/csfactors.tsx` — replace TierGateOverlay + signed-out nudge with `<CSFactorsLanding />`; narrow `LumiDrawerProvider` scope.
- `src/components/csfactors/CSFactorsLanding.tsx` — new; owns stage content + CTA.
- `src/components/home/StageRevealSection.tsx` — rewrite to original sticky-scroll container shape.

## Out of scope

Per-stage copy, mocks, pricing matrix, the route's authenticated command center, and the Lumi loader / loader-prompts changes from earlier today (those stay as they are).