
## Scope

Five front-end + one schema change. No edits to existing API routes, `askQ` handler, RLS model on existing tables, or auth flow. Editorial typography and oxblood/gold palette tokens stay untouched.

---

## 1. Restore Q's guided flow + anonymous gate

**File:** `src/components/site/QAgentButton.tsx` (and a new `src/lib/q-vectors.ts`).

- Replace the current 3 short "Try" chips with a **Suggested Vectors** row directly below the Ask button: horizontally scrollable rail of parchment pills (`border border-border bg-card/70`, oxblood-on-hover, font-body, generous tracking). Three exact strings, sourced from a new `src/lib/q-vectors.ts` so they're easy to extend:
  1. *"Navigating alignment issues with department leadership during performance review cycles."*
  2. *"Defending account Net Retention Rate (NRR) during aggressive internal client restructuring."*
  3. *"Managing professional diplomacy when a cross-functional project faces executive scrutiny."*
  - Clicking a pill seeds the input and focuses it (existing pattern).
  - Pills also remain visible after the input has text (do **not** hide them on type), to keep the guided framework prominent.
- **Anonymous gate (1 free question):** the `gated` derivation already exists (`!user || (trialUsed && !unlimited) || capped`). Keep it, but:
  - On the **first** answered question for an anonymous user, after `setAnswer(...)`, immediately open a new `AnonymousGateModal` (Dialog) instead of leaving the user able to keep typing into a disabled input.
  - The modal is an editorial parchment card: "You've used your one free question with Q." → two CTAs: **Sign in** (`/login`) and **See pricing** (`/pricing`). No close-X; only an esc-to-dismiss that re-disables the input.
  - Persist `q.trial.used = "1"` (already in place via `TRIAL_KEY`) — no schema change for this.

## 2. End-of-day sentiment check-in pipeline

**New schema** (single migration; the only DB change in this plan):

```sql
CREATE TABLE public.user_daily_sentiment (
  id uuid PK default gen_random_uuid(),
  user_id uuid NOT NULL,                         -- no FK to auth.users per house rules
  date date NOT NULL,
  raw_text_feedback text NOT NULL,
  calculated_sentiment_score text NOT NULL,      -- 'positive' | 'neutral' | 'negative'
  flagged_keywords text[] NOT NULL DEFAULT '{}', -- which trigger words fired
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
-- GRANT SELECT, INSERT, UPDATE on public.user_daily_sentiment TO authenticated;
-- GRANT ALL TO service_role;
-- RLS: owner SELECT/INSERT/UPDATE WHERE auth.uid() = user_id.
```

**No new edge function.** Two new server fns in `src/lib/sentiment.functions.ts`:
- `recordDailySentiment` — INSERT/UPSERT, owner-scoped via `requireSupabaseAuth`.
- `getMonthlySentiment` — returns the last 30 daily rows for the signed-in user.

**Trigger detection** (client, in `QAgentButton.handleAsk`):
- Lightweight regex against the question for: `escalation`, `HOD`, `performance dispute`, `churn risk`, `scrutiny`, `restructuring`, `executive review`, `pip`, `appraisal conflict`. Configurable in `src/lib/sentiment.keywords.ts`.
- If matched, set `sessionStorage["q.flagged.today"] = "<ISO date> | <keyword>"`.

**Evening check-in UI** — new `src/components/site/EndOfDaySentimentCheckIn.tsx`, mounted in `__root.tsx` (logged-in only, same place as `QAgentButton`):
- On mount, read `sessionStorage["q.flagged.today"]` and a local `endofday.{userId}.{YYYY-MM-DD}` flag.
- Shows a non-intrusive bottom-right drawer (using `Sheet side="bottom"`) when:
  - flagged today, AND
  - local time ≥ 18:00, AND
  - drawer not already dismissed/submitted today for this user.
- Copy: *"Checking in. You flagged some critical corporate friction earlier today. How are you holding up? How did the escalation call or alignment connect turn out?"*
- Large `<textarea>` (parchment card, Cormorant prompt + Instrument Sans body), Submit button.
- On submit: call **`scoreSentiment(text)`** — a pure client lexicon scorer in `src/lib/sentiment.score.ts` (no AI gateway round-trip needed; weighted positive/negative lemma list → `positive` | `neutral` | `negative`). Then call `recordDailySentiment`. Set the local-dismiss flag.

**Monthly Sentiment sub-panel** — new `src/components/site/SentimentTrendPanel.tsx`, mounted inside `src/routes/account.workspace.tsx` as a new editorial section:
- Pulls `getMonthlySentiment()` via `useQuery`.
- Renders a thin SVG sparkline (positive=emerald, neutral=foreground/40, negative=destructive) over a 30-day rolling window, plus a 3-cell distribution matrix using existing `MetricCard` + `HealthChip` from `src/components/dashboard/` (per the dashboard-kit memory; no new color tokens).

## 3. Operational resilience layer around Q

