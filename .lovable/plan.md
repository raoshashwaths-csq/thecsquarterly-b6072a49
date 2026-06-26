
## 1. Where the Stage 01 / 02 / 03 stack lives

Today the three "Stage" cards (`StickyScrollSection` at `src/routes/index.tsx:193`) render directly under the hero for everyone. Change to tier-aware placement:

| Viewer | Placement |
|---|---|
| Visitor (logged out) | Under the headline, above editorial (current slot) |
| Free Reader (logged in, free tier) | Under the headline, above editorial (current slot) |
| Practitioner+ (any paid tier, logged in) | Bottom of page, **below Operator Toolkit**, above ClosingCTA |

Implementation: read `useSubscriptionTier()` and gate which slot renders the new `StageRevealSection`. Only one instance mounts per render.

## 2. New scroll-locked reveal — `StageRevealSection`

Replaces `StickyScrollSection` for this surface only (`StickyScrollSection` itself stays for any other caller). New component at `src/components/home/StageRevealSection.tsx`.

Behaviour, in order:

1. **Pin / scroll lock.** When the section's top hits the viewport top, page scroll is captured (CSS `overscroll-behavior: contain` + a wheel/touch handler that advances an internal `phase` 0→4 instead of scrolling the page). On touch devices, swipe up advances; swipe down at phase 0 releases the lock back to the page.
2. **Phase 1 — Stage 01** fades in from the **left** (translate-x −24px → 0, opacity 0 → 1, 450ms ease-out). Caption sits to the right of the mock.
3. **Phase 2 — Stage 02** fades in from the **right** (translate-x +24px → 0). Stage 01 stays on screen, slightly shrunk and offset up-left.
4. **Phase 3 — Stage 03** fades in from the **left**. Stages 01 + 02 continue shrinking and offsetting to make room.
5. **Phase 4 — Composite.** All three mock images converge into a single staggered stack (each rotated −4°/0°/+4°, offset by ~32px, z-index 1/2/3) centred in the panel; the three captions render as a vertical list immediately to the right of the stack, each caption aligned with its image's vertical centre by a hairline connector.
6. **Unlock.** Once phase 4 settles (≈400ms after entry), the wheel/touch handler releases and normal scroll resumes — the next scroll tick scrolls the page down into the editorial band.

Implementation notes:
- Use `IntersectionObserver` to know when the section is pinned, and a single `useRef<number>` for `phase`. `requestAnimationFrame` throttles wheel deltas; one wheel "burst" = one phase advance (debounced 350ms).
- Honour `prefers-reduced-motion`: skip the lock entirely, render all three stages stacked with no transform animations, no scroll capture.
- Honour keyboard: ArrowDown / PageDown / Space advance phase; Esc releases the lock.
- Honour focus: if any focusable element inside the section receives focus via Tab, release the lock so keyboard users are never trapped.
- Mobile (<768px): collapse to a vertical 3-card list with a simple alternating `animate-fade-up` per card — no scroll lock on touch, only desktop pointer.

## 3. Editorial section — bring up and seed from Lumi context

**Position.** Today the section order after the hero is: StickyScrollSection → SectionsFillGrid → Featured/Sidebar → Recent grid → OperatorTools. New order:

- **Visitor / Free:** Hero → `StageRevealSection` → **Featured + Sidebar (lifted)** → SectionsFillGrid → Recent grid → OperatorTools → ClosingCTA.
- **Paid logged-in:** Hero → **Featured + Sidebar (lifted)** → SectionsFillGrid → Recent grid → OperatorTools → `StageRevealSection` → ClosingCTA.

The Featured + Sidebar block also gets visual prominence: drop the `[animation-delay:400ms]`, increase top spacing, and promote the featured headline to `text-5xl md:text-7xl` to match hero weight; sidebar pull-quote stays.

**Lumi-seeded editorial cards.** The Recent grid (`rest.slice(0, 4)` from `listPosts`) currently uses pure recency. For logged-in users with Lumi memory, seed the order from their context:

- New server fn `getLumiSeededFeed({ limit })` in `src/lib/posts.functions.ts`:
  - Auth-gated (`requireSupabaseAuth`). Returns `Post[]` ordered by relevance.
  - Step 1: fetch the user's `lumi_memory` rows (`memory_type in ('situation','preference','account')`, top 8 by `last_seen_at`).
  - Step 2: build a query string by concatenating their `content` + `profiles.challenges` + `profiles.persona`.
  - Step 3: embed via the same `embedText()` helper used by Lumi Memory; run `match_posts()` SQL function (new — mirror of `match_lumi_memory` but on `posts.embedding`) to return top N by cosine similarity over a pre-computed `posts.embedding vector(1536)` column.
  - Fallback: if any step fails or memory is empty, return `listPosts()` recency order. Free Readers always get recency (no memory). Visitors hit the existing public `listPosts` path.
- New migration: add `embedding vector(1536)` column on `posts`, HNSW index, and a one-shot backfill that embeds existing posts (title + excerpt + first 800 chars body). New posts get embedded on insert via a trigger calling a tiny edge-side embed step (or on first read if column null — lazy backfill keeps the migration simple).
- Wire the home loader to call `getLumiSeededFeed` when `user` is present, else `listPosts`. Each card shows a faint mono eyebrow `"Surfaced for you"` when the result came from Lumi seeding (server fn returns a `source: 'lumi' | 'recency'` flag per row).

The lifted Featured post stays the editor's pick (newest), not Lumi-seeded — only the Recent grid + SectionsFillGrid reorders. This keeps the editorial voice intact.

## 4. Files

- New: `src/components/home/StageRevealSection.tsx`
- New: `src/lib/posts.functions.ts` — add `getLumiSeededFeed`
- New: `supabase/migrations/<ts>_posts_embeddings.sql` — `vector(1536)` + HNSW + `match_posts()` + lazy backfill helper
- Edited: `src/routes/index.tsx` — tier-gated placement, lift editorial band, swap to `StageRevealSection`, call seeded feed for logged-in users
- Edited: `src/lib/lumi-memory.functions.ts` — export `embedText` (already internal) so `posts.functions.ts` can reuse it

## 5. Out of scope

- Re-embedding on every post edit (lazy backfill only; full reindex stays a manual admin task).
- Changing `StickyScrollSection` consumers elsewhere in the app.
- Changing the Featured post selection logic.

## 6. Acceptance

- Logged-out: stages appear directly under hero with the new alternating-fade scroll-locked reveal, ending in the staggered composite; one extra scroll tick continues into the lifted Featured band.
- Free Reader logged in: same placement as logged-out; Recent grid falls back to recency.
- Practitioner+ logged in: hero flows straight into the lifted Featured band; stages appear at the bottom under Operator Toolkit; Recent grid shows "Surfaced for you" eyebrows on Lumi-seeded items.
- Reduced motion and keyboard users are never trapped in the scroll lock.
- `tsgo --noEmit` clean; no edits to `routeTree.gen.ts` or any auto-generated Supabase file.
