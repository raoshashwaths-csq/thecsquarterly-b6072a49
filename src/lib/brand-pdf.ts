/**
 * Branded "heavyweight paper" PDF renderer for The CS Quarterly.
 *
 * Dark midnight-slate background, gold + cream typography, hairline gold
 * border. Every PDF is personalised with the reader's first name and a
 * dated footer. Uses jsPDF built-in Times + Helvetica (no external font
 * loading needed in the Worker SSR runtime).
 *
 * Color tokens MIRROR the dark CSS tokens in src/styles.css. Update both
 * if either changes.
 */
import jsPDF from "jspdf";
import { CANONICAL_ORIGIN } from "@/lib/canonical-url";

export const BRAND_DARK = {
  ink: "#0B1220",       // midnight-slate page
  paper: "#F5F0E1",     // warm cream text
  paperDim: "#C9C2AE",  // muted cream
  gold: "#C9A24A",      // accent gold (Quicksand gold)
  goldDeep: "#8B6F2A",
  rule: "#1F2A3D",      // subtle dark rule
} as const;

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 56;

export type BrandSection =
  | { kind: "prose"; eyebrow?: string; title?: string; body: string }
  | { kind: "bullets"; eyebrow?: string; title?: string; items: string[] }
  | { kind: "kv"; eyebrow?: string; title?: string; rows: { label: string; value: string }[] }
  | { kind: "quote"; body: string; attribution?: string }
  | { kind: "divider" };

export type BrandPdfInput = {
  firstName: string;             // resolved on caller side; falls back to "Reader"
  title: string;                 // display title (gold)
  subtitle?: string;
  kicker?: string;               // small uppercase tag in header right
  sections: BrandSection[];
  footerNote?: string;
  filenameSlug: string;          // becomes csq-{slug}-{firstname}-{date}.pdf
};

export function renderBrandedPdf(input: BrandPdfInput): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  drawShell(doc);
  let y = drawHeader(doc, input);
  y = drawTitle(doc, input, y);

  for (const section of input.sections) {
    y = ensureRoom(doc, y, 100);
    y = drawSection(doc, section, y);
  }

  drawFooter(doc, input);
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const first = sanitizeName(input.firstName);
  doc.save(`csq-${input.filenameSlug}-${first}-${date}.pdf`);
}

function sanitizeName(n: string): string {
  return (n || "reader").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "reader";
}

function drawShell(doc: jsPDF) {
  // Full bleed midnight fill
  doc.setFillColor(BRAND_DARK.ink);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");

  // Subtle "heavyweight paper" grain — sparse dim flecks
  doc.setFillColor(BRAND_DARK.rule);
  let seed = 1337;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 220; i++) {
    const x = rnd() * PAGE_W;
    const yy = rnd() * PAGE_H;
    doc.circle(x, yy, 0.3, "F");
  }

  // Inner hairline gold border — the "deckle"
  doc.setDrawColor(BRAND_DARK.gold);
  doc.setLineWidth(0.6);
  doc.rect(MARGIN - 14, MARGIN - 28, PAGE_W - (MARGIN - 14) * 2, PAGE_H - (MARGIN - 28) * 2, "S");
  doc.setDrawColor(BRAND_DARK.goldDeep);
  doc.setLineWidth(0.2);
  doc.rect(MARGIN - 10, MARGIN - 24, PAGE_W - (MARGIN - 10) * 2, PAGE_H - (MARGIN - 24) * 2, "S");
}

function drawHeader(doc: jsPDF, input: BrandPdfInput): number {
  // Wordmark "The CS Quarterly" + gold period
  doc.setFont("times", "normal");
  doc.setFontSize(13);
  doc.setTextColor(BRAND_DARK.paper);
  doc.text("The CS Quarterly", MARGIN, MARGIN - 8);
  const wmW = doc.getTextWidth("The CS Quarterly");
  doc.setTextColor(BRAND_DARK.gold);
  doc.text(".", MARGIN + wmW, MARGIN - 8);

  // Right-aligned kicker
  if (input.kicker) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(BRAND_DARK.gold);
    doc.text(input.kicker.toUpperCase(), PAGE_W - MARGIN, MARGIN - 8, { align: "right" });
  }

  return MARGIN + 8;
}

function drawTitle(doc: jsPDF, input: BrandPdfInput, y: number): number {
  // "Prepared for {FirstName}" tag
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(BRAND_DARK.paperDim);
  doc.text(`PREPARED FOR ${input.firstName.toUpperCase()}`, MARGIN, y + 18);

  // Main title (gold + cream)
  doc.setFont("times", "bold");
  doc.setFontSize(28);
  doc.setTextColor(BRAND_DARK.paper);
  const titleLines = doc.splitTextToSize(input.title, PAGE_W - MARGIN * 2 - 14);
  doc.text(titleLines, MARGIN, y + 50);
  let cur = y + 50 + titleLines.length * 30;

  // Trailing gold flourish
  doc.setDrawColor(BRAND_DARK.gold);
  doc.setLineWidth(1.2);
  doc.line(MARGIN, cur + 6, MARGIN + 48, cur + 6);
  cur += 18;

  if (input.subtitle) {
    doc.setFont("times", "italic");
    doc.setFontSize(13);
    doc.setTextColor(BRAND_DARK.paperDim);
    const subLines = doc.splitTextToSize(input.subtitle, PAGE_W - MARGIN * 2);
    doc.text(subLines, MARGIN, cur + 14);
    cur += 14 + subLines.length * 16;
  }

  return cur + 14;
}

