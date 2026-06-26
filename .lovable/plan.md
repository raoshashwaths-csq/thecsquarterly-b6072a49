## Future Operator — implementation plan

Builds the PRD as a Lumi persona (not a new agent), gated at Practitioner+, with a separate admin-controlled budget. New `/account/quests` route, header bell, and reflection prompts that open the Lumi drawer with a seeded first message.

---

### 1. Data model (one migration)

`supabase/migrations/<ts>_future_operator.sql`:

- `future_operator_profiles` — keyed by `user_id uuid references auth.users(id) on delete cascade`, unique. Fields per PRD plus:
  - `pending_renewal_at timestamptz` (replaces loose `pending_renewal text` so the 14-day drift check is deterministic)
  - `timezone text default 'UTC'`, `notification_window_start time default '08:00'`, `notification_window_end time default '21:00'`
  - `paused_until timestamptz` (subscriber-controlled mute)
  - `check (array_length(core_commitments, 1) between 1 and 3)`
- `future_operator_notifications` — per PRD, plus `idx_fo_notifications_user_unread`.
- GRANTs in the same migration (project rule):
  ```
  grant select, update on public.future_operator_notifications to authenticated;
  grant select, insert, update on public.future_operator_profiles to authenticated;
  grant all on both tables to service_role;
  ```
- Enable RLS, then:
  - `future_operator_profiles`: `for all to authenticated using (user_id = auth.uid())`.
  - `future_operator_notifications`: SELECT + UPDATE `using (user_id = auth.uid())`. No INSERT policy — server-only via `supabaseAdmin`.
- `app_settings` row: `key='future_operator.limits'`, `value={"daily_quest_calls_per_user_per_day":1,"drift_signals_per_user_per_day":2,"reflection_calls_per_user_per_day":4,"monthly_global_cap":null}`.
- No `last_active_at` column added — reuse `lumi_memory.last_seen_at` + `q_usage` activity for inactivity detection.

### 2. Tier gate — Practitioner+

- New helper `canUseFutureOperator(designation)` in `src/lib/tiers.ts` → `true` for `practitioner | operator | team | scale | enterprise | strategic_partner`.
- Every server fn and the `/account/quests` route call `useEntitlements()` / server-side `has_role`-style check before doing work; lower tiers see an upsell card.

### 3. Lumi persona, not a new agent

- All generation uses the Lovable AI Gateway (`ai.gateway.lovable.dev`, `LOVABLE_API_KEY`) — same shape as `lumi-knowledge.functions.ts`. Models:
  - Quests + drift signals: `google/gemini-2.5-flash`.
  - Intro message + reflection prompts: `google/gemini-2.5-pro`.
