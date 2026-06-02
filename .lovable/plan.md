
## Scope

Refine the existing CSFactors Pulse dashboard to match `csq-mockup-pulse-dark.png` pixel-for-pixel, complete the Q → Lumi rebrand using the uploaded lighthouse mark, and wire the Ask Lumi slide-out drawer with ledger-driven context. Data values stay frozen.

## 1. Lumi brand asset

- Upload `IMG_20260531_020324-2.png` via `lovable-assets` → `src/assets/lumi-mark.png.asset.json`.
- New `src/components/site/LumiMark.tsx`:
  - Props: `variant: "emblem" | "lockup"`, `size`, `animated`, `className`.
  - `emblem` = lighthouse only (cropped via CSS `object-position` or a pre-cropped emblem-only asset). `lockup` = emblem + serif "Lumi" wordmark (font-display, gold).
  - Built-in beam/star/lantern animation hooks toggled by `animated` + parent `data-state="active"`.
- Replace every `<QMark />` usage with `<LumiMark variant="emblem" />` (inline) or `<LumiMark variant="lockup" />` (hero spots). Keep `QMark.tsx` as a one-line re-export shim during this pass to avoid churn — delete in a follow-up.
- Copy sweep: "Ask Q" → "Ask Lumi", "Powered by Q" → "Powered by Lumi", "Q Insight" → "Lumi Insight", tooltips, aria-labels, toasts, suggested vectors header.

## 2. Lighthouse activation animation

In `src/styles.css` add keyframes + utilities (semantic only, no hex in components):

```text
@keyframes lumi-beam   { 0% { transform: rotate(-30deg) } 100% { transform: rotate(30deg) } }
@keyframes lumi-twinkle{ 0%,100% { opacity:.4 } 50% { opacity:1 } }
@keyframes lumi-lantern{ 0%,100% { opacity:.5 } 50% { opacity:1; filter: blur(6px) } }
```

- `.lumi-beam` — absolute conic-gradient overlay, masked to lantern origin, 2.4s ease-in-out infinite alternate, gated by `data-state="hover"|"active"`.
- `.lumi-star` (×3) — staggered 1.8s/2.4s/3.0s delays.
- `.lumi-lantern` — radial blur pulse on drawer open.
- Reduced-motion: `@media (prefers-reduced-motion)` disables all three.

## 3. Top utility bar — Ask Lumi trigger

In `src/routes/csfactors.tsx` header zone (next to Import CSV / + Add Account):

- New `AskLumiTrigger` button — flat (radius 0), 1px gold hairline (`border-accent`), 36px height, gold text. Embeds `<LumiMark variant="emblem" size={18} animated />` left of "Ask Lumi".
- Click → opens the new Ask Lumi drawer with no preset context.
- Hover → beam sweep + lantern pulse activate.

## 4. Ask Lumi drawer (slide-out copilot)

New `src/components/csfactors/AskLumiDrawer.tsx`:

- 420px fixed right slide-out, `ease-out` 240ms; backdrop `bg-foreground/40 backdrop-blur-sm`.
- Header: lockup logo left, "[ Close ]" mono text trigger right.
- Body sections:
  - Context briefing card (rendered when invoked from a ledger row) — dark card, gold hairline top, mono eyebrow "Lumi Insight · <event time>", serif headline, body summary, "Open account →" link.
  - Composer (textarea + send) wired to the existing `askQ` server function (reused as-is; rename in copy only).
- State managed by a new `LumiDrawerContext` (`src/components/csfactors/LumiDrawerContext.tsx`) exposing `open(briefing?)` / `close()`. Provider mounted in `csfactors.tsx`.
- Replaces the legacy `QAgentDrawer` slot on CSFactors only; site-wide `QAgentButton` is untouched.
- Reuses existing `useElevenLabsSpeechInput` hook for dictation.

## 5. Reckoning Ledger interactivity

`src/components/csfactors/pulse/ReckoningLedger.tsx`:

- Convert each event row to a `<button>` with full-width hit target.
- Fix timeline rail: move rail to `left: 11px` and center each `8px` dot via `translate-x-[-50%] left-[11px]`; rows use `pl-7` so text never crosses the rail.
- onClick → `lumiDrawer.open({ kind: "ledger", event, account })` builds a briefing payload from the event (escalation/usage drop/health change → templated runbook copy).
- Briefing renderer: a small `buildLedgerBriefing(event, account)` pure function in `src/lib/lumi-briefings.ts` returning `{ eyebrow, headline, body, accountId }`.

