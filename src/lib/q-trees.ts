// Q decision graph — single source of truth for the operator canvas.
// 8 trees, levels 1-3. Terminal (L3) nodes carry the prompt template
// that gets injected into the AI call. Positions are % of the canvas
// viewport so the SVG scales responsively.

export type TreeId =
  | "T1" | "T2" | "T3" | "T4" | "T5" | "T6" | "T7" | "T8"
  | "T9" | "T10" | "T11" | "T12" | "T13"
  | "T14" | "T15" | "T16" | "T17"
  | "T18" | "T19" | "T20" | "T21";

export type TreeCategory = "core" | "ops" | "shared" | "leadership";

export const CATEGORY_COLOR: Record<TreeCategory, { hex: string; label: string; blurb: string }> = {
  core: { hex: "#B8862C", label: "Core scenarios", blurb: "Trees 1–8 · the original operator canvas." },
  ops: { hex: "#5A7DC4", label: "CSM daily operations", blurb: "Trees 9–13 · in-the-room tactical guidance." },
  shared: { hex: "#4A9B6F", label: "Shared scenarios", blurb: "Trees 14–17 · cross-role CSM + VP plays." },
  leadership: { hex: "#8A5AC4", label: "Leadership & strategic", blurb: "Trees 18–21 · systemic, board-aware." },
};

export interface ContextField {
  key: string;
  label: string;
  kind: "select" | "text";
  options?: string[];
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
}

export interface TreeNode {
  id: string;
  treeId: TreeId;
  label: string;
  level: 1 | 2 | 3;
  parentId?: string;
  isTerminal: boolean;
  // terminal-only:
  promptTemplate?: string;
  benchmarks?: string[];
  contextFields?: ContextField[];
  position: { x: number; y: number }; // % of canvas
}

export interface Tree {
  id: TreeId;
  title: string;
  eyebrow: string;
  blurb: string;
  category: TreeCategory;
}

export const TREES: Tree[] = [
  { id: "T1", title: "Manage an Escalation", eyebrow: "T1 · ESCALATION", blurb: "Contain a board-temperature account in 24 hours.", category: "core" },
  { id: "T2", title: "Handle Champion Change", eyebrow: "T2 · CHAMPION CHANGE", blurb: "Your evangelist left. The heir is hostile or unknown.", category: "core" },
  { id: "T3", title: "Qualify an Upsell", eyebrow: "T3 · UPSELL QUALIFICATION", blurb: "Expansion talk without the churn risk that usually follows.", category: "core" },
  { id: "T4", title: "Diagnose Renewal Risk", eyebrow: "T4 · RENEWAL RISK", blurb: "What the True Health Index actually says, 90 days out.", category: "core" },
  { id: "T5", title: "Prepare a QBR", eyebrow: "T5 · QBR PREP", blurb: "A QBR the customer wants to attend, not endure.", category: "core" },
  { id: "T6", title: "Onboarding Stall", eyebrow: "T6 · ONBOARDING STALL", blurb: "Time-to-value is slipping. Find what's actually blocking.", category: "core" },
  { id: "T7", title: "Exec Misalignment", eyebrow: "T7 · EXEC MISALIGNMENT", blurb: "Your VP and the customer's VP are no longer reading the same memo.", category: "core" },
  { id: "T8", title: "Career & Alignment", eyebrow: "T8 · CAREER & ALIGNMENT", blurb: "Appraisals, stretch burden, and cross-functional conflict.", category: "core" },
  // ---- CSM daily ops (blue) ----
  { id: "T9", title: "Adoption Rescue", eyebrow: "T9 · LOW ADOPTION", blurb: "Logins look fine. Usage is hollow. Rebuild the habit loop.", category: "ops" },
  { id: "T10", title: "Expectation Reset", eyebrow: "T10 · BROKEN PROMISE", blurb: "Sales promised a thing. We can't ship it. Own it, restage it.", category: "ops" },
  { id: "T11", title: "Commercial Conversation", eyebrow: "T11 · COMMERCIAL PRESSURE", blurb: "The customer wants a discount. Defend the price, not the ego.", category: "ops" },
  { id: "T12", title: "Stakeholder Conflict", eyebrow: "T12 · INTERNAL CUSTOMER CONFLICT", blurb: "Two buyers inside the account want opposite things from us.", category: "ops" },
  { id: "T13", title: "Sentiment Recovery", eyebrow: "T13 · NEGATIVE SENTIMENT", blurb: "Tone has turned. Bring the relationship back to neutral first.", category: "ops" },
  // ---- Shared (green) ----
  { id: "T14", title: "Onboarding Crisis", eyebrow: "T14 · ONBOARDING STUCK", blurb: "Implementation is openly failing. Escalate without losing the room.", category: "shared" },
  { id: "T15", title: "Executive Access", eyebrow: "T15 · NEED EXEC ACCESS", blurb: "You need 20 minutes with their CFO. Earn the calendar.", category: "shared" },
  { id: "T16", title: "Product Gap", eyebrow: "T16 · PRODUCT GAP", blurb: "We don't have what they need. Hold the relationship anyway.", category: "shared" },
  { id: "T17", title: "Win-Back", eyebrow: "T17 · CHURNED ACCOUNT", blurb: "They left. The story isn't over — open the second window.", category: "shared" },
  // ---- Leadership (purple) ----
  { id: "T18", title: "Team Performance", eyebrow: "T18 · TEAM PERFORMANCE", blurb: "A CSM is underperforming. Coach, restage, or part — on evidence.", category: "leadership" },
  { id: "T19", title: "Leadership Communication", eyebrow: "T19 · LEADERSHIP COMMUNICATION", blurb: "Frame the board update without burying the bad news.", category: "leadership" },
  { id: "T20", title: "Org Design", eyebrow: "T20 · ORG DESIGN", blurb: "Pooled vs named. Onshore vs offshore. Build the model that scales.", category: "leadership" },
  { id: "T21", title: "Sales Alignment", eyebrow: "T21 · SALES ALIGNMENT", blurb: "CS and Sales are pulling in different directions. Re-cut the seam.", category: "leadership" },
];

