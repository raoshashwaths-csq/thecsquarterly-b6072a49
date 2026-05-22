// Super Agent Readiness Diagnostic — questions, options, and scoring logic
// preserved from the original HTML diagnostic (11 dimensions, 44 metrics).

export type SurveySection = "Foundational Readiness" | "Agent-Level Readiness";

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
  { value: 0, label: "0 · Absent", desc: "Doesn't exist" },
  { value: 1, label: "1 · Ad-hoc", desc: "Manual / paper / spreadsheet" },
  { value: 2, label: "2 · Basic", desc: "In system but messy (>30% gaps)" },
  { value: 3, label: "3 · Structured", desc: "In system, gaps <15%" },
  { value: 4, label: "4 · Governed", desc: "Standardised & audited" },
  { value: 5, label: "5 · AI-ready", desc: "Real-time, API-exposed" },
] as const;

export const QUESTIONS: Question[] = [
  { id: "A1", section: "Foundational Readiness", title: "HCM Data Foundation",
    desc: "Super Agent inherits roles, permissions, and approvals from your HCM. Without a clean foundation, no agent can act safely.",
    weight: 15, cardClass: "foundation",
    metrics: [
      { id: "a1_completeness", label: "Employee master record completeness", help: "What % of employee records have all core fields populated (role, manager, location, cost centre)?" },
      { id: "a1_orghier", label: "Org hierarchy & reporting accuracy", help: "How accurate is your reporting structure — including dotted lines, legal entities, business units?" },
      { id: "a1_positions", label: "Position-based staffing model", help: "Do you use positions (not just job titles) so the agent knows which roles to backfill?" },
      { id: "a1_docs", label: "Document library digitisation", help: "Are policies, contracts, and letters digitised, versioned, and tagged?" },
      { id: "a1_ess", label: "Employee self-service adoption", help: "What % of employees actively use the ESS portal each month?" },
    ]},
  { id: "A2", section: "Foundational Readiness", title: "Identity, Permissions & Approvals",
    desc: "Super Agent will only act within your access controls. Weak identity = unsafe AI.",
    weight: 10, cardClass: "identity",
    metrics: [
      { id: "a2_sso", label: "SSO via SAML 2.0 / OAuth", help: "Is single sign-on live across your HR + IT systems?" },
      { id: "a2_rbac", label: "Role-based access control (RBAC)", help: "Is your access matrix documented and reviewed at least annually?" },
      { id: "a2_approvals", label: "Digital approval workflows", help: "What % of approvals are in-system (not email-based)?" },
      { id: "a2_sod", label: "Segregation-of-duties rules", help: "Are SoD policies defined and enforced (e.g., maker-checker)?" },
    ]},
  { id: "A3", section: "Foundational Readiness", title: "Cross-System Integration & MCP-Readiness",
    desc: "Super Agent's superpower is orchestrating across HR, IT, Finance, CRM. This needs API-reachable systems.",
    weight: 10, cardClass: "integration",
    metrics: [
      { id: "a3_systems", label: "External systems with named use cases", help: "How many non-HR systems (ITSM, Finance, CRM, Slack/Teams) have stated AI use cases?" },
      { id: "a3_apis", label: "API availability for top 3 systems", help: "Are RESTful authenticated APIs available for your highest-priority external systems?" },
      { id: "a3_ipaas", label: "iPaaS / integration middleware adoption", help: "Do you actively use integration middleware with running recipes?" },
      { id: "a3_aiagents", label: "Existing AI agents in environment", help: "Do you already use Copilot, Claude, Gemini, or other MCP-compatible agents anywhere?" },
    ]},
  { id: "A4", section: "Foundational Readiness", title: "Governance, Audit & Compliance",
    desc: "Super Agent ships with audit trails — but you need to want them and act on them.",
    weight: 8, cardClass: "governance",
    metrics: [
      { id: "a4_dpia", label: "DPIA / privacy framework for AI", help: "Is a Data Protection Impact Assessment in place for AI use cases?" },
      { id: "a4_certs", label: "Compliance certification requirements", help: "Have GDPR / SOC 2 / CCPA / local-law requirements been documented?" },
      { id: "a4_authority", label: "AI decision-authority matrix", help: "Have you defined what AI can auto-approve vs. what requires human review?" },
      { id: "a4_owner", label: "AI/data governance owner", help: "Is there a named accountable owner for AI governance in your org?" },
    ]},
  { id: "A5", section: "Foundational Readiness", title: "Workflow Digitisation",
    desc: "You can't agentify what isn't digital. Workflows on email or paper are invisible to AI.",
    weight: 7, cardClass: "workflow",
    metrics: [
      { id: "a5_pctdigital", label: "% of HR processes on a digital workflow", help: "Roughly what proportion of your HR processes run inside a workflow tool?" },
      { id: "a5_policylib", label: "Searchable digital policy library", help: "Are policies digitised in a searchable repository (not a shared drive)?" },
      { id: "a5_top5", label: "Top 5 workflows standardised", help: "Are hire, onboard, offboard, leave, and expense workflows standardised org-wide?" },
      { id: "a5_manualsteps", label: "Few manual handoffs per workflow", help: "On average, how few manual handoffs exist per workflow? (lower = better, higher score)" },
    ]},
  { id: "B1", section: "Agent-Level Readiness", title: "Employee Self-Service Agent",
    desc: "Powers HR queries, policy lookup, leave optimisation, shift swap. The most common starter agent.",
    weight: 10, cardClass: "agent-emp",
    metrics: [
      { id: "b1_essmau", label: "ESS monthly active users", help: "What % of employees log into the ESS portal monthly?" },
      { id: "b1_policies", label: "Policies digitised & tagged", help: "Are policy documents searchable and tagged for AI retrieval?" },
      { id: "b1_leaveconfig", label: "Leave/attendance configured by geography", help: "Is leave & attendance correctly configured for every country you operate in?" },
      { id: "b1_helpdesk", label: "Helpdesk ticket history (12+ months)", help: "Do you have at least 12 months of structured helpdesk tickets to train on?" },
    ]},
  { id: "B2", section: "Agent-Level Readiness", title: "Line Manager Agent",
    desc: "Backfills roles, spots attrition risk, drafts feedback, surfaces team analytics.",
    weight: 10, cardClass: "agent-mgr",
    metrics: [
      { id: "b2_hierarchy", label: "Manager hierarchy clean & current", help: "Is your manager-employee mapping accurate with no orphan reports?" },
      { id: "b2_perfdata", label: "Digital performance data (2+ cycles)", help: "Do you have at least 2 cycles of digital performance data available?" },
      { id: "b2_goals", label: "Goals / OKRs captured in system", help: "What % of employees have active digital goals or OKRs?" },
      { id: "b2_attrition", label: "Attrition baseline by team", help: "Do you track attrition by team / function / location with a baseline?" },
    ]},
  { id: "B3", section: "Agent-Level Readiness", title: "Recruiter Agent",
    desc: "Parses resumes, screens candidates, drafts JDs, schedules interviews, generates offer letters.",
    weight: 10, cardClass: "agent-rec",
    metrics: [
      { id: "b3_ats", label: "ATS data in system or integrated", help: "Is your ATS data accessible — with at least 24 months of historical hires?" },
      { id: "b3_jd", label: "Structured, skills-tagged JD library", help: "Are your JDs in a structured library with skills tags?" },
      { id: "b3_rubric", label: "Interview rubric / scorecard adoption", help: "What % of interviews use a structured rubric (vs free-text notes)?" },
      { id: "b3_skills", label: "Skills taxonomy in place", help: "Do you have a skills taxonomy (or ready to adopt a 40k+ skills ontology)?" },
    ]},
  { id: "B4", section: "Agent-Level Readiness", title: "HRBP / HR Admin Agent",
    desc: "Handles HR workflow setup, policy queries, exception handling, analytics surfacing.",
    weight: 8, cardClass: "agent-hrbp",
    metrics: [
      { id: "b4_policylib", label: "Master policy library digital", help: "Is your master HR policy library fully digital and current?" },
      { id: "b4_coverage", label: "HRBP coverage model defined", help: "Is your HRBP coverage clearly defined by BU / region / function?" },
      { id: "b4_sops", label: "Exception SOPs documented", help: "Are exception-handling SOPs documented (not tribal knowledge)?" },
      { id: "b4_consumers", label: "Named analytics consumers", help: "Are there named end-users for HR analytics with stated questions?" },
    ]},
  { id: "B5", section: "Agent-Level Readiness", title: "Payroll Admin Agent",
    desc: "Detects payroll anomalies, resolves queries, validates expenses, monitors statutory compliance.",
    weight: 7, cardClass: "agent-pay",
    metrics: [
      { id: "b5_payroll", label: "Payroll on platform or 2-way integrated", help: "Is payroll on your HCM, or fully bi-directionally integrated?" },
      { id: "b5_components", label: "Pay components standardised", help: "Are pay components consolidated to under ~50 unique heads per legal entity?" },
      { id: "b5_history", label: "12+ months historical payroll runs", help: "Do you have at least 12 months of historical payroll runs available?" },
      { id: "b5_expense", label: "Expense policy digitised with rules", help: "Is your expense policy in a rules engine (not a PDF)?" },
    ]},
  { id: "B6", section: "Agent-Level Readiness", title: "Cross-System / IT-Finance Agent",
    desc: "The MCP unlock. Coordinates deprovisioning, ticket triage, finance approvals across systems.",
    weight: 5, cardClass: "agent-cross",
    metrics: [
      { id: "b6_itsm", label: "ITSM platform with API access", help: "Is your ITSM (Jira, ServiceNow, Freshservice) accessible via API?" },
      { id: "b6_provision", label: "Onboarding includes IT provisioning", help: "Are IT account creation and access provisioning already part of digital onboarding?" },
      { id: "b6_finance", label: "Finance system API-accessible", help: "Can your finance system be reached via documented APIs?" },
      { id: "b6_comms", label: "Slack/Teams integration live", help: "Is your enterprise comms platform already integrated with HR workflows?" },
    ]},
];

