# Article UX: Signal, Resume, Related Intelligence

Three additive enhancements to `/insights/$slug`. No backend writes, no schema changes, no visual palette changes — only `--accent`, `--secondary-accent`, and existing neutral tokens. All three live above the existing paywall logic so they remain visible to gated readers.

---

## 1. Reading Time + Difficulty Indicator

A single eyebrow line rendered above the H1, in the existing mono eyebrow style (uppercase, tracking `[0.25em]`, 10–11px):

```
14 MIN READ  ·  STRATEGIC READ 
```

**Difficulty derivation** (no schema change, no admin UI). A pure function `deriveComplexity(post)` in `src/lib/article-signals.ts`:

- `STRATEGIC` if `section === "vanguard"` OR `tier === "operator" | "team" | "scale" | "enterprise"` OR `read_minutes >= 12`.
- `OPERATOR` if `section === "retention-protocol"` OR `read_minutes` between 7 and 11.
- `PRACTITIONER` otherwise (codex, outcome-forum, short vanguard pieces under 7 min).

Read time uses existing `post.read_minutes`; falls back to `Math.max(3, Math.round(wordCount/220))` if null.

**Tier-aware rendering** (`useSubscriptionTier`):

- `visitor` / `free`: chip is muted (`text-muted-foreground`), tooltip on hover reads *"STRATEGIC pieces are written for VP/Director-level operators. Vanguard unlocks the full archive."* Clicking the chip routes to `/pricing#vanguard`.
- `vanguard`+: chip uses `text-accent`, no tooltip, no link — pure signal.
- `operator`+: adds a second micro-line *"In your tier"* when complexity ≤ user's tier, *"Above your daily cadence"* when complexity = STRATEGIC and user is practitioner. Copy is per-tier label set, reusing the existing tier-label map in `src/hooks/useSubscriptionTier.ts`.

New component: `src/components/site/ArticleSignalRow.tsx`. Rendered inside `PostPage` in `insights.$slug.tsx`, replacing the existing standalone read-minutes line.

---

## 2. Article Progress Persistence

Pure client-side, localStorage only. New hook `src/hooks/useArticleProgress.ts`:

- Key: `csq.article.progress.v1` → `Record<slug, { pct: number; updatedAt: ISO; title: string }>`.
- Throttled scroll listener (250ms) writes `pct` based on the article `<article>` element's `getBoundingClientRect` vs viewport. Caps at 100.
- Only persists for entries between 15% and 95% (below 15% = didn't really start; ≥95% = finished, clear entry).
- TTL 30 days; entries older than 30d are pruned on read.

**Resume prompt**: new component `src/components/site/ResumeReadingBanner.tsx`. Renders inside `PostPage` only if a saved entry for the current slug exists with `pct >= 20` and `updatedAt` older than 30 minutes. Single-line bar above the article body:

```
You read 60% of this piece on Tue 17 Jun. ⤵ Resume   ✕ Start over
```

Resume: smooth-scroll to a marker computed from saved `pct`. Start over: clears entry, scrolls to top. Banner auto-dismisses on first scroll.

**Cross-feature**: also surfaces a small dot indicator on `/insights` index cards for slugs with an in-progress entry. Cheap addition (already iterating cards there). No backend, no analytics required for v1.

---

## 3. Related Intelligence Panel

Server function `getRelatedIntelligence({ slug })` in `src/lib/posts.functions.ts` (read-only, no auth). Returns exactly three picks, each may be null:

1. **Codex playbook** — most relevant entry from `codex` section. Match by:
  - shared `category` first, then
  - keyword overlap between article `title + excerpt` and codex `title + excerpt` (simple token Jaccard, no embeddings, no new dependency).
2. **Lumi tree** — most relevant tree from `src/lib/q-trees.ts`. Match article `category` → tree `TreeCategory` via a static map (Stakeholder Management → T2/T14, Escalation → T4/T9, Negotiation → T6, AI in CS → T18/T19, Sales Qualification → T10, default → T1). Pick the tree whose root label has the highest keyword overlap with the article excerpt.
3. **Foundational article** — earliest published post in the same `section` + same `category`, excluding the current slug. Fallback: earliest in the same `section`.

Selection is deterministic and computed server-side per request (cheap; the candidate set is small). No new table.

**Component**: `src/components/site/RelatedIntelligencePanel.tsx`. Three stacked rows in a `SectionCard`-style frame, each row using the existing eyebrow + headline pattern:

```
PLAYBOOK         → Onboarding Playbook
LUMI TREE        → Escalating a stalled renewal (T4)
FOUNDATIONAL     → Why NRR Eats CAC (Mar 2025)
```

Each row is a `<Link>`. Eyebrow uses `text-secondary-accent`. Hover lifts the row 1px and underlines the title (consistent with existing card patterns). Renders below `HighlightedBody` and above `NewsletterInline` in `insights.$slug.tsx`. Hidden when all three picks are null.

---

## Wiring summary

Files added:

- `src/lib/article-signals.ts` — `deriveComplexity`, `complexityCopy(tier)`.
- `src/components/site/ArticleSignalRow.tsx`
- `src/hooks/useArticleProgress.ts`
- `src/components/site/ResumeReadingBanner.tsx`
- `src/components/site/RelatedIntelligencePanel.tsx`

Files edited (additive only):

- `src/routes/insights.$slug.tsx` — mount the three components, remove the standalone read-minutes line.
- `src/lib/posts.functions.ts` — add `getRelatedIntelligence` server fn (public, no auth, no writes).
- `src/routes/insights.index.tsx` — tiny "in-progress" dot from the progress hook.

Analytics (reuses existing `lumi-analytics` event bus, no schema change):

- `article.signal.shown { slug, complexity, tier }`
- `article.resume.shown { slug, pct }` / `article.resume.click` / `article.resume.dismiss`
- `article.related.click { slug, kind: "playbook"|"tree"|"foundational", targetSlug }`

---

## Conflicts and call-outs

1. **No `complexity` column exists on `posts`.** Plan derives it from `section/tier/read_minutes`. If you want editor-overridable values later, that becomes a small migration — flag and I'll add it; for now this is purely presentational.
2. `**tier` on posts vs subscription tier are different vocabularies.** `post.tier` today is the access tier (free/vanguard/operator…); `complexity` is reader-facing seniority. The plan keeps them distinct — the chip never says "vanguard", only PRACTITIONER/OPERATOR/STRATEGIC.
3. **Resume banner uses scroll percent, not paragraph anchors.** Markdown body is re-rendered on every visit so anchor IDs aren't stable. Percent is good enough for v1 and matches Medium's behavior; paragraph anchors would need a body-hashing pass — out of scope unless you want it.
4. **Related panel runs inside the paywall gate.** It will render for locked readers too (it's metadata, not premium content). That is intentional — it's a discovery surface. Confirm if you'd rather hide it behind the paywall.
5. **Lumi tree mapping is a static category→tree table.** Cheap and predictable. A semantic match would need embeddings + a new table; not justified at current article volume.
6. **No competitor naming, no new color tokens, no font changes.** Chip uses existing `--accent` / `--secondary-accent` / `text-muted-foreground` only. Banner and panel reuse `SectionCard`/eyebrow primitives.

Approve and I'll build in this order: signals → resume → related panel → analytics → index-card dot.