/**
 * Branded PDF export for diagnostic scores. Delegates rendering to the
 * shared dark-theme brand renderer in `brand-pdf.ts` so every PDF the
 * site emits looks like the same heavyweight midnight-blue stock.
 */
import { renderBrandedPdf, type BrandSection } from "@/lib/brand-pdf";

type Section = { eyebrow?: string; title: string; body: string | string[] };

export type DiagnosticPdfInput = {
  slug: string;
  diagnosticName: string;
  scoreLabel: string;
  scoreValue: string;
  tierLabel?: string;
  interpretation: string;
  subScores?: { label: string; value: number }[];
  blueprintSections?: Section[];
  isUnlocked: boolean;
  shareUrlPath: string;
  firstName?: string;
};

export function downloadDiagnosticPdf(input: DiagnosticPdfInput) {
  const sections: BrandSection[] = [];

  sections.push({
    kind: "kv",
    eyebrow: input.scoreLabel,
    title: `${input.scoreValue}${input.tierLabel ? `  ·  ${input.tierLabel}` : ""}`,
    rows: (input.subScores ?? []).map((s) => ({ label: s.label, value: `${s.value}` })),
  });

  sections.push({
    kind: "prose",
    eyebrow: "What this means",
    body: input.interpretation,
  });

  if (input.isUnlocked && input.blueprintSections?.length) {
    sections.push({ kind: "divider" });
    for (const s of input.blueprintSections) {
      sections.push({
        kind: "prose",
        eyebrow: s.eyebrow,
        title: s.title,
        body: Array.isArray(s.body) ? s.body.join("\n\n") : s.body,
      });
    }
  } else {
    sections.push({ kind: "divider" });
    sections.push({
      kind: "bullets",
      eyebrow: "What a Practitioner subscription unlocks",
      items: [
        "Full re-threading / 90-day blueprint for every diagnostic.",
        "All six Codex playbooks and the CSFactors personal dashboard.",
        "Lumi decision agent — 50 sessions a month.",
        "Two-voice premium archive, downloadable as branded PDF.",
      ],
    });
  }

  renderBrandedPdf({
    firstName: input.firstName || "Reader",
    title: input.diagnosticName,
    subtitle: input.tierLabel,
    kicker: "Diagnostic",
    sections,
    filenameSlug: input.slug,
  });
}
