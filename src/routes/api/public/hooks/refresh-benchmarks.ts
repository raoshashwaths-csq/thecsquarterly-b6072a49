/**
 * Weekly Benchmark Refresh — Workflow Two.
 *
 * TRIGGER: pg_cron, Monday 07:00 UTC. Same x-cron-secret header as Workflow 1.
 *
 * Metrics computed from `cs_accounts` (only those available today; see notes):
 *   - health (0-100)
 *   - final_cs_nps
 *   - implementation_progress (0-100)
 *   - arr_retention_ratio = invoiced_arr / carr (NRR proxy)
 *
 * Segments: "all" + each tier value present in the data.
 * Outlier rules: health [0..100], nps [-100..100], progress [0..100],
 * arr_retention_ratio [0.5..2.0].
 *
 * Records with sample_size < MIN_SAMPLE are NOT upserted; they are
 * reported under `notice` for review.
 */
import { createFileRoute } from "@tanstack/react-router";

const MIN_SAMPLE = 30;
const DISTILL_MODEL = "anthropic/claude-sonnet-4-5";
const EMBED_MODEL = "openai/text-embedding-3-small";
const EMBED_DIM = 1536;

type Metric = {
  metric: string;
  segment: string;
  p25: number | null;
  p50: number | null;
  p75: number | null;
  sample_size: number;
};

const METRIC_DEFS: Array<{
  name: string;
  expr: string; // SQL expression returning the numeric value
  range: [number, number];
}> = [
  { name: "health", expr: "health", range: [0, 100] },
  { name: "final_cs_nps", expr: "final_cs_nps", range: [-100, 100] },
  { name: "implementation_progress", expr: "implementation_progress", range: [0, 100] },
  {
    name: "arr_retention_ratio",
    expr: "(invoiced_arr / NULLIF(carr, 0))",
    range: [0.5, 2.0],
  },
];

async function embed(apiKey: string, text: string): Promise<number[] | null> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({ model: EMBED_MODEL, input: text.slice(0, 4000), dimensions: EMBED_DIM }),
  });
  if (!res.ok) return null;
  const j = (await res.json()) as { data?: Array<{ embedding?: number[] }> };
  const v = j.data?.[0]?.embedding;
  return Array.isArray(v) && v.length === EMBED_DIM ? v : null;
}

