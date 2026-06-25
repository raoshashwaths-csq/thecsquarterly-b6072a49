# Plan: Workspace history readability + article `**` cleanup

Two unrelated, presentation-only fixes. No schema, no server functions, no copy rewrites.

---

## 1) Workspace · Interaction History — hide tree codes, show scenarios

**File:** `src/routes/account.workspace.tsx` (HistoryPanel, lines ~575–648)
**Helper source:** `src/lib/q-trees.ts` (`getTree`, `NODES`, `Tree`, `TreeId`)

### Today
- Collapsed row title = raw `r.node_id` (e.g. `T3-B-2`).
- Expanded body = full `JSON.stringify(r.context)` pretty-printed.
- "Open full response" link exists but is buried under JSON.

### Target

Collapsed row (what the user sees):
- **Heading line:** tree title (e.g. *"Qualify an Upsell"*).
- **Sub-line:** timestamp + account name (if `context.account_name`).
- No `T#`, no `T#-X-Y` anywhere on this row.

Expanded body:
- **Sub-branch path** rendered as a breadcrumb of node `label`s, e.g. *"Existing buyer · Multi-product expansion"* — derived by walking `parentId` from the run's leaf node up to (but excluding) the L1 root, joined with " · ".
- **One-line context:** first non-empty value from `context` matching, in order: `one_sentence_context`, `context`, `summary`, `prompt_context` — truncated to 180 chars.
- **"See full run →"** button (prominent, replaces the JSON dump) → existing `/agent/response/$runId` route.
- Raw JSON dump is removed from this surface (full run page already shows it).

### Helper (inline in `account.workspace.tsx`, ~25 LOC, no new file)

```ts
function resolveRun(nodeId: string) {
  const treeId = nodeId.split("-")[0] as TreeId;        // "T3-B-2" → "T3"
  const tree = getTree(treeId);
  // Walk parents to build breadcrumb of non-root labels.
  const path: string[] = [];
  let cur = NODES.find(n => n.id === nodeId);
  while (cur && cur.parentId) {
    path.unshift(cur.label);
    cur = NODES.find(n => n.id === cur!.parentId);
  }
  return { heading: tree?.title ?? "Scenario", breadcrumb: path.join(" · ") };
}
```

`NODES` is already exported from `q-trees.ts` (used elsewhere); no schema change.

### Filter change
`runs.filter` currently matches on `r.node_id`. Switch to matching on resolved `heading + breadcrumb + context-string` so search by *"upsell"* keeps working without exposing codes.

### Edge cases
- Unknown / legacy `node_id` (no matching tree) → heading falls back to "Scenario", breadcrumb empty, row still clickable.
- L1-only run (no `-` in id) → breadcrumb empty; show only heading + timestamp.
- Missing `context` fields → omit one-line context block; keep "See full run".
- TaggedLumiRunsWidget + AccountTimeline already use `getTree` per prior fix — no further change needed there.

### Out of scope
- Admin surfaces (admin control panel, q_runs raw exports) keep `T#` for ops.
- No DB migration. `q_runs.node_id` continues storing the technical id.

---

## 2) Article body · stray `**` markers — RCA + fix

**File:** `src/routes/insights.$slug.tsx` — `renderBody` (lines ~89–149) and `renderInline` (152–162).

### RCA — five failure modes for the current `(\*\*[^*]+\*\*)` regex

1. **Headings skip inline rendering.** `h1/h2/h3` branches render `match[1].trim()` directly. Any `## **Section**` lands `**Section**` literally in the DOM.
2. **List-bullet collision.** The `[-*]\s` bullet regex strips a single leading `*`, so a line that begins with `**Bold thing.**` is mis-detected as a bullet, leaving `*Bold thing.**` (one orphan `*` at front, two at end) in a `<li>`.
3. **Triple asterisks.** `***strong-italic***` — `[^*]+` rejects, the run prints raw.
4. **Nested asterisk inside bold.** `**foo *bar* baz**` — same `[^*]+` rejection.
5. **Unbalanced / line-wrapped bold.** `**opens here\nbut closes on next paragraph**` — paragraph split on `\n{2,}` separates the two halves; each half has a lone `**` that passes through.

### Fix (presentation-only, in `renderBody` + `renderInline`)

- **Run headings through `renderInline`** so any `**` inside `h1/h2/h3` resolves to `<strong>` (covers RCA 1, the most common visible offender).
- **Tighten bullet detection** so `**` at line start isn't treated as a bullet: change `/^[-*]\s/m` to `/^(?:-|\*(?!\*))\s/m`, and the per-item strip regex to `/^\s*(?:-|\*(?!\*))\s+/` (RCA 2).
- **Replace `renderInline` regex** with a tolerant matcher that handles triples and nested singles, in this order:
  - `***([^\n]+?)***` → `<strong><em>…</em></strong>`
  - `\*\*([\s\S]+?)\*\*` (non-greedy, allows inner `*`) → `<strong>…</strong>`
  - `(?<!\*)\*(?!\*)([^*\n]+?)(?<!\*)\*(?!\*)` → `<em>…</em>`
  - After all passes, strip any surviving stray `**` or lone `*` adjacent to whitespace/punctuation so RCA 5 (unbalanced) never renders as glyphs.
- **Pre-pass in `renderBody`:** before paragraph split, collapse a `**` token that sits alone at end-of-line followed by a blank line + continuation into a single span (defensive against RCA 5).

### Verification
- Add a tiny unit test alongside existing tests (or a `__tests__/renderInline.test.ts`) covering: heading with `**`, list item starting with `**Bold**`, `***triple***`, `**bold *italic* bold**`, lone trailing `**`.
- Spot-check `/insights/*` routes in preview at desktop + mobile for visible `*` glyphs.

### Out of scope
- No switch to `react-markdown` or a real parser — keeps current bundle size and styling intact.
- Codex / playbook / dashboard renderers untouched (each has its own minimal renderer; only `insights.$slug.tsx` was named as the offender).

---

## Files touched
- `src/routes/account.workspace.tsx` — HistoryPanel row + expanded view, inline `resolveRun` helper.
- `src/routes/insights.$slug.tsx` — `renderBody` (headings + bullet regex) and `renderInline` (matcher).
- *(optional)* `src/routes/__tests__/renderInline.test.ts` — new, ~30 LOC.

No backend, no migrations, no new packages, no copy changes, no admin-facing change.
