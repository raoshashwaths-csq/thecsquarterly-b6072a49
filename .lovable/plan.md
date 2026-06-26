## Goal

Two related fixes:

1. **Stop the replayed entry animation on navigation.** Today `<div key={pathname} className="page-enter">` in `src/routes/__root.tsx` plus the `.page-enter` keyframes in `src/styles.css` make every route mount replay a 400ms fade + 20px upward drift. On heavy routes (e.g. clicking the CSFactors card from the homepage), the old route stays visible while data loads, then the new route mounts and replays its entry — which reads as "the homepage animation runs again before navigating."

2. **Give heavy routes a branded loading state.** A pulsing Lumi badge with use-case "bubbles" floating up beneath it, so the wait feels intentional and on-brand instead of dead.

---

## 1 · Replace the page-enter animation with a 150ms cross-fade

**File: `src/styles.css`** — replace the `.page-enter` rule (~line 275–280) and its `prefers-reduced-motion` override (~line 441):

```css
@keyframes page-enter {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.page-enter {
  animation: page-enter 150ms ease-out both;
}
```

Leave the `.page-enter h1 / h2` headline reveal rules untouched — they were already scoped to the first render only via CSS `animation-fill-mode: both` and don't replay unless the wrapper re-keys.

**File: `src/routes/__root.tsx`** — `PageTransition` keeps `key={pathname}` (so the wrapper still remounts), but the visual is now a pure 150ms opacity fade. No drift, no headline replay, no perceived "redo."

This is a one-line CSS change; no component refactor needed.

---

## 2 · Lumi loading state for heavy routes

### 2a · Router wiring

**File: `src/router.tsx`** — add a default pending component + thresholds so brief navigations stay instant and only genuinely slow ones see the loader:

```ts
defaultPendingComponent: LumiRouteLoader,
defaultPendingMs: 250,        // wait 250ms before showing
defaultPendingMinMs: 600,     // once shown, hold ≥600ms so it doesn't flash
```

Routes that aren't heavy already resolve in <250ms and never trigger it. For the known-heavy list we explicitly set `pendingComponent: LumiRouteLoader` on the route file so the loader is guaranteed (even when the data is warm-but-not-instant):

- `src/routes/csfactors.tsx`
- `src/routes/csfactors.$accountId.tsx`
- `src/routes/csfactors.360.tsx`
- `src/routes/csfactors.maps.$id.tsx`
- `src/routes/codex.$slug.tsx`
- `src/routes/account.analytics.index.tsx` + the three analytics children
- `src/routes/admin.control-panel.tsx`
- `src/routes/benchmarks.tsx`
- `src/routes/retention-protocol.tsx`

Other routes inherit the default and only show the loader if they actually exceed 250ms.

### 2b · New component: `src/components/site/LumiRouteLoader.tsx`

A centered overlay (full-bleed, `bg-background/80 backdrop-blur-sm`, fixed inset-0, z below the global Lumi button) with:

- **Lumi badge** — reuse the existing `lumi-mark.png` / `lumi-badge-light.png` assets. Hexagonal mark, ~96px, with a pulsing gold ring + soft glow.
- **Pulse animation** — two new keyframes in `styles.css`:
  - `lumi-pulse` (1.6s ease-in-out infinite) — scales the badge 1.0 → 1.04 → 1.0.
  - `lumi-glow` (2.4s ease-in-out infinite) — animates an `::after` ring's box-shadow opacity between 0.2 and 0.55 using `--secondary-accent` (gold).
- **Eyebrow line** under the badge: mono uppercase 11px, `text-secondary-accent` — "LUMI IS WARMING UP…".
- **Bubble field** beneath, height ~140px, relative-positioned. 4–6 bubble pills rising from the bottom with `lumi-bubble` keyframe (translateY 0 → −120px, opacity 0 → 1 → 0, scale 0.9 → 1, staggered `animation-delay` 0s / 0.4s / 0.8s / 1.2s / 1.6s, looped 6s).
- Bubbles are small rounded-full pills, `border border-secondary-accent/40`, `bg-secondary-accent/5`, `font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/80`, padding `px-3 py-1.5`.
- Respects `prefers-reduced-motion`: badge pulse off, bubbles fade in-place instead of rising.

### 2c · Bubble content — pull from existing Lumi briefings/tips

**File: `src/hooks/useRouteTips.ts`** — already exposes a route-prefix → `Tip[]` registry. Add a thin selector helper (no new data source):

```ts
export function getLoaderPrompts(pathname: string): string[] {
  // Find longest-matching TipGroup, return its tips' titles
  // (titles are already 4–8 words, ideal bubble copy).
  // Fallback to a small universal set if no match.
}
```

`LumiRouteLoader` consumes `getLoaderPrompts(useRouterState(...).location.pathname)`. Examples that will surface for free from the existing registry:

- `/csfactors/...` → "Map the stakeholder web first", "Pin the contract vault"
- `/csfactors` → "Read the CSF tiles top-down", "The Burning Three rule", "Talk to Q in plain English"
- `/calculator` → existing calculator tips
- Fallback (unknown route): "Ask about churn risk", "Draft a QBR outline", "Score this account's health", "Find a playbook"

No new content authoring required — the registry is already curated.

---

## Technical details

```text
src/styles.css                              ← shorten .page-enter to 150ms opacity-only
                                            ← add @keyframes lumi-pulse, lumi-glow, lumi-bubble
                                            ← add prefers-reduced-motion overrides for each
src/components/site/LumiRouteLoader.tsx     ← NEW: overlay, pulsing badge, bubble field
src/hooks/useRouteTips.ts                   ← add getLoaderPrompts(pathname) selector
src/router.tsx                              ← defaultPendingComponent / Ms / MinMs
src/routes/csfactors.tsx                    ← pendingComponent: LumiRouteLoader
src/routes/csfactors.$accountId.tsx         ← idem
src/routes/csfactors.360.tsx                ← idem
src/routes/csfactors.maps.$id.tsx           ← idem
src/routes/codex.$slug.tsx                  ← idem
src/routes/account.analytics.index.tsx      ← idem
src/routes/account.analytics.nrr-waterfall.tsx
src/routes/account.analytics.retention-funnel.tsx
src/routes/account.analytics.stakeholder-radar.tsx
src/routes/admin.control-panel.tsx          ← idem
src/routes/benchmarks.tsx                   ← idem
src/routes/retention-protocol.tsx           ← idem
```

Tokens used: `--background`, `--foreground`, `--accent`, `--secondary-accent`, `--border`. No new color tokens, no hex values.

Verification:
- `tsgo --noEmit` clean.
- Click CSFactors card on home → no homepage replay; brief 150ms cross-fade; Lumi loader appears within ~250ms with bubble prompts while the CSFactors loader resolves.
- Click a fast route (e.g. `/about`) → instant, no loader, single 150ms fade.
- Toggle `prefers-reduced-motion: reduce` → loader still appears but without pulse/rise; cross-fade collapses to instant (existing `.page-enter { animation: none }` rule).
