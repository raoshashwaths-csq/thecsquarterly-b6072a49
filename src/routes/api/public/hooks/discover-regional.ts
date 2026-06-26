/**
 * Weekly Regional Knowledge Discovery — Workflow Seven.
 *
 * TRIGGER: pg_cron, Thursday 07:00 UTC. Same x-cron-secret as other workflows.
 *
 * STEP 1 — Run Perplexity searches in parallel across AR / ID / VI / TH for
 *          current CS intelligence in those markets (2 per language, 1 for TH).
 * STEP 2 — Detect language of each result. Non-English → distill in-language.
 *          English → distill in English, tagged to the originating market.
 * STEP 3 — Apply editorial glossary (never_translate + fixed_translations) in
 *          the distillation prompt for the target language.
 * STEP 4 — Insert distilled records as content_type='external_intelligence',
 *          source_type='external', confidence_level='medium',
 *          translation_reviewed=false.
 * STEP 5 — For each non-English record, also create an English back-translation
 *          linked via source_record_id so the English Lumi benefits from regional
 *          intel too. English copy is embedded (retrievable); regional original
 *          is not embedded (matches workflow 6: English-anchored embedding space).
 *
 * CONFLICTS RESOLVED:
 * - lumi_knowledge has no `translated_from` column. The English back-translation
 *   links to the regional original via `source_record_id` (parent pointer).
 * - Non-English records skip embedding — same rationale as Workflow 6: the
 *   English copy carries the semantic vector and anchors retrieval.
 */
import { createFileRoute } from "@tanstack/react-router";

const PPLX_MODEL = "sonar";
const DISTILL_MODEL = "anthropic/claude-sonnet-4-5";
const EMBED_MODEL = "openai/text-embedding-3-small";
const EMBED_DIM = 1536;

type Lang = "ar" | "id" | "vi" | "th";

const LANGUAGE_NAME: Record<Lang, string> = {
  ar: "Arabic",
  id: "Bahasa Indonesia",
  vi: "Vietnamese",
  th: "Thai",
};

const MARKET: Record<Lang, string> = {
  ar: "Middle East (Saudi Arabia, UAE, Egypt)",
  id: "Indonesia",
  vi: "Vietnam",
  th: "Thailand",
};

const REGISTER: Record<Lang, string> = {
  ar: "Gulf business register, formal but direct.",
  id: "Professional Indonesian, direct, not overly formal.",
  vi: "Business Vietnamese as used in B2B SaaS in HCMC and Hanoi.",
  th: "Formal business Thai appropriate for SaaS professionals in Bangkok.",
};

type Query = { lang: Lang; topic: string; query: string };

const QUERIES: Query[] = [
  { lang: "ar", topic: "retention_me", query: "customer success SaaS معدل الاحتفاظ بالعملاء الشرق الأوسط 2026" },
  { lang: "ar", topic: "cs_practice_gulf", query: "نجاح العملاء أفضل الممارسات شركات التكنولوجيا السعودية الإمارات 2026" },
  { lang: "id", topic: "retention_id", query: "customer success SaaS Indonesia retensi pelanggan benchmark 2026" },
  { lang: "id", topic: "cs_strategy_id", query: "strategi customer success B2B teknologi Indonesia 2026" },
  { lang: "vi", topic: "retention_vn", query: "customer success SaaS Việt Nam tỷ lệ giữ chân khách hàng 2026" },
  { lang: "vi", topic: "cs_strategy_vn", query: "chiến lược customer success công ty công nghệ Việt Nam 2026" },
  { lang: "th", topic: "retention_th", query: "customer success SaaS ประเทศไทย อัตราการรักษาลูกค้า 2026" },
];

type PplxAnswer = { content: string; citations: string[] };

async function perplexity(apiKey: string, q: Query): Promise<PplxAnswer | null> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: PPLX_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a research assistant for CS operators. Return a single concise paragraph with specific data points and source names. No hedging. Respond in the language of the user's query.",
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
    content,
    citations: Array.isArray(j.citations) ? j.citations : [],
  };
}

// Heuristic language detection by script range. Enough to route between
// English (Latin) and the four target scripts; Claude does the rest.
function detectLanguage(text: string): Lang | "en" | "other" {
  const sample = text.slice(0, 800);
  if (/[\u0600-\u06FF]/.test(sample)) return "ar";
  if (/[\u0E00-\u0E7F]/.test(sample)) return "th";
  // Vietnamese: Latin + combining diacritics in the extended ranges.
  if (/[ăâđêôơưĂÂĐÊÔƠƯ]|[\u1EA0-\u1EF9]/.test(sample)) return "vi";
  // Bahasa Indonesia is Latin without distinguishing diacritics; if the
  // query was Indonesian and the response looks like ASCII/Latin with no
  // Vietnamese marks, treat as id when expected.
  const latinRatio = (sample.match(/[A-Za-z]/g) ?? []).length / Math.max(sample.length, 1);
  if (latinRatio > 0.6) return "en"; // caller may override with expected lang
  return "other";
}

