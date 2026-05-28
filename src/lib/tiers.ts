// Canonical pricing matrix for The CS Quarterly.
// See mem://product/positioning-v4 for the strategy; this file is the single
// source of truth that /pricing and /subscribe both render from.

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
  priceMonthly: string;        // display string e.g. "$79"
  priceMonthlyValue: number;   // numeric for math; 0 for free, 0 for contact-only display
  priceAnnual?: string;        // e.g. "$790 / year"
  contactOnly?: boolean;       // skip monthly/annual ladder, route to mailto
  seatCap: string;             // "1 seat" | "Up to 8 seats" | "Unlimited"
  qCap: string;                // "0 sessions" | "30 / month" | "Unlimited"
  band: "individual" | "team" | "partner";
  highlight?: boolean;         // visually emphasized card
  highlightLabel?: string;     // chip text when highlighted
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
    qCap: "0 sessions",
    band: "individual",
    features: [
      "Weekly Tuesday dispatch",
      "Retention Ledger benchmark ticker",
      "AI Diagnostic — score only",
      "Public archive access",
      "Job board as a candidate",
    ],
    cta: "Start free",
    ctaKind: "free",
  },
  {
    designation: "practitioner",
    label: "Practitioner",
    tagline: "Full library, every Codex playbook, and the Q advisor.",
    priceMonthly: "$29",
    priceMonthlyValue: 29,
    priceAnnual: "$290 / year",
    seatCap: "1 seat",
    qCap: "30 / month",
    band: "individual",
    features: [
      "Everything in Reader",
      "Full premium archive, two-voice toggle",
      "All six Codex playbooks",
      "AI Diagnostic full blueprint",
      "Q advisor, 30 sessions a month",
      "Access to the Whiteboard to hold your article notes and pasted URLs",
    ],
    cta: "Become a Practitioner",
    ctaKind: "checkout",
  },
  {
    designation: "operator",
    label: "Operator",
    tagline: "The personal CS dashboard and a benchmark comparison tool.",
    priceMonthly: "$79",
    priceMonthlyValue: 79,
    priceAnnual: "$790 / year",
    seatCap: "1 seat",
    qCap: "100 / month",
    band: "individual",
    highlight: true,
    highlightLabel: "Most popular for senior ICs",
    features: [
      "Everything in Practitioner",
      "Personal CS dashboard — your portfolio, health, renewals",
      "Benchmark comparison vs Retention Ledger quartiles",
      "Q advisor, 100 sessions a month",
      "VP+ community access",
      "Priority content notifications",
    ],
    cta: "Become an Operator",
    ctaKind: "checkout",
  },
  {
    designation: "team",
    label: "Team",
    tagline: "Shared team dashboard, admin analytics, and learning paths.",
    priceMonthly: "$599",
    priceMonthlyValue: 599,
    priceAnnual: "$5,990 / year",
    seatCap: "Up to 8 seats",
    qCap: "400 pooled / month",
    band: "team",
    features: [
      "Everything in Operator, per seat",
      "Shared team CS dashboard — portfolio + renewal pipeline",
      "Admin analytics — usage, reads, agent activity",
      "Assignable learning paths",
      "2 job board posting credits per quarter",
      "SSO preparation",
    ],
    cta: "Start a team",
    ctaKind: "checkout",
  },
  {
    designation: "scale",
    label: "Scale",
    tagline: "Advanced dashboard, branded benchmark PDF, and a quarterly briefing call.",
    priceMonthly: "$1,499",
    priceMonthlyValue: 1499,
    priceAnnual: "$14,990 / year",
    seatCap: "Up to 20 seats",
    qCap: "1,000 pooled / month",
    band: "team",
    highlight: true,
    highlightLabel: "Most popular for mid-market CS",
    features: [
      "Everything in Team",
      "Advanced dashboard — cohort analysis, churn signal heatmap",
      "Quarterly branded benchmark PDF, board-ready",
      "Quarterly briefing call with the editorial team",
      "SSO / SAML integration",
      "4 job board posting credits per quarter",
    ],
    cta: "Scale the team",
    ctaKind: "checkout",
  },
  {
    designation: "enterprise",
    label: "Enterprise",
    tagline: "White-label benchmark reports, Ledger API, and certified learning paths.",
    priceMonthly: "$3,500",
    priceMonthlyValue: 3500,
    priceAnnual: "Custom annual contract",
    seatCap: "Up to 50 seats",
    qCap: "Unlimited",
    band: "team",
    features: [
      "Everything in Scale",
      "White-label quarterly benchmark reports",
      "Retention Ledger API access",
      "Custom learning paths with completion certificates",
      "Dedicated community space for your team",
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
