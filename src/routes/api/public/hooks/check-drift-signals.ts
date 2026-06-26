/**
 * Future Operator — drift signal checker.
 *
 * TRIGGER: scheduler every 4h.
 * Header: `x-cron-secret: $FUTURE_OPERATOR_WEBHOOK_SECRET`.
 *
 * Per Practitioner+ profile, enforces:
 *   - paused_until null or in the past
 *   - next_drift_signal_at null or <= now()
 *   - drift signals delivered today < per-day cap
 *   - now() within notification window (UTC of the user's timezone)
 *
 * Evaluates trigger conditions in priority order and fires the first one
 * that matches:
 *   1. renewal-urgency  (pending_renewal_at <= now() + 14 days)
 *   2. quest-drift      (a quest incomplete for 2+ days)
 *   3. inactivity       (no q_runs in last 5 days)
 *   4. lumi-drift       (no q_runs in last 7 days)
 *
 * On no match, bumps next_drift_signal_at by random 6–28h to keep cadence
 * unpredictable.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/check-drift-signals")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env.FUTURE_OPERATOR_WEBHOOK_SECRET;
        if (!cronSecret || request.headers.get("x-cron-secret") !== cronSecret) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { generateDriftSignalFor } = await import("@/lib/future-operator.server");
        const { DESIGNATION_RANK, tierToDesignation } = await import("@/lib/entitlements");

        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const { data: profiles, error } = await supabaseAdmin
          .from("future_operator_profiles")
          .select(
            "user_id, paused_until, next_drift_signal_at, last_quest_generated_at, active_quests, pending_renewal_at, current_focus_account",
          );
        if (error) return Response.json({ error: error.message }, { status: 500 });

        const userIds = (profiles ?? []).map((p) => p.user_id);
        const tierByUser = new Map<string, string | null>();
        if (userIds.length) {
          const { data: subs } = await supabaseAdmin
            .from("subscriptions")
            .select("user_id, tier, designation, status")
            .in("user_id", userIds)
            .eq("status", "active");
          for (const s of subs ?? []) {
            tierByUser.set(
              s.user_id,
              (s.designation as string | null) ?? tierToDesignation(s.tier),
            );
          }
        }

        const results: Array<{ user_id: string; fired?: string; skipped?: string }> = [];

        for (const p of profiles ?? []) {
          const d = tierByUser.get(p.user_id);
          if (!d || DESIGNATION_RANK[d as keyof typeof DESIGNATION_RANK] < DESIGNATION_RANK.practitioner) {
            results.push({ user_id: p.user_id, skipped: "tier" });
            continue;
          }
          if (p.paused_until && new Date(p.paused_until) > now) {
            results.push({ user_id: p.user_id, skipped: "paused" });
            continue;
          }
          if (p.next_drift_signal_at && new Date(p.next_drift_signal_at) > now) {
            results.push({ user_id: p.user_id, skipped: "scheduled" });
            continue;
          }

          // Per-day cap precheck (the generator also enforces this).
          const { count: deliveredToday } = await supabaseAdmin
            .from("future_operator_notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", p.user_id)
            .eq("type", "drift-signal")
            .gte("delivered_at", startOfDay.toISOString());
          if ((deliveredToday ?? 0) >= 2) {
            results.push({ user_id: p.user_id, skipped: "cap" });
            continue;
          }

          // Evaluate triggers in priority order.
          let triggerType: string | null = null;
          let triggerContext: Record<string, unknown> = {};

          if (p.pending_renewal_at) {
            const renewal = new Date(p.pending_renewal_at);
            const days = (renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            if (days >= 0 && days <= 14) {
              triggerType = "renewal-urgency";
              triggerContext = {
                renewal_in_days: Math.round(days),
                account: p.current_focus_account,
              };
            }
          }

          if (!triggerType && Array.isArray(p.active_quests) && p.last_quest_generated_at) {
            const ageDays =
              (now.getTime() - new Date(p.last_quest_generated_at).getTime()) /
              (1000 * 60 * 60 * 24);
            type Quest = { id: string; label?: string; completed?: boolean };
            const stale = (p.active_quests as Quest[]).find((q) => !q.completed);
            if (ageDays >= 2 && stale) {
              triggerType = "quest-drift";
              triggerContext = { quest_id: stale.id, quest_label: stale.label, days_open: Math.floor(ageDays) };
            }
          }

          if (!triggerType) {
            const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const { count: recent } = await supabaseAdmin
              .from("q_runs")
              .select("id", { count: "exact", head: true })
              .eq("user_id", p.user_id)
              .gte("created_at", fiveDaysAgo.toISOString());
            if ((recent ?? 0) === 0) {
              const { count: weekRecent } = await supabaseAdmin
                .from("q_runs")
                .select("id", { count: "exact", head: true })
                .eq("user_id", p.user_id)
                .gte("created_at", sevenDaysAgo.toISOString());
              if ((weekRecent ?? 0) === 0) {
                triggerType = "lumi-drift";
                triggerContext = { days_inactive: 7 };
              } else {
                triggerType = "inactivity";
                triggerContext = { days_inactive: 5 };
              }
            }
          }

          if (!triggerType) {
            // No trigger — bump next attempt.
            const hours = 6 + Math.random() * 22;
            const next = new Date(now.getTime() + hours * 60 * 60 * 1000);
            await supabaseAdmin
              .from("future_operator_profiles")
              .update({ next_drift_signal_at: next.toISOString() } as never)
              .eq("user_id", p.user_id);
            results.push({ user_id: p.user_id, skipped: "no-trigger" });
            continue;
          }

          try {
            await generateDriftSignalFor(p.user_id, triggerType, triggerContext);
            results.push({ user_id: p.user_id, fired: triggerType });
          } catch (e) {
            results.push({ user_id: p.user_id, skipped: String((e as Error).message ?? e) });
          }
        }

        return Response.json({ processed: results.length, results });
      },
    },
  },
});
