// Feature glossary — operator-grade, full definitions (longer than the
// inline acronym tooltips in src/lib/glossary.ts).

export type GlossaryItem = {
  id: string;
  term: string;
  short: string;
  definition: string;
  formula?: string;
  whyItMatters?: string;
  tags?: string[];
  link?: { label: string; to: string };
};

export const FEATURE_GLOSSARY: GlossaryItem[] = [
  {
    id: "nrr",
    term: "Net Retention Rate (NRR)",
    short: "Recurring revenue retained from existing customers, including expansion.",
    definition:
      "NRR measures how much recurring revenue you keep — and grow — from your existing customer base over a period, ignoring new logos. It is the single cleanest read on whether your install base is healthy.",
    formula: "NRR = (Starting ARR + Expansion − Contraction − Churn) ÷ Starting ARR",
    whyItMatters:
      "Above 120% you have a working land-and-expand motion; below 100% you are leaking and new bookings are just refilling the bucket.",
    tags: ["nrr", "retention", "revenue", "metric"],
  },
  {
    id: "grr",
    term: "Gross Retention Rate (GRR)",
    short: "Revenue retained from existing customers, excluding any expansion.",
    definition:
      "GRR strips expansion out of the equation and shows what you would retain if you sold zero upsell. It's the honest read on stickiness.",
    formula: "GRR = (Starting ARR − Contraction − Churn) ÷ Starting ARR",
    whyItMatters:
      "NRR can mask churn behind expansion. A 115% NRR with an 82% GRR means a few large accounts are carrying the number — fragile.",
    tags: ["grr", "retention", "metric"],
  },
  {
    id: "csf-box",
    term: "Critical Success Factors (CSF) Box",
    short: "The homepage tile of your live Command Centre.",
    definition:
      "The CSF Box is the executive read of your portfolio in one glance: account health, escalations, renewals at risk, expansion in play, and the burning three. It is intentionally the first surface on the homepage because it's the only view that ties revenue, sentiment and stakeholder posture together.",
    whyItMatters:
      "If you check one CS surface per day, this is it. Everything else exists to feed or explain what the CSF Box is telling you.",
    tags: ["csf", "command centre", "dashboard"],
    link: { label: "Open Command Centre", to: "/csfactors" },
  },
  {
    id: "ai-readiness",
    term: "AI Readiness Diagnostic",
    short: "A framework for measuring CS tech-stack and workflow maturity.",
    definition:
      "Eleven dimensions and forty-four metrics scoring how ready your CS function is to operate with AI in the loop — data hygiene, workflow instrumentation, stakeholder posture, governance, and outcome telemetry.",
    whyItMatters:
      "Tools without readiness produce expensive theatre. The diagnostic tells you which lever to pull next, in order.",
    tags: ["ai", "diagnostic", "readiness", "maturity"],
    link: { label: "Run the diagnostic", to: "/ai-readiness" },
  },
  {
    id: "ask-q",
    term: "Ask Q Engine",
    short: "Type plain-English questions to slice your portfolio and analytics live.",
    definition:
      "Q is the brand agent that understands your accounts, your CSF data, and your benchmarks. Phrase questions like you would to a CSM — Q routes them to the right tree (escalation, expansion, QBR, etc.) and returns a structured answer.",
    whyItMatters:
      'Prompts like "Which accounts have a renewal in 60 days and red sentiment?" replace 20 minutes of SQL or spreadsheet wrangling.',
    tags: ["q", "ai", "agent", "ask"],
  },
  {
    id: "ttv",
    term: "Time-to-Value (TTV)",
    short: "Elapsed time from signature to first measurable outcome.",
    definition:
      "TTV is the clock from contract signature to the customer realizing the first concrete business outcome — not the first login, not go-live, the first outcome.",
    whyItMatters:
      "Every additional week of TTV measurably reduces year-2 NRR. It is the most leveraged onboarding metric you can manage.",
    tags: ["ttv", "onboarding", "metric"],
  },
  {
    id: "thi",
    term: "True Health Index (THI)",
    short: "Composite health signal blending usage, sentiment and commercial posture.",
    definition:
      "THI rolls product usage, support sentiment, stakeholder coverage and commercial posture into a single 0–100 score per account. It's directionally honest where single-signal health scores aren't.",
    tags: ["health", "thi", "metric"],
  },
  {
    id: "qbr",
    term: "QBR / EBR",
    short: "Quarterly and Executive Business Reviews.",
    definition:
      "QBR is the operator-level structured check-in tying product usage to business outcomes. EBR is the higher-altitude version aimed at C-level stakeholders. Both belong on a cadence, not on a fire drill.",
    tags: ["qbr", "ebr", "review"],
  },
  {
    id: "roi-calc",
    term: "ROI Calculator",
    short: "Stand-alone module to model NRR, payback and contraction scenarios.",
    definition:
      "Use the ROI Calculator to pressure-test renewal and expansion assumptions before they land in a board pack. Run an upside, a base and a contraction case — bring all three to the conversation.",
    tags: ["roi", "calculator", "modeling"],
    link: { label: "Open ROI Calculator", to: "/calculator" },
  },
  {
    id: "workspace",
    term: "Workspace",
    short: "Your private surface for notes, drafts and account context.",
    definition:
      "Workspace is where you drop the raw material — call notes, draft emails, account context. Q reads from it, so the more you put there, the sharper the answers it gives back.",
    tags: ["workspace", "notes"],
    link: { label: "Open Workspace", to: "/account/workspace" },
  },
  {
    id: "csql",
    term: "CSQL",
    short: "Customer Success Qualified Lead.",
    definition:
      "An expansion opportunity surfaced and validated by CS before being handed off to sales. CSQLs convert at meaningfully higher rates than marketing-sourced expansion plays.",
    tags: ["csql", "expansion", "sales"],
  },
];

export function filterGlossary(items: GlossaryItem[], query: string): GlossaryItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((it) => {
    const haystack = [it.term, it.short, it.definition, it.whyItMatters ?? "", ...(it.tags ?? [])]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