- New `src/lib/future-operator-voice.ts` exports `FUTURE_OPERATOR_VOICE_RULES` (the PRD's voice block). Every prompt = `LUMI_BASE_VOICE` + `FUTURE_OPERATOR_VOICE_RULES` + the specific task instructions, so the Lumi voice owns the persona.
- UI uses `<LumiMark />` (gold variant) as the "Future Operator" avatar — no new mark asset, no new agent name in chrome.

### 4. Server functions — `src/lib/future-operator.functions.ts`

All use `createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(...).handler(...)` and read user state via `context.supabase` (RLS-scoped):

- `getFutureOperatorProfile()` — returns row or null.
- `saveFutureOperatorOnboarding({ future_team_state, core_commitments[], current_focus_account, timezone })` — upserts profile, kicks intro message generation.
- `getQuests()` — returns today's `active_quests` + today's notifications.
- `completeQuest({ questId })` — flips `completed:true`, creates a `reflection-prompt` notification using that quest's `lumi_followup`. If all 3 done, creates a "Future Operator completion" notification.
- `listNotifications({ limit })` / `markNotificationRead({ id })` / `markAllRead()` / `actOnNotification({ id })`.
- `pauseFutureOperator({ days })` / `resumeFutureOperator()`.

Service-role-only helpers in `src/lib/future-operator.server.ts` (loaded inside handlers / hook routes):

- `generateDailyQuestsFor(userId)`
- `generateDriftSignalFor(userId, triggerType, triggerContext)`
- `generateReflectionPromptFor(userId, triggerEvent, triggerContext)`
- `generateIntroMessageFor(userId)`
- `assertFutureOperatorBudget(userId, kind)` — reads `app_settings.future_operator.limits`, counts today's notifications by `type`, throws on exceed and writes a `lumi_events` row (`future_operator.budget_blocked`). This is the SEPARATE admin budget — never decrements `q_usage`.

### 5. n8n webhook endpoints

Under `src/routes/api/public/hooks/`, HMAC-verified with new secret `FUTURE_OPERATOR_WEBHOOK_SECRET` (mirrors existing hooks like `analyze-interactions.ts`):

- `generate-daily-quests.ts` — body `{ batch_timezone }`. Fan-out: every Practitioner+ user with a profile, `paused_until` null, `last_quest_generated_at < today`. Calls `generateDailyQuestsFor` per user.
- `check-drift-signals.ts` — runs every 24h. Per user: enforce per-day cap + notification window + `paused_until` + 24h spacing, evaluate the 5 PRD trigger conditions (inactivity, quest drift, missed Monday check-in, `pending_renewal_at <= now()+14d`, Lumi drift), call `generateDriftSignalFor` when matched, else bump `next_drift_signal_at` by random 6–28h.
- `dispatch-read.ts` — called from the dispatch page when scroll depth ≥ 90%. Calls `generateReflectionPromptFor(userId, 'dispatch_read', { slug })`.

### 6. Onboarding extension

`src/lib/onboarding.functions.ts` already handles the 5-question flow. Add a follow-on step rendered after `finishOnboarding` returns, ONLY for Practitioner+ users:

- New component `src/components/onboarding/FutureOperatorStep.tsx` — three sequential questions per PRD, typing UI, dark background, `<LumiMark variant="gold" />`. On submit calls `saveFutureOperatorOnboarding`. Intro message is generated server-side and the next route render shows it as a full-screen modal once, then it lives in the notification panel.

### 7. New surface: `/account/quests`

- New route file `src/routes/account.quests.tsx` (sibling of existing `account.workspace.tsx`, `account.api.tsx` — flat dotted convention, generated route id `/account/quests`).
- `head()` with route-specific title/description.
- `loader` calls `context.queryClient.ensureQueryData(questsQueryOptions())`; component uses `useSuspenseQuery`.
- Renders:
  - Top: "Today's quests" — 3 `MetricCard`-styled cards (project dashboard kit) per PRD layout (label, instruction, commitment + estimated minutes, "Mark complete" button using `--accent`). Completed state with gold check + "Open Lumi debrief" secondary CTA.
  - Below: Future Operator commitments, focus account, paused state with "Pause for 7 days / Resume" controls.
- Tier gate: lower tiers see an upsell card instead of quests.

### 8. Header — link in avatar dropdown + bell

`src/components/site/SiteHeader.tsx`:

- Add a new `DropdownMenuItem` linking to `/account/quests` inside the existing avatar dropdown (positioned right under "Your Workspace"). Label: `t("menu.futureOperator")` → "Future Operator" (mono uppercase, matches surrounding items).
- New `NotificationBell` component placed to the left of the avatar (logged-in only, Practitioner+ only):
  - Bell icon (lucide `Bell`), unread-count badge in `--secondary-accent` (gold).
  - Click opens a `Popover` panel (max-h 480, scrollable) per PRD spec — gold left border for unread, mono eyebrow label for type, serif body, gold text-link CTA.
  - CTAs navigate to `/account/quests`, `/account?lumi=open&seed=<notificationId>`, etc.
  - Logged-out users get nothing; sub-Practitioner users see the bell with a one-line "Upgrade for Future Operator" empty state (no upsell pressure in the chrome).

### 9. Reflection prompts → Lumi drawer (not Situation Room)

- The Lumi drawer (`?lumi=open` is already used elsewhere — confirmed during exploration of CSFactors Q wiring) gains a `seed` query param: `?lumi=open&seed=<notificationId>`.
- On open, the drawer fetches the notification, pre-pends its `message` as the first Lumi turn ("Future Operator persona"), and the user replies inline. This does NOT call `startSituation` and does NOT touch the Situation Room one-shot lock or its quota.
- Each reflection-prompt notification stores `action_route: '/?lumi=open&seed=<id>'` (or the user's current route + `?lumi=open&seed=<id>` when generated from an in-product event).

### 10. Admin control panel

Extend `src/lib/control-panel.functions.ts` and `src/routes/admin.control-panel.tsx` Overview tab:

- New `FutureOperatorLimitsCard`: inputs for `daily_quest_calls_per_user_per_day`, `drift_signals_per_user_per_day`, `reflection_calls_per_user_per_day`, optional `monthly_global_cap`. Server fns `getFutureOperatorSettings` / `updateFutureOperatorSettings` (admin-gated, `admin_audit_log` entry on write).
- Diagnostics tab gains a "Future Operator" tile: 30-day counters for notifications by type, budget blocks, paused-user count — from `lumi_events` + the notifications table.

### 11. Voice rules constant (`src/lib/future-operator-voice.ts`)

Exports the PRD voice block verbatim. Concatenated into every Future Operator prompt. Also enforces: under 80 / 60 / 40 words (drift / quest instruction / reflection), first person, at least one piece of user-specific context referenced (account name, commitment, metric, or situation) — the constant includes the explicit "if it could have been sent to anyone, it fails" line.

### 12. Verification (mirrors PRD checklist + project-specific items)

1. Migration applies; GRANTs present; RLS denies cross-user reads (verified via `supabase--read_query` with `set role authenticated`).
2. Onboarding extension appears only for Practitioner+; on Reader/free, the 6th step is skipped.
3. Intro message renders as a full-screen modal once, then persists in the notification panel.
4. n8n hook with valid HMAC populates `active_quests`; with bad HMAC returns 401.
5. `/account/quests` renders 3 quest cards; marking complete creates a reflection notification and the "Open Lumi debrief" CTA opens the Lumi drawer pre-seeded with `lumi_followup`.
6. Drift checker honours per-day cap, notification window, `paused_until`, and 4h spacing; `next_drift_signal_at` is randomised.
7. Bell shows correct unread count, gold left border on unread items, max-h 480, scrollable.
8. Pause/resume from `/account/quests` suppresses generation across all three workflows.
9. Future Operator generation does NOT decrement `q_usage`; admin budget block writes `future_operator.budget_blocked` to `lumi_events`.
10. Reflection-prompt CTAs never navigate to `/situation-room`.
11. Every generated message contains at least one user-specific token (account name, commitment, metric, or situation) — spot-check via prompt logging in dev.

---

### Technical notes

- Server fns live under `src/lib/`, never `src/server/` (project rule).
- All AI calls go through `ai.gateway.lovable.dev` with `LOVABLE_API_KEY`. No Anthropic SDK, no direct `api.anthropic.com`.
- Service-role client (`supabaseAdmin`) is imported only inside handler bodies, never at module scope of route files or `*.functions.ts`.
- Avatar dropdown link uses TanStack `<Link to="/account/quests">` — never `<a href>`.
- New route file is `src/routes/account.quests.tsx` with `createFileRoute("/account/quests")`.
- Secret to add via `secrets--add_secret`: `FUTURE_OPERATOR_WEBHOOK_SECRET`.