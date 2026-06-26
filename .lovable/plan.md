# Situation Room: one-shot guard, quotas, admin controls, metrics

## What changes (user-visible)

1. The Situation Room returns **exactly one read per situation**. The reply box is already gone; we add a clear "Situation complete" state with a "Start new situation" CTA.
2. The form shows a chip like **"3 of 5 situations left this month"** before the user hits submit, and a friendly block screen when they hit zero.
3. Admins get a new "Situation Room" card on the Control Panel → Overview tab to set:
   - **Max prompts per user** (integer)
   - **Reset window** (day / week / month)
4. The server rejects any second message on a session, and any new situation past the user's quota. Both rejections are logged so we can monitor and tune.

## Server-side guard (the core fix)

`src/lib/situation-room.functions.ts`

- `continueSituation` is converted into a hard-reject endpoint. It always throws `SITUATION_SESSION_LOCKED` and writes a `lumi_events` row with `event_type = 'situation.extra_attempt_blocked'`, `meta = { sessionId }`. No AI call, no token spend. (We keep the export to avoid breaking imports, but the route no longer calls it.)
- `startSituation` calls a new `assertSituationQuota(userId)` helper before any AI work:
  - Reads the admin-configured `max_prompts` and `window` from `app_settings`.
  - Counts the user's `situation_sessions` rows where `created_at >= windowStart`.
  - If `used >= max_prompts`, logs `situation.quota_blocked` to `lumi_events` and throws `SITUATION_QUOTA_EXCEEDED`.
- New server fn `getSituationQuota` returns `{ used, max, window, remaining, resetAt }` for the UI chip.

## Admin settings storage

New migration `situation_room_settings`:

```text
table public.app_settings
  key   text primary key
  value jsonb not null
  updated_at timestamptz default now()
  updated_by uuid references auth.users(id)
```

- GRANTs: `service_role` full; no anon, no authenticated direct access.
- RLS enabled; no policies needed because all reads/writes go through admin-gated server functions using `supabaseAdmin`.
- Seed row: `key = 'situation_room.limits'`, `value = { "max_prompts": 5, "window": "month" }`.

New server fns in `src/lib/control-panel.functions.ts`:
- `getSituationRoomSettings` (admin only): returns the current limits.
- `updateSituationRoomSettings` (admin only): validates `max_prompts` (1–100) and `window` (`day` | `week` | `month`), upserts the row, writes an `admin_audit_log` entry.

## Admin UI

`src/routes/admin.control-panel.tsx` → OverviewTab gets a new `SituationRoomLimitsCard`:
- Number input for max prompts.
- Select for window (Daily / Weekly / Monthly).
- Save button → calls `updateSituationRoomSettings`, toast on success.
- Small footnote: "Applies to new situations only. Already-running sessions are unaffected."

## End-user UI

`src/routes/situation-room.tsx`

- Before the textarea: small `QuotaChip` reading `getSituationQuota`. Shows `"3 of 5 left · resets Aug 1"` or `"Unlimited"` for admins.
- If `remaining === 0`, the submit button becomes a disabled "Quota reached" state with a one-line explanation and a link to `/pricing` for upgrade.
- `SituationActive` (post-response panel) gets a new bottom strip:
  - Eyebrow "Situation complete"
  - Copy: "One read per situation. Save this thread, or start a new situation when you're ready."
  - Existing "Start new situation" button stays as the primary CTA.
- Remove the unused `continueSituation`, `reply`, `setReply`, `cont` plumbing (already-dead code from the last change).

## Metrics

Two new event types in the existing `lumi_events` table (no schema change — it's already a free-form `event_type` + `meta`):
- `situation.extra_attempt_blocked` — written from the rejected `continueSituation`.
- `situation.quota_blocked` — written from `assertSituationQuota` when a user hits the cap.

Diagnostics tab gets a small "Situation Room guardrails" tile:
- `Blocked retries (30d)` and `Quota blocks (30d)` counters, sourced from a new admin `getSituationRoomMetrics` server fn aggregating `lumi_events`.

## Technical notes

- All new server fns use `requireSupabaseAuth`; admin endpoints check `has_role(uid, 'admin')` server-side before touching `supabaseAdmin`.
- Window math is UTC-bucketed: `day` = start of UTC day, `week` = ISO Monday 00:00 UTC, `month` = first of UTC month. Same convention as `q-usage.functions.ts`.
- We do **not** raise the AI cap. The new quota is stricter (or equal) and applies only to Situation Room starts.
- No client-side mutation of `app_settings`; only the admin server fns can write.
- Defaults if the settings row is missing: `max_prompts = 5`, `window = month`.

## Verification checklist

1. As a non-admin user, start a situation, then call `continueSituation` directly — must throw `SITUATION_SESSION_LOCKED` and produce one `lumi_events` row.
2. Set max=2/window=day in admin UI, then start 3 situations as the same user — third call throws `SITUATION_QUOTA_EXCEEDED`, the UI chip reads `0 of 2 left · resets tomorrow`, submit is disabled.
3. Diagnostics tile increments after both kinds of blocks.
4. Reload `/situation-room` — only the initial Lumi read renders, no reply textarea, "Situation complete" state visible.
