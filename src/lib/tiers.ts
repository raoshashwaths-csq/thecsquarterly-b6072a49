// Canonical pricing matrix for The CS Quarterly.
// Single source of truth that /pricing, /subscribe, the homepage, and the
// PaywallOverlay all render from. See mem://product/positioning-v4 for the
// surrounding strategy.
//
// Pricing override (this revision):
//   Practitioner $39 — unlocks Codex + CSFactors dashboard + 50 Lumi/month.
//   Operator $89 — adds Operator analytics + 100 Lumi/month.
// CSFactors is gated at Practitioner+ in this spec (was Operator+).

export type Designation =
  | "reader"
  | "practitioner"
  | "operator"
  | "team"
  | "scale"
  | "enterprise"
  | "strategic_partner";

export type TierCtaKind = "free" | "checkout" | "contact";

export type Tier = {
  designation: Designation;
  label: string;
  tagline: string;
  priceMonthly: string;
  priceMonthlyValue: number;
  priceAnnual?: string;
  contactOnly?: boolean;
  seatCap: string;
  qCap: string;
  band: "individual" | "team" | "partner";
  highlight?: boolean;
  highlightLabel?: string;
  features: string[];
  cta: string;
  ctaKind: TierCtaKind;
};

export const TIERS: Tier[] = [
  {
    designation: "reader",
    label: "Reader",
    tagline: "The weekly briefing and a baseline diagnostic. No card required.",
    priceMonthly: "$0",
    priceMonthlyValue: 0,
    priceAnnual: "Free forever",
    seatCap: "1 seat",
    qCap: "1 session / week",
    band: "individual",
    features: [
      "Weekly Tuesday dispatch",
      "AI Diagnostic — score only",
      "Public archive access",
      "Lumi — 1 session per week",
      "__jobboard__:Job board as a candidate",
    ],
    cta: "Start free",
    ctaKind: "free",
  },
  {
    designation: "practitioner",
    label: "Practitioner",
    tagline: "Full library, every Codex playbook, CSFactors dashboard, and Lumi.",
    priceMonthly: "$39",
    priceMonthlyValue: 39,
    priceAnnual: "$390 / year",
    seatCap: "1 seat",
    qCap: "50 / month",
    band: "individual",
    highlight: true,
    highlightLabel: "Most popular for individuals",
    features: [
      "Everything in Reader",
      "Full premium archive, two-voice toggle",
      "All six Codex playbooks",
      "AI Diagnostic full blueprint",
      "CSFactors personal dashboard",
      "Lumi — 50 sessions a month",
      "Whiteboard for article notes and pasted URLs",
    ],
    cta: "Become a Practitioner",
    ctaKind: "checkout",
  },
  {
    designation: "operator",
    label: "Operator",
    tagline: "Advanced operator analytics, benchmarks, and more Lumi headroom.",
    priceMonthly: "$89",
    priceMonthlyValue: 89,
    priceAnnual: "$890 / year",
    seatCap: "1 seat",
    qCap: "100 / month",
    band: "individual",
    features: [
      "Everything in Practitioner",
      "Operator analytics — risk register, renewal waterfall",
      "Benchmark comparison vs Retention Ledger quartiles",
      "Lumi — 100 sessions a month",
      "VP+ community access",
      "Priority content notifications",
    ],
    cta: "Become an Operator",
    ctaKind: "checkout",
  },
  {
    designation: "team",
    label: "Team",
    tagline: "Shared team dashboard, admin analytics, and a 500-session Lumi pool.",
    priceMonthly: "$599",
    priceMonthlyValue: 599,
    priceAnnual: "$5,990 / year",
    seatCap: "Up to 8 seats",
    qCap: "500 pooled / month",
    band: "team",
    features: [
      "Everything in Operator, per seat",
      "Shared team CS dashboard — portfolio + renewal pipeline",
      "Admin analytics — usage, reads, agent activity",
      "Assignable learning paths",
      "Lumi pool — 500 sessions a month",
      "__jobboard__:2 job board posting credits per quarter",
      "SSO preparation",
    ],
    cta: "Start a team",
    ctaKind: "checkout",
  },
  {
    designation: "scale",
    label: "Scale",
    tagline: "Advanced dashboard, branded benchmark PDF, and a 2,000-session pool.",
    priceMonthly: "$1,499",
    priceMonthlyValue: 1499,
    priceAnnual: "$14,990 / year",
    seatCap: "Up to 20 seats",
    qCap: "2,000 pooled / month",
    band: "team",
    highlight: true,
    highlightLabel: "Most popular for mid-market CS",
    features: [
      "Everything in Team",
      "Advanced dashboard — cohort analysis, churn signal heatmap",
      "Quarterly branded benchmark PDF, board-ready",
      "Quarterly briefing call with the editorial team",
      "Lumi pool — 2,000 sessions a month",
      "SSO / SAML integration",
      "__jobboard__:4 job board posting credits per quarter",
    ],
    cta: "Scale the team",
    ctaKind: "checkout",
  },
  {
    designation: "enterprise",
    label: "Enterprise",
    tagline: "White-label benchmarks, Ledger API, and a 5,000-session pool.",
    priceMonthly: "$3,500",
    priceMonthlyValue: 3500,
    priceAnnual: "Custom annual contract",
    seatCap: "Up to 50 seats",
    qCap: "5,000 pooled / month",
    band: "team",
    features: [
      "Everything in Scale",
      "White-label quarterly benchmark reports",
      "Retention Ledger API access",
      "Custom learning paths with completion certificates",
      "Dedicated community space for your team",
      "Lumi pool — 5,000 sessions a month",
      "SSO / SAML mandatory, priority onboarding",
    ],
    cta: "Talk to editorial",
    ctaKind: "contact",
  },
  {
    designation: "strategic_partner",
    label: "Strategic Partner",
    tagline: "Co-branded Codex content, full Ledger API, and an editorial partnership.",
    priceMonthly: "$8,000",
    priceMonthlyValue: 8000,
    priceAnnual: "Annual contract required",
    contactOnly: true,
    seatCap: "Unlimited seats",
    qCap: "Unlimited",
    band: "partner",
    features: [
      "Everything in Enterprise",
      "Co-branded Codex content distributed to the community",
      "Full Retention Ledger API — all segments, all metrics",
      "Speaking slot at quarterly community events",
      "Editorial footer logo placement",
      "Dedicated integration support and quarterly strategy call",
    ],
    cta: "Talk to editorial",
    ctaKind: "contact",
  },
];

