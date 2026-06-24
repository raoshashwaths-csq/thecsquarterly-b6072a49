## Rolling Daily Headlines — Homepage

Rotate the hero headline (eyebrow + 2-line title + subtitle) through 7 variants, one per day of the week (viewer's local day). The existing copy becomes Sunday (dispatch day, anchor for the brand line).

### Day → Direction mapping


| Day       | Variant                                                                                              |
| --------- | ---------------------------------------------------------------------------------------------------- |
| Monday    | Direction 5 — "94% NRR vs 120% NRR… system design" (open the week with a sharp benchmark)            |
| Tuesday   | Direction 2 — "High-touch CS is a scaling liability. Here is what replaces it." (pre-Tuesday tee-up) |
| Wednesday | Direction 1 — "Stop managing accounts. Start engineering revenue."                                   |
| Thursday  | Direction 4 — "Your peers are managing relationships. The top quartile is engineering expansion."    |
| Friday    | Direction 6 — "CS done right does not feel like CS. It feels like revenue leadership."               |
| Saturday  | Direction 3 — "Why do your best accounts still churn?" (reflective, weekend register)                |
| Sunday    | Current headline ("The architecture of retention") — dispatch day, brand anchor                      |


All seven share the same eyebrow line: "Weekly Dispatch for the 1% of Customer Success Operators" (already the value of `home.eyebrow` — no change). Only the H1 (two lines) and the subtitle swap.

### Where the change lands

- `src/locales/en/common.json` → under `home.hero`, add a `rotations` array of 7 objects `{ line1, line2, sub }`, ordered Sunday=0 … Saturday=6 to match `Date.getDay()`. Keep existing `home.hero.line1/line2/sub` untouched as a fallback for any consumer that still reads them.
- `src/routes/index.tsx` → derive `const todayIndex = new Date().getDay()` inside `HomePage`, read `t("home.hero.rotations", { returnObjects: true })`, pick `rotations[todayIndex]`, and render its `line1` / `line2` / `sub` in the existing H1 + paragraph. No layout, font, color, spacing, or animation changes. The `<span className="text-accent">` accent on `line2` is preserved.
- Other locales (`ar`, `id`, `th`, `tl`, `vi`) → not in scope this pass; they continue to use their existing `home.hero.*` strings via a fallback branch (`rotations?.[i] ?? { line1, line2, sub }`). Translations can be added later without code changes.

### SSR / hydration note

`new Date().getDay()` is timezone-dependent. To avoid a server/client hydration mismatch, compute the index inside a `useState` initializer guarded by `typeof window !== "undefined"` and default to the Tuesday (brand-anchor) variant during SSR; on mount, swap to the viewer's local day. This keeps the first paint stable and the rotation correct for the reader.

### Out of scope

- No header, nav, card grid, or below-the-fold changes.
- No new tokens, fonts, or colors.
- No analytics events for headline variant (can add later if you want A/B-style tracking).