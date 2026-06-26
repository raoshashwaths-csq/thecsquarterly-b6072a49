
# Operator Profile + Lumi Memory

Two coordinated features. Onboarding seeds memory on day one; memory then accumulates and is retrieved before every Lumi reply.

---

## 1. Operator Onboarding (every signed-in user, first login only)

**UX — stepper card**

A 5-step modal (`OnboardingStepper.tsx`) that opens on the first authenticated render when `profiles.onboarded_at IS NULL`. One question per screen, Lumi badge in the top-left corner, dark editorial theme, progress dots, Back / Next, Esc + "Finish later" both allowed (sets a `dismissed_at` so it doesn't reopen the same session but reopens next login until completed).

Steps:

1. **Role** — confirm/refine the persona picked at signup. Single-select from `PERSONA_OPTIONS`. Pre-selected from `profiles.persona`.
2. **ACV band** — single-select: `<$10k`, `$10k–$50k`, `$50k–$250k`, `$250k–$1M`, `$1M+`, `Mixed`.
3. **Company ARR range** — single-select: `<$5M`, `$5–20M`, `$20–100M`, `$100M–$1B`, `$1B+`.
4. **Biggest current challenges** — multi-select (1–3): `churn_risk`, `expansion_motion`, `stakeholder_coverage`, `team_capability`, `ai_readiness`.
5. **One difficult account** — free text, single line, 280 char max, optional but encouraged. Placeholder: "e.g. Mid-market SaaS renewal, sponsor just left, 60 days to close."

On finish: write all answers to `profiles` columns + seed `lumi_memory` rows (one `situation` row from the free text, one `preference` row summarising challenges, one `account` row from the free text). Set `onboarded_at = now()`. Toast: "Lumi has your context. Ask anything."

**Trigger** — a small `useOnboardingGate()` hook in `__root.tsx` (client-only) that opens the dialog when `user && !onboarded_at && !dismissed_at_this_session`. No route change.

---

## 2. Lumi Memory (Practitioner+ only)

**Schema** — new migration adds:

```text
extension: vector

profiles (additive)
  acv_band            text
  company_arr_range   text
  challenges          text[]
  difficult_account   text
  onboarded_at        timestamptz

lumi_memory
  id           uuid pk
  user_id      uuid fk → auth.users (cascade)
  memory_type  text check in ('situation','preference','account','framework','reading')
  content      text not null            -- short natural-language fact
  source       text                     -- 'onboarding' | 'lumi_chat' | 'dispatch_read' | 'codex_view' | 'manual'
  source_ref   text                     -- post slug, account id, q_runs id, etc.
  embedding    vector(3072)             -- google/gemini-embedding-001 default
  created_at   timestamptz default now()
  last_seen_at timestamptz default now()
  pinned       boolean default false
```

Grants: `authenticated` full CRUD on own rows; `service_role` all. RLS: `user_id = auth.uid()`. HNSW index on `embedding vector_cosine_ops`. Index on `(user_id, created_at desc)`.

**Tier gate** — writes to `lumi_memory` are no-ops for users below Practitioner (checked server-side via existing tier helpers). Onboarding seed rows are still written for everyone (cheap, useful if they upgrade later).

**Embeddings**

- Server fn `embedText(text)` — internal helper that POSTs to `https://ai.gateway.lovable.dev/v1/embeddings` with `google/gemini-embedding-001`, returns the 3072-dim vector. Keyed off `LOVABLE_API_KEY`. Used only inside `*.functions.ts` handlers.
- Writes: every `lumi_memory` insert embeds the `content` field synchronously. Skip writes >2k chars (truncate to 2000).
- Reads: `match_lumi_memory(query_embedding, user_id, k)` SQL function — `security definer`, scopes by `user_id`, returns top `k` (default 6) by cosine distance plus all `pinned=true` rows.

**Retrieval contract** (`src/lib/lumi-memory.functions.ts`)

```text
recallMemory({ query, limit }) → { items: Memory[], usedFallback: boolean }
recordMemory({ type, content, source, source_ref })
listMemory()  // account settings page
updateMemory({ id, content, pinned })
deleteMemory({ id })
```

`recallMemory` embeds the query, calls the SQL function, falls back to recency if embedding fails. Tier-gated — returns empty for non-Practitioners.

**Wiring into Lumi**

Update `askCSFactorsQ` and the global `askLumi` server fn (under `src/lib/`):

1. Before calling the model, `await recallMemory({ query: data.question, limit: 6 })`.
2. Prepend the items as a `MEMORY` block in the system prompt:
   ```text
   PRIOR CONTEXT (things this operator has told you or you've observed):
   - [situation, 2026-06-12] Renewal with mid-market SaaS sponsor lost…
   - [preference] Focuses on expansion motion and stakeholder coverage…
   ```
3. After the response, `recordMemory` extracts 0–2 new facts via a cheap follow-up call: "Return JSON array of 0–2 durable facts about this operator's situation/preferences/accounts worth remembering for next time. No PII unless they shared it. Empty array if nothing notable." Insert non-empty results.
4. Bump `last_seen_at` on any memories cited.

**Read-tracking memory** — light: when a logged-in Practitioner+ reads a dispatch (existing read tracker, or a new one-time effect on `/insights/$slug` and `/codex/$slug`), insert a `reading` memory with `content = "Read: <title>"` and `source_ref = slug` (debounced per-slug per-day, no embedding write — too noisy; store with `embedding = NULL` and exclude from semantic retrieval, only used for the "you read X recently" surfacing case).

**Periodic surfacing** — `LumiMemoryNudge` component on the dashboard / `/account`: picks one `situation` memory older than 14 days and shows "You mentioned [content] X weeks ago — how did it go?" with Resolved / Still open / Dismiss buttons. Updates `last_seen_at` and (on Resolved) deletes.

---

## 3. Account settings — Memory management (GDPR)

New section in `/account` → "Lumi Memory":

- List all rows grouped by `memory_type`, newest first.
- Each row: content, type chip, source chip, pin toggle, edit (inline), delete.
- "Delete all memory" destructive button (confirm dialog, calls a bulk delete server fn).
- Empty-state copy for users below Practitioner: "Lumi Memory is a Practitioner feature. Upgrade to give Lumi long-term context." with upgrade CTA.

---

## 4. Files

**New**
- `supabase/migrations/<ts>_lumi_memory.sql` — extension, columns, table, grants, RLS, indexes, `match_lumi_memory` SQL function.
- `src/components/onboarding/OnboardingStepper.tsx`
- `src/components/onboarding/OnboardingStep1Role.tsx` … `Step5Account.tsx` (or one file with sub-steps — TBD during build)
- `src/hooks/useOnboardingGate.ts`
- `src/lib/lumi-memory.functions.ts` — recall, record, list, update, delete + internal `embedText`.
- `src/lib/onboarding.functions.ts` — `finishOnboarding({ persona, acv_band, arr_range, challenges, difficult_account })` (single transactional write).
- `src/components/account/MemorySettings.tsx`
- `src/components/site/LumiMemoryNudge.tsx`

**Edited**
- `src/routes/__root.tsx` — mount `useOnboardingGate()`.
- `src/lib/csfactors-q.functions.ts` — recall + record around the model call.
- Global Lumi server fn (existing site-wide `askLumi`) — same recall + record wiring.
- `src/routes/account.tsx` — add the Memory section.
- `src/integrations/supabase/types.ts` — regenerated automatically.

---

## 5. Out of scope (for this turn)

- Streaming the onboarding answers through a fake Lumi chat thread (deferred per your choice of stepper UI).
- Re-embedding existing `q_runs` / past reading history (only new activity from the moment this ships forward).
- Cross-device memory export / import.

---

## Acceptance checks

- Brand-new signup → onboarding appears on first dashboard load; finishing writes 5 profile fields + 3 seed memory rows; never reopens.
- Existing user with `onboarded_at IS NULL` → same flow on next login.
- Free user: onboarding works; `recordMemory` is a no-op; `recallMemory` returns empty; Lumi system prompt has no MEMORY block.
- Practitioner+ user: every Lumi answer includes a MEMORY block; `lumi_memory` grows after each meaningful question.
- `/account → Lumi Memory` lists, edits, pins, deletes; "Delete all" wipes the table for that user.
- 14-day-old situation memory surfaces a nudge on the account/dashboard once and respects Resolved/Dismiss.
- RLS: signed-in user A cannot read user B's memory rows via the Data API.
- `tsgo --noEmit` clean. No new color tokens. No edits to managed Supabase client files.