**New file** `src/components/site/QErrorBoundary.tsx` — class component implementing `componentDidCatch`. Renders an editorial fallback card ("Q lost the signal. Your draft is safe — tap to retry.") with a retry button that resets `state.hasError` and re-mounts children.

**Mount:** wrap `<QAgentButton />` in `__root.tsx`, and `<QAgentDrawer />` in `src/routes/csfactors.tsx`, with `<QErrorBoundary />`.

**Local draft cache** in `QAgentButton` + `QAgentDrawer`:
- On every `setQuery`/`setInput`, write to `sessionStorage["q.draft.global"]` / `"q.draft.csfactors"`.
- On mount, hydrate from sessionStorage if non-empty.
- Clear on successful answer.
- Also stash the last `messages[]` array (CSFactors drawer) under `sessionStorage["q.transcript.csfactors"]` and rehydrate on remount — protects against network drops mid-session.

## 4. Declutter Q UI + standardize global placement

**Declutter (`QAgentButton.tsx`):**
- Remove the rotating capability speech bubble (`bubble`, `bubbleIdx`, `CAPABILITY_LINES`, `q-hint`) — visual noise.
- Remove the scope toggle's caption block (lines ~306–312) and tighten margins; keep the toggle itself.
- Increase composer padding (`p-7 md:p-9` → keep; tighten internal spacing); single 16px gutter between input, Ask button, vectors rail, and answer slot. No other typographic changes.

**Standardize placement:**
- Today `QAgentButton` early-returns on `/admin`, `/agent`, `/csfactors`. Loosen this:
  - **`/csfactors`**: keep the dedicated `QAgentDrawer` (it's scoped to portfolio data, per the Q-isolation memory). Do not double-mount the global button there.
  - **`/admin`**: keep hidden (admin surface).
  - **All other routes including `/agent/framework` and `/job-board`**: render the global `QAgentButton` at the same fixed bottom-right anchor (`fixed bottom-20 right-5 md:bottom-28 md:right-8`).
- No size/shape change — just remove `/agent` from the hide-list and let the existing fixed positioning do its job. This satisfies "exact same visual screen position across ALL pages".

## 5. Lift Workspace + Canvas for signed-in users

**File:** `src/components/site/SiteHeader.tsx`.

- Today: when signed in, Workspace lives only inside the avatar dropdown, Canvas (`/agent/framework`) isn't in the header at all.
- Change: when `user` is present, render two header chips immediately before the avatar (both visible from `md:` and up; on `<md`, only Canvas chip shows to save room, full set in avatar menu):
  - **Canvas** → `/agent/framework` (LayoutGrid icon already imported; swap for `Sparkles`-style mark? No — keep `LayoutGrid`-class chip, label "Canvas").
  - **Workspace** → `/account/workspace` (replaces the conditional `canWorkspace` chip that currently only appears on non-home routes; show it everywhere when signed in).
- Both rendered as `inline-flex … border border-border hover:border-accent hover:text-accent` chips in the existing mono `[0.25em]` style, matching the search/workspace chip pattern.
- When **not** signed in, neither chip renders; the existing "Login" button stays as the last item (matches Core memory rule: sign-in is the last item when logged out).

---

## Technical details (out-of-band)

- **Files created**
  - `supabase/migrations/<ts>_user_daily_sentiment.sql`
  - `src/lib/q-vectors.ts`
  - `src/lib/sentiment.keywords.ts`
  - `src/lib/sentiment.score.ts` (pure function, no network)
  - `src/lib/sentiment.functions.ts` (two server fns)
  - `src/components/site/QErrorBoundary.tsx`
  - `src/components/site/EndOfDaySentimentCheckIn.tsx`
  - `src/components/site/SentimentTrendPanel.tsx`
- **Files edited (surgical)**
  - `src/components/site/QAgentButton.tsx` — vectors rail, gate modal, declutter, draft cache, drop `/agent` from hide-list
  - `src/components/csfactors/QAgentDrawer.tsx` — wrap in boundary, draft cache, transcript cache
  - `src/components/site/SiteHeader.tsx` — Canvas + Workspace chips
  - `src/routes/__root.tsx` — wrap QAgentButton, mount EndOfDaySentimentCheckIn
  - `src/routes/csfactors.tsx` — wrap QAgentDrawer in boundary
  - `src/routes/account.workspace.tsx` — mount SentimentTrendPanel
- **Untouched**
  - `askQ` / `askCSFactorsQ` server fns
  - `/api/elevenlabs/stt`
  - `subscriptions`, `q_runs`, `cs_*` tables and policies
  - All other audit items (#4–#15 from the prior pass)
  - The CSFactors Q drawer's data scope (no cross-leakage to global Q)

## Open assumption to confirm

I'm treating **Canvas = `/agent/framework`** (the operator decision canvas) and **Workspace = `/account/workspace`**. If "Canvas" should instead point at something new, tell me and I'll wire that route instead before building.
