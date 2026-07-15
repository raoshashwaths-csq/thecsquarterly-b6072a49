## Increase grain opacity in both modes

Current values in `src/styles.css`:
- Light mode: `--paper-grain-opacity: 0.02` with `mix-blend-mode: multiply`
- Dark mode: `opacity: 0.14` with `mix-blend-mode: screen`

### Proposed change
Bump each by a small, controlled step so the texture is perceptible but still reads as surface quality, not decoration:

- **Light mode:** `0.02` → `0.035` (~75% relative increase, but still subtle on cream/bond backgrounds; stays within "ledger stock" territory).
- **Dark mode:** `0.14` → `0.18` (slightly more visible on midnight-slate; avoids washing out the indigo ground).

No changes to blend modes, SVG noise frequency, octaves, or z-index. Only the opacity values change.

### Verification
- Toggle theme in the preview; grain should be slightly more present in both modes.
- No visible texture on cards, buttons, or content surfaces — grain remains background-only.
- Light mode should still feel crisp/mechanical, not parchment.
- Dark mode should still feel like subliminal surface noise, not a static overlay.

### Files touched
- `src/styles.css` only.