function drawSection(doc: jsPDF, s: BrandSection, y: number): number {
  if (s.kind === "divider") {
    doc.setDrawColor(BRAND_DARK.rule);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, y + 4, PAGE_W - MARGIN, y + 4);
    return y + 18;
  }

  if (s.kind === "quote") {
    doc.setDrawColor(BRAND_DARK.gold);
    doc.setLineWidth(2);
    doc.line(MARGIN, y, MARGIN, y + 60);
    doc.setFont("times", "italic");
    doc.setFontSize(13);
    doc.setTextColor(BRAND_DARK.paper);
    const lines = doc.splitTextToSize(s.body, PAGE_W - MARGIN * 2 - 16);
    doc.text(lines, MARGIN + 14, y + 14);
    let cur = y + 14 + lines.length * 16;
    if (s.attribution) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(BRAND_DARK.gold);
      doc.text(`— ${s.attribution.toUpperCase()}`, MARGIN + 14, cur + 12);
      cur += 16;
    }
    return cur + 14;
  }

  // eyebrow + title for prose/bullets/kv
  if (s.eyebrow) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(BRAND_DARK.gold);
    doc.text(s.eyebrow.toUpperCase(), MARGIN, y);
    y += 12;
  }
  if (s.title) {
    doc.setFont("times", "bold");
    doc.setFontSize(15);
    doc.setTextColor(BRAND_DARK.paper);
    const titleLines = doc.splitTextToSize(s.title, PAGE_W - MARGIN * 2);
    doc.text(titleLines, MARGIN, y + 4);
    y += 4 + titleLines.length * 18;
  }

  if (s.kind === "prose") {
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.setTextColor(BRAND_DARK.paper);
    const paragraphs = s.body.split(/\n\n+/);
    for (const para of paragraphs) {
      const lines = doc.splitTextToSize(para.trim(), PAGE_W - MARGIN * 2);
      y = ensureRoom(doc, y, lines.length * 14 + 12);
      doc.text(lines, MARGIN, y + 4);
      y += lines.length * 14 + 8;
    }
    return y + 6;
  }

  if (s.kind === "bullets") {
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    for (const item of s.items) {
      const lines = doc.splitTextToSize(item, PAGE_W - MARGIN * 2 - 14);
      y = ensureRoom(doc, y, lines.length * 14 + 6);
      doc.setTextColor(BRAND_DARK.gold);
      doc.text("•", MARGIN, y + 6);
      doc.setTextColor(BRAND_DARK.paper);
      doc.text(lines, MARGIN + 14, y + 6);
      y += lines.length * 14 + 4;
    }
    return y + 8;
  }

  if (s.kind === "kv") {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    for (const row of s.rows) {
      y = ensureRoom(doc, y, 20);
      doc.setTextColor(BRAND_DARK.paperDim);
      doc.text(row.label, MARGIN, y + 6);
      doc.setTextColor(BRAND_DARK.paper);
      const valLines = doc.splitTextToSize(row.value, (PAGE_W - MARGIN * 2) * 0.55);
      doc.text(valLines, PAGE_W - MARGIN, y + 6, { align: "right" });
      y += Math.max(16, valLines.length * 14) + 2;
      doc.setDrawColor(BRAND_DARK.rule);
      doc.setLineWidth(0.3);
      doc.line(MARGIN, y, PAGE_W - MARGIN, y);
      y += 4;
    }
    return y + 8;
  }

  return y;
}

function ensureRoom(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_H - MARGIN - 30) {
    doc.addPage();
    drawShell(doc);
    return MARGIN + 8;
  }
  return y;
}

function drawFooter(doc: jsPDF, input: BrandPdfInput) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(BRAND_DARK.paperDim);
    const left = input.footerNote ?? CANONICAL_ORIGIN.replace("https://", "");
    const date = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    doc.text(`${left}  ·  ${date}`, MARGIN, PAGE_H - MARGIN + 10);
    doc.setTextColor(BRAND_DARK.gold);
    doc.text(`${i} / ${total}`, PAGE_W - MARGIN, PAGE_H - MARGIN + 10, { align: "right" });
  }
}

/** Pull a sensible first name from a Supabase user, falling back to "Reader". */
export function firstNameFromUser(user: {
  user_metadata?: Record<string, unknown> | null;
  email?: string | null;
} | null | undefined): string {
  if (!user) return "Reader";
  const meta = user.user_metadata ?? {};
  const candidates = [
    (meta.first_name as string | undefined),
    (meta.given_name as string | undefined),
    typeof meta.full_name === "string" ? meta.full_name.split(" ")[0] : undefined,
    typeof meta.name === "string" ? meta.name.split(" ")[0] : undefined,
    typeof meta.display_name === "string" ? meta.display_name.split(" ")[0] : undefined,
  ].filter(Boolean) as string[];
  if (candidates.length) return capitalize(candidates[0]);
  const email = user.email ?? "";
  if (email) return capitalize(email.split("@")[0].split(/[._]/)[0]);
  return "Reader";
}

function capitalize(s: string): string {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}
