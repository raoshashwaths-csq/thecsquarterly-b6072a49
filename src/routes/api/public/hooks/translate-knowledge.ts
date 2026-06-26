/**
 * Daily Multilingual Knowledge Translation — Workflow Six.
 *
 * TRIGGER: pg_cron, daily 07:30 UTC (90 minutes after Workflow 1 article
 * ingestion so new English records are ready to translate).
 *
 * Translates active English lumi_knowledge rows into Arabic, Bahasa
 * Indonesia, Vietnamese, and Thai via Claude through the Lovable AI gateway,
 * respecting the editorial glossary (never_translate + fixed_translations).
 *
 * Rate limit: 40 translations per run (~$1.60 max at current rates).
 *
 * CONFLICTS RESOLVED:
 * - lumi_knowledge has no `source_ref` or `translated_from` columns. The
 *   English parent id is stored in `source_record_id`; `source_slug` carries
 *   the original slug. The spec's `source_ref` maps to `source_slug`.
 * - lumi_knowledge.translation_reviewed didn't exist — added via migration
 *   in this turn so freshly translated rows can be flagged for editorial
 *   review.
 * - knowledge_translation_queue had no (source_record_id, target_language)
 *   uniqueness — added via the same migration so STEP 2's ON CONFLICT is a
 *   real no-op on rerun.
 * - Translated rows are NOT embedded here. The English parent's semantic
 *   vector already anchors retrieval via match_lumi_knowledge; embedding
 *   non-English text against an English-anchored space hurts recall. If we
 *   later add a multilingual embedding model, translate-then-embed runs as
 *   a separate job.
 */
import { createFileRoute } from "@tanstack/react-router";

const TRANSLATE_MODEL = "anthropic/claude-sonnet-4-5";
const TARGET_LANGUAGES = ["ar", "id", "vi", "th"] as const;
type TargetLang = (typeof TARGET_LANGUAGES)[number];

const LANGUAGE_NAME: Record<TargetLang, string> = {
  ar: "Arabic",
  id: "Bahasa Indonesia",
  vi: "Vietnamese",
  th: "Thai",
};

const MARKET_CONTEXT: Record<TargetLang, string> = {
  ar: "Gulf business register, as used by CS leaders at SaaS companies in Saudi Arabia, UAE, and Egypt. Formal but direct.",
  id: "Professional Indonesian as used by CS leaders at B2B tech companies in Jakarta. Direct, not overly formal.",
  vi: "Business Vietnamese as used in B2B SaaS companies in Ho Chi Minh City and Hanoi.",
  th: "Formal business Thai appropriate for SaaS professionals in Bangkok.",
};

const CATCH_UP_LIMIT = 20;
const TRANSLATE_BATCH = 40;

type GlossaryRow = {
  term: string;
  protection_type: string | null;
  fixed_translations: Record<string, string> | null;
};

function buildSystemPrompt(
  lang: TargetLang,
  glossary: GlossaryRow[],
): string {
  const neverTranslate = glossary
    .filter((g) => g.protection_type === "never_translate")
    .map((g) => g.term);

  const fixed: Record<string, string> = {};
  for (const g of glossary) {
    const t = g.fixed_translations?.[lang];
    if (typeof t === "string" && t.trim()) fixed[g.term] = t;
  }

  return [
    "You are translating operational CS intelligence for Lumi — The CS Quarterly's AI advisor. This content will be injected directly into Lumi's system prompt when responding to CS professionals in " +
      LANGUAGE_NAME[lang] +
      ".",
    "",
    "TRANSLATION REQUIREMENTS:",
    `- Translate into ${LANGUAGE_NAME[lang]} in a formal business register, as used in professional publications in the target market.`,
    "- Preserve the directness and authority of the source. Do not soften assertions. Do not add hedging language that was not in the original.",
    "- Keep all numbers, percentages, and data points exactly as they appear in the source.",
    "",
    `MARKET CONTEXT: ${MARKET_CONTEXT[lang]}`,
    "",
    "NEVER TRANSLATE (keep exactly as written in English):",
    neverTranslate.length ? neverTranslate.map((t) => `- ${t}`).join("\n") : "(none)",
    "",
    "FIXED TRANSLATIONS (always use these exact terms):",
    Object.keys(fixed).length ? JSON.stringify(fixed, null, 2) : "(none)",
    "",
    "OUTPUT: Return ONLY the translated text. No preamble, no notes, no explanation. Same length and structure as the source.",
  ].join("\n");
}

