// Shared, client-safe survey definition (questions + scoring shape).
// NOTE: Replace this with your uploaded HTML survey when you provide it.

export type SurveyOption = { label: string; value: number };
export type SurveyQuestion = {
  id: string;
  dimension: "Strategy" | "Data" | "Skills" | "Culture";
  prompt: string;
  options: SurveyOption[];
};

export const SURVEY: SurveyQuestion[] = [
  // Strategy
  { id: "s1", dimension: "Strategy", prompt: "Does your CS org have a written AI strategy tied to retention or expansion goals?", options: [
    { label: "No plan exists", value: 0 },
    { label: "Informal experiments", value: 1 },
    { label: "Documented plan, not measured", value: 2 },
    { label: "Documented plan with KPIs", value: 3 },
  ]},
  { id: "s2", dimension: "Strategy", prompt: "Who owns AI initiatives in your post-sales org?", options: [
    { label: "Nobody specific", value: 0 },
    { label: "A side-of-desk volunteer", value: 1 },
    { label: "A named lead, part-time", value: 2 },
    { label: "A dedicated function with budget", value: 3 },
  ]},
  { id: "s3", dimension: "Strategy", prompt: "How is AI investment justified to your CFO?", options: [
    { label: "It isn't", value: 0 },
    { label: "Headcount avoidance only", value: 1 },
    { label: "Productivity gains, anecdotal", value: 2 },
    { label: "Modeled NRR / cost-to-serve impact", value: 3 },
  ]},
  // Data
  { id: "d1", dimension: "Data", prompt: "How clean and unified is your customer health data?", options: [
    { label: "Scattered across tools, untrusted", value: 0 },
    { label: "Centralized but messy", value: 1 },
    { label: "Centralized, mostly clean", value: 2 },
    { label: "Single source of truth, governed", value: 3 },
  ]},
  { id: "d2", dimension: "Data", prompt: "Can you connect product usage to revenue per account?", options: [
    { label: "No", value: 0 },
    { label: "Manually, with effort", value: 1 },
    { label: "Yes, with caveats", value: 2 },
    { label: "Yes, in real time", value: 3 },
  ]},
  { id: "d3", dimension: "Data", prompt: "Are interactions (calls, emails) captured and structured?", options: [
    { label: "No", value: 0 },
    { label: "Calls only, ad hoc", value: 1 },
    { label: "Most, semi-structured", value: 2 },
    { label: "All, structured + searchable", value: 3 },
  ]},
  // Skills
  { id: "k1", dimension: "Skills", prompt: "Do your CSMs know how to write a usable AI prompt?", options: [
    { label: "Not yet", value: 0 },
    { label: "A few champions", value: 1 },
    { label: "Most, basic level", value: 2 },
    { label: "All, with shared playbooks", value: 3 },
  ]},
  { id: "k2", dimension: "Skills", prompt: "Has your CS leadership team completed any AI-for-CS training?", options: [
    { label: "No", value: 0 },
    { label: "Self-directed reading", value: 1 },
    { label: "Workshop, one-off", value: 2 },
    { label: "Ongoing curriculum", value: 3 },
  ]},
  { id: "k3", dimension: "Skills", prompt: "Is there a clear escalation path when AI gets it wrong?", options: [
    { label: "Undefined", value: 0 },
    { label: "Informal", value: 1 },
    { label: "Documented", value: 2 },
    { label: "Documented + audited", value: 3 },
  ]},
  // Culture
  { id: "c1", dimension: "Culture", prompt: "How does your team react when AI suggestions disagree with the CSM?", options: [
    { label: "Defensiveness, ignored", value: 0 },
    { label: "Mixed", value: 1 },
    { label: "Curiosity, sometimes acted on", value: 2 },
    { label: "Treated as a peer signal", value: 3 },
  ]},
  { id: "c2", dimension: "Culture", prompt: "Are wins from AI-assisted work celebrated publicly?", options: [
    { label: "Never", value: 0 },
    { label: "Rarely", value: 1 },
    { label: "Occasionally", value: 2 },
    { label: "Every QBR cycle", value: 3 },
  ]},
  { id: "c3", dimension: "Culture", prompt: "How aligned is HR with CS on AI-related role evolution?", options: [
    { label: "Not on the radar", value: 0 },
    { label: "Early conversations", value: 1 },
    { label: "Active partnership", value: 2 },
    { label: "Joint roadmap with milestones", value: 3 },
  ]},
];

export const MAX_SCORE = SURVEY.length * 3;

export function scoreToTier(score: number): {
  tier: "Not Ready" | "Emerging" | "Ready" | "Leading";
  blurb: string;
  recommendations: string[];
} {
  const pct = score / MAX_SCORE;
  if (pct < 0.25) {
    return {
      tier: "Not Ready",
      blurb:
        "Your organization is at the starting line. Foundational work is required before AI investment will return real leverage.",
      recommendations: [
        "Name a single owner for AI in CS within 30 days.",
        "Audit your customer data sources and pick one to consolidate.",
        "Run one structured AI literacy session with the leadership team.",
      ],
    };
  }
  if (pct < 0.5) {
    return {
      tier: "Emerging",
      blurb:
        "You have momentum but no system. Standardize the wins you already have and tie them to a measurable outcome.",
      recommendations: [
        "Document the 3 AI use cases delivering the most CSM time back.",
        "Set one NRR or cost-to-serve KPI tied to AI deployment.",
        "Build a shared prompt library across the team.",
      ],
    };
  }
  if (pct < 0.75) {
    return {
      tier: "Ready",
      blurb:
        "You have the data, the skills, and the cultural permission. The work now is sequencing — not enabling.",
      recommendations: [
        "Move from pilots to a quarterly rollout cadence.",
        "Partner with HR on a role evolution map for CSM, CSL, and Ops.",
        "Begin reporting AI impact on NRR to the exec team monthly.",
      ],
    };
  }
  return {
    tier: "Leading",
    blurb:
      "You are operating at the edge. The remaining gains are compounding — protect them with governance and continuous learning.",
    recommendations: [
      "Codify your AI playbooks as a public asset.",
      "Mentor a peer org through their first 90 days.",
      "Invest in evaluation infrastructure to catch model regressions early.",
    ],
  };
}