export function getTree(id: TreeId): Tree | undefined {
  return TREES.find((t) => t.id === id);
}

// ---- shared context-field presets ----
const ARR_FIELD: ContextField = {
  key: "arr",
  label: "Account ARR",
  kind: "select",
  options: ["< $100k", "$100k–$500k", "Growth ($500k–$2M)", "Midmarket ($2M–$10M)", "> $10M"],
  required: true,
};
const TIMING_FIELD: ContextField = {
  key: "timing",
  label: "Time horizon",
  kind: "select",
  options: ["< 24 hours", "This week", "This month", "This quarter"],
  required: true,
};
const CONTEXT_FIELD: ContextField = {
  key: "context",
  label: "One sentence of context",
  kind: "text",
  placeholder: "e.g. CFO escalated after a Q3 outage we already remediated.",
  maxLength: 240,
  required: true,
};

// ---- helpers to author concise terminal prompts ----
const t = (
  treeId: TreeId,
  parentId: string,
  id: string,
  label: string,
  position: { x: number; y: number },
  promptTemplate: string,
  contextFields: ContextField[] = [ARR_FIELD, TIMING_FIELD, CONTEXT_FIELD],
  benchmarks: string[] = [],
): TreeNode => ({
  id, treeId, parentId, label, level: 3, isTerminal: true,
  promptTemplate, contextFields, benchmarks, position,
});

// ===== TREE 1 — ESCALATION =====
const T1: TreeNode[] = [
  { id: "T1", treeId: "T1", label: "Escalation", level: 1, isTerminal: false, position: { x: 50, y: 8 } },
  { id: "T1-A", treeId: "T1", parentId: "T1", label: "Product failure", level: 2, isTerminal: false, position: { x: 22, y: 38 } },
  { id: "T1-B", treeId: "T1", parentId: "T1", label: "Commercial dispute", level: 2, isTerminal: false, position: { x: 50, y: 38 } },
  { id: "T1-C", treeId: "T1", parentId: "T1", label: "Relationship breakdown", level: 2, isTerminal: false, position: { x: 78, y: 38 } },
  t("T1", "T1-A", "T1-A1", "Core platform downtime", { x: 10, y: 78 },
    "An enterprise customer has escalated after a core-platform outage. Build the 24-hour containment plan: who calls whom, what they say, what artifact lands in the customer's inbox tonight, and how to stop the escalation from reaching their board."),
  t("T1", "T1-A", "T1-A2", "Critical feature regression", { x: 22, y: 78 },
    "A feature the customer depends on regressed in the last release. Build the operator response: blameless RCA outline, rollback or workaround the CSM can ship today, and the commitment language that does not over-promise engineering."),
  t("T1", "T1-B", "T1-B1", "Surprise invoice / true-up", { x: 44, y: 78 },
    "Customer is escalating over an unexpected invoice or usage true-up. Build the response: posture (concede, defend, restructure), the email the CSM sends procurement, and the internal note to Finance."),
  t("T1", "T1-B", "T1-B2", "ROI no longer defensible", { x: 58, y: 78 },
    "Customer's exec is questioning the ROI mid-cycle. Build a defensible value brief using their own committed business outcomes, plus the conversation flow to reset value before renewal."),
  t("T1", "T1-C", "T1-C1", "Hostile new exec", { x: 78, y: 78 },
    "A new exec on the customer side is openly hostile to the relationship. Build the first-meeting playbook: pre-read, sequencing, what to concede, what not to."),
  t("T1", "T1-C", "T1-C2", "Internal CSM-AE conflict", { x: 90, y: 78 },
    "The CSM and AE are no longer aligned on this account. Build a 20-minute reset agenda that lands a single account narrative both can defend with the customer this week."),
];

