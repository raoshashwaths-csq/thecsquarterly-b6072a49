# Lumi Debrief — post-read conversation trigger

## Behavior

1. On `/insights/$slug`, when scroll-progress reaches **≥ 90%**, a card slides up from the bottom-right of the viewport with Lumi's opening question.
2. The opener is **LLM-generated at debrief time** from the dispatch's title + excerpt + body (the "1 actionable" of the 3-2-1). It always ends in a personalising question: *"What's the one account this applies to right now?"*-shaped.
3. Reader types a reply → continues as a normal Lumi coaching thread inside the card (expandable to a side drawer for longer chats).
4. The conversation is **saved as a `situation_sessions` row** (source = dispatch debrief, linked to the post) — appears in Situation Room list + `/account` workspace.
5. **Quota**:
   - Free tier: 1 debrief per calendar month. After that, the card shows a paywall nudge instead of opening.
   - Paid tiers: each debrief counts as **1 Lumi run** against the monthly pool (enforced via existing `assertQUnderCap` + `q_runs` insert).
6. Triggers **once per slug per session** (dismissible; reappears next visit only if not yet completed for that slug).

## Files

**New**
- `src/components/lumi/LumiDebriefCard.tsx` — sliding card UI, opener state, mini-chat thread, paywall fallback. Uses existing `LumiMark` + `.lumi-cta` styling.
- `src/hooks/useDebriefTrigger.ts` — scroll-progress watcher (consumes the existing `progress` already tracked in `insights.$slug.tsx`), per-slug "already triggered" session-storage guard, reduced-motion respect.
- `src/lib/dispatch-debrief.functions.ts` — two server functions:
  - `startDispatchDebrief({ postId })` — enforces quota, generates opener via Lovable AI Gateway, creates `situation_sessions` row tagged `source: "dispatch-debrief"` with `post_id` in dispatches JSON, logs `q_runs` row `node_id='dispatch-debrief'`, returns `{ sessionId, opening, remainingThisMonth }`.
  - `getDebriefQuota()` — returns `{ used, limit, tier, blocked }` for the current month (used by the card to render the right CTA before starting).

**Edited**
- `src/routes/insights.$slug.tsx` — render `<LumiDebriefCard postId={post.id} slug={post.slug} progress={progress} />` near the end of the article container. No layout/copy changes elsewhere.
- `src/lib/situation-room.functions.ts` — extend `continueSituation` to accept dispatch-debrief sessions (already shape-compatible; just verify the system prompt branch when `dispatches[0].source === 'dispatch-debrief'`).

**No schema change.** We piggyback on:
- `situation_sessions.dispatches` (Json) — store `[{ source: "dispatch-debrief", post_id, slug, title, actionable }]`.
- `q_runs` — `node_id = 'dispatch-debrief'`. Free quota = `count(*) where node_id='dispatch-debrief' and created_at >= date_trunc('month', now())`. Paid: reuse `assertQUnderCap`.

## Opener generation

Inside `startDispatchDebrief.handler`:
- Pull `title, subtitle, excerpt, body` for `postId`.
- Single Lovable AI Gateway call (`google/gemini-3-flash-preview`), JSON output:
  ```
  { "actionable": "<the 1 actionable from the 3-2-1, ≤140 chars>",
    "opener": "<2 short sentences. Sentence 1 names what they just read. Sentence 2 asks one operator question that forces them to apply it to a real account/situation right now.>" }
  ```
- System prompt enforces McKinsey register, no emoji, no hedging. Falls back to a deterministic template (`You just read about "{title}". What's the one account this applies to right now?`) if the call fails.

## Quota UX

- Free user, 0 debriefs this month → card opens normally, footer shows *"This is your free debrief for {month}."*
- Free user, already used → card shows the dispatch title + a locked CTA: *"Debriefs reset on the 1st. Upgrade for unlimited."* Single button to `/pricing`.
- Paid user → footer micro-line: *"Counts as 1 of your {remaining} Lumi runs this month."* Never blocks unless over cap (existing `assertQUnderCap` error surfaces inline).

## Trigger rules

- Only on `/insights/$slug` (not codex, not section pages).
- Only when `progress >= 0.9`.
- Skip if user is the visitor-gate or scroll-gate is active (avoid double-prompting unauth/paywalled users).
- `sessionStorage` key `csq.debrief.shown.{slug}` prevents re-appearance in the same tab.
- `prefers-reduced-motion`: card fades in instead of sliding.
- Mobile: card becomes a bottom sheet (full-width, max-height 70vh).

## Out of scope

- No new analytics dashboard surface (reuse Situation Room list).
- No edits to `src/integrations/supabase/*`, `routeTree.gen.ts`, or `.env`.
- No changes to existing Lumi Bubble or Drawer actions.
- No backfill of older posts — opener is generated on the fly.
