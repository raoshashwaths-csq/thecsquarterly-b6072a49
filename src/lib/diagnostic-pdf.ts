/**
 * Branded PDF export for diagnostic scores.
 *
 * Uses jsPDF (already a dependency) to render a CS Quarterly-branded
 * one-or-two page report. Free tier gets score + interpretation + a
 * CTA panel pointing to thecsquarterly.com; paid tier (rank >= 1) gets
 * score + full blueprint sections.
 *
 * The PDF is generated entirely client-side so it works without a
 * server round-trip and never leaks user emails.
 */
import jsPDF from "jspdf";
import { CANONICAL_ORIGIN, canonicalUrl } from "@/lib/canonical-url";

type Section = { eyebrow?: string; title: string; body: string | string[] };

export type DiagnosticPdfInput = {
  slug: string;
  diagnosticName: string;
  scoreLabel: string;          // e.g. "Single-threading exposure"
  scoreValue: string;          // e.g. "62%"
  tierLabel?: string;          // e.g. "High exposure" / "AI Native"
  interpretation: string;
  subScores?: { label: string; value: number }[];
  blueprintSections?: Section[];   // shown only if isUnlocked
  isUnlocked: boolean;
  shareUrlPath: string;            // e.g. "/diagnostics/champion-dependency"
};

// brand tokens (cream parchment)
const BRAND = {
  bg: "#F5F0E9",
  ink: "#1A1A1A",
  muted: "#6B655E",
  accent: "#7A1F1F",       // oxblood
  secondary: "#B08A3E",    // gold
  rule: "#D9CBC2",         // shellstone
};

const PAGE_W = 595; // A4 in pt
const PAGE_H = 842;
const MARGIN = 56;

export function downloadDiagnosticPdf(input: DiagnosticPdfInput) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  let page = 1;
  drawShell(doc);
  let y = drawHeader(doc, input);
  y = drawScoreBlock(doc, input, y);

  if (input.subScores?.length) {
    y = drawSubScores(doc, input.subScores, y);
  }

  y = drawInterpretation(doc, input.interpretation, y);

  if (input.isUnlocked && input.blueprintSections?.length) {
    // Page 2 for the blueprint
    doc.addPage();
    page += 1;
    drawShell(doc);
    y = drawSectionTitle(doc, "Your re-threading blueprint", MARGIN + 30);
    for (const s of input.blueprintSections) {
      y = drawBlueprintSection(doc, s, y);
      if (y > PAGE_H - MARGIN - 80) {
        doc.addPage();
        page += 1;
        drawShell(doc);
        y = MARGIN + 30;
      }
    }
  } else {
    y = drawUpgradeCta(doc, y);
  }

  drawFooter(doc, page);
  doc.save(`cs-quarterly-${input.slug}-score.pdf`);
}

function drawShell(doc: jsPDF) {
  doc.setFillColor(BRAND.bg);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  // hairline frame
  doc.setDrawColor(BRAND.rule);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, MARGIN, PAGE_W - MARGIN, MARGIN);
  doc.line(MARGIN, PAGE_H - MARGIN, PAGE_W - MARGIN, PAGE_H - MARGIN);
}

