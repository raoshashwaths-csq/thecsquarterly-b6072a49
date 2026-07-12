## Audit findings

**Bug 1 — "overlay on top of blurred headline".** There is no duplicate `<h1>` in `src/routes/index.tsx` — only `<HeadlineMorph />` is rendered in the hero (line 123). The blurred layer the user sees is HeadlineMorph's *own* `<h1>` in its initial state:

- On first render, `mounted = false`, so `isFinal = true` and the `<h1>` renders **sharp with the full Sunday headline**.
- The mount effect then flips `mounted = true` → `isFinal = false`, and the `<h1>` transitions to `opacity-0 blur-sm` over 500ms while the phrase overlay fades in on top of it.
- During that 500ms transition, the user sees the full Sunday headline blurring out underneath phrase 1. That is the "blurred headline behind an overlay" symptom — it is the same element, mid-transition, not a second element.

**Bug 2 — wrong-headline flash.** This is **CHECK B (SSR/client mismatch)**, specifically the two-phase `dayIndex` in `src/routes/index.tsx`:

```
const [dayIndex, setDayIndex] = useState(0);           // SSR + first client render = Sunday
useEffect(() => { setDayIndex(new Date().getDay()); }, []);  // then swaps to today
```

So SSR renders Sunday's headline; the browser hydrates with Sunday's headline; then the effect runs and swaps to today's headline, resetting the morph. The "different headline that flashes first" is always Sunday's.

CHECK C does not apply — the old `t("home.hero.rotations")` i18n rotation only feeds the sub-headline (`hero.sub`), not the `<h1>`.

## Fix plan

Two surgical changes, no rebuild, no animation/CSS/data changes.

### 1. `src/components/homepage/HeadlineMorph.tsx` — remove the pre-mount "final" flash

Change the initial visual state so nothing sharp renders before the morph starts. The `<h1>` still exists (SEO + reserved layout height), but it starts hidden and only becomes visible at stage 3.

- Drop the `isFinal = stage === 3 || !mounted` shortcut. Compute visibility from `stage` alone: `isFinal = stage === 3`.
- Keep the `mounted` gate only for starting the timers (so SSR doesn't try to `setTimeout`).
- For the reduced-motion branch, still set `stage = 3` immediately in the effect — reduced-motion users get an instant sharp headline with no animation, same as today.
- Net effect: SSR/first paint shows an invisible (opacity-0, blurred) `<h1>` with the phrase overlay layered on top rendering phrase 1. No sharp full-sentence flash, no visible blurred layer underneath.

The screen-reader `<span className="sr-only">{fullText}</span>` stays, so a11y is unchanged even during the morph.

### 2. `src/routes/index.tsx` — remove the Sunday→today swap

Replace the two-phase `dayIndex` state with a value that is stable across SSR and hydration. Use the route loader (already present) to compute the day server-side and pass it through, so SSR and the first client render agree.

- In the route's `loader`, compute `dayIndex = new Date().getUTCDay()` (UTC to avoid edge/server timezone drift) and return `{ dayIndex }` alongside the existing `ensureQueryData` call.
- In `HomePage`, read `dayIndex` from `Route.useLoaderData()` instead of `useState(0) + useEffect`.
- Delete the `useState`/`useEffect` pair for `dayIndex` and the `rotations`/`fallback`/`hero` block only insofar as `hero` still needs `dayIndex` — keep the i18n sub-headline logic, just source `dayIndex` from the loader.
- Result: SSR, hydration, and post-mount all render the same headline. No swap, no flash.

Using UTC means the "today" boundary rolls over at 00:00 UTC everywhere, which is acceptable for a weekly-cadence editorial site and is the standard fix for SSR date mismatches. If we later want viewer-local day, we'd need a cookie-based approach — out of scope for this bug fix.

### Verification

- Hard refresh homepage 3–4×: first visible text is phrase 1 of today's headline; no full-sentence flash; no blurred layer visible behind the phrases.
- DOM inspection: exactly one `<h1>` in the hero, plus the phrase overlay div only while `stage < 3`.
- Final state: sharp `<h1>` with the accent-colored `line2` span, zero residual blur/opacity.
- Reduced-motion: instant sharp headline, no animation, correct day.

### Files touched

- `src/components/homepage/HeadlineMorph.tsx` — 2-line change to `isFinal` derivation.
- `src/routes/index.tsx` — move `dayIndex` from `useState`/`useEffect` into the route `loader` + `useLoaderData`.

No changes to `src/data/homepageHeadlines.ts`, `src/styles.css`, keyframes, SVG goo filter, or timing constants.

Make sure these changes reflect cleanly on mobile as well 