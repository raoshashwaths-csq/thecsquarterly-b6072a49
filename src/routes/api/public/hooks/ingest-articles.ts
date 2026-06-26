/**
 * Daily Article Ingestion — Workflow One.
 *
 * TRIGGER: pg_cron at 06:00 UTC (configurable). Same endpoint is reusable
 * by n8n via the same `x-cron-secret` header.
 *
 * SECURITY: This route lives under /api/public/* (auth bypassed on the edge),
 * so it MUST self-verify the cron secret before doing any work.
 */
import { createFileRoute } from "@tanstack/react-router";

const EMBED_MODEL = "openai/text-embedding-3-small";
const EMBED_DIM = 1536;
const DISTILL_MODEL = "anthropic/claude-sonnet-4-5";
const ARTICLE_WINDOW_HOURS = 25;
const WORD_LIMIT = 3000;

const TREE_RELEVANCE_VALUES = [
  "escalationMatrix", "championChange", "upsellQualification", "careerAlignment",
  "competitiveDisplacement", "renewalFailureAutopsy", "healthScoreBreakdown",
  "stakeholderSilence", "adoptionRescue", "expectationReset", "commercialConversation",
  "stakeholderConflict", "sentimentRecovery", "onboardingCrisis", "executiveAccess",
  "productGap", "winBack", "teamPerformance", "leadershipComm", "orgDesign",
  "salesAlignment",
] as const;

type DistilledRecord = {
  content: string;
  tree_relevance: string[];
  topic_tags: string[];
  confidence_level: "high" | "medium" | "low";
};

async function embedText(apiKey: string, text: string): Promise<number[] | null> {
  const input = text.trim().slice(0, 4000);
  if (!input) return null;
  const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({ model: EMBED_MODEL, input, dimensions: EMBED_DIM }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: Array<{ embedding?: number[] }> };
  const v = json.data?.[0]?.embedding;
  return Array.isArray(v) && v.length === EMBED_DIM ? v : null;
}

function truncateToWords(text: string, words: number): string {
  const parts = text.split(/\s+/);
  if (parts.length <= words) return text;
  return parts.slice(0, words).join(" ");
}

async function distill(
  apiKey: string,
  title: string,
  content: string,
): Promise<DistilledRecord[]> {
  const system = `You are a knowledge curator for Lumi — The CS Quarterly's AI advisor. Extract the most operationally useful intelligence from this CS Quarterly article for injection into Lumi's context.

Write exactly 3 knowledge records. Each record:
- Is 2-4 sentences maximum
- Contains a specific, data-backed or evidence-backed claim
- Is written as something a practitioner would reference when dealing with a real account situation
- Does NOT start with 'In this article' or 'The author says'
- Reads as established intelligence, not as a summary

Return ONLY valid JSON in this shape:
{"records":[{"content":"...","tree_relevance":["..."],"topic_tags":["..."],"confidence_level":"high|medium|low"}]}

tree_relevance values come from this list (use [] if relevant to all trees):
${TREE_RELEVANCE_VALUES.join(", ")}`;

  const userMsg = `Article title: ${title}\n\nArticle content: ${truncateToWords(content, WORD_LIMIT)}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({
      model: DISTILL_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
    }),
  });
  if (!res.ok) throw new Error(`distill_failed_${res.status}`);
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = json.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as {
    records?: Array<{
      content?: string;
      tree_relevance?: string[];
      topic_tags?: string[];
      confidence_level?: string;
    }>;
  };
  const allowed = new Set<string>(TREE_RELEVANCE_VALUES);
  return (parsed.records ?? [])
    .filter((r) => typeof r.content === "string" && r.content.trim().length > 0)
    .slice(0, 3)
    .map((r) => ({
      content: r.content!.trim(),
      tree_relevance: Array.isArray(r.tree_relevance)
        ? r.tree_relevance.filter((t) => allowed.has(t)).slice(0, 6)
        : [],
      topic_tags: Array.isArray(r.topic_tags) ? r.topic_tags.slice(0, 8) : [],
      confidence_level: r.confidence_level === "high" || r.confidence_level === "low"
        ? r.confidence_level
        : "medium",
    }));
}

export const Route = createFileRoute("/api/public/hooks/ingest-articles")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env.INGESTION_CRON_SECRET;
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!cronSecret) {
          return new Response(JSON.stringify({ error: "cron_secret_missing" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (request.headers.get("x-cron-secret") !== cronSecret) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "ai_not_configured" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const sinceIso = new Date(Date.now() - ARTICLE_WINDOW_HOURS * 3600 * 1000).toISOString();
        const { data: articles, error: qErr } = await supabaseAdmin
          .from("posts")
          .select("id, slug, title, subtitle, body, published_at")
          .eq("published", true)
          .gte("published_at", sinceIso);

        if (qErr) {
          return new Response(JSON.stringify({ error: "query_failed", detail: qErr.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const errors: Array<{ slug: string; reason: string }> = [];
        let recordsCreated = 0;
        let articlesProcessed = 0;

        for (const article of articles ?? []) {
          try {
            const records = await distill(apiKey, article.title, article.body ?? "");
            if (!records.length) {
              errors.push({ slug: article.slug, reason: "no_records_returned" });
              continue;
            }

            // Idempotent re-ingestion: clear prior records for this source.
            await supabaseAdmin
              .from("lumi_knowledge")
              .delete()
              .eq("source_record_id", article.id);

            const rows = await Promise.all(
              records.map(async (r) => ({
                source_record_id: article.id,
                source_slug: article.slug,
                source_title: article.title,
                source_type: "article",
                content: r.content,
                content_type: "article_insight",
                confidence_level: r.confidence_level,
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
            if (insErr) {
              errors.push({ slug: article.slug, reason: `insert_failed:${insErr.message}` });
              continue;
            }
            recordsCreated += inserted?.length ?? 0;
            articlesProcessed += 1;
          } catch (e) {
            errors.push({
              slug: article.slug,
              reason: e instanceof Error ? e.message : "unknown",
            });
          }
        }

        const status = errors.length === 0 ? "ok" : articlesProcessed > 0 ? "partial" : "error";
        await supabaseAdmin.from("workflow_runs").insert({
          workflow: "article_ingestion",
          articles_processed: articlesProcessed,
          records_created: recordsCreated,
          errors: errors as never,
          status,
        });

        return new Response(
          JSON.stringify({
            ok: true,
            articles_processed: articlesProcessed,
            records_created: recordsCreated,
            errors,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
