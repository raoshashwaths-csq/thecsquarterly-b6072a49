## Status today

`tagQRunToAccount` (src/lib/q-agent.functions.ts:424) only writes a `lumi.run.tagged` timeline event. It never reads the run's question/answer and never touches `cs_accounts.csm_sentiment` or `cs_stakeholders.sentiment`. The lexicon scorer in `src/lib/sentiment.score.ts` is used only by `recordDailySentiment` for the operator's own daily journal. Result: tagging a Lumi run has zero effect on the account or stakeholder sentiment surfaces.

## What we'll build

### 1. Hybrid sentiment engine (server-only)

New `src/lib/lumi-sentiment.server.ts`:

- `inferLumiRunSentiment({ question, reply, priorAccount, priorStakeholder })`
  - **Layer A (lexicon)** — run `scoreSentiment()` on `question + "\n" + reply`; map score to `Positive | Neutral | Critical` with a deadband (`score >= 2` → Positive, `<= -2` → Critical, else Neutral).
  - **Layer B (AI tiebreaker)** — call Lovable AI `google/gemini-2.5-flash-lite` with `response_format: json_object` ONLY when:
    - lexicon = Neutral but absolute score ≥ 1 (borderline), OR
    - lexicon result disagrees with `priorAccount` (e.g. lexicon Positive vs prior Critical), OR
    - reply length < 200 chars (too thin for lexicon).
  - Returns `{ label, confidence: 'low'|'med'|'high', rationale, source: 'lexicon'|'ai' }`. Best-effort; if AI fails, fall back to lexicon.

### 2. Wire into `tagQRunToAccount`

Extend the handler in `src/lib/q-agent.functions.ts` after the run-update step:

1. Fetch the run's question + reply from `q_runs` (already owned by user).
2. Fetch prior `csm_sentiment` from `cs_accounts` and (if `stakeholder` provided) prior `sentiment` from the matching `cs_stakeholders` row.
3. Call `inferLumiRunSentiment(...)`.
4. **Always** append a `sentiment.inferred` event to `cs_account_events` with `{ run_id, label, confidence, source, rationale, prior_account, prior_stakeholder, stakeholder }` (audit trail — never lost).
5. **Account chip update** — compute rolling sentiment over the last 5 `sentiment.inferred` events for this account (plus the new one). Apply majority rule:
   - 3+ Critical out of 5 → set `csm_sentiment = 'Critical'`
   - 3+ Positive out of 5 → `'Positive'`
   - otherwise `'Neutral'`
   This prevents one ambiguous run from whipsawing the chip.
6. **Stakeholder update** — only when the tag carries a `stakeholder` string AND it matches an existing `cs_stakeholders.contact_name` (case-insensitive) for that account. Overwrite directly with the single run's label (`Positive → positive`, `Critical → negative`, else `neutral`). Skip silently if no match — never invent a stakeholder row.
7. Return the inferred label in the server-fn response so the tagger can toast "Tagged · sentiment: Positive".

Clearing a tag (existing `!accountId` branch) — no sentiment changes; the audit events remain.

### 3. Realtime in CSFactors

Migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.cs_accounts, public.cs_stakeholders, public.cs_account_events;` (already RLS-scoped to `auth.uid()`, so subscribers only see their own rows).

Subscribe inside the CSFactors route component (`src/routes/csfactors.tsx`, mounted only when logged in):

- `useEffect` opens a single channel listening for `postgres_changes` (`UPDATE` on `cs_accounts`, `UPDATE` on `cs_stakeholders`, `INSERT` on `cs_account_events`).
- On any event, call `queryClient.invalidateQueries({ queryKey: ['csfactors', 'accounts'] })` and `['csfactors','stakeholders']`. Tear the channel down on unmount.
- Same pattern (scoped to one account) inside `src/routes/csfactors.$accountId.tsx` so the drawer chip + stakeholder map repaint live.

### 4. UI surface

- `RunAccountTagger` (`src/components/agent/RunAccountTagger.tsx`) — on save success, render the returned label as a subtle chip under the "Tagged" badge ("Sentiment inferred: Critical · from this run").
- `AccountDrawer` — show a small "Last inferred: <label> · <date>" line under the manually-editable CSM Sentiment field, sourced from the latest `sentiment.inferred` event, so the operator knows the chip moved.

### 5. Tests / verification

- Unit test `inferLumiRunSentiment` with three fixtures (clearly positive, clearly negative, borderline that triggers AI).
- Update `tests/e2e/lumi-tag-flow.spec.ts` to assert the tagger toast surfaces a sentiment label and that `AccountDrawer` reflects it.
- Manual: tag a critical-sounding run, confirm chip flips after enough runs accumulate; tag from a second tab, confirm Realtime updates the first tab without refresh.

## Files touched

- New: `src/lib/lumi-sentiment.server.ts`
- Edit: `src/lib/q-agent.functions.ts` (extend `tagQRunToAccount`)
- Edit: `src/components/agent/RunAccountTagger.tsx` (show returned label)
- Edit: `src/routes/csfactors.tsx`, `src/routes/csfactors.$accountId.tsx` (Realtime subscriptions)
- Edit: `src/components/csfactors/AccountDrawer.tsx` (last-inferred line)
- New migration: `ALTER PUBLICATION supabase_realtime ADD TABLE ...`
- Edit: `tests/e2e/lumi-tag-flow.spec.ts`

No schema changes — `csm_sentiment`, `cs_stakeholders.sentiment`, and `cs_account_events.payload` already exist.

## Out of scope

- Backfilling sentiment for previously tagged runs (can be a one-shot admin script later).
- Sentiment trend chart on the account drawer (today we only surface the latest).
- Changing the manual `csm_sentiment` editor in `AccountDrawer` — the operator can still override at any time; the next 3-out-of-5 inferred result will move it again.