// ===== TREE 2 — CHAMPION CHANGE =====
const T2: TreeNode[] = [
  { id: "T2", treeId: "T2", label: "Champion Change", level: 1, isTerminal: false, position: { x: 50, y: 8 } },
  { id: "T2-A", treeId: "T2", parentId: "T2", label: "Champion left", level: 2, isTerminal: false, position: { x: 28, y: 38 } },
  { id: "T2-B", treeId: "T2", parentId: "T2", label: "Champion sidelined", level: 2, isTerminal: false, position: { x: 72, y: 38 } },
  t("T2", "T2-A", "T2-A1", "Unknown successor", { x: 16, y: 78 },
    "Our champion exited and their replacement is a stranger. Build the first-90-days plan: discovery questions, who to map first, what proof to lead with."),
  t("T2", "T2-A", "T2-A2", "Successor came from a competitor", { x: 40, y: 78 },
    "The new owner used a competing product at their previous employer. Build the displacement-defense brief: where competitors lose, where we are objectively better, and the early-win to surface in week one."),
  t("T2", "T2-B", "T2-B1", "Reorg pushed champion down", { x: 60, y: 78 },
    "A reorg moved our champion two layers down. Build the re-mapping plan: who now owns the budget, the meeting we need this month, and the new value narrative."),
  t("T2", "T2-B", "T2-B2", "Champion under performance review", { x: 84, y: 78 },
    "Our champion is now perceived as underperforming. Build the protective play: how to neither over-associate nor abandon them, plus a parallel relationship we should open without burning the original."),
];

// ===== TREE 3 — UPSELL QUALIFICATION =====
const T3: TreeNode[] = [
  { id: "T3", treeId: "T3", label: "Upsell Qualification", level: 1, isTerminal: false, position: { x: 50, y: 8 } },
  { id: "T3-A", treeId: "T3", parentId: "T3", label: "Usage signal", level: 2, isTerminal: false, position: { x: 28, y: 38 } },
  { id: "T3-B", treeId: "T3", parentId: "T3", label: "Stated demand", level: 2, isTerminal: false, position: { x: 72, y: 38 } },
  t("T3", "T3-A", "T3-A1", "Seat saturation", { x: 16, y: 78 },
    "Seat utilization is >85%. Decide if this is true expansion or coverage masking churn risk. Build the qualification checklist + the conversation that gets the customer to ask us for more seats."),
  t("T3", "T3-A", "T3-A2", "New use-case adoption", { x: 40, y: 78 },
    "Customer organically adopted a second use case. Build the expansion brief: value already proven, the SKU they should buy, and the internal procurement path."),
  t("T3", "T3-B", "T3-B1", "Customer asked for a module", { x: 60, y: 78 },
    "Customer explicitly asked about a paid module. Build the qualification path: business outcome, sponsor, budget, timing. Refuse to quote until all four are present."),
  t("T3", "T3-B", "T3-B2", "M&A or new geo", { x: 84, y: 78 },
    "Customer just acquired a company or opened a new geography. Build the expansion narrative: standardization argument, the meeting we ask for, and the artifact we send first."),
];

// ===== TREE 4 — RENEWAL RISK =====
const T4: TreeNode[] = [
  { id: "T4", treeId: "T4", label: "Renewal Risk", level: 1, isTerminal: false, position: { x: 50, y: 8 } },
  { id: "T4-A", treeId: "T4", parentId: "T4", label: "Usage decay", level: 2, isTerminal: false, position: { x: 28, y: 38 } },
  { id: "T4-B", treeId: "T4", parentId: "T4", label: "Sentiment decay", level: 2, isTerminal: false, position: { x: 72, y: 38 } },
  t("T4", "T4-A", "T4-A1", "MAU collapse > 30%", { x: 16, y: 78 },
    "MAU is down >30% over 90 days. Build the True Health Index read: leading indicators, what's lagging, the one experiment to run in the next 14 days to recover usage."),
  t("T4", "T4-A", "T4-A2", "Power user churn", { x: 40, y: 78 },
    "We lost our power users but the account is still 'green'. Build the realistic forecast and the intervention sequence before the renewal conversation."),
  t("T4", "T4-B", "T4-B1", "Quiet customer, no reply", { x: 60, y: 78 },
    "Customer has gone silent for 60+ days. Build the re-engagement playbook: the channel and message that breaks silence without sounding desperate."),
  t("T4", "T4-B", "T4-B2", "Late survey detractor", { x: 84, y: 78 },
    "A late-cycle survey response was a strong detractor. Build the recovery plan: closing the loop in person, the artifact that proves we heard them, and how this lands in the renewal forecast."),
];

// ===== TREE 5 — QBR PREP =====
const T5: TreeNode[] = [
  { id: "T5", treeId: "T5", label: "QBR Prep", level: 1, isTerminal: false, position: { x: 50, y: 8 } },
  { id: "T5-A", treeId: "T5", parentId: "T5", label: "Strategic QBR", level: 2, isTerminal: false, position: { x: 28, y: 38 } },
  { id: "T5-B", treeId: "T5", parentId: "T5", label: "Recovery QBR", level: 2, isTerminal: false, position: { x: 72, y: 38 } },
  t("T5", "T5-A", "T5-A1", "Exec-level, new sponsor", { x: 16, y: 78 },
    "Strategic QBR with a new C-level sponsor in the room. Build the 45-minute agenda, the 3 slides that matter, and the single ask that justifies the meeting."),
  t("T5", "T5-A", "T5-A2", "Multi-BU global account", { x: 40, y: 78 },
    "Global QBR spanning multiple BUs. Build the structure: shared outcomes, per-BU sub-stories, and the cross-BU expansion thesis we put on the table."),
  t("T5", "T5-B", "T5-B1", "After an outage / failure", { x: 60, y: 78 },
    "First QBR after a significant failure. Build the agenda that earns trust back: what we own, what we changed, and the commitment we will hold ourselves to publicly."),
  t("T5", "T5-B", "T5-B2", "Pre-renewal, at risk", { x: 84, y: 78 },
    "QBR 60 days before a renewal flagged at-risk. Build the conversation that names risk explicitly and converts it into a co-authored 60-day plan."),
];

