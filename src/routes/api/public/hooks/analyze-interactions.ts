/**
 * Weekly Interaction Analysis — Workflow Four.
 *
 * TRIGGER: pg_cron, Sunday 08:00 UTC. Same x-cron-secret header as the other Lumi workflows.
 *
 * Reads last 7 days of q_runs (the canonical Lumi run log — lumi_sessions
 * was dropped per the Layer 3 decision) and the unprocessed negative
 * lumi_feedback rows. Aggregates per-tree usage, asks Claude to synthesise
 * patterns, optionally inserts one new knowledge record, marks feedback
 * processed, writes the full brief to workflow_runs.output.
 *
 * `tree_id` is derived from q_runs.node_id: a node like "T1-A1" maps to
 * tree "T1"; everything else (csfactors-ask, chat:askq, situation-room,
 * WORKSPACE_SUMMARY) is treated as its own pseudo-tree.
 */
import { createFileRoute } from "@tanstack/react-router";

const DISTILL_MODEL = "anthropic/claude-sonnet-4-5";
const EMBED_MODEL = "openai/text-embedding-3-small";
const EMBED_DIM = 1536;
const NEGATIVE_RATINGS = ["down", "-1", "negative", "thumbs_down"];

function treeIdFromNode(nodeId: string | null | undefined): string {
  if (!nodeId) return "unknown";
  const m = /^(T\d+)/.exec(nodeId);
  return m ? m[1] : nodeId;
}

const STOPWORDS = new Set([
  "the","a","an","and","or","but","is","are","was","were","be","been","being",
  "to","of","in","on","for","with","at","by","from","as","it","this","that",
  "these","those","i","you","we","they","he","she","my","our","your","their",
  "do","does","did","have","has","had","not","no","so","if","then","than",
  "what","which","who","whom","whose","when","where","why","how","can","could",
  "should","would","will","just","about","into","over","up","down","out","very",
  "really","ok","okay","also","more","most","some","any","one","two","like",
]);