async function translate(
  apiKey: string,
  lang: TargetLang,
  glossary: GlossaryRow[],
  source: string,
): Promise<string | null> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({
      model: TRANSLATE_MODEL,
      messages: [
        { role: "system", content: buildSystemPrompt(lang, glossary) },
        { role: "user", content: `Translate this knowledge record to ${LANGUAGE_NAME[lang]}:\n\n${source}` },
      ],
    }),
  });
  if (!res.ok) return null;
  const j = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const out = j.choices?.[0]?.message?.content?.trim();
  return out && out.length > 0 ? out : null;
}

export const Route = createFileRoute("/api/public/hooks/translate-knowledge")({
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
        const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

        // ---- STEP 1: collect English records that need queuing ----
        // a) Fresh: last 48h, not yet in the queue at all.
        const { data: queued } = await supabaseAdmin
          .from("knowledge_translation_queue")
          .select("source_record_id");
        const queuedSet = new Set((queued ?? []).map((q) => q.source_record_id as string));

        const { data: fresh } = await supabaseAdmin
          .from("lumi_knowledge")
          .select("id, content, content_type, tree_relevance, topic_tags, confidence_level, source_slug, source_type")
          .eq("language", "en")
          .eq("is_active", true)
          .gte("created_at", since);

        // b) Catch-up: older English records that were never queued, capped.
        const { data: catchUp } = await supabaseAdmin
          .from("lumi_knowledge")
          .select("id, content, content_type, tree_relevance, topic_tags, confidence_level, source_slug, source_type")
          .eq("language", "en")
          .eq("is_active", true)
          .lt("created_at", since)
          .limit(CATCH_UP_LIMIT * 4); // over-fetch then filter against queue

        const candidatesById = new Map<string, NonNullable<typeof fresh>[number]>();
        for (const r of fresh ?? []) {
          if (!queuedSet.has(r.id as string)) candidatesById.set(r.id as string, r);
        }
        let added = 0;
        for (const r of catchUp ?? []) {
          if (added >= CATCH_UP_LIMIT) break;
          if (!queuedSet.has(r.id as string) && !candidatesById.has(r.id as string)) {
            candidatesById.set(r.id as string, r);
            added++;
          }
        }
        const candidates = [...candidatesById.values()];

        // ---- STEP 2: queue all 4 target languages per candidate ----
        let enqueued = 0;
        if (candidates.length) {
          const rows = candidates.flatMap((c) =>
            TARGET_LANGUAGES.map((lang) => ({
              source_record_id: c.id,
              target_language: lang,
              status: "pending",
            })),
          );
          // The unique (source_record_id, target_language) constraint added in
          // this turn's migration turns this into idempotent insertion.
          const { data: ins } = await supabaseAdmin
            .from("knowledge_translation_queue")
            .upsert(rows, { onConflict: "source_record_id,target_language", ignoreDuplicates: true })
            .select("id");
          enqueued = ins?.length ?? 0;
        }

        // ---- STEP 3: pick the next batch, mark in_progress ----
        const { data: pending } = await supabaseAdmin
          .from("knowledge_translation_queue")
          .select("id, source_record_id, target_language, status, created_at")
          .eq("status", "pending")
          .order("created_at", { ascending: true })
          .limit(TRANSLATE_BATCH);

        const batch = pending ?? [];
        if (batch.length === 0) {
          await supabaseAdmin.from("workflow_runs").insert({
            workflow: "multilingual_translation",
            articles_processed: candidates.length,
            records_created: 0,
            output: { enqueued, note: "no_pending_translations", per_language: { ar: 0, id: 0, vi: 0, th: 0 } },
          });
          return new Response(JSON.stringify({ ok: true, enqueued, translated: 0 }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        const batchIds = batch.map((r) => r.id as string);
        await supabaseAdmin
          .from("knowledge_translation_queue")
          .update({ status: "in_progress" })
          .in("id", batchIds);

        // Load the parent English rows in one shot
        const parentIds = [...new Set(batch.map((r) => r.source_record_id as string))];
        const { data: parents } = await supabaseAdmin
          .from("lumi_knowledge")
          .select("id, content, content_type, tree_relevance, topic_tags, confidence_level, source_slug, source_title, source_type, source_record_id")
          .in("id", parentIds);
        const parentMap = new Map<string, NonNullable<typeof parents>[number]>();
        for (const p of parents ?? []) parentMap.set(p.id as string, p);

        // Load glossary once
        const { data: glossary } = await supabaseAdmin
          .from("translation_glossary")
          .select("term, protection_type, fixed_translations");
        const glossaryRows: GlossaryRow[] = (glossary ?? []).map((g) => ({
          term: g.term as string,
          protection_type: (g.protection_type as string | null) ?? null,
          fixed_translations: (g.fixed_translations as Record<string, string> | null) ?? null,
        }));

        // ---- STEP 4–6: translate, insert, mark complete ----
        const perLanguage: Record<TargetLang, number> = { ar: 0, id: 0, vi: 0, th: 0 };
        let translated = 0;
        const errors: Array<{ queue_id: string; reason: string }> = [];

        for (const row of batch) {
          const lang = row.target_language as TargetLang;
          if (!TARGET_LANGUAGES.includes(lang)) {
            await supabaseAdmin
              .from("knowledge_translation_queue")
              .update({ status: "error", error_note: "unsupported_language" })
              .eq("id", row.id as string);
            errors.push({ queue_id: row.id as string, reason: "unsupported_language" });
            continue;
          }
          const parent = parentMap.get(row.source_record_id as string);
          if (!parent) {
            await supabaseAdmin
              .from("knowledge_translation_queue")
              .update({ status: "error", error_note: "parent_not_found" })
              .eq("id", row.id as string);
            errors.push({ queue_id: row.id as string, reason: "parent_not_found" });
            continue;
          }

          const translatedText = await translate(apiKey, lang, glossaryRows, parent.content as string);
          if (!translatedText) {
            await supabaseAdmin
              .from("knowledge_translation_queue")
              .update({ status: "error", error_note: "translate_failed" })
              .eq("id", row.id as string);
            errors.push({ queue_id: row.id as string, reason: "translate_failed" });
            continue;
          }

          const { data: inserted, error: insErr } = await supabaseAdmin
            .from("lumi_knowledge")
            .insert({
              source_record_id: parent.id, // English parent — replaces spec's `translated_from`
              source_slug: parent.source_slug,
              source_title: parent.source_title,
              source_type: parent.source_type,
              content: translatedText,
              content_type: parent.content_type,
              language: lang,
              tree_relevance: parent.tree_relevance ?? [],
              topic_tags: parent.topic_tags ?? [],
              confidence_level: parent.confidence_level,
              is_active: true,
              translation_reviewed: false,
            })
            .select("id")
            .maybeSingle();

          if (insErr || !inserted) {
            await supabaseAdmin
              .from("knowledge_translation_queue")
              .update({ status: "error", error_note: insErr?.message ?? "insert_failed" })
              .eq("id", row.id as string);
            errors.push({ queue_id: row.id as string, reason: insErr?.message ?? "insert_failed" });
            continue;
          }

          await supabaseAdmin
            .from("knowledge_translation_queue")
            .update({
              status: "complete",
              translated_record_id: inserted.id,
              completed_at: new Date().toISOString(),
            })
            .eq("id", row.id as string);

          translated++;
          perLanguage[lang]++;
        }

        // ---- STEP 7: log ----
        await supabaseAdmin.from("workflow_runs").insert({
          workflow: "multilingual_translation",
          articles_processed: candidates.length,
          records_created: translated,
          output: {
            enqueued,
            batch_size: batch.length,
            per_language: perLanguage,
            errors,
          },
        });

        return new Response(
          JSON.stringify({ ok: true, enqueued, translated, per_language: perLanguage, errors }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
