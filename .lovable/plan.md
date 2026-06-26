## Scope

Three changes, all visual/structural:

1. **StageRevealSection** — replace the overlapping absolute-positioned stack and the staggered composite end state with a clean alternating-fade entrance that resolves into a **horizontal scroll carousel** of three cards. No stacked composite, no right-side caption list.
2. **Tier ordering verification** — confirm Stage section + editorial render in correct order across hard refresh and client-side nav for visitor, Free Reader, and Practitioner+.
3. **LumiRouteLoader** — remove the animated rising "bubbles" and replace with a static cluster of use-case quotes (wrapped in inverted commas), no animation under the badge.

## Stage section redesign

Rewrite `src/components/home/StageRevealSection.tsx`:

- **Phase model collapses to 4 steps:** phase 1 → stage 01 card slides in from LEFT; phase 2 → stage 02 slides in from RIGHT (01 stays, moves left into row); phase 3 → stage 03 slides in from LEFT (02 stays); phase 4 → all three cards settle into a **horizontal scroll carousel** row, snap-aligned, scroll-lock released.
- **No absolute stacking.** Each card is a normal flow item from the start; opacity + translate-x drive the entrance. Cards never overlap — the absolute layering is gone.
- **End state = carousel:** `overflow-x-auto snap-x snap-mandatory` row, each card `min-w-[clamp(320px,80vw,520px)] snap-center`, with horizontal padding so first/last cards center. Native scrollbar hidden, custom hairline indicator below.
- **Card content unchanged** (eyebrow + headline + body + CTA + mock image inside one card). Mock is the upper third of each card; copy below.
- **Scroll lock:** IntersectionObserver-based (kept from current file, with the 6s safety net). Lock engages at ≥75% in-view, advances on wheel/touch/key through phases 1-3, releases at phase 4. After release the page scrolls normally and the carousel is interacted with via horizontal scroll, swipe, or arrow keys when focused.
- **Mobile / reduced-motion:** carousel is the default — three cards in a horizontally scrollable row from mount, no lock, no entrance gating.
- **Progress dots:** 3 segments only (one per stage), accent fill as each card enters.

## Tier ordering verification

`src/routes/index.tsx` already computes `stagesAtBottom = !sub.loading && sub.canAccessCSFactors`:
- Visitor / Free Reader → `canAccessCSFactors === false` → Stages render under hero (line 215).
- Practitioner+ → render below `OperatorTools`, above `ClosingCTA` (line 331).

Risk on hard refresh: `sub.loading` is true on first render, so `stagesAtBottom` is false → top slot renders → when entitlements resolve, `stagesAtBottom` flips true for paid users → top slot unmounts, bottom slot mounts. That's a flash, not a wrong-order bug.

**Fix:** while `sub.loading` is true, render *neither* slot. Once `sub.loading === false`, render exactly one. This guarantees stable ordering across hard refresh and client-side nav. Place a small `aria-hidden` skeleton spacer in the top slot during loading so layout doesn't jump.

**Verify with Playwright** (post-build): three sessions — anon, signed-in free, signed-in practitioner+ (session injected via `LOVABLE_BROWSER_SUPABASE_*`). For each:
- Load `/` cold (hard refresh): assert Stage section in the correct slot, no second instance elsewhere.
- Client-nav away to `/codex` and back: assert same slot, no duplicate mount.
- Screenshot proof at each step.

## LumiRouteLoader redesign

Edit `src/components/site/LumiRouteLoader.tsx`:

- Remove `.lumi-bubble-field` and `.lumi-bubble` markup; remove the rising animation entirely.
- Replace with a static centered cluster: pick **3 prompts** from `getLoaderPrompts(pathname)`, render each as a single `<blockquote>`-style line wrapped in typographic quotes (`"…"`), small mono-serif treatment, stacked vertically with `space-y-3`, faint border-l accent. No transforms, no animation delays, no per-prompt motion.
- Keep the pulsing badge and "Lumi is warming up…" label.
- Clean up the orphan CSS for `.lumi-bubble*` in `src/styles.css` (delete the keyframes + selectors).

## Files

- `src/components/home/StageRevealSection.tsx` — rewrite (carousel end state, no composite).
- `src/routes/index.tsx` — gate both stage slots on `!sub.loading`; add loading skeleton.
- `src/components/site/LumiRouteLoader.tsx` — replace bubble field with static quotes.
- `src/styles.css` — remove `.lumi-bubble*` rules + keyframes.

No DB, server, or auth changes. No new dependencies.

## Out of scope

- Changing the per-stage copy or mocks.
- Changing which posts feed the Recent grid (Lumi-seeded logic stays).
- Header / footer / hero edits.