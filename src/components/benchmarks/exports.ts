import { ACV_BANDS, BENCHMARK_MATRIX, CHECKLIST, HURDLE_RATES, AI_CALLOUTS, MARGIN_GOVERNORS } from "./data";
import { renderBrandedPdf, type BrandSection } from "@/lib/brand-pdf";

export const CHECKLIST_STORAGE_KEY = "csq:benchmarks:checklist:v1";

function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((r) =>
      r
        .map((cell) => {
          const s = String(cell ?? "");
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\n");
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const METRIC_ROWS: { key: keyof (typeof BENCHMARK_MATRIX)["smb"]; label: string }[] = [
  { key: "medianGrr", label: "Median GRR" },
  { key: "worldClassGrr", label: "World-Class GRR (75th pct)" },
  { key: "medianNrr", label: "Median NRR" },
  { key: "worldClassNrr", label: "World-Class NRR (75th pct)" },
  { key: "cacPayback", label: "Blended CAC Payback" },
  { key: "csSpend", label: "CS Spend (% of ARR)" },
  { key: "deliveryModel", label: "Delivery Model" },
  { key: "arrPerCsm", label: "ARR-to-CSM Ratio" },
  { key: "logoChurn", label: "Annual Logo Churn" },
  { key: "timeToValue", label: "Time-to-Value" },
];

export function exportBenchmarkMatrixCsv() {
  const header = ["Metric", ...ACV_BANDS.map((b) => `${b.label} (${b.range})`)];
  const body = METRIC_ROWS.map((m) => [m.label, ...ACV_BANDS.map((b) => BENCHMARK_MATRIX[b.id][m.key])]);
  downloadBlob(toCsv([header, ...body]), "csq-benchmarks-matrix.csv", "text/csv;charset=utf-8");
}

export function exportChecklistCsv(audited: Record<string, boolean>) {
  const rows: (string | number)[][] = [
    ["#", "Title", "Audited", "Error Pattern", "Detection Method", "Correction Protocol"],
    ...CHECKLIST.map((c, i) => [
      i + 1,
      c.title,
      audited[c.id] ? "YES" : "NO",
      c.error,
      c.detection,
      c.correction,
    ]),
  ];
  downloadBlob(toCsv(rows), "csq-fpa-audit-checklist.csv", "text/csv;charset=utf-8");
}

export function exportFullReportPdf(firstName: string, audited: Record<string, boolean>) {
  const completed = Object.values(audited).filter(Boolean).length;
  const sections: BrandSection[] = [];

  sections.push({
    kind: "prose",
    eyebrow: "Executive Summary",
    title: "A structural inversion in post-sale economics",
    body:
      "Aggregate data from 2,900+ private and public SaaS companies reveals six structural forces reshaping the post-sale function. Median NRR sits at 101%, median GRR at 84%, and expansion ARR accounts for 40%+ of net-new ARR at scale.",
  });

  sections.push({ kind: "divider" });
  sections.push({
    kind: "kv",
    eyebrow: "Benchmark Registry",
    title: "Median NRR by ACV band",
    rows: ACV_BANDS.map((b) => ({
      label: `${b.label} (${b.range})`,
      value: `NRR ${BENCHMARK_MATRIX[b.id].medianNrr} · GRR ${BENCHMARK_MATRIX[b.id].medianGrr} · Payback ${BENCHMARK_MATRIX[b.id].cacPayback}`,
    })),
  });

  sections.push({ kind: "divider" });
  sections.push({
    kind: "kv",
    eyebrow: "Institutional Hurdle Rates",
    title: "IRR range: 25–35%",
    rows: HURDLE_RATES.map((h) => ({ label: h.type, value: h.rate })),
  });

  sections.push({ kind: "divider" });
  sections.push({
    kind: "kv",
    eyebrow: "FP&A Audit Progress",
    title: `${completed} of ${CHECKLIST.length} items audited`,
    rows: CHECKLIST.map((c, i) => ({
      label: `${String(i + 1).padStart(2, "0")}. ${c.title}`,
      value: audited[c.id] ? "✓ AUDITED" : "— PENDING",
    })),
  });

  sections.push({ kind: "divider" });
  sections.push({
    kind: "kv",
    eyebrow: "AI Deflation Paradox",
    title: "Five mutations · headline metrics",
    rows: AI_CALLOUTS.map((c) => ({ label: c.title, value: `${c.metric} · ${c.metricLabel}` })),
  });

  sections.push({ kind: "divider" });
  sections.push({
    kind: "kv",
    eyebrow: "CS as Gross Margin Governor",
    title: "Basis-point recovery by activity",
    rows: MARGIN_GOVERNORS.map((g) => ({ label: g.activity, value: g.recovery })),
  });

  renderBrandedPdf({
    firstName,
    title: "2026 State of the Industry Report",
    subtitle: "Institutional benchmark registry, financial math, and the AI gross-margin reset",
    kicker: "Q2 2026 · Benchmarks",
    sections,
    filenameSlug: "benchmarks-report",
  });
}
