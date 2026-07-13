## Depth & Texture System — Plan

Three additive changes to the design system. No layout, spacing, typography, or color-token changes. Sharp corners preserved everywhere.

### 1. Background grain (dark mode)

The codebase already has a `.paper-grain` layer on `<body>` (`src/styles.css` ~line 139) that is explicitly disabled in dark mode (`opacity: 0`). Since the site's default theme is the dark midnight-slate, that means the grain currently never shows on the primary experience.

Change: enable the grain in dark mode using a lighter overlay tuned for the indigo background, matching the PRD spec.

- Keep the existing light-mode grain untouched (multiply, warm ink tint).
- In `.dark .paper-grain::before`, replace `opacity: 0` with a second SVG data URI using neutral white noise + `mix-blend-mode: overlay` at `opacity: 0.035`.
- Position stays `fixed` + `pointer-events: none` (already the case), so it does not scroll with content and never intercepts input.
- No new asset, no network request, no application to any card or component.

Tuning: ship at `0.035`; if it reads as "a texture" rather than a surface quality, drop to `0.025`.

### 2. Hard offset shadow utilities

Add two utilities to `src/styles.css`. Colors reference existing tokens only (`--border`, `--accent`) — no new hex.

```css
@utility elevated {
  box-shadow: 3px 3px 0 0 var(--border);
  transition: box-shadow 0.15s ease, transform 0.15s ease;
  &:hover { box-shadow: 5px 5px 0 0 var(--border); transform: translate(-1px, -1px); }
}
@utility elevated-primary {
  box-shadow: 4px 4px 0 0 var(--accent);
  transition: box-shadow 0.15s ease, transform 0.15s ease;
  &:hover { box-shadow: 6px 6px 0 0 var(--accent); transform: translate(-1px, -1px); }
}
```

Apply to exactly this small set:

- `src/routes/index.tsx` — the primary hero CTA button → `elevated-primary` (once per homepage).
- `src/routes/index.tsx` — the featured/hero article card (if a distinct "featured" slot exists on the homepage after the hero) → `elevated`.
- `src/routes/pricing.tsx` — the recommended tier card only → `elevated`.
- `src/routes/codex.index.tsx` (and codex list card) — playbook card on `:hover` only, via `hover:shadow-[5px_5px_0_0_var(--border)] hover:-translate-x-px hover:-translate-y-px transition-[box-shadow,transform] duration-150`. Not `elevated` permanently.

Standard article grids, nav, footer, and every other card stay untouched.

### 3. Inset surface utility

```css
@utility inset-surface {
  border: 1px solid var(--border);
  box-shadow: inset 1px 1px 0 0 color-mix(in oklab, var(--foreground) 12%, transparent);
}
```

Uses existing `--border` + a foreground-derived inner edge (no new token). No outer shadow, no radius.

Apply to:

- `src/components/site/RetentionLedger.tsx` — the ticker wrapper (currently `border-y border-border`). Adds the recessed inner edge.
- Search / form text inputs on high-signal pages: the FAQ search input (`src/routes/faq.tsx`) and the Lumi chat input textarea in the global agent (`src/components/site/QAgentButton.tsx` / drawer input) — apply the class alongside existing styling, no structural change.

Additional inputs (Codex search, subscribe forms) are out of scope for this pass; if we want them later, we extend deliberately.

### Verification

- Hard refresh in dark mode: grain visible only on very close inspection in the empty indigo gaps between content; not visible on any card.
- Hard refresh in light mode: existing cream-paper grain unchanged.
- Scroll: grain does not move with content.
- Homepage: exactly one `elevated-primary` (hero CTA); at most one additional `elevated` (featured card).
- Pricing: only the recommended tier has the hard shadow; other tiers unchanged.
- Codex: playbook cards flat at rest, lift on hover.
- Retention ticker: reads as recessed, no outer shadow.
- No new hex introduced. No border-radius added.

### Files touched

- `src/styles.css` — enable dark-mode grain; add `elevated`, `elevated-primary`, `inset-surface` utilities.
- `src/routes/index.tsx` — hero CTA + featured card classes.
- `src/routes/pricing.tsx` — recommended tier class.
- `src/routes/codex.index.tsx` (and/or the codex card component it uses) — hover-only shadow.
- `src/components/site/RetentionLedger.tsx` — inset class on ticker wrapper.
- `src/routes/faq.tsx` + Lumi drawer input — inset class on input(s).

No component restructuring, no new files, no new dependencies.
