// Static data extracted verbatim from CS Quarterly 2026 State of the Industry Report

export type AcvBand = "smb" | "midmarket" | "enterprise" | "strategic";

export const ACV_BANDS: { id: AcvBand; label: string; range: string }[] = [
  { id: "smb", label: "SMB", range: "<$25K ACV" },
  { id: "midmarket", label: "Mid-Market", range: "$25K–$100K ACV" },
  { id: "enterprise", label: "Enterprise", range: "$100K–$500K ACV" },
  { id: "strategic", label: "Strategic Enterprise", range: ">$500K ACV" },
];

export const BENCHMARK_MATRIX: Record<
  AcvBand,
  {
    medianGrr: string;
    worldClassGrr: string;
    medianNrr: string;
    worldClassNrr: string;
    cacPayback: string;
    csSpend: string;
    deliveryModel: string;
    arrPerCsm: string;
    logoChurn: string;
    timeToValue: string;
  }
> = {
  smb: {
    medianGrr: "84–88%",
    worldClassGrr: "92–95%",
    medianNrr: "97–102%",
    worldClassNrr: "108–115%",
    cacPayback: "8–12 mo",
    csSpend: "8–12%",
    deliveryModel: "Digital-led, pooled CSM",
    arrPerCsm: "$1.0M–$2.0M",
    logoChurn: "10–20%",
    timeToValue: "<7 days",
  },
  midmarket: {
    medianGrr: "88–91%",
    worldClassGrr: "94–97%",
    medianNrr: "105–108%",
    worldClassNrr: "115–120%",
    cacPayback: "14–18 mo",
    csSpend: "6–9%",
    deliveryModel: "Hybrid: named + digital",
    arrPerCsm: "$2.0M–$3.5M",
    logoChurn: "5–10%",
    timeToValue: "14–30 days",
  },
  enterprise: {
    medianGrr: "91–94%",
    worldClassGrr: "97–99%",
    medianNrr: "115–118%",
    worldClassNrr: "125–135%",
    cacPayback: "18–24 mo",
    csSpend: "4–7%",
    deliveryModel: "Dedicated named CSM",
    arrPerCsm: "$3.0M–$5.0M",
    logoChurn: "2–5%",
    timeToValue: "30–90 days",
  },
  strategic: {
    medianGrr: "94–97%",
    worldClassGrr: "99%+",
    medianNrr: "118–125%",
    worldClassNrr: "135%+",
    cacPayback: "24–36 mo",
    csSpend: "3–5%",
    deliveryModel: "Strategic team (CSM + AM + SE)",
    arrPerCsm: "$2.0M–$4.0M",
    logoChurn: "1–2%",
    timeToValue: "60–180 days",
  },
};

export const HURDLE_RATES = [
  { type: "Retention-focused CSM hires", rate: "20–25%", rationale: "Lower operational risk; cash flows more predictable" },
  { type: "Expansion-focused AM hires", rate: "25–35%", rationale: "Higher risk; requires sales competency + market conditions" },
  { type: "AI/automation infrastructure", rate: "15–20%", rationale: "Technology risk but scalable across portfolio" },
  { type: "Professional services scaling", rate: "25–30%", rationale: "High fixed cost; requires utilization rate discipline" },
];

export const VARIABLE_GLOSSARY: Record<
  string,
  { included: string[]; excluded: string[]; magnitude?: string }
> = {
  "Fully Loaded CS Spend": {
    included: [
      "Burdened CSM/AM salary + payroll tax (7.65% FICA)",
      "Health benefits ($8K–$15K/yr)",
      "401(k) match (3–6%)",
      "Variable comp (renewal + expansion bonuses)",
      "Post-sale tool stack (Gainsight/Vitally/ChurnZero)",
      "Allocated PS hours during deployment",
    ],
    excluded: [
      "Sales AE compensation (belongs in CAC)",
      "Marketing programs",
      "G&A overhead allocation",
      "Cost of inference / GPU compute (COGS)",
    ],
    magnitude: "$125K–$135K fully loaded on a $95K base CSM",
  },
  "MRR per Account": {
    included: ["Subscription MRR", "Metered usage averaged to monthly", "Add-on SKUs billed monthly"],
    excluded: ["One-time PS revenue", "Setup fees", "Non-recurring credits"],
  },
  "Subscription Gross Margin %": {
    included: ["Hosting & infrastructure", "Technical support (break-fix)", "Required onboarding labor", "AI inference cost (4–9% of revenue)"],
    excluded: ["Proactive CSM time", "Account management upsell motion", "R&D and product engineering"],
    magnitude: "78–85% traditional SaaS · 65–70% AI-augmented · 52% LLM-native",
  },
};

export const COGS_ITEMS = [
  { role: "Technical Support (break-fix)", note: "Required to deliver functioning service" },
  { role: "Implementation & Onboarding (bundled PS)", note: "ASC 606 matches recognition to subscription" },
  { role: "Mandatory Training (deployment)", note: "Required for value delivery; capitalized with PS" },
];

export const OPEX_ITEMS = [
  { role: "Proactive CSM (renewal mgmt, health)", note: "Retention activity = sales-like" },
  { role: "Account Management (upsell/cross-sell)", note: "Generates new revenue; identical to sales" },
  { role: "Customer Education (non-mandatory)", note: "Optional enablement" },
  { role: "Customer Community Management", note: "Marketing & engagement" },
];