function topKeywords(texts: string[], k: number): Array<{ word: string; count: number }> {
  const counts = new Map<string, number>();
  for (const t of texts) {
    const words = (t || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/);
    for (const w of words) {
      if (!w || w.length < 4 || STOPWORDS.has(w)) continue;
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, k);
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

type TreeStats = {
  tree_id: string;
  session_count: number;
  avg_latency_ms: number | null;
  top_entry_nodes: Array<{ node_id: string; count: number }>;
  top_keywords: Array<{ word: string; count: number }>;
};

type Brief = {
  usage_insight: string;
  gap_identified: string;
  recommended_knowledge_record: {
    content: string;
    tree_relevance: string[];
    topic_tags: string[];
  } | null;
};

async function synthesize(
  apiKey: string,
  usage: TreeStats[],
  feedback: Array<{ tree_id: string; query_text: string | null; note: string | null }>,
): Promise<Brief> {
  const sys = `You are analysing weekly usage patterns for Lumi, The CS Quarterly's AI advisor with 21 decision trees serving CS operators ($20M-$1B ARR SaaS). Based on this data, identify:
1. The 3 most-used trees this week and what this suggests about what CS practitioners are struggling with right now.
2. Any pattern in the low-rated responses — what is Lumi getting wrong or missing?
3. One recommended knowledge record to add based on a gap you identify in the interaction data.

Voice: Economist / Stratechery register. Operator framing. No hype.

Return strict JSON: {"usage_insight": string (2-3 sentences), "gap_identified": string (1-2 sentences), "recommended_knowledge_record": {"content": string, "tree_relevance": string[], "topic_tags": string[]} | null}. Set recommended_knowledge_record to null when the data is too thin to justify a new record.`;

  const user = `Usage data (top 10 trees):\n${JSON.stringify(usage.slice(0, 10), null, 2)}\n\nLow-rated responses (sample of up to 10):\n${JSON.stringify(feedback.slice(0, 10), null, 2)}`;

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
  if (!res.ok) throw new Error(`synthesize_failed_${res.status}`);
  const j = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const parsed = JSON.parse(j.choices?.[0]?.message?.content ?? "{}") as Partial<Brief>;
  return {
    usage_insight: parsed.usage_insight ?? "",
    gap_identified: parsed.gap_identified ?? "",
    recommended_knowledge_record:
      parsed.recommended_knowledge_record &&
      typeof parsed.recommended_knowledge_record.content === "string" &&
      parsed.recommended_knowledge_record.content.trim()
        ? {
            content: parsed.recommended_knowledge_record.content.trim(),
            tree_relevance: Array.isArray(parsed.recommended_knowledge_record.tree_relevance)
              ? parsed.recommended_knowledge_record.tree_relevance.filter(
                  (x): x is string => typeof x === "string",
                )
              : [],
            topic_tags: Array.isArray(parsed.recommended_knowledge_record.topic_tags)
              ? parsed.recommended_knowledge_record.topic_tags.filter(
                  (x): x is string => typeof x === "string",
                )
              : [],
          }
        : null,
  };
}

export const Route = createFileRoute("/api/public/hooks/analyze-interactions")({
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
        const period = new Date().toISOString().slice(0, 10);
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        // STEP 1 — pull last 7d of q_runs
        const { data: runs, error: runsErr } = await supabaseAdmin
          .from("q_runs")
          .select("node_id, query_text, latency_ms, created_at")
          .gte("created_at", since);
        if (runsErr) {
          return new Response(JSON.stringify({ error: "q_runs_query_failed", detail: runsErr.message }), {
            status: 500, headers: { "Content-Type": "application/json" },
          });
        }

        // STEP 2 — aggregate per tree
        type Bucket = {
          tree_id: string;
          latencies: number[];
          nodeCounts: Map<string, number>;
          queries: string[];
        };
        const buckets = new Map<string, Bucket>();
        for (const r of runs ?? []) {
          const tree = treeIdFromNode(r.node_id);
          let b = buckets.get(tree);
          if (!b) {
            b = { tree_id: tree, latencies: [], nodeCounts: new Map(), queries: [] };
            buckets.set(tree, b);
          }
          if (typeof r.latency_ms === "number") b.latencies.push(r.latency_ms);
          const nid = r.node_id ?? "unknown";
          b.nodeCounts.set(nid, (b.nodeCounts.get(nid) ?? 0) + 1);
          if (r.query_text) b.queries.push(r.query_text);
        }
        const usage: TreeStats[] = [...buckets.values()]
          .map((b) => ({
            tree_id: b.tree_id,
            session_count: [...b.nodeCounts.values()].reduce((s, n) => s + n, 0),
            avg_latency_ms: b.latencies.length
              ? Math.round(b.latencies.reduce((s, n) => s + n, 0) / b.latencies.length)
              : null,
            top_entry_nodes: [...b.nodeCounts.entries()]
              .map(([node_id, count]) => ({ node_id, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 3),
            top_keywords: topKeywords(b.queries, 5),
          }))
          .sort((a, b) => b.session_count - a.session_count);

        // STEP 3 — low-rated feedback this week
        const { data: feedbackRaw, error: fbErr } = await supabaseAdmin
          .from("lumi_feedback")
          .select("id, run_id, rating, note, created_at")
          .gte("created_at", since)
          .in("rating", NEGATIVE_RATINGS)
          .eq("processed", false);
        if (fbErr) {
          return new Response(JSON.stringify({ error: "feedback_query_failed", detail: fbErr.message }), {
            status: 500, headers: { "Content-Type": "application/json" },
          });
        }

        // Join feedback → q_runs for query_text + node_id
        const runIds = (feedbackRaw ?? []).map((f) => f.run_id).filter((x): x is string => !!x);
        const runMap = new Map<string, { node_id: string | null; query_text: string | null }>();
        if (runIds.length) {
          const { data: fbRuns } = await supabaseAdmin
            .from("q_runs")
            .select("id, node_id, query_text")
            .in("id", runIds);
          for (const r of fbRuns ?? []) {
            runMap.set(r.id as string, {
              node_id: (r.node_id as string | null) ?? null,
              query_text: (r.query_text as string | null) ?? null,
            });
          }
        }
        const feedbackForBrief = (feedbackRaw ?? []).map((f) => {
          const r = f.run_id ? runMap.get(f.run_id as string) : undefined;
          return {
            tree_id: treeIdFromNode(r?.node_id),
            query_text: r?.query_text ?? null,
            note: (f.note as string | null) ?? null,
          };
        });

        // STEP 4 — synthesise
        const errors: Array<{ stage: string; reason: string }> = [];
        let brief: Brief = {
          usage_insight: "",
          gap_identified: "",
          recommended_knowledge_record: null,
        };
        const hasSignal = (runs?.length ?? 0) > 0 || feedbackForBrief.length > 0;
        if (hasSignal) {
          try {
            brief = await synthesize(apiKey, usage, feedbackForBrief);
          } catch (e) {
            errors.push({ stage: "synthesize", reason: e instanceof Error ? e.message : "unknown" });
          }
        }

        // STEP 5 — insert recommended knowledge record (if any)
        let knowledgeInserted = 0;
        if (brief.recommended_knowledge_record) {
          const rec = brief.recommended_knowledge_record;
          // Idempotent on re-run within the same period.
          await supabaseAdmin
            .from("lumi_knowledge")
            .delete()
            .eq("source_type", "interaction_analysis")
            .eq("source_slug", `interaction-analysis-${period}`);

          const row = {
            source_record_id: null,
            source_slug: `interaction-analysis-${period}`,
            source_title: `Interaction pattern brief — ${period}`,
            source_type: "interaction_analysis",
            content: rec.content,
            content_type: "interaction_pattern",
            confidence_level: "medium",
            language: "en",
            tree_relevance: rec.tree_relevance,
            topic_tags: rec.topic_tags.length ? rec.topic_tags : ["interaction", "weekly"],
            embedding: await embed(apiKey, rec.content),
            is_active: true,
          };
          const { data: ins, error: insErr } = await supabaseAdmin
            .from("lumi_knowledge")
            .insert([row] as never)
            .select("id");
          if (insErr) errors.push({ stage: "knowledge_insert", reason: insErr.message });
          else knowledgeInserted = ins?.length ?? 0;
        }

        // STEP 7 — mark processed feedback (only the ones we actually fed into the brief)
        let feedbackProcessed = 0;
        const feedbackIds = (feedbackRaw ?? []).map((f) => f.id as string);
        if (feedbackIds.length) {
          const { error: updErr, data: upd } = await supabaseAdmin
            .from("lumi_feedback")
            .update({ processed: true, processed_at: new Date().toISOString() } as never)
            .in("id", feedbackIds)
            .select("id");
          if (updErr) errors.push({ stage: "feedback_mark_processed", reason: updErr.message });
          else feedbackProcessed = upd?.length ?? 0;
        }

        // STEP 6 — log the brief
        const topThree = usage.slice(0, 3).map((u) => `${u.tree_id}(${u.session_count})`).join(", ");
        const notice = `Lumi weekly ${period}: ${runs?.length ?? 0} runs, top trees: ${topThree || "none"}. ${feedbackForBrief.length} negative feedback processed. Knowledge added: ${knowledgeInserted}.`;
        const status = errors.length === 0 && hasSignal ? "ok"
          : errors.length > 0 ? "partial"
          : "error";

        await supabaseAdmin.from("workflow_runs").insert({
          workflow: "interaction_analysis",
          articles_processed: runs?.length ?? 0,
          records_created: knowledgeInserted,
          errors: errors as never,
          status,
          notice,
          output: {
            period,
            usage,
            feedback_sample: feedbackForBrief,
            brief,
            feedback_processed: feedbackProcessed,
          } as never,
        });

        return new Response(
          JSON.stringify({
            ok: true,
            period,
            runs_analyzed: runs?.length ?? 0,
            trees_observed: usage.length,
            top_trees: usage.slice(0, 3),
            feedback_processed: feedbackProcessed,
            knowledge_inserted: knowledgeInserted,
            brief,
            notice,
            errors,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
