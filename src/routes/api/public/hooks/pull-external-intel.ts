/**
 * Weekly External Intelligence Pull — Workflow Three.
 *
 * TRIGGER: pg_cron, Wednesday 07:00 UTC. Same x-cron-secret header as the
 * other Lumi workflows.
 *
 * STEP 1 — Run 5 Perplexity sonar searches in parallel for current CS data.
 * STEP 2 — Filter for: numeric anchor present, identifiable source from the
 *          allow-list, no obvious contradiction with CS Quarterly editorial
 *          posture (no hype, operator audience, no competitor naming).
 * STEP 3 — Distill each accepted item through Claude. Claude is allowed to
 *          flag "CONFLICT — DO NOT INSERT" against CS Quarterly positions.
 * STEP 4 — Insert approved records into lumi_knowledge as
 *          content_type='external_intelligence', source_type='external',
 *          confidence_level='medium'. Conflicts are logged into
 *          workflow_runs.notice for editorial review and NOT inserted.
 */
import { createFileRoute } from "@tanstack/react-router";

const PPLX_MODEL = "sonar";
const DISTILL_MODEL = "anthropic/claude-sonnet-4-5";
const EMBED_MODEL = "openai/text-embedding-3-small";
const EMBED_DIM = 1536;

type Query = { id: string; topic: string; query: string };

const QUERIES: Query[] = [
  { id: "nrr", topic: "nrr_benchmarks", query: "customer success NRR benchmarks 2026 SaaS" },
  { id: "team", topic: "team_structure", query: "CS team structure trends 2026 enterprise" },
  { id: "ai", topic: "ai_in_cs", query: "AI customer success tools adoption 2026" },
  { id: "churn", topic: "churn_prevention", query: "churn prevention strategies B2B SaaS 2026" },
  { id: "comp", topic: "cs_compensation", query: "CS leader compensation trends 2026" },
];

// Soft allow-list of credible sources. Matched as substring against the
// citation URL or against any free-text source name Perplexity returns.
const SOURCE_ALLOWLIST = [
  "keybanc", "iconiq", "mckinsey", "bain", "saastr", "gainsight",
  "churnzero", "openview", "pavilion", "forrester", "gartner",
  "bcg", "deloitte", "kpmg", "pwc", "harvard", "hbr.org",
  "tsia", "totango", "catalyst", "vitally", "sbi", "scaleventurepartners",
];

const NUMERIC = /(\d+(\.\d+)?%|\$\s?\d|\d+\s?(days?|weeks?|months?|years?)|\d+x\b)/i;

type PplxAnswer = {
  topic: string;
  query: string;
  content: string;
  citations: string[];
};

async function perplexity(apiKey: string, q: Query): Promise<PplxAnswer | null> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: PPLX_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a research assistant for CS operators. Return a single concise paragraph with a specific numeric data point and the source name. No hedging.",
        },
        { role: "user", content: q.query },
      ],
    }),
  });
  if (!res.ok) return null;
  const j = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    citations?: string[];
  };
  const content = j.choices?.[0]?.message?.content?.trim();
  if (!content) return null;
  return {
    topic: q.topic,
    query: q.query,
    content,
    citations: Array.isArray(j.citations) ? j.citations : [],
  };
}

function passesFilter(a: PplxAnswer): { ok: boolean; reason?: string; source?: string } {
  if (!NUMERIC.test(a.content)) return { ok: false, reason: "no_numeric_anchor" };
  if (a.citations.length === 0) return { ok: false, reason: "no_source" };
  const haystack = (a.content + " " + a.citations.join(" ")).toLowerCase();
  const matched = SOURCE_ALLOWLIST.find((s) => haystack.includes(s));
  if (!matched) return { ok: false, reason: "source_not_in_allowlist" };
  return { ok: true, source: matched };
}

type DistillOutcome =
  | { kind: "record"; content: string }
  | { kind: "conflict"; reason: string };

async function distill(
  apiKey: string,
  topic: string,
  answer: PplxAnswer,
): Promise<DistillOutcome> {
  const sys = `You are a knowledge curator for Lumi, The CS Quarterly's AI advisor. The CS Quarterly's editorial posture:
- Audience: VPs, Directors, Senior CSMs at SaaS companies $20M-$1B ARR. Operators, not generalist readers.
- Tone: Economist / Stratechery register. No hype, no emoji.
- Never name competitor publications or vendors as authoritative.
- Operator framing: structured, data-driven, no marketing fluff.

You will receive one raw data point from external CS industry research. Either:
(a) Distill it into one 2-3 sentence knowledge record Lumi can use when a subscriber asks about ${topic}. Requirements:
    - Include the specific number or finding.
    - Include the source name.
    - Frame as established intelligence: "Research from [source] indicates..." — not "maybe" / "might".
(b) If the data point contradicts CS Quarterly's editorial posture (hype, anti-operator framing, vendor promotion masquerading as research, or a claim that materially conflicts with the operator-audience worldview), flag it.

Return strict JSON: {"action": "insert", "content": "..."} OR {"action": "conflict", "reason": "..."}.`;
  const user = `Topic: ${topic}\nQuery: ${answer.query}\nPerplexity answer: ${answer.content}\nCitations: ${answer.citations.join(", ")}`;

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
    action?: string;
    content?: string;
    reason?: string;
  };
  if (parsed.action === "conflict") {
    return { kind: "conflict", reason: parsed.reason ?? "unspecified" };
  }
  if (parsed.action === "insert" && parsed.content?.trim()) {
    return { kind: "record", content: parsed.content.trim() };
  }
  return { kind: "conflict", reason: "distill_unparseable" };
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

