/**
 * Layer 3 — Portfolio-wide Lumi knowledge pipeline.
 *
 * Two distinct memory layers that must not be conflated:
 *   - Layer 3   (this file): `lumi_knowledge`. Distilled, portfolio-wide
 *                knowledge records derived from published articles + benchmarks.
 *                Service-role only. Shared across all users.
 *   - Layer 3.5 (lumi-memory.functions.ts): `lumi_memory`. Per-user semantic
 *                memory, RLS-scoped to auth.uid().
 *
 * Layer 3 records get injected into every Q / Situation Room system prompt
 * via `getLumiKnowledgeContext`. Layer 3.5 records are recalled per-user.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EMBED_MODEL = "openai/text-embedding-3-small"; // mirrors lumi_memory
const EMBED_DIM = 1536;
const DISTILL_MODEL = "google/gemini-2.5-flash";

type ContentType = "principle" | "data_point" | "framework" | "case_study" | "heuristic";

async function embedText(apiKey: string, text: string): Promise<number[] | null> {
  const input = text.trim().slice(0, 4000);
  if (!input) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({ model: EMBED_MODEL, input, dimensions: EMBED_DIM }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: Array<{ embedding?: number[] }> };
    const v = json.data?.[0]?.embedding;
    return Array.isArray(v) && v.length === EMBED_DIM ? v : null;
  } catch {
    return null;
  }
}

/**
 * Server-side helper: build the KNOWLEDGE_CONTEXT block to append to a
 * system prompt. Pulls top knowledge records via match_lumi_knowledge and
 * latest benchmark drops from the benchmark_drops_latest view.
 *
 * Returns `{ block, recordCount }`. `block` is empty string when no records
 * match — callers append unconditionally.
 */
export async function getLumiKnowledgeContext(opts: {
  query: string;
  treeId?: string | null;
  userLanguage?: string;
  k?: number;
}): Promise<{ block: string; recordCount: number }> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { block: "", recordCount: 0 };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const language = opts.userLanguage ?? "en";
  const k = opts.k ?? 5;

  const vec = await embedText(apiKey, opts.query);
  let records: Array<{ source_title: string; content: string; content_type: string }> = [];
  if (vec) {
    const { data } = await (supabaseAdmin.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: Array<{ source_title: string; content: string; content_type: string }> | null }>)(
      "match_lumi_knowledge",
      { _query: vec as unknown as number[], _k: k, _tree_id: opts.treeId ?? null, _language: language },
    );
    records = data ?? [];
  }

  const { data: benchmarks } = await supabaseAdmin
    .from("benchmark_drops_latest")
    .select("metric, segment, value, p25, p50, p75, period")
    .limit(8);

  if (!records.length && !(benchmarks?.length)) return { block: "", recordCount: 0 };

  const knowledgeLines = records
    .map((r, i) => `[K${i + 1}] (${r.content_type}) ${r.source_title ? `"${r.source_title}" — ` : ""}${r.content}`)
    .join("\n");

  const benchmarkLines = (benchmarks ?? [])
    .filter((b) => b.metric != null && b.value != null)
    .map((b) => {
      const seg = b.segment ? ` (${b.segment})` : "";
      const pct = b.p25 != null && b.p50 != null && b.p75 != null
        ? ` — p25 ${b.p25}, p50 ${b.p50}, p75 ${b.p75}`
        : "";
      return `- ${b.metric}${seg} ${b.period ?? ""}: ${b.value}${pct}`;
    })
    .join("\n");

  const parts: string[] = ["KNOWLEDGE_CONTEXT (portfolio-wide, do not cite ids verbatim):"];
  if (knowledgeLines) parts.push(knowledgeLines);
  if (benchmarkLines) parts.push("BENCHMARKS:\n" + benchmarkLines);

  return { block: parts.join("\n\n"), recordCount: records.length };
}

// ---------------------------------------------------------------------------
// Ingestion — distill an article into 3 knowledge records + embed + insert.
// Called by the n8n article workflow (POST) and from the admin panel.
// ---------------------------------------------------------------------------

const IngestInput = z.object({
  articleId: z.string().uuid(),
});

async function distillArticle(
  apiKey: string,
  title: string,
  body: string,
): Promise<Array<{ content: string; content_type: ContentType; tree_relevance: string[]; topic_tags: string[] }>> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({
      model: DISTILL_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You distill Customer Success dispatches into exactly 3 portfolio-wide knowledge records that Lumi can inject into future operator prompts. Each record must be self-contained (no 'as the article said'), 1–3 sentences, concrete. Return JSON: {\"records\":[{\"content\":\"...\",\"content_type\":\"principle|data_point|framework|case_study|heuristic\",\"tree_relevance\":[\"escalation\",\"churn\",...],\"topic_tags\":[\"stakeholder\",...]}]}. tree_relevance values come from: escalation, churn, expansion, onboarding, qbr, stakeholder, negotiation, ai-readiness, sales-qualification. Use 1–3 per record.",
        },
        {
          role: "user",
          content: `TITLE: ${title}\n\nBODY:\n${body.slice(0, 12000)}`,
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Distillation failed (${res.status})`);
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = json.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as {
    records?: Array<{ content?: string; content_type?: string; tree_relevance?: string[]; topic_tags?: string[] }>;
  };
  const validTypes: ContentType[] = ["principle", "data_point", "framework", "case_study", "heuristic"];
  return (parsed.records ?? [])
    .filter((r) => typeof r.content === "string" && r.content.trim().length > 0)
    .slice(0, 3)
    .map((r) => ({
      content: r.content!.trim(),
      content_type: (validTypes.includes(r.content_type as ContentType) ? r.content_type : "principle") as ContentType,
      tree_relevance: Array.isArray(r.tree_relevance) ? r.tree_relevance.slice(0, 5) : [],
      topic_tags: Array.isArray(r.topic_tags) ? r.topic_tags.slice(0, 8) : [],
    }));
}

/**
 * Ingest an article into the Lumi knowledge base.
 * Admin-only (callable from admin panel). The n8n workflow uses the same
 * server function via POST + service-role bearer.
 */
export const ingestArticleKnowledge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => IngestInput.parse(d))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI not configured");

    // Admin gate — distillation costs credits + writes portfolio-wide rows.
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: post, error: postErr } = await supabaseAdmin
      .from("posts")
      .select("id, slug, title, body")
      .eq("id", data.articleId)
      .maybeSingle();
    if (postErr || !post) throw new Error("Article not found");

    const records = await distillArticle(apiKey, post.title, post.body ?? "");
    if (!records.length) return { inserted: 0, records: [] };

    // Remove prior distillations for this source so re-ingestion is idempotent.
    await supabaseAdmin.from("lumi_knowledge").delete().eq("source_record_id", post.id);

    const rows = await Promise.all(
      records.map(async (r) => ({
        source_record_id: post.id,
        source_slug: post.slug,
        source_title: post.title,
        content: r.content,
        content_type: r.content_type,
        language: "en",
        tree_relevance: r.tree_relevance,
        topic_tags: r.topic_tags,
        embedding: await embedText(apiKey, r.content),
        is_active: true,
      })),
    );

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from("lumi_knowledge")
      .insert(rows as never)
      .select("id");
    if (insErr) throw new Error(insErr.message);

    return { inserted: inserted?.length ?? 0, records: inserted ?? [] };
  });
