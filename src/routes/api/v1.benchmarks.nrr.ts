import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/v1/benchmarks/nrr")({
  server: {
    handlers: {
      GET: async () => {
        const { data, error } = await supabaseAdmin
          .from("benchmark_drops")
          .select("period, segment, value, notes, created_at")
          .eq("published", true)
          .eq("metric", "NRR")
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(
          JSON.stringify({
            metric: "NRR",
            unit: "percent",
            source: "The CS Quarterly operator panel",
            count: data?.length ?? 0,
            data: data ?? [],
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