export function getTier(d: Designation): Tier | undefined {
  return TIERS.find((t) => t.designation === d);
}

export const CONTACT_EMAIL = "editorial@thecsquarterly.com";

export function tierMailto(label: string): string {
  const subject = encodeURIComponent(`${label} tier — The CS Quarterly`);
  return `mailto:${CONTACT_EMAIL}?subject=${subject}`;
}

// ---------- Paddle price ID helpers ----------
// External IDs created via Paddle batch_create_product use `<designation>_monthly`
// and `<designation>_annual`. Keep cadence labels UI-facing ("yearly") but map
// to Paddle's `_annual` suffix when resolving price IDs.

export type Cadence = "monthly" | "yearly";

const PAID_DESIGNATIONS = new Set<Designation>([
  "practitioner",
  "operator",
  "team",
  "scale",
]);

export function priceIdFor(designation: Designation, cadence: Cadence): string | null {
  if (!PAID_DESIGNATIONS.has(designation)) return null;
  return `${designation}_${cadence === "monthly" ? "monthly" : "annual"}`;
}

export function designationFromPriceId(
  priceId: string | null | undefined,
): Designation | null {
  if (!priceId) return null;
  const [base] = priceId.split("_");
  return PAID_DESIGNATIONS.has(base as Designation) ? (base as Designation) : null;
}