export const GAP_FIXES: Record<string, string> = {
  A1: "Run a 4-week HCM data audit. Target >95% record completeness, position-based staffing, and >70% ESS adoption before any AI pilot.",
  A2: "Stand up SSO (SAML 2.0/OAuth), document your RBAC matrix, and migrate email-based approvals into digital workflows.",
  A3: "Identify your top 3 non-HR systems (ITSM, Finance, comms) and confirm API access. Adopt an iPaaS for integration recipes.",
  A4: "Appoint a named AI governance owner. Draft a DPIA template and an AI decision-authority matrix before any agent goes live.",
  A5: "Pick your top 5 workflows (hire, onboard, offboard, leave, expense) and standardise them digitally before agentifying them.",
  B1: "Drive ESS adoption to 70%+ and tag your policy library. Without these, the Employee Agent has nothing to retrieve from.",
  B2: "Operationalise digital goals/OKRs at 80%+ adoption and clean up your manager hierarchy — no orphan reports.",
  B3: "Move your ATS data into your HCM or fully integrate it. Adopt a structured skills ontology as your taxonomy.",
  B4: "Document HRBP coverage and exception SOPs. Identify named analytics consumers with stated questions.",
  B5: "Consolidate pay components to <50 per entity. Move expense policy from PDFs into a rules engine.",
  B6: "Confirm API access to your ITSM and finance systems. Integrate Slack/Teams with HR workflows before activating MCP.",
};

