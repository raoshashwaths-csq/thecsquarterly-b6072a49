# Felix & Nora Comic Strip — `/strip`

Static, self-contained editorial page. No DB, no auth, no nav link. New files only; nothing existing is modified except `src/routes/__root.tsx` (font `<link>` tags only).

## Files created

```
src/routes/strip.tsx                     — page + route
src/components/strip/StripCard.tsx
src/components/strip/StripHeader.tsx
src/components/strip/Panel.tsx
src/components/strip/DialoguePanel.tsx
src/components/strip/SpeechBubble.tsx
src/data/strips.ts                       — 3 strips verbatim from PRD
src/styles/strip.css                     — imported in strip.tsx only
```

## Route

`src/routes/strip.tsx` uses `createFileRoute("/strip")` with `head()` setting title "Felix & Nora — The CS Quarterly", description, and matching og:title/og:description/twitter:card. No og:image (per site rule — omit rather than use generic). No navigation entry added anywhere.

## Fonts

Add three `<link>` tags to `src/routes/__root.tsx` `head().links` (preconnect + one stylesheet URL) for Playfair Display, Libre Baskerville, DM Mono. Only surgical edit to an existing file. Referenced by name in `strip.css` inline `font-family` declarations — no changes to `styles.css` or global tokens.

## Data

`src/data/strips.ts` exports the exact `PanelType`, `SpeechBubble`, `StripPanel`, `Strip` types and the three strips (No. 4, 30, 3) verbatim as in the PRD.

## Components (built per PRD spec)

- **StripHeader** — flex row, `title={hoverText}`, `cursor: help`, native browser tooltip for the punchline reveal. No.### + title on the left, tag badge on the right.
- **Panel** — illustration container with placeholder = 72px circle (only element with border-radius) + character initial + italic `imageAlt` description. Optional overlaid `SpeechBubble`s and optional bottom stage-direction strip.
- **DialoguePanel** — text-only, gold left border (3px `var(--accent, #C4A45A)`), stage direction in brackets, bubbles stack statically.
- **SpeechBubble** — two contexts (`panel` absolute-positioned / `dialogue` static). Character label color: FELIX = `var(--muted-foreground)`, NORA/BRENDAN = `var(--accent, #C4A45A)`.
- **StripCard** — max-width 720px, grid `repeat(panelCount, 1fr)` desktop, 2-col mobile (3-panel: last spans full width). Footer with `thecsquarterly.com/strip` left, `F&N` gold right.

## Design tokens (per user answer: "tokens with hex fallbacks as written")

Map PRD names to real project tokens with the PRD's hex fallbacks kept as written:
- `var(--gold, #C4A45A)` → uses project `--accent`; hex fallback preserved verbatim per PRD.
- `var(--bg, #0A0A0A)` → uses `--background`; hex preserved for the speech-bubble "cutout" match.
- `var(--text-primary)` → `--foreground`; `var(--text-muted)` / `var(--text-dim)` → `--muted-foreground`; `var(--surface)` → `--card`; `var(--border)` → `--border`.

All in `strip.css` and inline styles — no changes to global token definitions.

## Layout / motion

- No rounded corners anywhere except the 72px avatar circle.
- No new animations. Static page. Existing site header (from `__root.tsx`) still renders above; page adds its own 64px top padding.
- Character key row: two entries side by side desktop with vertical hairline separator, stacked mobile.
- Strip order rendered: 4 → 30 → 3.

## Not doing (explicit non-goals from PRD)

- No Midjourney / stock / generated illustrations — placeholder circle + `imageAlt` IS the design.
- No nav link to `/strip`.
- No modifications to any existing component, route, or global CSS beyond adding font `<link>`s to `__root.tsx`.
- No custom hover tooltip — uses native `title` attribute, intentionally.

## Testing

After build, load `/strip` and verify: route resolves, three strips render in order 4/30/3, hovering a strip header shows the browser-native tooltip with the hoverText, 4-panel strips are 4-col desktop / 2×2 mobile, gold left border only on dialogue panels, no rounded corners besides the avatar circles.