## 6. Burning Three — populate third card

`deriveBurningThree` in `src/lib/csfactors.functions.ts` currently returns up to 3 but seeds only 2 entries with content; add a third `info`-accent slot ("Renewal upcoming") derived from the soonest `renewal_date` in the next 60 days. For demo (seed) data, ensure `pulseSeed.ts` has at least one account with a renewal in that window so the third card renders (TechCore Q2-2027 already qualifies — verify and adjust contract date if needed).

## 7. KPI metric card accent rails

`src/components/dashboard/MetricCard.tsx`:

- Add a `topAccent?: "gold" | "success" | "danger" | "warn"` prop.
- Render as a `2px` flat bar pinned to the card top (absolute, full width), color from semantic tokens (`--accent`, `--success` / emerald, `--destructive`, `--secondary-accent`).
- Update `PulseDashboard.tsx` to pass `topAccent="gold" | "success" | "danger" | "success"` to NRR / GRR / Churn / Health respectively. Keep the existing accent prop for trend color only.

## 8. Heatmap hover state

`RiskHeatmap.tsx`:

- On hover, swap border to `outline outline-1 outline-accent` (already partly there) and reveal a floating mono tooltip via Radix `HoverCard` or a simple absolute-positioned `div` showing `Impact <i> · Likelihood <l>` and first 2 account names.
- Keep current click → row-drawer behavior intact.

## 9. Typography / spacing polish

- `PulseHeader.tsx`: tighten serif headline — wrap the italic emphasis in `<em class="italic font-display tracking-tight pr-[0.05em]">` so the trailing period doesn't crowd. Date stamp `MONDAY, 1 JUNE 2026` — force `font-mono uppercase tracking-[0.28em] text-[11px] text-muted-foreground`.
- Unify all dashboard eyebrows on the shared `.eyebrow` utility (already in `styles.css`) — sweep `BurningThree`, `RiskHeatmap`, `PulseDashboard`, `ReckoningLedger`, `SectionCard` to remove ad-hoc tracking values.

## 10. Sidebar rail tightening

`CSFactorsSidebar.tsx`: reduce horizontal padding to `px-3`, icon row gap to `gap-1`, icon button to `h-9 w-9` so the rail reads as a flush shell. No nav items added or removed.

## 11. Account drawer cross-fade

Existing "Open account →" links already route to `/csfactors/$accountId`. Add a `view-transition-name` on the `<main>` container and the account drawer root + a small `.fade-cross` utility (200ms `opacity` + 2px translate) for browsers without view-transition support. No router changes.

## Out of scope (deferred)

- Renaming Q files (`QAgentDrawer`, `QFilterContext`, `q-agent.functions.ts`, etc.) — copy/visual rebrand only this turn; file/server-fn renames in a follow-up to keep this diff reviewable.
- Stakeholder Canvas, 360 lens rework, drop-cap polish on `/insights`.

## Technical notes

- All new colors come from existing semantic tokens (`--accent`, `--secondary-accent`, `--destructive`, plus emerald via existing `--success` token if defined; otherwise add `--success: oklch(0.72 0.12 150)` once in `styles.css`).
- No new dependencies.
- No DB/schema changes; ledger briefings are derived client-side.
- `askQ` server fn reused unchanged; rebrand is presentation-only.

## Files touched

- new: `src/assets/lumi-mark.png.asset.json`, `src/components/site/LumiMark.tsx`, `src/components/csfactors/AskLumiDrawer.tsx`, `src/components/csfactors/LumiDrawerContext.tsx`, `src/lib/lumi-briefings.ts`
- edited: `src/styles.css`, `src/components/site/QMark.tsx` (shim → LumiMark), `src/components/dashboard/MetricCard.tsx`, `src/components/csfactors/pulse/{PulseDashboard,PulseHeader,RiskHeatmap,ReckoningLedger}.tsx`, `src/components/csfactors/{CSFactorsSidebar,BurningThree,QAgentDrawer (copy only)}.tsx`, `src/routes/csfactors.tsx`, `src/lib/csfactors.functions.ts` (third Burning Three slot), `src/lib/mocks/pulseSeed.ts` (verify renewal-window account), `src/components/site/QHint.tsx` (copy)
