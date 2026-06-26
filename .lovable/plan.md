## Problem

The `StageRevealSection` renders `h-screen` with all three stages absolutely positioned and `opacity-0` until `phase >= 1`. Phase only advances on `wheel` events *after* the scroll-lock engages, and the lock only engages when the section's top is within ±4px of the viewport top. In practice the section flashes past during fast scrolls (or never reaches the exact pin point on certain viewports), so users see a tall blank slot where the stages should be. Reduced-motion / mobile users do see the stacked variant, which is why this only reproduces for desktop fine-pointer viewers.

Tier ordering itself is correct in `src/routes/index.tsx`:
- `stagesAtBottom = !sub.loading && sub.canAccessCSFactors`
- Visitors and Free Readers (`canAccessCSFactors === false`) → `<HomeStages />` renders under the hero (line 215).
- Practitioner+ → `<HomeStages />` renders below `OperatorTools`, above `ClosingCTA` (line 331).
- While `sub.loading` is true the bottom slot is suppressed but the top slot still renders, so the section is never *missing* — it is just visually blank because of the phase-0 bug.

## Fix

Rewrite the desktop branch of `StageRevealSection` so something is always visible, the scroll-lock is robust, and the composite still resolves:

1. **Initial phase = 1, not 0.** Stage 01 is visible the moment the section mounts; there is no blank state. `phaseRef` and `phase` both start at `1`. Progress dots show 4 segments; the first is filled by default.
2. **Lock via IntersectionObserver, not exact-top match.** When `>= 80%` of the section is in view and `phase < 4`, set `locked = true` and `document.body.style.overflow = "hidden"`. Release when `phase >= 4` (after the composite settles) or when the section leaves view.
3. **Bounded section height.** Replace the outer `h-screen` wrapper with `min-h-[640px] md:min-h-[720px]` plus `py-16 md:py-24` so the section is always shorter than the viewport and Intersection Observer can reliably hit the 80% threshold. The inner content keeps `min-h-[560px]` for the absolute-stack canvas.
4. **Wheel / key handlers unchanged in spirit** but read from the IO-managed `locked` flag. Add a `touchmove` handler with the same debounce so trackpad-pinch and touchscreens advance phases too. Esc, ArrowUp at phase 1, and `focusin` all release immediately (no keyboard trap).
5. **Safety net**: a `setTimeout(release, 6000)` armed when the lock first engages, so the page can never be wedged if a browser swallows the wheel event.
6. **Composite phase (4)** unchanged — staggered mocks + caption list. After unlock the section keeps the composite rendered (no flash back to the alternating layout).
7. **`prefers-reduced-motion` and mobile branches** unchanged — already render all three stages stacked vertically with no lock.

No changes to `src/routes/index.tsx` ordering, no DB or server work. Tier ordering already correct; verification is purely visual after the component fix.

## Verification

After the rewrite, drive Playwright headless against `localhost:8080` for three sessions:

1. **Visitor** (no auth) — load `/`, assert `StageRevealSection` is rendered between hero and the featured article (`getByRole('heading', { name: /practitioner managing thirty/i })` visible without scrolling past it), then wheel-scroll and confirm phases 2 → 3 → composite advance, then page unlocks and reaches the editorial grid.
2. **Free Reader** (managed Supabase session, no entitlement) — same expected layout as visitor.
3. **Practitioner+** (entitlement injected) — assert stages render *below* `OperatorTools` and *above* `ClosingCTA`; assert the under-hero slot is empty.

Each session captures three screenshots: initial (stage 01 visible — no blank slot), composite (all three mocks staggered), post-unlock (editorial visible). Console clean of errors, no body-overflow stuck after unmount.

## Files

- `src/components/home/StageRevealSection.tsx` — rewrite per items 1–6 above.

No other files change.