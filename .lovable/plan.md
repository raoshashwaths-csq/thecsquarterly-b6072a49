## Dispatch Reactions ("What did this change for you?")

End-of-article single-signal reaction with 4 structured options, aggregate readout, admin dashboard, and Lumi pushback thread for disagreement.

### New table: `post_reactions`

```text
id uuid pk
post_id uuid → posts(id) on delete cascade
user_id uuid → auth.users(id) on delete cascade
reaction text check in ('applied','language','confirmed','disagree')
disagree_session_id uuid null  -- situation_sessions row when reaction='disagree'
created_at timestamptz default now()
unique(post_id, user_id)        -- one signal per reader per article
```

- RLS: authenticated users SELECT/INSERT/UPDATE their own rows; admins SELECT all; service_role ALL. Standard GRANTs on `public`.
- RPC `get_post_reaction_stats(_post_id uuid)` returning `{ total, counts: { applied, language, confirmed, disagree }, top_label, top_pct }` — security definer, callable by `anon` + `authenticated` for the public signal readout. No PII.

### New server fns — `src/lib/post-reactions.functions.ts`

- `submitPostReaction({ postId, reaction })` — `requireSupabaseAuth`. Upserts on `(post_id, user_id)` (readers may change their mind). If `reaction='disagree'` and no session exists, creates a `situation_sessions` row tagged `source: "dispatch-disagree"` with `post_id` in dispatches JSON; opener generated via Lovable AI Gateway (`google/gemini-2.5-flash`) framed as: "You disagreed with the thesis. Tell Lumi why — your pushback may shape the next dispatch." Returns `{ sessionId, stats }`. Does NOT count against `q_runs` (pushback is editorial signal, not a Lumi turn).
- `getPostReactionStats({ postId })` — public, calls the RPC. Used for the live "61% of operators said…" line.
- `getMyPostReaction({ postId })` — `requireSupabaseAuth`. Returns current user's choice if any.
- `listReactionAggregates({ limit, since })` — admin only (`has_role(_, 'admin')`), returns per-post counts + top label for the admin dashboard.

### UI — `src/components/lumi/DispatchReactionCard.tsx`

Renders below the article body (above the existing `LumiDebriefCard`). Structure:

1. Eyebrow: `READER SIGNAL · ONE TAP`
2. Prompt: "What did this change for you?"
3. Four option buttons (radio-style, single select):
   - "Changed how I'll approach an account this week"
   - "Gave me language I didn't have"
   - "Confirmed something I already believed"
   - "I disagree with the thesis."
4. After submit: collapses to aggregate readout — `"{top_pct}% of operators said this {top_label_phrase} this week"` + `{total} signals` (uses the public RPC; revalidates every 30s while visible).
5. Disagree path: opens a Lumi thread inline (reuses `continueSituation` like the debrief card) seeded with the LLM-generated opener; saved to the reader's Situation Room.
6. Signed-out users see the question + options but tapping prompts sign-in.

### Admin — `src/routes/admin.tsx`

New "Reader Signals" section using existing dashboard primitives (`SectionCard`, `MetricCard`, `HealthChip`):
- Top strip: total signals (7d/30d/all), % disagree, % applied.
- Table of recent posts (last 30d) with: title, total signals, % each reaction, top label chip, link to post. Sortable by disagree-rate (for calibration).
- Disagree threads: link list of `situation_sessions` where `source='dispatch-disagree'` (post title + first message preview).

### Article integration — `src/routes/insights.$slug.tsx`

Mount `<DispatchReactionCard postId={post.id} />` after the body and before `<LumiDebriefCard>`. No gating — reactions are open to all signed-in readers regardless of tier (one signal per article is not a Lumi turn).

### FAQ updates — `src/lib/faq-content.ts` (English source of truth)

Add Q&A entries (English block only; other locales fall back) under existing categories for everything shipped today:

- **Lumi** category — add:
  - "What is Lumi Debrief?" → describes 90% scroll trigger, opener from the dispatch's 1 actionable, saves to Situation Room, free tier gets 1/month, paid counts as 1 Lumi run.
  - "What are dispatch reactions?" → 4 options, one per article, aggregate shown to all readers, disagree opens a Lumi thread.
- **Editorial** category — add:
  - "How does the editorial team use reader signals?" → admin sees aggregate per dispatch; disagree threads calibrate future topics.
- **Account, Billing & Tiers** — add:
  - "Does the dispatch debrief count toward my Lumi limit?" → free: 1/month standalone; paid: counts as 1 run from your pool.

Keep the FAQ JSON-LD generation (`SEO_ENTRIES`) unchanged — it auto-picks the new entries.

### Out of scope

No new analytics events beyond the reaction row itself. No edits to `routeTree.gen.ts`, `src/integrations/supabase/*`, `.env`. No localization of the new FAQ entries (English only, existing fallback handles others). No changes to the debrief card.

### Technical notes

- Reaction upsert uses `onConflict: 'post_id,user_id'`.
- Aggregate RPC is `STABLE SECURITY DEFINER` with `SET search_path = public`, exposed via `GRANT EXECUTE ... TO anon, authenticated`.
- The disagree-thread opener prompt is fixed (no per-dispatch LLM call needed for the seed; the dispatch title/excerpt is interpolated). Keeps latency low and avoids a Gateway call on every disagree click.
- Mobile: option buttons become a 1-col stack; aggregate readout uses the same hairline-bordered card pattern as the debrief card.