export const Route = createFileRoute("/api/public/hooks/pull-external-intel")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env.INGESTION_CRON_SECRET;
        const apiKey = process.env.LOVABLE_API_KEY;
        const pplxKey = process.env.PERPLEXITY_API_KEY;

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
        if (!apiKey || !pplxKey) {
          return new Response(
            JSON.stringify({ error: "missing_keys", lovable: !!apiKey, perplexity: !!pplxKey }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const period = new Date().toISOString().slice(0, 10);

        // STEP 1 — parallel Perplexity searches
        const answers = await Promise.all(QUERIES.map((q) => perplexity(pplxKey, q)));

        const accepted: Array<{ q: Query; answer: PplxAnswer; source: string }> = [];
        const rejected: Array<{ topic: string; reason: string }> = [];

        QUERIES.forEach((q, i) => {
          const a = answers[i];
          if (!a) {
            rejected.push({ topic: q.topic, reason: "perplexity_failed" });
            return;
          }
          const f = passesFilter(a);
          if (!f.ok) {
            rejected.push({ topic: q.topic, reason: f.reason ?? "filtered" });
            return;
          }
          accepted.push({ q, answer: a, source: f.source! });
        });

        // STEP 3 — distill accepted items
        const errors: Array<{ stage: string; reason: string }> = [];
        const conflicts: Array<{ topic: string; reason: string }> = [];
        const toInsert: Array<{
          topic: string;
          source: string;
          citation: string;
          content: string;
        }> = [];

        for (const item of accepted) {
          try {
            const out = await distill(apiKey, item.q.topic, item.answer);
            if (out.kind === "conflict") {
              conflicts.push({ topic: item.q.topic, reason: out.reason });
            } else {
              toInsert.push({
                topic: item.q.topic,
                source: item.source,
                citation: item.answer.citations[0] ?? "",
                content: out.content,
              });
            }
          } catch (e) {
            errors.push({
              stage: `distill:${item.q.topic}`,
              reason: e instanceof Error ? e.message : "unknown",
            });
          }
        }

        // STEP 4 — clear prior intel for this period (idempotent re-runs) and insert
        let inserted = 0;
        if (toInsert.length > 0) {
          await supabaseAdmin
            .from("lumi_knowledge")
            .delete()
            .eq("source_type", "external")
            .eq("source_slug", `external-intel-${period}`);

          const rows = await Promise.all(
            toInsert.map(async (r) => ({
              source_record_id: null,
              source_slug: `external-intel-${period}`,
              source_title: `External intelligence — ${r.topic} (${period})`,
              source_type: "external",
              source_ref: r.citation,
              content: r.content,
              content_type: "external_intelligence",
              confidence_level: "medium",
              language: "en",
              tree_relevance: [],
              topic_tags: [r.topic, r.source, "external"],
              embedding: await embed(apiKey, r.content),
              is_active: true,
            })),
          );
          const { data: ins, error: insErr } = await supabaseAdmin
            .from("lumi_knowledge")
            .insert(rows as never)
            .select("id");
          if (insErr) errors.push({ stage: "knowledge_insert", reason: insErr.message });
          else inserted = ins?.length ?? 0;
        }

        const noticeParts = [
          `External intel ${period}: ${inserted} inserted, ${rejected.length} rejected, ${conflicts.length} editorial conflicts.`,
        ];
        if (rejected.length) {
          noticeParts.push(
            `Rejected: ${rejected.map((r) => `${r.topic}=${r.reason}`).join(", ")}.`,
          );
        }
        if (conflicts.length) {
          noticeParts.push(
            `Conflicts (review): ${conflicts.map((c) => `${c.topic}: ${c.reason}`).join(" | ")}.`,
          );
        }
        const notice = noticeParts.join(" ");

        const status =
          errors.length === 0 && inserted > 0
            ? "ok"
            : errors.length > 0
            ? "partial"
            : "error";

        await supabaseAdmin.from("workflow_runs").insert({
          workflow: "external_intel_pull",
          articles_processed: QUERIES.length,
          records_created: inserted,
          errors: errors as never,
          status,
          notice,
        });

        return new Response(
          JSON.stringify({
            ok: true,
            period,
            queries_run: QUERIES.length,
            accepted: accepted.length,
            rejected,
            conflicts,
            inserted,
            errors,
            notice,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