// ===== TREE 6 — ONBOARDING STALL =====
const T6: TreeNode[] = [
  { id: "T6", treeId: "T6", label: "Onboarding Stall", level: 1, isTerminal: false, position: { x: 50, y: 8 } },
  { id: "T6-A", treeId: "T6", parentId: "T6", label: "Customer-side blocker", level: 2, isTerminal: false, position: { x: 28, y: 38 } },
  { id: "T6-B", treeId: "T6", parentId: "T6", label: "Our-side blocker", level: 2, isTerminal: false, position: { x: 72, y: 38 } },
  t("T6", "T6-A", "T6-A1", "Missing data / access", { x: 16, y: 78 },
    "Onboarding is stalled on customer-side data or access. Build the escalation script that moves IT this week without alienating the business sponsor."),
  t("T6", "T6-A", "T6-A2", "Sponsor lost interest", { x: 40, y: 78 },
    "The sponsor who signed has gone cold. Build the re-anchor: re-state the original business case in their language and force a binary go/pause decision."),
  t("T6", "T6-B", "T6-B1", "Implementation team overrun", { x: 60, y: 78 },
    "Our implementation team is the bottleneck. Build the honest customer comms + the internal escalation that gets engineering attention without blowing CSAT."),
  t("T6", "T6-B", "T6-B2", "Scope creep mid-onboarding", { x: 84, y: 78 },
    "Customer keeps adding scope mid-onboarding. Build the firm-but-warm scope-reset: what stays in v1, what moves to a paid phase 2, and the commercial framing."),
];

// ===== TREE 7 — EXEC MISALIGNMENT =====
const T7: TreeNode[] = [
  { id: "T7", treeId: "T7", label: "Exec Misalignment", level: 1, isTerminal: false, position: { x: 50, y: 8 } },
  { id: "T7-A", treeId: "T7", parentId: "T7", label: "Internal", level: 2, isTerminal: false, position: { x: 28, y: 38 } },
  { id: "T7-B", treeId: "T7", parentId: "T7", label: "Customer-side", level: 2, isTerminal: false, position: { x: 72, y: 38 } },
  t("T7", "T7-A", "T7-A1", "Our VP wants different outcome", { x: 16, y: 78 },
    "Our VP wants a different commercial outcome than the field reads. Build the brief that re-frames the trade-off with data the VP cannot dismiss."),
  t("T7", "T7-A", "T7-A2", "CS vs Sales account narrative", { x: 40, y: 78 },
    "CS and Sales are telling two different stories about this account. Build the 20-minute reset that produces a single shared narrative both can defend."),
  t("T7", "T7-B", "T7-B1", "Customer CEO vs CIO split", { x: 60, y: 78 },
    "The customer's CEO and CIO want different things from us. Build the dual-narrative briefing that lets us speak to both without contradicting ourselves."),
  t("T7", "T7-B", "T7-B2", "Procurement weaponized", { x: 84, y: 78 },
    "Procurement is being used as a battering ram by the business. Build the posture, the concessions ladder, and the line we do not cross."),
];

// ===== TREE 8 — CAREER & ALIGNMENT =====
const T8: TreeNode[] = [
  { id: "T8", treeId: "T8", label: "Career & Alignment", level: 1, isTerminal: false, position: { x: 50, y: 8 } },
  { id: "T8-A", treeId: "T8", parentId: "T8", label: "Performance & growth", level: 2, isTerminal: false, position: { x: 28, y: 38 } },
  { id: "T8-B", treeId: "T8", parentId: "T8", label: "Cross-functional conflict", level: 2, isTerminal: false, position: { x: 72, y: 38 } },
  t("T8", "T8-A", "T8-A1", "Appraisal narrative", { x: 16, y: 78 },
    "Build a self-appraisal narrative for a senior CS operator. Lead with retained ARR, expansion sourced, and the qualitative outcomes a CRO actually weighs.",
    [TIMING_FIELD, CONTEXT_FIELD]),
  t("T8", "T8-A", "T8-A2", "Stretch-role positioning", { x: 40, y: 78 },
    "Operator is interviewing internally for a stretch role. Build the brag-doc structure and the 3 stories that map cleanly to the new scope.",
    [TIMING_FIELD, CONTEXT_FIELD]),
  t("T8", "T8-B", "T8-B1", "CS-Product friction", { x: 60, y: 78 },
    "Recurring friction with Product over roadmap influence. Build the operating model proposal that gives CS structured influence without slowing Product down.",
    [TIMING_FIELD, CONTEXT_FIELD]),
  t("T8", "T8-B", "T8-B2", "CS-Sales comp conflict", { x: 84, y: 78 },
    "CS and Sales comp plans are pushing opposite behaviors on the same account. Build the case for a shared-comp mechanic for the next planning cycle.",
    [TIMING_FIELD, CONTEXT_FIELD]),
];

