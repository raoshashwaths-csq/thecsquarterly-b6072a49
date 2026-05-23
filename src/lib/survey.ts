// CS Operating Maturity Diagnostic — 8 dimensions, 32 metrics.
// Replaces the legacy HR/HCM "Super Agent" diagnostic. Audience: VP/Director
// of Customer Success at $20M–$1B ARR SaaS companies.

export type SurveySection = "Foundational Discipline" | "Strategic Operating";

export type Metric = { id: string; label: string; help: string };

export type Question = {
  id: string;
  section: SurveySection;
  title: string;
  desc: string;
  weight: number;
  cardClass:
    | "foundation" | "identity" | "integration" | "governance" | "workflow"
    | "agent-emp" | "agent-mgr" | "agent-rec" | "agent-hrbp" | "agent-pay" | "agent-cross";
  metrics: Metric[];
};

export const SCORE_OPTIONS = [
  { value: 0, label: "0 · Absent", desc: "Doesn't exist in our org" },
  { value: 1, label: "1 · Ad-hoc", desc: "Tribal knowledge / case by case" },
  { value: 2, label: "2 · Inconsistent", desc: "Some teams do it, most don't" },
  { value: 3, label: "3 · Standardised", desc: "Documented and broadly followed" },
  { value: 4, label: "4 · Measured", desc: "Tracked with KPIs and reviewed" },
  { value: 5, label: "5 · Optimised", desc: "Continuously improved, exec-visible" },
] as const;

