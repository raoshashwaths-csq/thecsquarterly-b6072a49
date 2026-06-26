/**
 * Future Operator — daily quest generation webhook.
 *
 * TRIGGER: scheduler (n8n / pg_cron) at 07:30 per timezone batch.
 * Header: `x-cron-secret: $FUTURE_OPERATOR_WEBHOOK_SECRET`.
 * Body (optional): `{ "batch_timezone": "UTC" }`. When omitted, processes all
 * Practitioner+ users with a profile, not paused, whose last_quest_generated_at
 * is before the start of today (UTC).
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/generate-daily-quests")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env.FUTURE_OPERATOR_WEBHOOK_SECRET;
        if (!cronSecret || request.headers.get("x-cron-secret") !== cronSecret) {
          return new Response("Unauthorized", { status: 401 });
        }

        let body: { batch_timezone?: string } = {};
        try {
          body = (await request.json()) as typeof body;
        } catch {
          /* empty body ok */
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { generateDailyQuestsFor } = await import("@/lib/future-operator.server");
        const { DESIGNATION_RANK, tierToDesignation } = await import("@/lib/entitlements");

        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);

        let q = supabaseAdmin
          .from("future_operator_profiles")
          .select("user_id, timezone, paused_until, last_quest_generated_at");
        if (body.batch_timezone) q = q.eq("timezone", body.batch_timezone);

        const { data: profiles, error } = await q;
        if (error) return Response.json({ error: error.message }, { status: 500 });

        const eligible = (profiles ?? []).filter((p) => {
          if (p.paused_until && new Date(p.paused_until) > new Date()) return false;
          if (p.last_quest_generated_at && new Date(p.last_quest_generated_at) >= startOfDay) return false;
          return true;
        });

        // Gate to Practitioner+ by joining subscriptions.
        const userIds = eligible.map((p) => p.user_id);
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

        const results: Array<{ user_id: string; ok: boolean; error?: string }> = [];
        for (const p of eligible) {
          const d = tierByUser.get(p.user_id);
          if (!d || DESIGNATION_RANK[d as keyof typeof DESIGNATION_RANK] < DESIGNATION_RANK.practitioner) {
            results.push({ user_id: p.user_id, ok: false, error: "tier_below_practitioner" });
            continue;
          }
          try {
            const r = await generateDailyQuestsFor(p.user_id);
            results.push({ user_id: p.user_id, ok: r.ok });
          } catch (e) {
            results.push({ user_id: p.user_id, ok: false, error: String((e as Error).message ?? e) });
          }
        }

        return Response.json({ processed: results.length, results });
      },
    },
  },
});