// ===== TREE 9 — ADOPTION RESCUE =====
const T9: TreeNode[] = [
  { id: "T9", treeId: "T9", label: "Adoption Rescue", level: 1, isTerminal: false, position: { x: 50, y: 8 } },
  { id: "T9-A", treeId: "T9", parentId: "T9", label: "Feature dark", level: 2, isTerminal: false, position: { x: 28, y: 38 } },
  { id: "T9-B", treeId: "T9", parentId: "T9", label: "Habit collapse", level: 2, isTerminal: false, position: { x: 72, y: 38 } },
  t("T9", "T9-A", "T9-A1", "Core workflow unused", { x: 16, y: 78 },
    "The customer bought us for a specific workflow they never adopted. Build the rescue: the 30-minute working session that proves the workflow this week, and the artifact the CSM sends afterwards."),
  t("T9", "T9-A", "T9-A2", "New module ignored", { x: 40, y: 78 },
    "A paid module they bought 90 days ago has zero usage. Build the adoption sprint: the 2 stakeholders to convene, the use case to anchor on, and the success metric they own."),
  t("T9", "T9-B", "T9-B1", "Logins steady, depth shallow", { x: 60, y: 78 },
    "Logins look healthy but session depth is collapsing. Build the operator response: what depth signal to surface to the sponsor, and the experiment that restores meaningful use in 14 days."),
  t("T9", "T9-B", "T9-B2", "Team turnover broke habit", { x: 84, y: 78 },
    "Customer turnover means the people we trained are gone. Build the re-enablement plan: who to retrain first, the lightweight cert path, and the manager check-in that prevents relapse."),
];

// ===== TREE 10 — EXPECTATION RESET =====
const T10: TreeNode[] = [
  { id: "T10", treeId: "T10", label: "Expectation Reset", level: 1, isTerminal: false, position: { x: 50, y: 8 } },
  { id: "T10-A", treeId: "T10", parentId: "T10", label: "Sales over-promised", level: 2, isTerminal: false, position: { x: 28, y: 38 } },
  { id: "T10-B", treeId: "T10", parentId: "T10", label: "Roadmap slipped", level: 2, isTerminal: false, position: { x: 72, y: 38 } },
  t("T10", "T10-A", "T10-A1", "Feature was vapor", { x: 16, y: 78 },
    "A feature mentioned in the sales cycle does not exist. Build the reset: the email the CSM sends, the credible bridge offer, and the internal escalation to AE + Product."),
  t("T10", "T10-A", "T10-A2", "Pricing model misread", { x: 40, y: 78 },
    "Customer expected a different pricing mechanic. Build the conversation that re-frames value vs. unit cost without re-trading the deal."),
  t("T10", "T10-B", "T10-B1", "Promised quarter slipped", { x: 60, y: 78 },
    "A roadmap item we committed to has slipped two quarters. Build the proactive disclosure: the call script, the workaround we will resource, and the credit/concession ladder."),
  t("T10", "T10-B", "T10-B2", "Scope cut without telling them", { x: 84, y: 78 },
    "Product cut scope on a feature they're already using. Build the recovery comms: ownership, alternative path, and the executive-to-executive call we offer first."),
];

// ===== TREE 11 — COMMERCIAL CONVERSATION =====
const T11: TreeNode[] = [
  { id: "T11", treeId: "T11", label: "Commercial Conversation", level: 1, isTerminal: false, position: { x: 50, y: 8 } },
  { id: "T11-A", treeId: "T11", parentId: "T11", label: "Discount demand", level: 2, isTerminal: false, position: { x: 28, y: 38 } },
  { id: "T11-B", treeId: "T11", parentId: "T11", label: "Down-sell signal", level: 2, isTerminal: false, position: { x: 72, y: 38 } },
  t("T11", "T11-A", "T11-A1", "Procurement asking for 20%+", { x: 16, y: 78 },
    "Procurement is demanding a 20%+ cut at renewal. Build the posture: what we concede, what we trade for, and the email that opens the negotiation from strength."),
  t("T11", "T11-A", "T11-A2", "Benchmarking against a peer", { x: 40, y: 78 },
    "Customer is wielding a peer benchmark to compress price. Build the counter-narrative: defensible value reset using their own outcomes, not feature comparison."),
  t("T11", "T11-B", "T11-B1", "Seat reduction request", { x: 60, y: 78 },
    "Customer wants to drop 30% of seats. Build the qualification: real consolidation vs. usage hiding. Then the conversation that preserves account value or restages it."),
  t("T11", "T11-B", "T11-B2", "Term shortening", { x: 84, y: 78 },
    "Customer wants to move from 3-year to 1-year. Build the trade matrix: what we hold, what we soften, and the proof we ask for that justifies the shorter commitment."),
];

// ===== TREE 12 — STAKEHOLDER CONFLICT =====
const T12: TreeNode[] = [
  { id: "T12", treeId: "T12", label: "Stakeholder Conflict", level: 1, isTerminal: false, position: { x: 50, y: 8 } },
  { id: "T12-A", treeId: "T12", parentId: "T12", label: "Peer-to-peer split", level: 2, isTerminal: false, position: { x: 28, y: 38 } },
  { id: "T12-B", treeId: "T12", parentId: "T12", label: "Vertical split", level: 2, isTerminal: false, position: { x: 72, y: 38 } },
  t("T12", "T12-A", "T12-A1", "Two BUs want opposite roadmap", { x: 16, y: 78 },
    "Two business units inside the account want incompatible roadmap commitments. Build the brief that re-frames the trade as their internal decision, not ours."),
  t("T12", "T12-A", "T12-A2", "IT vs. business owner", { x: 40, y: 78 },
    "IT and the business sponsor disagree on architecture direction. Build the conversation we host that produces a single decision both can defend."),
  t("T12", "T12-B", "T12-B1", "Manager blocking individual contributor", { x: 60, y: 78 },
    "A manager is blocking adoption their team wants. Build the upstream conversation: business case in the manager's language, and the safe path to a pilot."),
  t("T12", "T12-B", "T12-B2", "Exec sponsor vs. day-to-day owner", { x: 84, y: 78 },
    "Sponsor wants speed, the day-to-day owner wants discipline. Build the dual-track operating cadence that keeps both at the table for renewal."),
];

