/**
 * Weekly Native Reviewer Flagging — Workflow Eight.
 *
 * TRIGGER: pg_cron, Monday 09:00 UTC. Same x-cron-secret as other workflows.
 *
 * STEP 1 — Count unreviewed non-English active lumi_knowledge records per language.
 * STEP 2 — For each language with > 10 unreviewed records, take the oldest 20.
 * STEP 3 — Render a plain-text reviewer export with instructions, numbered
 *          records, status checkboxes, and the language's glossary reference.
 * STEP 4 — Upload to private storage bucket `review-packages/<lang>/<date>.txt`.
 * STEP 5 — Email link if REVIEWER_EMAIL_<LANG> is configured (best-effort via
 *          Resend connector if present; skipped silently otherwise).
 *
 * STEP 6 (manual return processing) lives in a separate admin server function
 * — outside the scope of the scheduled job.
 */
import { createFileRoute } from "@tanstack/react-router";

const LANGUAGE_NAME: Record<string, string> = {
  ar: "Arabic",
  id: "Bahasa Indonesia",
  vi: "Vietnamese",
  th: "Thai",
};

const MARKET: Record<string, string> = {
  ar: "Middle East (Saudi Arabia, UAE, Egypt)",
  id: "Indonesia",
  vi: "Vietnam",
  th: "Thailand",
};

const THRESHOLD = 10;
const BATCH_SIZE = 20;

type KnowledgeRow = {
  id: string;
  content: string;
  source_slug: string | null;
  language: string;
  created_at: string;
};

type GlossaryRow = {
  term: string;
  protection_type: string | null;
  fixed_translations: Record<string, string> | null;
  category: string | null;
};

function renderPackage(
  lang: string,
  records: KnowledgeRow[],
  glossary: GlossaryRow[],
): string {
  const date = new Date().toISOString().slice(0, 10);
  const langName = LANGUAGE_NAME[lang] ?? lang.toUpperCase();
  const market = MARKET[lang] ?? lang;

  const header = [
    `LUMI KNOWLEDGE BASE REVIEW — ${langName.toUpperCase()} — ${date}`,
    "",
    "INSTRUCTIONS: Please review each record below. These will be injected",
    `into Lumi's system prompt when responding to CS professionals in ${market}.`,
    "",
    "For each record:",
    "  - If accurate and natural: mark APPROVED",
    "  - If needs correction: provide corrected version",
    "  - If should not be used: mark REJECT with reason",
    "",
    "Focus on: naturalness in professional register, accuracy of CS",
    "terminology, consistency with the fixed translation terms at the",
    "bottom of this doc.",
    "",
    "─".repeat(60),
    "",
  ].join("\n");

  const body = records
    .map((r, i) => {
      const n = String(i + 1).padStart(3, "0");
      return [
        `RECORD ${n} (ID: ${r.id})`,
        r.source_slug ? `Source: ${r.source_slug}` : null,
        "",
        r.content,
        "",
        "STATUS: [ ] APPROVED  [ ] CORRECTED  [ ] REJECTED",
        "CORRECTION IF NEEDED:",
        "",
        "",
        "─".repeat(60),
        "",
      ]
        .filter((v) => v !== null)
        .join("\n");
    })
    .join("\n");

  const neverTranslate = glossary
    .filter((g) => g.protection_type === "never_translate")
    .map((g) => `  - ${g.term}`)
    .join("\n");

  const fixedPairs: string[] = [];
  for (const g of glossary) {
    const t = g.fixed_translations?.[lang];
    if (typeof t === "string" && t.trim()) {
      fixedPairs.push(`  - "${g.term}" → "${t}"${g.category ? ` (${g.category})` : ""}`);
    }
  }

  const glossarySection = [
    "FIXED TRANSLATION REFERENCE:",
    "",
    "Never translate (use English term verbatim):",
    neverTranslate || "  (none)",
    "",
    `Fixed translations into ${langName}:`,
    fixedPairs.join("\n") || "  (none)",
    "",
  ].join("\n");

  return header + body + "\n" + glossarySection;
}

