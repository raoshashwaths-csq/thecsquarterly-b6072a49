/**
 * Daily High-Rated Response Curation — Workflow Five.
 *
 * TRIGGER: pg_cron, daily 09:00 UTC. Same x-cron-secret header as other Lumi workflows.
 *
 * For each unprocessed positive lumi_feedback row in the last 24h, distil the
 * insight that made the response valuable into a 2-3 sentence knowledge record
 * Lumi can reuse, embed it, and insert into lumi_knowledge as an
 * interaction_pattern. Then mark the feedback processed.
 *
 * CONFLICTS RESOLVED:
 * - lumi_feedback.rating is text, not integer. We treat ["up","1","positive","thumbs_up"]
 *   as the positive set (mirrors workflow 4's negative set).
 * - q_runs stores no response/answer text. The brief is built from query_text +
 *   context jsonb + the operator's feedback note; the model is told it does not
 *   have the verbatim response and must extract the implied insight.
 * - tree_id is derived from q_runs.node_id (T1-A1 → T1) — same rule as workflow 4.
 */
import { createFileRoute } from "@tanstack/react-router";

const DISTILL_MODEL = "anthropic/claude-sonnet-4-5";
const EMBED_MODEL = "openai/text-embedding-3-small";
const EMBED_DIM = 1536;
const POSITIVE_RATINGS = ["up", "1", "positive", "thumbs_up"];

function treeIdFromNode(nodeId: string | null | undefined): string {
  if (!nodeId) return "unknown";
  const m = /^(T\d+)/.exec(nodeId);
  return m ? m[1] : nodeId;
}

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

type DistilledInsight = {
  insight: string;
  topic_tags: string[];
};

async function distil(
  apiKey: string,
  input: { query_text: string | null; context_snippet: string; note: string | null; tree_id: string },
): Promise<DistilledInsight | null> {
  const sys = `You curate the Lumi knowledge base for The CS Quarterly. A CS practitioner just rated a Lumi response as helpful. Your job is to extract the specific framing, insight, or approach that made the response valuable as a 2-3 sentence knowledge record for future use.

Rules:
- Do not describe the response. Capture the insight itself.
- Write it as something Lumi would say in a future session when a similar situation arises — second person, operator framing, no hype.
- Voice: Economist / Stratechery register. CS operator at $20M-$1B ARR SaaS.
- 2-3 sentences. No preamble, no "the user asked".
- If the signal is too thin to extract a durable insight, return null.

Return strict JSON: {"insight": string, "topic_tags": string[]} or {"insight": null, "topic_tags": []}.`;

  const user = `Tree context: ${input.tree_id}
Original query: ${input.query_text ?? "(none)"}
Run context: ${input.context_snippet || "(none)"}
Operator note on why this was helpful: ${input.note ?? "(none)"}`;

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
  if (!res.ok) return null;
  const j = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  let parsed: Partial<DistilledInsight> & { insight?: string | null } = {};
  try {
    parsed = JSON.parse(j.choices?.[0]?.message?.content ?? "{}");
  } catch {
    return null;
  }
  if (!parsed.insight || typeof parsed.insight !== "string" || !parsed.insight.trim()) return null;
  return {
    insight: parsed.insight.trim(),
    topic_tags: Array.isArray(parsed.topic_tags)
      ? parsed.topic_tags.filter((x): x is string => typeof x === "string").slice(0, 6)
      : [],
  };
}

export const Route = createFileRoute("/api/public/hooks/curate-high-rated")({
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
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // STEP 1 — query unprocessed positive feedback in last 24h
        const { data: feedback, error: fbErr } = await supabaseAdmin
          .from("lumi_feedback")
          .select("id, run_id, rating, note, created_at")
          .gte("created_at", since)
          .in("rating", POSITIVE_RATINGS)
          .eq("processed", false);
        if (fbErr) {
          return new Response(JSON.stringify({ error: "feedback_query_failed", detail: fbErr.message }), {
            status: 500, headers: { "Content-Type": "application/json" },
          });
        }

        const rows = feedback ?? [];
        if (rows.length === 0) {
          await supabaseAdmin.from("workflow_runs").insert({
            workflow: "high_rated_curation",
            articles_processed: 0,
            records_created: 0,
            output: { note: "no_positive_feedback_in_window" },
          });
          return new Response(JSON.stringify({ ok: true, processed: 0, created: 0 }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        // Join → q_runs for query_text, node_id, context
        const runIds = rows.map((f) => f.run_id).filter((x): x is string => !!x);
        const runMap = new Map<string, { node_id: string | null; query_text: string | null; context: unknown }>();
        if (runIds.length) {
          const { data: runs } = await supabaseAdmin
            .from("q_runs")
            .select("id, node_id, query_text, context")
            .in("id", runIds);
          for (const r of runs ?? []) {
            runMap.set(r.id as string, {
              node_id: (r.node_id as string | null) ?? null,
              query_text: (r.query_text as string | null) ?? null,
              context: r.context ?? null,
            });
          }
        }

        // STEP 2-3 — distil + insert per feedback row
        const processedIds: string[] = [];
        const errors: Array<{ id: string; reason: string }> = [];
        let created = 0;
        let skipped = 0;

        for (const f of rows) {
          const run = f.run_id ? runMap.get(f.run_id as string) : undefined;
          const tree_id = treeIdFromNode(run?.node_id);
          const contextSnippet = run?.context
            ? JSON.stringify(run.context).slice(0, 800)
            : "";

          const insight = await distil(apiKey, {
            query_text: run?.query_text ?? null,
            context_snippet: contextSnippet,
            note: (f.note as string | null) ?? null,
            tree_id,
          });

          if (!insight) {
            skipped++;
            processedIds.push(f.id as string); // mark processed even if we skipped — feedback is consumed
            continue;
          }

          const embedding = await embed(apiKey, insight.insight);

          const { error: insErr } = await supabaseAdmin.from("lumi_knowledge").insert({
            source_slug: `feedback-${f.id}`,
            source_title: `Validated insight from ${tree_id}`,
            content: insight.insight,
            content_type: "interaction_pattern",
            source_type: "interaction_analysis",
            confidence_level: "high",
            tree_relevance: tree_id === "unknown" ? [] : [tree_id],
            topic_tags: insight.topic_tags,
            language: "en",
            is_active: true,
            embedding: embedding as unknown as string | null,
          });

          if (insErr) {
            errors.push({ id: f.id as string, reason: insErr.message });
            continue;
          }
          created++;
          processedIds.push(f.id as string);
        }

        // STEP 4 — mark processed
        if (processedIds.length) {
          await supabaseAdmin
            .from("lumi_feedback")
            .update({ processed: true, processed_at: new Date().toISOString() })
            .in("id", processedIds);
        }

        await supabaseAdmin.from("workflow_runs").insert({
          workflow: "high_rated_curation",
          articles_processed: rows.length,
          records_created: created,
          output: { skipped, errors },
        });

        return new Response(
          JSON.stringify({ ok: true, processed: rows.length, created, skipped, errors }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