type GlossaryRow = {
  term: string;
  protection_type: string | null;
  fixed_translations: Record<string, string> | null;
};

function glossaryBlock(lang: Lang, glossary: GlossaryRow[]): string {
  const neverTranslate = glossary
    .filter((g) => g.protection_type === "never_translate")
    .map((g) => g.term);
  const fixed: string[] = [];
  for (const g of glossary) {
    const t = g.fixed_translations?.[lang];
    if (typeof t === "string" && t.trim()) fixed.push(`"${g.term}" → "${t}"`);
  }
  const parts: string[] = [];
  if (neverTranslate.length) parts.push(`Never translate: ${neverTranslate.join(", ")}`);
  if (fixed.length) parts.push(`Fixed translations: ${fixed.join("; ")}`);
  return parts.length ? parts.join("\n") : "No glossary constraints.";
}

async function distillRegional(
  apiKey: string,
  lang: Lang,
  answer: PplxAnswer,
  glossary: GlossaryRow[],
): Promise<string | null> {
  const sys = `You are a knowledge curator for Lumi, distilling CS intelligence from ${LANGUAGE_NAME[lang]} sources for CS professionals in ${MARKET[lang]}.

Distill the source into a 2-4 sentence knowledge record in ${LANGUAGE_NAME[lang]} that Lumi can use when responding to a CS practitioner in ${MARKET[lang]}.

Requirements:
- Write entirely in ${LANGUAGE_NAME[lang]} in a formal business register. ${REGISTER[lang]}
- Include any specific data points (numbers, percentages, named companies) from the source.
- Frame it as established market intelligence — not hedged speculation.
- ${glossaryBlock(lang, glossary)}

Return strict JSON: {"content": "..."} — content in ${LANGUAGE_NAME[lang]} only.`;
  return runJson(apiKey, sys, `Source content:\n${answer.content}\nCitations: ${answer.citations.join(", ")}`);
}

async function distillEnglishForMarket(
  apiKey: string,
  market: string,
  answer: PplxAnswer,
): Promise<string | null> {
  const sys = `You are a knowledge curator for Lumi. Distill this English-language source into a 2-4 sentence knowledge record tagged as relevant to CS professionals in ${market}.

Requirements:
- English, formal Economist/Stratechery register, operator audience.
- Include specific data points exactly.
- Frame as established intelligence. Mention the regional applicability (${market}) where useful.

Return strict JSON: {"content": "..."}.`;
  return runJson(apiKey, sys, `Source content:\n${answer.content}\nCitations: ${answer.citations.join(", ")}`);
}

async function translateToEnglish(apiKey: string, lang: Lang, content: string): Promise<string | null> {
  const sys = `Translate this ${LANGUAGE_NAME[lang]} CS knowledge record to English. Preserve all data points (numbers, percentages, named entities) exactly. Maintain the directness and register of the original. Return strict JSON: {"content": "..."}.`;
  return runJson(apiKey, sys, content);
}