// Foundational: 50 pts (15+10+15+10).  Strategic: 50 pts (15+10+15+10).
export const QUESTIONS: Question[] = [
  { id: "A1", section: "Foundational Discipline", title: "Account Segmentation & Coverage",
    desc: "Whether your book is intentionally tiered — and whether coverage matches contract value, expansion potential, and risk.",
    weight: 15, cardClass: "foundation",
    metrics: [
      { id: "a1_tiers", label: "Tier definitions are written and enforced", help: "Are tier criteria (ARR, strategic value, growth potential) documented and used to set coverage?" },
      { id: "a1_ratios", label: "CSM-to-ARR ratios match tier", help: "Do enterprise CSMs hold defensible portfolios (e.g., $4–8M ARR) vs. scaled CSMs running pooled books?" },
      { id: "a1_coverage", label: "Coverage model differentiated by tier", help: "Do top tiers get named exec sponsors, QBRs, and proactive plans — not the same motion as mid-market?" },
      { id: "a1_reviewed", label: "Segmentation reviewed quarterly", help: "Is the segmentation revisited every quarter against actual NRR, GRR, and product usage?" },
    ]},

  { id: "A2", section: "Foundational Discipline", title: "Health Score & Risk Signal Quality",
    desc: "Whether your health score is a leading indicator or theatre. Garbage health scores produce garbage interventions.",
    weight: 10, cardClass: "identity",
    metrics: [
      { id: "a2_inputs", label: "Health score uses 5+ weighted inputs", help: "Does the score blend usage, sentiment, NPS/CSAT, exec engagement, and support volume — not just login frequency?" },
      { id: "a2_calibrated", label: "Health score calibrated against churn data", help: "Has the score been back-tested against actual past churn / downsell events?" },
      { id: "a2_owner", label: "Named owner per risk signal", help: "When a signal fires, is there one named CSM accountable for the play and the outcome?" },
      { id: "a2_actioned", label: "% of red accounts with active play in 5 days", help: "What share of accounts that go red get a documented intervention plan within one business week?" },
    ]},

  { id: "A3", section: "Foundational Discipline", title: "Onboarding & Time-to-Value",
    desc: "First 90 days predict the next 900. Whether you operate a deterministic onboarding or hand-wave through it.",
    weight: 15, cardClass: "integration",
    metrics: [
      { id: "a3_milestones", label: "Onboarding has defined milestones with dates", help: "Are 30/60/90 day value milestones documented per customer at kickoff?" },
      { id: "a3_ttv", label: "Time-to-first-value is measured per cohort", help: "Do you report median TTV by segment and trend it month over month?" },
      { id: "a3_handoff", label: "Sales → CS handoff is a structured artefact", help: "Is there a required handoff doc (success criteria, stakeholders, risks) signed by both parties?" },
      { id: "a3_redflag", label: "Stalled onboardings escalate automatically", help: "If a milestone slips past SLA, is there an automatic escalation to the CS leader?" },
    ]},

  { id: "A4", section: "Foundational Discipline", title: "Stakeholder Mapping Discipline",
    desc: "Whether you can name the four people who control renewal — or whether you only know the champion.",
    weight: 10, cardClass: "governance",
    metrics: [
      { id: "a4_map", label: "Top-tier accounts have a written stakeholder map", help: "Does every strategic account have a documented power map (economic buyer, champion, blocker, end users)?" },
      { id: "a4_multithread", label: "Multi-threaded ≥3 people in buyer org", help: "What % of strategic accounts have active relationships with three or more contacts on the buyer side?" },
      { id: "a4_refreshed", label: "Stakeholder map refreshed every 90 days", help: "Are maps formally revisited each quarter to catch turnover, reorgs, and new sponsors?" },
      { id: "a4_execsponsor", label: "Exec sponsor program is live, not theatrical", help: "Do exec sponsors actually attend QBRs and intervene on saves — or is it just a slide?" },
    ]},

  { id: "B1", section: "Strategic Operating", title: "Renewal & Expansion Forecasting",
    desc: "The CFO doesn't care about your gut. Whether your forecast holds up at 60-day-out and whether CS owns expansion explicitly.",
    weight: 15, cardClass: "agent-emp",
    metrics: [
      { id: "b1_forecast", label: "Renewal forecast at 90/60/30 days out", help: "Is there a documented renewal forecast at each interval, with named risk?" },
      { id: "b1_accuracy", label: "Forecast accuracy within ±5%", help: "Over the last 4 quarters, has renewal forecast variance stayed inside ±5%?" },
      { id: "b1_expansion", label: "CS owns expansion targets explicitly", help: "Do CSMs / CSAs carry a written expansion quota or shared one with AEs — not just 'influence'?" },
      { id: "b1_nrr", label: "NRR trended and reviewed monthly with exec team", help: "Is NRR (and GRR) on the monthly exec dashboard with named action owners?" },
    ]},

  { id: "B2", section: "Strategic Operating", title: "Escalation Playbook Maturity",
    desc: "Whether your team has a sequenced, exec-tested protocol when a strategic account goes red — or whether everyone improvises.",
    weight: 10, cardClass: "agent-mgr",
    metrics: [
      { id: "b2_playbook", label: "Documented escalation playbook exists", help: "Is there a written sequence for severity 1/2 escalations — owners, comms, decision points?" },
      { id: "b2_warroom", label: "War-room model with named roles", help: "When an account goes critical, are CS, Product, Engineering, and Exec roles pre-assigned, not improvised?" },
      { id: "b2_postmortem", label: "Post-mortem runs on every escalation", help: "Does every Sev 1/2 escalation produce a written post-mortem with actions and owners?" },
      { id: "b2_csat", label: "Escalation CSAT tracked post-resolution", help: "Do you survey the customer 14 days after resolution and trend the recovery signal?" },
    ]},

  { id: "B3", section: "Strategic Operating", title: "QBR & Value Realisation Reporting",
    desc: "QBRs should produce decisions, not slides. Whether yours are forensic value reviews or status meetings dressed up.",
    weight: 15, cardClass: "agent-rec",
    metrics: [
      { id: "b3_template", label: "Standard QBR template enforced", help: "Is there one mandatory QBR template across the team (not 12 freelance versions)?" },
      { id: "b3_value", label: "Quantified value realised per account", help: "Does every strategic QBR present hard ROI / value figures — not adoption screenshots?" },
      { id: "b3_outcomes", label: "Mutual success plan reviewed each QBR", help: "Is the customer's written success plan tracked and updated, with status visible to both sides?" },
      { id: "b3_attendance", label: "Customer exec attends ≥75% of QBRs", help: "What % of strategic QBRs have the customer's actual exec sponsor in the room?" },
    ]},

  { id: "B4", section: "Strategic Operating", title: "AI & Automation in the CS Motion",
    desc: "Whether you have a sequenced AI deployment plan — or a Slack of vendor demos and no production use.",
    weight: 10, cardClass: "agent-hrbp",
    metrics: [
      { id: "b4_strategy", label: "Written AI roadmap for CS exists", help: "Is there a 12-month plan naming which CS workflows AI will touch, in what sequence?" },
      { id: "b4_ops", label: "≥2 AI use cases in production", help: "Are at least two AI use cases (e.g., churn prediction, QBR drafting, ticket triage) actually live and used weekly?" },
      { id: "b4_quality", label: "Output quality measured and humans-in-loop", help: "Do you measure model output quality and route low-confidence cases to humans?" },
      { id: "b4_data", label: "Customer data exposed cleanly to AI tools", help: "Are usage, support, and CRM data available to AI tools via APIs — not export-and-pray?" },
    ]},
];