async function maybeEmail(
  lang: string,
  recordCount: number,
  downloadPath: string,
): Promise<{ sent: boolean; reason?: string }> {
  const to = process.env[`REVIEWER_EMAIL_${lang.toUpperCase()}`];
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.REVIEWER_EMAIL_FROM ?? "lumi@thecsquarterly.com";
  if (!to) return { sent: false, reason: "no_reviewer_email_configured" };
  if (!resendKey) return { sent: false, reason: "no_email_provider" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `Lumi ${LANGUAGE_NAME[lang] ?? lang} Review — ${recordCount} records`,
        text: [
          `${recordCount} unreviewed Lumi knowledge records are awaiting your review.`,
          "",
          `Download from Supabase Storage (private bucket):`,
          downloadPath,
          "",
          "Reply with the completed file as an attachment when done.",
        ].join("\n"),
      }),
    });
    if (!res.ok) return { sent: false, reason: `resend_${res.status}` };
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : "email_failed" };
  }
}

export const Route = createFileRoute("/api/public/hooks/flag-translations")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env.INGESTION_CRON_SECRET;
        if (!cronSecret) {
          return Response.json({ error: "cron_secret_missing" }, { status: 500 });
        }
        if (request.headers.get("x-cron-secret") !== cronSecret) {
          return Response.json({ error: "unauthorized" }, { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // STEP 1 — count unreviewed per language
        const { data: rows, error: countErr } = await supabaseAdmin
          .from("lumi_knowledge")
          .select("language")
          .eq("translation_reviewed", false)
          .eq("is_active", true)
          .neq("language", "en");

        if (countErr) {
          return Response.json({ error: "count_failed", reason: countErr.message }, { status: 500 });
        }

        const counts = new Map<string, number>();
        for (const r of rows ?? []) {
          if (!r.language) continue;
          counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
        }

        const date = new Date().toISOString().slice(0, 10);
        const packages: Array<{
          lang: string;
          count: number;
          batch: number;
          path: string;
          emailed: { sent: boolean; reason?: string };
        }> = [];
        const skipped: Array<{ lang: string; count: number; reason: string }> = [];

        // Glossary fetched once
        const { data: glossaryRows } = await supabaseAdmin
          .from("translation_glossary")
          .select("term, protection_type, fixed_translations, category");
        const glossary = (glossaryRows ?? []) as GlossaryRow[];

        // STEP 2 — for each language over threshold
        for (const [lang, count] of counts) {
          if (count <= THRESHOLD) {
            skipped.push({ lang, count, reason: "below_threshold" });
            continue;
          }

          const { data: batchRows, error: batchErr } = await supabaseAdmin
            .from("lumi_knowledge")
            .select("id, content, source_slug, language, created_at")
            .eq("translation_reviewed", false)
            .eq("is_active", true)
            .eq("language", lang)
            .order("created_at", { ascending: true })
            .limit(BATCH_SIZE);

          if (batchErr || !batchRows?.length) {
            skipped.push({ lang, count, reason: "batch_query_failed" });
            continue;
          }

          // STEP 3 — render
          const text = renderPackage(lang, batchRows as KnowledgeRow[], glossary);
          const path = `${lang}/${date}.txt`;

          // STEP 4 — upload
          const { error: uploadErr } = await supabaseAdmin.storage
            .from("review-packages")
            .upload(path, new Blob([text], { type: "text/plain; charset=utf-8" }), {
              upsert: true,
              contentType: "text/plain; charset=utf-8",
            });

          if (uploadErr) {
            skipped.push({ lang, count, reason: `upload_failed:${uploadErr.message}` });
            continue;
          }

          // STEP 5 — best-effort email
          const emailed = await maybeEmail(
            lang,
            batchRows.length,
            `review-packages/${path}`,
          );

          packages.push({
            lang,
            count,
            batch: batchRows.length,
            path: `review-packages/${path}`,
            emailed,
          });
        }

        await supabaseAdmin.from("workflow_runs").insert({
          workflow: "reviewer_flagging",
          status: packages.length ? "ok" : "no_action",
          records_created: packages.reduce((a, p) => a + p.batch, 0),
          articles_processed: rows?.length ?? 0,
          output: {
            counts: Object.fromEntries(counts),
            packages,
            skipped,
          },
        });

        return Response.json({ ok: true, packages, skipped });
      },
    },
  },
});