// ===== TREE 13 — SENTIMENT RECOVERY =====
const T13: TreeNode[] = [
  { id: "T13", treeId: "T13", label: "Sentiment Recovery", level: 1, isTerminal: false, position: { x: 50, y: 8 } },
  { id: "T13-A", treeId: "T13", parentId: "T13", label: "Cold sentiment", level: 2, isTerminal: false, position: { x: 28, y: 38 } },
  { id: "T13-B", treeId: "T13", parentId: "T13", label: "Hot sentiment", level: 2, isTerminal: false, position: { x: 72, y: 38 } },
  t("T13", "T13-A", "T13-A1", "Quiet detractor", { x: 16, y: 78 },
    "A historically warm sponsor has turned quietly cold. Build the diagnostic conversation that surfaces what changed, without inviting a list of complaints we can't fix this week."),
  t("T13", "T13-A", "T13-A2", "Survey detractor with no signal", { x: 40, y: 78 },
    "A surprise detractor survey with no obvious trigger. Build the close-the-loop call: ownership posture, the 3 questions, and the artifact we send after."),
  t("T13", "T13-B", "T13-B1", "Public Slack/Teams blow-up", { x: 60, y: 78 },
    "Customer has publicly criticized us in their internal channel. Build the immediate response sequence: who calls whom in the next 4 hours, and what we put in writing."),
  t("T13", "T13-B", "T13-B2", "Threat to escalate to exec", { x: 84, y: 78 },
    "Customer is threatening to take this to our CEO. Build the pre-empt: the executive sponsor we activate first, the framing we put in their hand, and the offer that absorbs the heat."),
];

// ===== TREE 14 — ONBOARDING CRISIS =====
const T14: TreeNode[] = [
  { id: "T14", treeId: "T14", label: "Onboarding Crisis", level: 1, isTerminal: false, position: { x: 50, y: 8 } },
  { id: "T14-A", treeId: "T14", parentId: "T14", label: "Time overrun", level: 2, isTerminal: false, position: { x: 28, y: 38 } },
  { id: "T14-B", treeId: "T14", parentId: "T14", label: "Outcome at risk", level: 2, isTerminal: false, position: { x: 72, y: 38 } },
  t("T14", "T14-A", "T14-A1", "Go-live missed twice", { x: 16, y: 78 },
    "We've missed go-live twice. Build the recovery operating plan: who owns what for the next 30 days, the explicit definition of done, and the executive review cadence."),
  t("T14", "T14-A", "T14-A2", "Scope keeps expanding", { x: 40, y: 78 },
    "Scope creep is the real cause of the overrun. Build the firm reset: a v1 lockdown, a paid phase 2, and the customer-side decision we force in 7 days."),
  t("T14", "T14-B", "T14-B1", "Original business case is dead", { x: 60, y: 78 },
    "The business case that justified the deal no longer exists. Build the re-anchor: what outcome we will commit to instead, and how we land it without re-opening commercials."),
  t("T14", "T14-B", "T14-B2", "Sponsor lost confidence", { x: 84, y: 78 },
    "Onboarding is technically progressing but the sponsor has stopped showing up. Build the visible-win plan that earns them back into the weekly room."),
];

// ===== TREE 15 — EXECUTIVE ACCESS =====
const T15: TreeNode[] = [
  { id: "T15", treeId: "T15", label: "Executive Access", level: 1, isTerminal: false, position: { x: 50, y: 8 } },
  { id: "T15-A", treeId: "T15", parentId: "T15", label: "Cold path", level: 2, isTerminal: false, position: { x: 28, y: 38 } },
  { id: "T15-B", treeId: "T15", parentId: "T15", label: "Warm path", level: 2, isTerminal: false, position: { x: 72, y: 38 } },
  t("T15", "T15-A", "T15-A1", "New CFO, no relationship", { x: 16, y: 78 },
    "Need 20 minutes with a CFO we've never met. Build the request: the artifact that justifies the calendar slot, the sponsor who carries it in, and the agenda that earns the second meeting."),
  t("T15", "T15-A", "T15-A2", "Their exec ignores CS layer", { x: 40, y: 78 },
    "Their exec routinely refuses CS meetings. Build the bypass: which of our execs reaches in, what they say, and the trade we offer to make the calendar happen."),
  t("T15", "T15-B", "T15-B1", "Sponsor will introduce us", { x: 60, y: 78 },
    "Sponsor is willing to make the intro. Build the pre-read the sponsor forwards, the 3 lines they send with it, and the meeting frame that makes the exec want a follow-up."),
  t("T15", "T15-B", "T15-B2", "Use a customer event as a vehicle", { x: 84, y: 78 },
    "Use an upcoming event/board moment as the wedge. Build the invitation logic, the speaking role we offer, and the post-event sequence that converts attention to access."),
];

