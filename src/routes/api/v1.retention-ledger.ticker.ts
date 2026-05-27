import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Surfaces the live retention ticker derived from survey_responses aggregates.
// Until a dedicated retention_ledger table exists, we derive a rolling
// snapshot from the foundational/agent scores submitted via /ai-readiness.
export const Route = createFileRoute("/api/v1/retention-ledger/ticker")({
  server: {
    handlers: {
      GET: async () => {
        const { data, error } = await supabaseAdmin
          .from("survey_responses")
          .select("tier, foundational_score, agent_score, created_at")
          .not("foundational_score", "is", null)
          .order("created_at", { ascending: false })
          .limit(500);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const rows = data ?? [];
        const avg = (key: "foundational_score" | "agent_score") => {
          const vs = rows.map((r: any) => Number(r[key])).filter((n) => Number.isFinite(n));
          return vs.length ? +(vs.reduce((s, v) => s + v, 0) / vs.length).toFixed(2) : null;
        };
        const tierCounts: Record<string, number> = {};
        rows.forEach((r: any) => {
          if (r.tier) tierCounts[r.tier] = (tierCounts[r.tier] || 0) + 1;
        });

        return new Response(
          JSON.stringify({
            asOf: new Date().toISOString(),
            sampleSize: rows.length,
            indices: {
              foundational: avg("foundational_score"),
              agent: avg("agent_score"),
            },
            tierDistribution: tierCounts,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=300",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      },
    },
  },
});