export const GAP_FIXES: Record<string, string> = {
  A1: "Rebuild segmentation around ARR, expansion potential, and strategic value. Match CSM ratios to tier. Review quarterly against NRR.",
  A2: "Reweight your health score with five inputs minimum, back-test against last 18 months of churn, and assign a named owner per red signal.",
  A3: "Codify onboarding milestones with dates per customer. Track median TTV by cohort. Make sales→CS handoff a signed artefact, not a Slack message.",
  A4: "Mandate written stakeholder maps for every strategic account. Refresh quarterly. Multi-thread to three contacts minimum.",
  B1: "Stand up 90/60/30-day renewal forecasts. Get accuracy inside ±5%. Give CS an explicit expansion target with a written quota or shared accountability.",
  B2: "Write the escalation playbook your team is currently improvising. Pre-assign war-room roles. Run post-mortems on every Sev 1/2 — not just the disasters.",
  B3: "Enforce one QBR template. Make every strategic QBR present quantified value realised. Track customer exec attendance and treat <75% as a leading risk signal.",
  B4: "Pick two AI use cases (churn prediction + QBR drafting are the safest starting bets) and ship them inside 90 days. Measure output quality and keep humans in the loop on low-confidence cases.",
};

export const AGENT_INFO: Record<string, { name: string; desc: string }> = {
  B1: { name: "Renewal & Expansion Forecasting", desc: "90/60/30-day forecast, NRR ownership, expansion quotas" },
  B2: { name: "Escalation Playbook", desc: "Sequenced response, war-room, post-mortems" },
  B3: { name: "QBR & Value Realisation", desc: "Standardised template, quantified ROI, exec attendance" },
  B4: { name: "AI Augmentation", desc: "Production AI in CS workflows, with quality controls" },
};

export const AGENT_RECS: Record<TierName, string[]> = {
  Block: [],
  Pilot: ["B3"],
  Scale: ["B1", "B3"],
  "AI Native": ["B1", "B2", "B3", "B4"],
};

export type TierName = "Block" | "Pilot" | "Scale" | "AI Native";

export type DimensionScore = {
  id: string;
  label: string;
  section: SurveySection;
  weight: number;
  avg: number;
  weighted: number;
};

export type ScoreResult = {
  finalScore: number;
  tier: TierName;
  tierLabel: string;
  recommendation: string;
  headline: string;
  foundationalTotal: number;
  agentTotal: number;
  dimensionScores: Record<string, DimensionScore>;
  topGaps: DimensionScore[];
  recommendedAgents: string[];
  ninetyDayPlan: { week: string; title: string; items: string[] }[];
  blockers: string[];
};

const PLAN_BY_TIER: Record<TierName, { week: string; title: string; items: string[] }[]> = {
  Block: [
    { week: "Days 1–30", title: "Segmentation & Health Score Reset", items: ["Rebuild account segmentation around ARR + strategic value", "Audit health score against last 18 months of churn", "Name a single CS leader accountable for the reset"] },
    { week: "Days 31–60", title: "Onboarding Discipline", items: ["Roll out a single onboarding template with 30/60/90 milestones", "Mandate a sales→CS handoff artefact", "Measure median time-to-first-value baseline"] },
    { week: "Days 61–90", title: "Re-baseline & Re-score", items: ["Map stakeholders on top 20 accounts", "Stand up basic renewal forecast", "Re-take this diagnostic — aim for Pilot tier"] },
  ],
  Pilot: [
    { week: "Days 1–30", title: "Forecast & QBR Tightening", items: ["Stand up 90/60/30-day renewal forecast", "Enforce one QBR template across the team", "Track customer exec attendance at strategic QBRs"] },
    { week: "Days 31–60", title: "Escalation Playbook", items: ["Document the escalation sequence and war-room roles", "Run post-mortems on the last 3 escalations", "Identify two AI use cases worth piloting (churn prediction + QBR drafting)"] },
    { week: "Days 61–90", title: "Expansion Ownership", items: ["Give CS an explicit expansion target", "Tie CSM comp to NRR contribution", "Trend NRR / GRR monthly with exec team"] },
  ],
  Scale: [
    { week: "Days 1–30", title: "Multi-Threading & Stakeholder Maps", items: ["Mandate written stakeholder maps on all strategic accounts", "Multi-thread to ≥3 contacts on top 50 accounts", "Activate exec sponsor program with real attendance"] },
    { week: "Days 31–60", title: "AI in Production", items: ["Ship one AI use case to production (start with QBR drafting or churn prediction)", "Measure output quality and route low-confidence to humans", "Expose usage + support + CRM data via APIs"] },
    { week: "Days 61–90", title: "Forecast Accuracy", items: ["Drive renewal forecast accuracy inside ±5%", "Publish quarterly NRR / GRR scorecard to board", "Plan second AI use case"] },
  ],
  "AI Native": [
    { week: "Days 1–30", title: "Optimise & Audit", items: ["Audit health score back-testing against last 8 quarters", "Refresh stakeholder maps on all tier-1 accounts", "Re-baseline AI output quality KPIs"] },
    { week: "Days 31–60", title: "Expand AI Surface Area", items: ["Add a third AI use case (e.g., proactive escalation detection)", "Pilot agentic workflows on lower-risk tiers", "Establish a CS AI council with Product + Eng"] },
    { week: "Days 61–90", title: "Publish the Playbook", items: ["Productise your retention playbook as internal training", "Share NRR results externally as proof", "Mentor peer CS orgs — leadership is now a moat"] },
  ],
};