async function runJson(apiKey: string, sys: string, user: string): Promise<string | null> {
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
  try {
    const parsed = JSON.parse(j.choices?.[0]?.message?.content ?? "{}") as { content?: string };
    return parsed.content?.trim() || null;
  } catch {
    return null;
  }
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

export const Route = createFileRoute("/api/public/hooks/discover-regional")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env.INGESTION_CRON_SECRET;
        const apiKey = process.env.LOVABLE_API_KEY;
        const pplxKey = process.env.PERPLEXITY_API_KEY;

        if (!cronSecret) {
          return Response.json({ error: "cron_secret_missing" }, { status: 500 });
        }
        if (request.headers.get("x-cron-secret") !== cronSecret) {
          return Response.json({ error: "unauthorized" }, { status: 401 });
        }
        if (!apiKey || !pplxKey) {
          return Response.json(
            { error: "missing_keys", lovable: !!apiKey, perplexity: !!pplxKey },
            { status: 500 },
          );
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: glossaryRows } = await supabaseAdmin
          .from("translation_glossary")
          .select("term, protection_type, fixed_translations");
        const glossary = (glossaryRows ?? []) as GlossaryRow[];

        // STEP 1 — parallel Perplexity searches
        const answers = await Promise.all(QUERIES.map((q) => perplexity(pplxKey, q)));

        type Pending = {
          expectedLang: Lang;
          topic: string;
          query: string;
          answer: PplxAnswer;
          actualLang: Lang | "en";
        };

        const pending: Pending[] = [];
        const failures: Array<{ topic: string; reason: string }> = [];

        QUERIES.forEach((q, i) => {
          const a = answers[i];
          if (!a) {
            failures.push({ topic: q.topic, reason: "perplexity_failed" });
            return;
          }
          // Route: if it has the target script, it's that lang; otherwise
          // treat Latin output as English (Bahasa fallback handled by
          // expectedLang in the distillation prompt).
          const detected = detectLanguage(a.content);
          const actualLang: Lang | "en" =
            detected === "ar" || detected === "th" || detected === "vi"
              ? detected
              : detected === "en" && q.lang === "id"
                ? // Bahasa output looks like Latin; trust the query.
                  isProbablyIndonesian(a.content)
                  ? "id"
                  : "en"
                : "en";
          pending.push({
            expectedLang: q.lang,
            topic: q.topic,
            query: q.query,
            answer: a,
            actualLang,
          });
        });

        // STEP 2/3 — distill each
        const regionalInserts: Array<{
          lang: Lang;
          topic: string;
          content: string;
          citation: string;
        }> = [];
        const englishInserts: Array<{
          topic: string;
          market: string;
          content: string;
          citation: string;
        }> = [];

        for (const item of pending) {
          try {
            if (item.actualLang === "en") {
              const distilled = await distillEnglishForMarket(
                apiKey,
                MARKET[item.expectedLang],
                item.answer,
              );
              if (distilled) {
                englishInserts.push({
                  topic: item.topic,
                  market: MARKET[item.expectedLang],
                  content: distilled,
                  citation: item.answer.citations[0] ?? "",
                });
              }
            } else {
              const distilled = await distillRegional(
                apiKey,
                item.actualLang,
                item.answer,
                glossary,
              );
              if (distilled) {
                regionalInserts.push({
                  lang: item.actualLang,
                  topic: item.topic,
                  content: distilled,
                  citation: item.answer.citations[0] ?? "",
                });
              }
            }
          } catch (e) {
            failures.push({
              topic: item.topic,
              reason: e instanceof Error ? e.message : "distill_failed",
            });
          }
        }

        const period = new Date().toISOString().slice(0, 10);
        const counts = { ar: 0, id: 0, vi: 0, th: 0, en_regional: 0, en_backtrans: 0 };

        // STEP 4 — insert regional records (no embedding)
        for (const r of regionalInserts) {
          const { data: ins, error } = await supabaseAdmin
            .from("lumi_knowledge")
            .insert({
              source_slug: `regional-discovery:${r.lang}:${period}:${r.topic}`,
              source_title: `Regional intel (${LANGUAGE_NAME[r.lang]}) — ${r.topic}`,
              content: r.content,
              content_type: "external_intelligence",
              language: r.lang,
              source_type: "external",
              confidence_level: "medium",
              translation_reviewed: false,
              topic_tags: [r.topic, r.lang, "regional"],
              is_active: true,
            })
            .select("id")
            .single();
          if (error || !ins) {
            failures.push({ topic: r.topic, reason: `insert_${r.lang}_failed` });
            continue;
          }
          counts[r.lang]++;

          // STEP 5 — English back-translation, embedded
          const enContent = await translateToEnglish(apiKey, r.lang, r.content);
          if (!enContent) continue;
          const vec = await embed(apiKey, enContent);
          await supabaseAdmin.from("lumi_knowledge").insert({
            source_record_id: ins.id,
            source_slug: `regional-discovery:en-from-${r.lang}:${period}:${r.topic}`,
            source_title: `Regional intel (translated from ${LANGUAGE_NAME[r.lang]}) — ${r.topic}`,
            content: enContent,
            content_type: "external_intelligence",
            language: "en",
            source_type: "external",
            confidence_level: "medium",
            translation_reviewed: false,
            topic_tags: [r.topic, "regional", `from_${r.lang}`],
            embedding: vec ? (vec as unknown as string) : null,
            is_active: true,
          });
          counts.en_backtrans++;
        }

        // STEP 4 (English direct) — embed and insert
        for (const r of englishInserts) {
          const vec = await embed(apiKey, r.content);
          const { error } = await supabaseAdmin.from("lumi_knowledge").insert({
            source_slug: `regional-discovery:en:${period}:${r.topic}`,
            source_title: `Regional intel (${r.market}) — ${r.topic}`,
            content: r.content,
            content_type: "external_intelligence",
            language: "en",
            source_type: "external",
            confidence_level: "medium",
            translation_reviewed: false,
            topic_tags: [r.topic, "regional", r.market],
            embedding: vec ? (vec as unknown as string) : null,
            is_active: true,
          });
          if (error) failures.push({ topic: r.topic, reason: "insert_en_failed" });
          else counts.en_regional++;
        }

        await supabaseAdmin.from("workflow_runs").insert({
          workflow: "regional_discovery",
          status: failures.length ? "partial" : "ok",
          records_created:
            counts.ar + counts.id + counts.vi + counts.th + counts.en_regional + counts.en_backtrans,
          articles_processed: QUERIES.length,
          output: { queries: QUERIES.length, ...counts, failures: failures.length },
          errors: failures.length ? failures : null,
          notice: failures.length ? JSON.stringify(failures).slice(0, 4000) : null,
        });

        return Response.json({ ok: true, counts, failures });
      },
    },
  },
});

// Cheap Indonesian sniff — common high-frequency Bahasa words. Used only as
// a tiebreaker when output is Latin-script and the query was Indonesian.
function isProbablyIndonesian(text: string): boolean {
  const t = text.toLowerCase();
  const markers = [" yang ", " dan ", " untuk ", " dengan ", " adalah ", " pelanggan ", " perusahaan "];
  return markers.some((m) => t.includes(m));
}