export const AGENT_INFO: Record<string, { name: string; desc: string }> = {
  B1: { name: "Employee Self-Service Agent", desc: "HR queries, policy lookup, leave optimisation" },
  B2: { name: "Line Manager Agent", desc: "Backfill roles, spot attrition, draft feedback" },
  B3: { name: "Recruiter Agent", desc: "Parse resumes, screen candidates, schedule interviews" },
  B4: { name: "HRBP / HR Admin Agent", desc: "Workflow setup, policy queries, exceptions" },
  B5: { name: "Payroll Admin Agent", desc: "Anomaly detection, expense validation" },
  B6: { name: "Cross-System / IT-Finance Agent", desc: "Onboarding, deprovisioning, ticket triage via MCP" },
};

export const AGENT_RECS: Record<TierName, string[]> = {
  Block: [],
  Pilot: ["B1", "B3"],
  Scale: ["B1", "B2", "B3", "B4"],
  "AI Native": ["B1", "B2", "B3", "B4", "B5", "B6"],
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
    { week: "Days 1–30", title: "Foundation Audit", items: ["Audit HCM data quality across all employees", "Document org hierarchy gaps + duplicate records", "Build the business case for HCM modernisation"] },
    { week: "Days 31–60", title: "Data Hygiene Sprint", items: ["Close >95% record-completeness gap", "Migrate email approvals into workflow tool", "Stand up SSO if not already in place"] },
    { week: "Days 61–90", title: "Re-Assess Readiness", items: ["Drive ESS adoption to >70%", "Appoint AI governance owner", "Re-take this diagnostic — aim for Pilot tier"] },
  ],
  Pilot: [
    { week: "Days 1–30", title: "Pilot Scoping", items: ["Pick 1–2 agents (Employee + Recruiter recommended)", "Define success KPIs (deflection rate, time-to-hire)", "Train an internal AI champion"] },
    { week: "Days 31–60", title: "Deploy & Tune", items: ["Live deploy in 1 BU or region", "Run weekly tuning + feedback loops", "Collect baseline metrics vs current state"] },
    { week: "Days 61–90", title: "Measure & Expand", items: ["Report results to exec sponsor", "Document playbook for rollout", "Plan persona #3 (Manager or HRBP)"] },
  ],
  Scale: [
    { week: "Days 1–30", title: "Multi-Agent Design", items: ["Map 5–10 agents across personas", "Identify top 2 external systems for MCP (Jira/Slack/SNow)", "Set up Control Center governance + telemetry"] },
    { week: "Days 31–60", title: "Phased Rollout", items: ["Deploy Employee + Manager + Recruiter agents org-wide", "Activate MCP for first external system", "Train HRBPs and managers on the conversational UI"] },
    { week: "Days 61–90", title: "Optimise & Govern", items: ["Add HRBP + Payroll agents", "Quarterly bias + accuracy audits", "Build ROI dashboard for the CHRO/CFO"] },
  ],
  "AI Native": [
    { week: "Days 1–30", title: "Full Suite Deployment", items: ["Activate all 6 persona agents", "Stand up MCP across 3+ external systems", "Bring-your-own-agent: connect existing Copilot/Claude/Gemini"] },
    { week: "Days 31–60", title: "Cross-System Orchestration", items: ["Roll out end-to-end workflows (hire-to-onboard, offboard-to-deprovision)", "Activate Control Center for prompt governance + model choice", "Establish AI Centre of Excellence"] },
    { week: "Days 61–90", title: "Lead the Market", items: ["Publish case-study metrics internally + externally", "Pilot custom agents for industry-specific use cases", "Expand to finance/CRM agents via MCP"] },
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
    if (q.section === "Foundational Readiness") foundationalTotal += weighted;
    else agentTotal += weighted;
  }

  let totalScore = foundationalTotal + agentTotal;
  const blockers: string[] = [];
  if (dimensionScores.A1.avg < 3.0) { totalScore = Math.min(totalScore, 35); blockers.push("A1"); }
  if (dimensionScores.A2.avg < 2.5) { totalScore = Math.min(totalScore, 50); blockers.push("A2"); }
  if (dimensionScores.A4.avg < 2.0) { totalScore = Math.min(totalScore, 55); blockers.push("A4"); }
  const finalScore = Math.round(totalScore);

  let tier: TierName, tierLabel: string, recommendation: string, headline: string;
  if (finalScore <= 40) {
    tier = "Block";
    tierLabel = "Block — Not Yet Ready";
    recommendation = "Foundation-first: Stabilise core HCM + data hygiene before deploying any agents";
    headline = "Your organisation isn't ready for agentic AI yet — and that's okay. Right now, deploying agents would amplify data and process gaps rather than solve them. Focus on the foundation for 6 months, then re-score.";
  } else if (finalScore <= 60) {
    tier = "Pilot";
    tierLabel = "Pilot Ready — 1–2 Agents";
    recommendation = "Deploy 1–2 low-risk agents (Employee Self-Service + Recruiter) — no MCP, no cross-system orchestration yet";
    headline = "You're in the right shape for a focused pilot. Start with 1–2 contained agents to demonstrate value, build internal AI literacy, and gather production data that will train the next wave. Hold off on MCP and cross-system orchestration until your foundation strengthens.";
  } else if (finalScore <= 80) {
    tier = "Scale";
    tierLabel = "Scale Ready — 5–10 Agents";
    recommendation = "Deploy 5–10 agents across multiple personas; activate MCP for 1–2 external systems (e.g., Jira or Slack)";
    headline = "You're ready for a meaningful Super Agent rollout. Your data foundation and governance are strong enough to deploy across multiple personas — Employee, Manager, Recruiter, HRBP — and to begin orchestrating with external systems via MCP.";
  } else {
    tier = "AI Native";
    tierLabel = "AI Native — Full Suite + MCP";
    recommendation = "Full agent deployment with MCP orchestration, Control Center governance, and bring-your-own-agent model";
    headline = "Your organisation is in the top decile of AI readiness. You can deploy the full agent suite — 15+ agents across all personas, MCP cross-system orchestration, Control Center governance, and bring-your-own-agent integration.";
  }

  if (blockers.length) {
    const reasons: string[] = [];
    if (blockers.includes("A1")) reasons.push("HCM data foundation is below the safe threshold");
    if (blockers.includes("A2")) reasons.push("identity & permissions are not enterprise-ready");
    if (blockers.includes("A4")) reasons.push("AI governance is not in place");
    headline += " Critical gaps detected: " + reasons.join("; ") + ". These must be addressed first.";
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