export const CHECKLIST = [
  {
    id: "attribution",
    title: "Expansion Attribution Integrity",
    error:
      "Expansion ARR double-counted between Account Management and Sales. Both credit 100% of the same upsell, inflating NRR by 5–15 points.",
    detection:
      "Fuzzy match expansion transactions across CRM opportunity owner and CS attribution field. Flag any where credited amounts exceed 100% of actual expansion value.",
    correction:
      "Single source of truth for NRR. First-touch attribution rules: AM identifies → AM gets 100%. Sales re-engages on pricing → 50/50 or 60/40 split.",
  },
  {
    id: "ps-credits",
    title: "Hidden Churn Behind Professional Services Credits",
    error:
      "Customer signals churn → CS offers a PS credit or waiver. Logo is recorded as retained; the credit is buried in PS cost overruns. NRR never reflects the de-facto price cut.",
    detection:
      "Review all PS credits/waivers > $5K over TTM. Cross-reference recipient ARR trajectory. A $25K credit on a $100K account = 25% effective revenue churn.",
    correction:
      "Record credits given in lieu of cancellation as contra-revenue. Any credit > 10% of ACV triggers mandatory finance review and NRR adjustment.",
  },
  {
    id: "multiyear",
    title: "Multi-Year Contract Insulation Effect",
    error:
      "60% of base locked into multi-year contracts. True churn propensity is masked; renewal cliff converges suppressed churn into a single period.",
    detection:
      "Calculate GRR/NRR on a contractually-available-to-churn basis, not did-churn. Apply non-renewal probabilities to the available pool. Gap > 5 points = material insulation.",
    correction:
      "Disclose % of ARR under multi-year + vintage distribution. Report 'available to churn GRR' as a supplemental metric. Model the renewal cliff scenario.",
  },
  {
    id: "involuntary",
    title: "Involuntary Churn Under-Counting",
    error:
      "Failed payments, expired cards, and admin lapses removed from ARR but never counted in the churn numerator. Inflates GRR by 1–3 points.",
    detection:
      "Reconcile churn report against the ARR bridge. Pull all 'payment failed / suspended / past due >90 days' accounts no longer active.",
    correction:
      "Define involuntary churn as any ARR loss without a formal cancellation. Report voluntary and involuntary as separate line items. Dunning recovery floor: 40% on first failure.",
  },
  {
    id: "cohort-drift",
    title: "Cohort Definition Drift",
    error:
      "Underlying NRR cohort filters shift quarter-to-quarter (min ARR threshold, customer age inclusion, currency conversion). Result: incomparable metric across periods.",
    detection:
      "Pull the SQL used to generate NRR for the last 8 quarters. Compare filter conditions. Recalculate the current quarter under the prior definition and quantify the delta.",
    correction:
      "Lock the NRR definition in writing. CFO approval required for any modification. Restate prior periods under new definition for four quarters after any change.",
  },
] as const;

export const AI_CALLOUTS = [
  {
    id: "deflation",
    title: "Seat De-provisioning / ACV Deflation",
    metric: "48%",
    metricLabel: "Median NRR — AI-native SaaS (ChartMogul 2025)",
    body: "35% of organizations have already replaced ≥1 SaaS tool with a custom AI build. Workflow automations (35%) and internal admin tools (33%) top the list.",
    tone: "danger" as const,
  },
  {
    id: "payback",
    title: "Human Overhead Reduction",
    metric: "<6 mo",
    metricLabel: "Compressed CS-CAC Payback target (from 12 mo)",
    body: "AI tickets resolve at $0.50–$1.05 vs $8–$12 human. 12–24x differential. Best-in-class deflection: 62% of total tickets.",
    tone: "accent" as const,
  },
  {
    id: "substitution",
    title: "In-House LLM Substitution Churn Matrix",
    metric: "4 layers",
    metricLabel: "Telemetry: usage decay → topic shift → CI signal → exit",
    body: "Concentrated in mid-market and SMB. Enterprise (1–2% logo churn) is structurally protected by compliance, audit, and multi-entity integration depth.",
    tone: "warn" as const,
  },
  {
    id: "copilot",
    title: "Copilot/Agent NRR Premium",
    metric: "131%",
    metricLabel: "Manufactured NRR via metered AI SKU stack (worked example)",
    body: "Five-step architecture: base seat preservation → AI add-on SKU → tiered capability → usage overages → annual commit incentive. Targets 115%+ world-class.",
    tone: "expansion" as const,
  },
];

export const AI_GM_DRIVERS = [
  { driver: "Inference cost", pct: "4–9%", floor: "3–6%" },
  { driver: "Eval engineering", pct: "1–3%", floor: "~1% fixed" },
  { driver: "Observability scale-up", pct: "0.5–1.5%", floor: "0.5%" },
  { driver: "Combined Reset", pct: "6–13pp", floor: "~5pp" },
];

export const MARGIN_GOVERNORS = [
  { activity: "Churn prevention (1% reduction)", recovery: "50–100 bps", mech: "Retained revenue carries ~70% marginal GM after AI COGS" },
  { activity: "AI-enabled onboarding (50% time cut)", recovery: "30–80 bps", mech: "PS hours shift from COGS to scaled digital delivery" },
  { activity: "Expansion ARR (consumption/cross-sell)", recovery: "20–50 bps", mech: "Higher ARR dilutes fixed COGS; consumption aligns variable costs" },
  { activity: "Support deflection (AI Tier 1)", recovery: "100–300 bps", mech: "$8–12 human → $0.50–$1.05 AI per resolution" },
  { activity: "Health-score proactive outreach", recovery: "20–40 bps", mech: "Prevents churn in high-GM accounts" },
];