function drawHeader(doc: jsPDF, input: DiagnosticPdfInput): number {
  // wordmark "The CS Quarterly."
  doc.setTextColor(BRAND.ink);
  doc.setFont("times", "normal");
  doc.setFontSize(18);
  doc.text("The CS Quarterly", MARGIN, MARGIN - 18);
  doc.setTextColor(BRAND.accent);
  const wmW = doc.getTextWidth("The CS Quarterly");
  doc.text(".", MARGIN + wmW, MARGIN - 18);

  doc.setTextColor(BRAND.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(input.diagnosticName.toUpperCase(), PAGE_W - MARGIN, MARGIN - 18, { align: "right" });

  return MARGIN + 28;
}

function drawScoreBlock(doc: jsPDF, input: DiagnosticPdfInput, y: number): number {
  doc.setTextColor(BRAND.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(input.scoreLabel.toUpperCase(), MARGIN, y + 16);

  doc.setTextColor(BRAND.ink);
  doc.setFont("times", "bold");
  doc.setFontSize(72);
  doc.text(input.scoreValue, MARGIN, y + 80);

  if (input.tierLabel) {
    doc.setTextColor(BRAND.accent);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(input.tierLabel.toUpperCase(), MARGIN, y + 102);
  }

  // divider
  doc.setDrawColor(BRAND.rule);
  doc.line(MARGIN, y + 120, PAGE_W - MARGIN, y + 120);
  return y + 134;
}

function drawSubScores(doc: jsPDF, subs: { label: string; value: number }[], y: number): number {
  doc.setTextColor(BRAND.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("BREAKDOWN", MARGIN, y);
  y += 14;

  for (const s of subs) {
    doc.setTextColor(BRAND.ink);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(s.label, MARGIN, y);
    doc.text(`${s.value}`, PAGE_W - MARGIN, y, { align: "right" });
    // bar
    const barY = y + 6;
    const barW = PAGE_W - MARGIN * 2;
    doc.setFillColor(BRAND.rule);
    doc.rect(MARGIN, barY, barW, 3, "F");
    doc.setFillColor(BRAND.accent);
    doc.rect(MARGIN, barY, (barW * Math.max(0, Math.min(100, s.value))) / 100, 3, "F");
    y += 22;
  }
  return y + 8;
}

function drawInterpretation(doc: jsPDF, body: string, y: number): number {
  doc.setTextColor(BRAND.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("WHAT THIS MEANS", MARGIN, y);
  y += 14;
  doc.setTextColor(BRAND.ink);
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(body, PAGE_W - MARGIN * 2);
  doc.text(lines, MARGIN, y);
  return y + lines.length * 14 + 8;
}

function drawSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setTextColor(BRAND.ink);
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.text(title, MARGIN, y);
  doc.setDrawColor(BRAND.rule);
  doc.line(MARGIN, y + 10, PAGE_W - MARGIN, y + 10);
  return y + 26;
}

function drawBlueprintSection(doc: jsPDF, s: Section, y: number): number {
  if (s.eyebrow) {
    doc.setTextColor(BRAND.secondary);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(s.eyebrow.toUpperCase(), MARGIN, y);
    y += 12;
  }
  doc.setTextColor(BRAND.ink);
  doc.setFont("times", "bold");
  doc.setFontSize(13);
  doc.text(s.title, MARGIN, y);
  y += 14;

  doc.setFont("times", "normal");
  doc.setFontSize(10.5);
  const bodyArr = Array.isArray(s.body) ? s.body : [s.body];
  for (const para of bodyArr) {
    const lines = doc.splitTextToSize(para, PAGE_W - MARGIN * 2);
    doc.text(lines, MARGIN, y);
    y += lines.length * 13 + 6;
  }
  return y + 6;
}

function drawUpgradeCta(doc: jsPDF, y: number): number {
  // panel
  const h = 110;
  doc.setFillColor(BRAND.ink);
  doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, h, "F");
  doc.setTextColor(BRAND.bg);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("WHAT A PRACTITIONER SUBSCRIPTION UNLOCKS", MARGIN + 16, y + 22);
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  const bullets = [
    "Full re-threading / 90-day blueprint for every diagnostic.",
    "All six Codex playbooks and the CSFactors personal dashboard.",
    "Lumi decision agent — 50 sessions a month.",
    "Two-voice premium archive, downloadable as PDF.",
  ];
  let by = y + 40;
  for (const b of bullets) {
    doc.text(`•  ${b}`, MARGIN + 16, by);
    by += 14;
  }
  doc.setTextColor(BRAND.secondary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Upgrade at ${CANONICAL_ORIGIN.replace("https://", "")}/pricing`, MARGIN + 16, y + h - 14);
  return y + h + 12;
}

function drawFooter(doc: jsPDF, _page: number) {
  doc.setTextColor(BRAND.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.text(canonicalUrl("/").replace("https://", ""), MARGIN, PAGE_H - MARGIN + 18);
    doc.text(`Page ${i} / ${totalPages}`, PAGE_W - MARGIN, PAGE_H - MARGIN + 18, { align: "right" });
  }
}