export function calculateScore(answers: Record<string, number>): ScoreResult {
  const dimensionScores: Record<string, DimensionScore> = {};
  let foundationalTotal = 0;
  let agentTotal = 0;

  for (const q of QUESTIONS) {
    const vals = q.metrics.map((m) => answers[m.id] ?? 0);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const weighted = (avg / 5) * q.weight;
    dimensionScores[q.id] = { id: q.id, label: q.title, section: q.section, weight: q.weight, avg, weighted };
    if (q.section === "Foundational Discipline") foundationalTotal += weighted;
    else agentTotal += weighted;
  }

  let totalScore = foundationalTotal + agentTotal;
  const blockers: string[] = [];
  // Foundational gates: you cannot be AI-native without segmentation, health, and stakeholder discipline.
  if (dimensionScores.A1.avg < 2.5) { totalScore = Math.min(totalScore, 40); blockers.push("A1"); }
  if (dimensionScores.A2.avg < 2.5) { totalScore = Math.min(totalScore, 50); blockers.push("A2"); }
  if (dimensionScores.A3.avg < 2.0) { totalScore = Math.min(totalScore, 55); blockers.push("A3"); }
  const finalScore = Math.round(totalScore);

  let tier: TierName, tierLabel: string, recommendation: string, headline: string;
  if (finalScore <= 40) {
    tier = "Block";
    tierLabel = "Block — Foundation Not Set";
    recommendation = "Foundation first: stabilise segmentation, health scoring, and onboarding before scaling motion or layering AI";
    headline = "The CS function is operating on craft, not system. That works at $20M ARR; it breaks at $80M. Before adding AI or expansion targets, fix the foundation — segmentation, health, onboarding, stakeholder maps. Re-score in 90 days.";
  } else if (finalScore <= 60) {
    tier = "Pilot";
    tierLabel = "Pilot Ready — Tighten the Motion";
    recommendation = "Tighten forecast accuracy, enforce one QBR standard, and pilot one AI use case (QBR drafting or churn prediction)";
    headline = "The fundamentals are mostly there. The next move is operational tightening: a deterministic renewal forecast, a single QBR template, and one piloted AI use case to build internal literacy. Don't try to roll out everything at once.";
  } else if (finalScore <= 80) {
    tier = "Scale";
    tierLabel = "Scale Ready — Multi-Thread & Automate";
    recommendation = "Mandate stakeholder discipline across all strategic accounts, get forecast inside ±5%, and put 1–2 AI use cases in production";
    headline = "You have the foundation and the discipline. The next leg is multi-threading every strategic account, getting your renewal forecast inside ±5%, and putting AI in production on the workflows where it pays off fastest.";
  } else {
    tier = "AI Native";
    tierLabel = "AI Native — Leadership Posture";
    recommendation = "Operate as a reference org: ship the third AI use case, productise your retention playbook, and benchmark publicly";
    headline = "You're operating in the top decile. The remaining work is leadership posture — third AI use case, public benchmarking, mentoring peer CS orgs, and treating your retention playbook as IP, not folklore.";
  }

  if (blockers.length) {
    const reasons: string[] = [];
    if (blockers.includes("A1")) reasons.push("account segmentation is below threshold");
    if (blockers.includes("A2")) reasons.push("health scoring isn't a reliable leading indicator");
    if (blockers.includes("A3")) reasons.push("onboarding is not deterministic");
    headline += " Critical gaps detected: " + reasons.join("; ") + ". Fix these before anything else.";
  }

  const sorted = Object.values(dimensionScores).sort(
    (a, b) => a.weighted / a.weight - b.weighted / b.weight,
  );
  const topGaps = sorted.slice(0, 3);

  return {
    finalScore,
    tier,
    tierLabel,
    recommendation,
    headline,
    foundationalTotal,
    agentTotal,
    dimensionScores,
    topGaps,
    recommendedAgents: AGENT_RECS[tier],
    ninetyDayPlan: PLAN_BY_TIER[tier],
    blockers,
  };
}