// ===== TREE 16 — PRODUCT GAP =====
const T16: TreeNode[] = [
  { id: "T16", treeId: "T16", label: "Product Gap", level: 1, isTerminal: false, position: { x: 50, y: 8 } },
  { id: "T16-A", treeId: "T16", parentId: "T16", label: "Workaround", level: 2, isTerminal: false, position: { x: 28, y: 38 } },
  { id: "T16-B", treeId: "T16", parentId: "T16", label: "Roadmap pull", level: 2, isTerminal: false, position: { x: 72, y: 38 } },
  t("T16", "T16-A", "T16-A1", "Integration gap", { x: 16, y: 78 },
    "We don't natively integrate with a system they need. Build the workaround: the partner/glue we point to, the cost they should expect, and how we hold the renewal while it's resolved."),
  t("T16", "T16-A", "T16-A2", "Reporting gap", { x: 40, y: 78 },
    "Reporting depth they need does not exist. Build the manual-bridge plan: the asset we deliver weekly, the cost-to-serve we accept, and the explicit exit when product ships it."),
  t("T16", "T16-B", "T16-B1", "Get them on a beta", { x: 60, y: 78 },
    "There is an active beta. Build the case to Product to put this customer on it: their fit, the feedback they will give, and the protection we put around them if the beta slips."),
  t("T16", "T16-B", "T16-B2", "Champion a roadmap item internally", { x: 84, y: 78 },
    "We need to push Product to prioritize this. Build the internal brief: ARR exposed, the proxy of how many other customers want it, and the decision we ask for at the next planning cycle."),
];

// ===== TREE 17 — WIN-BACK =====
const T17: TreeNode[] = [
  { id: "T17", treeId: "T17", label: "Win-Back", level: 1, isTerminal: false, position: { x: 50, y: 8 } },
  { id: "T17-A", treeId: "T17", parentId: "T17", label: "Reopen the door", level: 2, isTerminal: false, position: { x: 28, y: 38 } },
  { id: "T17-B", treeId: "T17", parentId: "T17", label: "Restage the offer", level: 2, isTerminal: false, position: { x: 72, y: 38 } },
  t("T17", "T17-A", "T17-A1", "They left for a competitor", { x: 16, y: 78 },
    "They moved to a competitor 6 months ago. Build the re-entry: what is likely already painful for them, the artifact we send, and the meeting we ask for without sounding desperate."),
  t("T17", "T17-A", "T17-A2", "They built it in-house", { x: 40, y: 78 },
    "They tried to build in-house. Build the diplomatic re-engagement: respect the build, surface the maintenance cost, and stage a narrow re-trial."),
  t("T17", "T17-B", "T17-B1", "New sponsor on their side", { x: 60, y: 78 },
    "A leader we know personally just joined them. Build the warm-restart: how the relationship enters, what we don't bring up, and the first business outcome we anchor on."),
  t("T17", "T17-B", "T17-B2", "Compelling product change since they left", { x: 84, y: 78 },
    "Our product has materially changed since they left. Build the re-pitch: the proof, the pricing posture that acknowledges history, and the path to a 90-day proof-of-value."),
];

// ===== TREE 18 — TEAM PERFORMANCE (LEADERSHIP) =====
const T18: TreeNode[] = [
  { id: "T18", treeId: "T18", label: "Team Performance", level: 1, isTerminal: false, position: { x: 50, y: 8 } },
  { id: "T18-A", treeId: "T18", parentId: "T18", label: "Individual underperformance", level: 2, isTerminal: false, position: { x: 28, y: 38 } },
  { id: "T18-B", treeId: "T18", parentId: "T18", label: "Team-level pattern", level: 2, isTerminal: false, position: { x: 72, y: 38 } },
  t("T18", "T18-A", "T18-A1", "Senior CSM stuck on the wrong book", { x: 16, y: 78 },
    "A senior CSM has the wrong book for their skills. Build the leader's plan: the conversation, the restage, and the evidence package that protects the decision."),
  t("T18", "T18-A", "T18-A2", "Hire who isn't ramping", { x: 40, y: 78 },
    "A new hire isn't ramping at the expected rate. Build the structured intervention: the 30/60 plan, the explicit success bar, and the parting-of-ways frame if it's not met."),
  t("T18", "T18-B", "T18-B1", "Whole pod's NRR slipping", { x: 60, y: 78 },
    "An entire pod's NRR has slipped two quarters in a row. Build the leader's diagnostic: book composition, sales hand-off quality, and the operating change you make this quarter."),
  t("T18", "T18-B", "T18-B2", "Attrition risk in the bench", { x: 84, y: 78 },
    "Your top two ICs are flight risks. Build the retention play: scope, comp envelope you ask for, and the visible-promotion mechanic that earns you 12 more months."),
];