async function distill(
  apiKey: string,
  newRows: Metric[],
  prior: Map<string, { p50: number | null; sample_size: number | null }>,
): Promise<Array<{ content: string }>> {
  const newPayload = newRows.map((r) => ({
    metric: r.metric,
    segment: r.segment,
    p25: r.p25,
    p50: r.p50,
    p75: r.p75,
    sample_size: r.sample_size,
  }));
  const priorPayload = newRows.map((r) => ({
    metric: r.metric,
    segment: r.segment,
    previous_p50: prior.get(`${r.metric}::${r.segment}`)?.p50 ?? null,
  }));

  const sys = `You are a knowledge curator for Lumi, the CS Quarterly's AI advisor. Based on these benchmark updates, write 2 knowledge records Lumi can reference when discussing portfolio performance with CS practitioners. Include the actual numbers. Be specific. Focus on what changed and what a practitioner should infer. 2-3 sentences per record. Return JSON: {"records":[{"content":"..."},{"content":"..."}]}.`;
  const user = `New data:\n${JSON.stringify(newPayload, null, 2)}\n\nPrevious data:\n${JSON.stringify(priorPayload, null, 2)}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({
      model: DISTILL_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`distill_failed_${res.status}`);
  const j = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const parsed = JSON.parse(j.choices?.[0]?.message?.content ?? "{}") as {
    records?: Array<{ content?: string }>;
  };
  return (parsed.records ?? [])
    .filter((r) => typeof r.content === "string" && r.content!.trim())
    .slice(0, 2)
    .map((r) => ({ content: r.content!.trim() }));
}

export const Route = createFileRoute("/api/public/hooks/refresh-benchmarks")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env.INGESTION_CRON_SECRET;
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!cronSecret) {
          return new Response(JSON.stringify({ error: "cron_secret_missing" }), {
            status: 500, headers: { "Content-Type": "application/json" },
          });
        }
        if (request.headers.get("x-cron-secret") !== cronSecret) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401, headers: { "Content-Type": "application/json" },
          });
        }
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "ai_not_configured" }), {
            status: 500, headers: { "Content-Type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const period = new Date().toISOString().slice(0, 10); // YYYY-MM-DD week marker

        // Find segments present in the data.
        const { data: tierRows } = await supabaseAdmin
          .from("cs_accounts")
          .select("tier")
          .not("tier", "is", null);
        const tiers = Array.from(
          new Set((tierRows ?? []).map((r) => (r.tier ?? "").trim()).filter(Boolean)),
        );
        const segments = ["all", ...tiers];

        // Compute percentiles. cs_accounts has ~few hundred rows max; pull and
        // compute in Node to avoid an RPC. Filter outliers per metric.
        const { data: accounts, error: accErr } = await supabaseAdmin
          .from("cs_accounts")
          .select("tier, health, final_cs_nps, implementation_progress, invoiced_arr, carr");
        if (accErr) {
          return new Response(JSON.stringify({ error: "accounts_query_failed", detail: accErr.message }), {
            status: 500, headers: { "Content-Type": "application/json" },
          });
        }

        const percentile = (sorted: number[], q: number): number | null => {
          if (sorted.length === 0) return null;
          const pos = (sorted.length - 1) * q;
          const base = Math.floor(pos);
          const rest = pos - base;
          const next = sorted[base + 1] ?? sorted[base];
          return +(sorted[base] + rest * (next - sorted[base])).toFixed(4);
        };

        const collected: Metric[] = [];
        const undersized: Array<{ metric: string; segment: string; sample_size: number }> = [];

        for (const def of METRIC_DEFS) {
          for (const segment of segments) {
            const values: number[] = [];
            for (const a of accounts ?? []) {
              if (segment !== "all" && a.tier !== segment) continue;
              let v: number | null = null;
              if (def.name === "health") v = a.health as number | null;
              else if (def.name === "final_cs_nps") v = a.final_cs_nps as number | null;
              else if (def.name === "implementation_progress") v = a.implementation_progress as number | null;
              else if (def.name === "arr_retention_ratio") {
                if (a.carr && Number(a.carr) > 0 && a.invoiced_arr != null) {
                  v = Number(a.invoiced_arr) / Number(a.carr);
                }
              }
              if (v == null || Number.isNaN(v)) continue;
              if (v < def.range[0] || v > def.range[1]) continue;
              values.push(v);
            }
            values.sort((a, b) => a - b);
            if (values.length < MIN_SAMPLE) {
              undersized.push({ metric: def.name, segment, sample_size: values.length });
              continue;
            }
            collected.push({
              metric: def.name,
              segment,
              p25: percentile(values, 0.25),
              p50: percentile(values, 0.5),
              p75: percentile(values, 0.75),
              sample_size: values.length,
            });
          }
        }

        // Fetch prior values for delta narration before upserting.
        const priorMap = new Map<string, { p50: number | null; sample_size: number | null }>();
        if (collected.length > 0) {
          const { data: prior } = await supabaseAdmin
            .from("benchmark_drops")
            .select("metric, segment, p50, sample_size")
            .in("metric", collected.map((c) => c.metric));
          for (const row of prior ?? []) {
            priorMap.set(`${row.metric}::${row.segment}`, {
              p50: row.p50 as number | null,
              sample_size: row.sample_size as number | null,
            });
          }
        }

        // Upsert benchmarks.
        let upserted = 0;
        if (collected.length > 0) {
          const rows = collected.map((c) => ({
            period,
            metric: c.metric,
            segment: c.segment,
            value: c.p50,
            p25: c.p25,
            p50: c.p50,
            p75: c.p75,
            sample_size: c.sample_size,
            published: true,
            last_calculated_at: new Date().toISOString(),
          }));
          const { error: upErr, data: up } = await supabaseAdmin
            .from("benchmark_drops")
            .upsert(rows as never, { onConflict: "metric,segment,period" })
            .select("id");
          if (upErr) {
            return new Response(JSON.stringify({ error: "upsert_failed", detail: upErr.message }), {
              status: 500, headers: { "Content-Type": "application/json" },
            });
          }
          upserted = up?.length ?? 0;
        }

        // Distill 2 knowledge records (only if we actually published something).
        let knowledgeInserted = 0;
        const errors: Array<{ stage: string; reason: string }> = [];
        if (collected.length > 0) {
          try {
            const records = await distill(apiKey, collected, priorMap);
            if (records.length) {
              // Clear prior benchmark snapshots for this period so re-runs stay idempotent.
              await supabaseAdmin
                .from("lumi_knowledge")
                .delete()
                .eq("source_type", "benchmark")
                .eq("source_slug", `benchmarks-${period}`);

              const rows = await Promise.all(
                records.map(async (r) => ({
                  source_record_id: null,
                  source_slug: `benchmarks-${period}`,
                  source_title: `Weekly benchmarks ${period}`,
                  source_type: "benchmark",
                  content: r.content,
                  content_type: "benchmark_data",
                  confidence_level: "high",
                  language: "en",
                  tree_relevance: [],
                  topic_tags: ["benchmark", "portfolio"],
                  embedding: await embed(apiKey, r.content),
                  is_active: true,
                })),
              );
              const { data: ins, error: insErr } = await supabaseAdmin
                .from("lumi_knowledge")
                .insert(rows as never)
                .select("id");
              if (insErr) errors.push({ stage: "knowledge_insert", reason: insErr.message });
              else knowledgeInserted = ins?.length ?? 0;
            }
          } catch (e) {
            errors.push({ stage: "distill", reason: e instanceof Error ? e.message : "unknown" });
          }
        }

        // Build a human-readable notice (Slack-less notification surface).
        const deltas = collected
          .map((c) => {
            const prev = priorMap.get(`${c.metric}::${c.segment}`)?.p50;
            if (prev == null || c.p50 == null) {
              return `${c.metric} [${c.segment}] p50 ${c.p50} (n=${c.sample_size}, new)`;
            }
            const delta = +(c.p50 - prev).toFixed(4);
            const sign = delta > 0 ? "+" : "";
            return `${c.metric} [${c.segment}] p50 ${prev}→${c.p50} (${sign}${delta}, n=${c.sample_size})`;
          })
          .join("; ");
        const undersizedNotice = undersized.length
          ? ` | undersized (n<${MIN_SAMPLE}, held): ${undersized.map((u) => `${u.metric}/${u.segment}=${u.sample_size}`).join(", ")}`
          : "";
        const notice = `Weekly benchmarks updated. Published ${upserted} metrics. ${deltas}${undersizedNotice}`;

        const status = errors.length === 0 && collected.length > 0 ? "ok"
          : errors.length > 0 ? "partial"
          : "error";

        await supabaseAdmin.from("workflow_runs").insert({
          workflow: "benchmark_refresh",
          articles_processed: 0,
          records_created: knowledgeInserted,
          errors: errors as never,
          status,
          notice,
        });

        return new Response(
          JSON.stringify({
            ok: true,
            period,
            benchmarks_published: upserted,
            knowledge_inserted: knowledgeInserted,
            undersized,
            notice,
            errors,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
