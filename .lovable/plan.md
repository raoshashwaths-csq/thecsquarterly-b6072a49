# Lumi Situation Room

A new high-stakes coaching surface where a reader pastes their live situation, Lumi retrieves the 3 most relevant past dispatches via semantic search, and walks them through a decision framework in conversation. Saves to workspace as a "Situation log."

The `posts.embedding` column and `match_posts(query_embedding, k, section)` RPC already exist — we reuse them.

## Where it lives

- New route: `/situation-room` (top-level, requires sign-in — render inline "Sign in to use Lumi Situation Room" CTA for visitors per the public/auth-route pattern; gated by Practitioner+ designation like the rest of Lumi Q for full conversation, with a 1-free-situation preview for Free Readers).PLace a card linking to it on the canvas page .Place all LUmi runs and playbooks in the situation room as well in a neat organised manner with expanding card on mouseover 
- Entry points: header CTA inside the avatar dropdown ("Open Situation Room"), a card on `/account`, and a prominent link on the homepage hero under the existing primary CTA.
- Reuses `LumiMark`, `.lumi-cta`, shared dashboard primitives, and the existing speech-to-text hook so the input box supports dictation.

## Page layout

Single-column editorial layout, dark midnight-slate (consistent with Lumi surfaces):

1. Eyebrow + display H1: "Lumi Situation Room." Subtitle: one line on what it does.
2. Large composer (textarea + mic button via `useElevenLabsSpeechInput`) — placeholder is the example silent-account scenario. Submit = "Find the dispatch."
3. After submit:
  - **Retrieved dispatches strip** — 3 `SectionCard`s side-by-side, each showing dispatch title, section eyebrow, similarity %, the extracted framework name, and a "Read full dispatch" link.
  - **Applicable benchmark callout** — when the situation matches a benchmark category (renewal-window, champion-loss, expansion, onboarding), surface the relevant `benchmark_drops` row inline.
  - **Coaching conversation** — `AskLumiDrawer`-style message list rendered inline (not a drawer here). Lumi opens with a diagnosis + named framework reference, then asks follow-up questions one at a time. User replies stream back. Markdown rendering, `message.parts`, optimistic user message, typing indicator.
4. Sticky footer bar: "Save to workspace as Situation log" + "Start new situation."

## Backend

New `src/lib/situation-room.functions.ts` (client-safe path), all `requireSupabaseAuth` + `assertQUnderCap`:

- `retrieveSituationContext({ situation })` — server fn:
  1. Embed `situation` via Lovable AI Gateway `/v1/embeddings` with `google/gemini-embedding-001` (column is `vector(3072)` — verify and resize migration if mismatched; the existing `match_posts` signature accepts `vector`).
  2. Call `match_posts(query_embedding, 3, null)`.
  3. For each hit, pull the post row (title, slug, section, excerpt, framework metadata) and have the model extract a 1-line framework name + 2-line "what this dispatch says about your situation" using `generateText` with structured `Output`.
  4. Pick best-matching benchmark from `benchmark_drops` (by section + keyword heuristic on the situation text).
  5. Return `{ dispatches: [...], benchmark, openingMessage }`.
- `continueSituation({ situationId, history, message })` — server fn that streams via the existing chat pattern (we already have `askCSFactorsQ`; add a parallel `askSituationRoom` that uses the situation + retrieved dispatches as system context instead of CSFactors portfolio context). Reuses `assertQUnderCap` so it draws from the same monthly Lumi quota.
- `saveSituationLog({ situationId, title })` — writes a row to `user_workspace_items` with `kind = 'situation_log'`, payload = `{ situation, dispatches, transcript }`. Cap already enforced by `enforce_workspace_cap`.

## Data

- Reuse `posts.embedding` + `match_posts` RPC — no schema changes for retrieval.
- New table `situation_sessions` (per-user transient log so refreshes don't lose state):
  - columns: `id uuid pk`, `user_id uuid fk auth.users`, `situation text`, `dispatches jsonb`, `messages jsonb default '[]'`, `created_at timestamptz default now()`, `saved_to_workspace boolean default false`.
  - RLS: `auth.uid() = user_id` for all of select/insert/update/delete.
  - GRANTs: `SELECT, INSERT, UPDATE, DELETE` to `authenticated`, `ALL` to `service_role`.
- Backfill: one-off migration / admin function to embed any `posts` rows still missing `embedding`. Use the same Lovable AI Gateway model. Re-run on publish via a trigger or just a manual admin button (out of scope for v1 — assume existing posts are embedded; surface a one-line "embed missing posts" button in `/admin/control-panel` for operator use).

## Files

- New: `src/routes/situation-room.tsx`, `src/components/situation-room/SituationComposer.tsx`, `RetrievedDispatches.tsx`, `SituationChat.tsx`, `BenchmarkCallout.tsx`.
- New: `src/lib/situation-room.functions.ts`, `src/lib/situation-room.server.ts` (embedding + retrieval helpers).
- New API server route: `src/routes/api/situation-room/chat.ts` for the streaming conversation (AI SDK `useChat` with `DefaultChatTransport`).
- Migration: `situation_sessions` table + GRANTs + RLS.
- Edit: `src/components/site/SiteHeader.tsx` (avatar dropdown entry), `src/routes/index.tsx` (hero secondary CTA), `src/routes/account.index.tsx` (Situation Room card listing saved logs).
- Edit: `src/lib/lumi-analytics.ts` — new event types `situation_started`, `situation_retrieved`, `situation_saved`.

## Gating

- Visitor: sees marketing copy + composer is disabled with inline "Sign in to use Situation Room."
- Free Reader: 1 free situation/month (tracked via `lumi_events`).
- Practitioner+: unlimited within their monthly Lumi Q cap (shared with existing Lumi surfaces).

## SEO

- Unique `head()`: title "Lumi Situation Room — The CS Quarterly", description on real-time renewal/escalation coaching, distinct og tags. No `og:image` for v1.

## Out of scope (v1)

- Multi-turn citation linking back to specific paragraphs in dispatches.
- Auto-detecting situation category to filter `match_posts(section)`.
- Shareable situation logs (saved logs are private-only).
- Voice output (TTS) — input dictation only.