// ===== TREE 19 — LEADERSHIP COMMUNICATION =====
const T19: TreeNode[] = [
  { id: "T19", treeId: "T19", label: "Leadership Communication", level: 1, isTerminal: false, position: { x: 50, y: 8 } },
  { id: "T19-A", treeId: "T19", parentId: "T19", label: "Upward", level: 2, isTerminal: false, position: { x: 28, y: 38 } },
  { id: "T19-B", treeId: "T19", parentId: "T19", label: "Outward", level: 2, isTerminal: false, position: { x: 72, y: 38 } },
  t("T19", "T19-A", "T19-A1", "Board update with bad news", { x: 16, y: 78 },
    "You owe the board a quarterly update with a churn miss. Build the structure: the headline that doesn't bury the loss, the 3 forward commitments, and the question you invite."),
  t("T19", "T19-A", "T19-A2", "CFO asking why CS exists", { x: 40, y: 78 },
    "Your CFO is openly questioning the CS investment. Build the brief: the unit economics frame, the leading indicators you commit to, and the cost-to-serve experiment you offer."),
  t("T19", "T19-B", "T19-B1", "All-hands narrative after a layoff", { x: 60, y: 78 },
    "You need an all-hands narrative the day after a layoff. Build it: what you own, the operating model going forward, and the line that re-anchors the team."),
  t("T19", "T19-B", "T19-B2", "Customer all-hands after an outage", { x: 84, y: 78 },
    "A multi-day outage requires a customer all-hands. Build the structure: the apology that doesn't grovel, the engineering commitment, and the executive-credit posture."),
];

// ===== TREE 20 — ORG DESIGN =====
const T20: TreeNode[] = [
  { id: "T20", treeId: "T20", label: "Org Design", level: 1, isTerminal: false, position: { x: 50, y: 8 } },
  { id: "T20-A", treeId: "T20", parentId: "T20", label: "Coverage model", level: 2, isTerminal: false, position: { x: 28, y: 38 } },
  { id: "T20-B", treeId: "T20", parentId: "T20", label: "Boundaries", level: 2, isTerminal: false, position: { x: 72, y: 38 } },
  t("T20", "T20-A", "T20-A1", "Named vs. pooled", { x: 16, y: 78 },
    "You're deciding named vs. pooled CSMs for the long-tail. Build the decision memo: book-segmentation thesis, the cost-to-serve math, and the migration plan."),
  t("T20", "T20-A", "T20-A2", "Onshore vs. offshore", { x: 40, y: 78 },
    "Pressure to move portions of CS offshore. Build the model: what stays onshore (relationship, exec), what moves (tier-2 ops), and the quality gates that protect NRR."),
  t("T20", "T20-B", "T20-B1", "Split CS from Implementation", { x: 60, y: 78 },
    "Time to separate CS from Implementation. Build the seam: the hand-off artifact, the shared scorecard, and the comp mechanic that keeps both honest."),
  t("T20", "T20-B", "T20-B2", "Carve out a Digital CS function", { x: 84, y: 78 },
    "Stand up a Digital CS function for the long tail. Build the charter, the headcount-to-coverage math, and the first 90 days of measurable proof."),
];

// ===== TREE 21 — SALES ALIGNMENT =====
const T21: TreeNode[] = [
  { id: "T21", treeId: "T21", label: "Sales Alignment", level: 1, isTerminal: false, position: { x: 50, y: 8 } },
  { id: "T21-A", treeId: "T21", parentId: "T21", label: "Hand-off", level: 2, isTerminal: false, position: { x: 28, y: 38 } },
  { id: "T21-B", treeId: "T21", parentId: "T21", label: "Comp & ownership", level: 2, isTerminal: false, position: { x: 72, y: 38 } },
  t("T21", "T21-A", "T21-A1", "Bad deals keep landing in CS", { x: 16, y: 78 },
    "The same shape of bad deal keeps landing in CS. Build the upstream fix: the qualification bar, the deal-review veto, and the executive sponsor who enforces it."),
  t("T21", "T21-A", "T21-A2", "AE ghosts after close", { x: 40, y: 78 },
    "AEs disengage immediately after close. Build the joint operating model: the 30-day hand-off artifact, the moments AEs must show up for, and how leadership re-signals the norm."),
  t("T21", "T21-B", "T21-B1", "Expansion ownership war", { x: 60, y: 78 },
    "CS and Sales are fighting over expansion ownership. Build the comp + ownership matrix: who owns what motion, what triggers a hand-off, and how both win on the same dollar."),
  t("T21", "T21-B", "T21-B2", "Renewals owned by Sales is failing", { x: 84, y: 78 },
    "Sales owns renewals and NRR is suffering. Build the case to move renewals to CS: the data, the comp redesign, and the transition plan that protects this fiscal year."),
];

export const NODES: TreeNode[] = [
  ...T1, ...T2, ...T3, ...T4, ...T5, ...T6, ...T7, ...T8,
  ...T9, ...T10, ...T11, ...T12, ...T13,
  ...T14, ...T15, ...T16, ...T17,
  ...T18, ...T19, ...T20, ...T21,
];

export function nodesForTree(treeId: TreeId): TreeNode[] {
  return NODES.filter((n) => n.treeId === treeId);
}

export function getNode(id: string): TreeNode | undefined {
  return NODES.find((n) => n.id === id);
}

export function breadcrumbFor(nodeId: string): string[] {
  const trail: string[] = [];
  let current = getNode(nodeId);
  while (current) {
    trail.unshift(current.label);
    current = current.parentId ? getNode(current.parentId) : undefined;
  }
  return trail;
}
