export type DefaultMilestone = {
  title: string;
  owner: "csm" | "customer" | "shared";
  due_days: number;
  health_score_impact?: number;
};

export type DefaultPhase = {
  title: string;
  color: string; // stored as data on map_phases.color
  is_value_milestone: boolean;
  default_milestones: DefaultMilestone[];
};

export const DEFAULT_PHASES: DefaultPhase[] = [
  {
    title: "KICKOFF",
    color: "#C4A45A",
    is_value_milestone: false,
    default_milestones: [
      { title: "Kickoff call completed", owner: "shared", due_days: 3 },
      { title: "Success plan agreed", owner: "csm", due_days: 5 },
      { title: "Admin access provisioned", owner: "customer", due_days: 5 },
      { title: "Core team introduced", owner: "customer", due_days: 7 },
    ],
  },
  {
    title: "CONFIGURATION",
    color: "#5A7DC4",
    is_value_milestone: false,
    default_milestones: [
      { title: "Platform configured", owner: "csm", due_days: 14 },
      { title: "Data import completed", owner: "shared", due_days: 14 },
      { title: "Integrations connected", owner: "shared", due_days: 21 },
      { title: "Configuration signed off", owner: "customer", due_days: 21 },
    ],
  },
  {
    title: "TRAINING",
    color: "#8A5AC4",
    is_value_milestone: false,
    default_milestones: [
      { title: "Admin training delivered", owner: "csm", due_days: 21 },
      { title: "End user training delivered", owner: "csm", due_days: 28 },
      { title: "Training completion confirmed", owner: "customer", due_days: 30 },
    ],
  },
  {
    title: "FIRST VALUE MOMENT",
    color: "#4A9B6F",
    is_value_milestone: true,
    default_milestones: [
      { title: "First meaningful output generated", owner: "customer", due_days: 35, health_score_impact: 5 },
      { title: "Value confirmed by sponsor", owner: "customer", due_days: 38, health_score_impact: 5 },
      { title: "ROI baseline documented", owner: "csm", due_days: 40, health_score_impact: 5 },
    ],
  },
  {
    title: "ADOPTION",
    color: "#C4914A",
    is_value_milestone: false,
    default_milestones: [
      { title: "DAU/licensed ratio >70%", owner: "csm", due_days: 60 },
      { title: "Second use case activated", owner: "shared", due_days: 60 },
      { title: "Executive sponsor engaged", owner: "csm", due_days: 45 },
    ],
  },
  {
    title: "HANDOFF TO BAU",
    color: "#6BAD8E",
    is_value_milestone: false,
    default_milestones: [
      { title: "Ongoing cadence established", owner: "shared", due_days: 75 },
      { title: "Escalation path documented", owner: "csm", due_days: 75 },
      { title: "Success metrics agreed (next 90 days)", owner: "shared", due_days: 80 },
    ],
  },
];

// Benchmark TTV (days) by tier — sourced from CS Quarterly Retention Ledger defaults.
// Until a per-industry table exists, tier provides the primary lookup with light industry skew.
const TIER_TTV: Record<string, number> = {
  Enterprise: 90,
  "Mid-Market": 60,
  SMB: 30,
};

const INDUSTRY_SKEW: Record<string, number> = {
  Healthcare: 1.2,
  Finance: 1.2,
  FinTech: 1.15,
  Manufacturing: 1.1,
  Retail: 0.95,
  Education: 1.0,
  SaaS: 0.9,
};

export function benchmarkTtvFor(tier?: string | null, industry?: string | null): number {
  const base = TIER_TTV[tier ?? "Mid-Market"] ?? 60;
  const skew = industry && INDUSTRY_SKEW[industry] ? INDUSTRY_SKEW[industry] : 1;
  return Math.round(base * skew);
}
