## Problem

Three floating elements share the bottom-right corner:

| Element | File | Current z | Current position |
|---|---|---|---|
| Lumi Badge (button) | `src/components/site/LumiBadgeButton.tsx` (mounted by `QAgentButton.tsx`) | `z-40` | `bottom-5 right-5` / md `bottom-8 right-8` |
| Lumi Bubble ("instructions popup") | `src/components/lumi/LumiBubble.tsx` | `z-30` | `bottom-[140px] right-5` / md `bottom-[180px] right-8` |
| Resume Run popup | `src/components/agent/ResumeRunPrompt.tsx` | `z-50` | `bottom-6 right-6` |

Visually, Resume Run lands on top of the badge (same corner) and behind it in stacking order on some routes because the bubble sits at a higher offset but lower z. User wants:

1. Resume Run always wins over the instructions bubble.
2. Both popups float above the Lumi badge.
3. Bubble's current offset placement (above badge) stays — that's the "perfect" placement.

## Fix

### 1. `src/components/agent/ResumeRunPrompt.tsx`
- Move it out of the badge's footprint: change wrapper className to use the same offset language as the bubble — `fixed z-50 bottom-[140px] right-5 md:bottom-[180px] md:right-8 max-w-sm …`. This puts it directly above the Lumi badge instead of on top of it.
- When the prompt mounts with `open && run`, dispatch a `window` CustomEvent `lumi:resume-run-open` with `{ open: true }`; on dismiss / unmount, dispatch `{ open: false }`. Set a module-level boolean as well so the bubble can read state on first render.

### 2. `src/components/lumi/LumiBubble.tsx`
- Raise its z-index to `z-40` so it sits above the badge (still below Resume Run at `z-50`). Keep the existing offset (`bottom-[140px]` / md `bottom-[180px]`) — placement unchanged per user.
- Subscribe to the `lumi:resume-run-open` event on mount and store `resumeOpen` state. When `resumeOpen` is true, short-circuit and return `null` so the bubble fully cedes priority to Resume Run. Restore visibility when the event flips back to false.

### 3. No other changes
- `LumiBadgeButton` stays at `z-40` and its existing offset; both popups will now visually sit above it.
- No changes to `LumiRouteLoader` (full-screen, unrelated overlap).
- No styling redesign of either popup — only positioning, z-index, and the bubble's hide-when-resume-open behavior.

## Acceptance

- On login with a recent Lumi run: Resume Run appears above the Lumi badge; the instructions bubble is hidden. Dismissing Resume Run brings the bubble back.
- No active Resume Run: instructions bubble appears at its current placement, now layered above the badge instead of below it.
- Neither popup overlaps the Lumi badge button anymore.
