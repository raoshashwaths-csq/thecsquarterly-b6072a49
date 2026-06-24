// Feature glossary — operator-grade, full definitions (longer than the
// inline acronym tooltips in src/lib/glossary.ts).

export type GlossaryItem = {
  id: string;
  term: string;
  short: string;
  definition?: string;
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
    link: { label: "Run the diagnostic", to: "/diagnostics/ai-readiness" },
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
  // ===== Financial & Revenue =====
  {
    id: "expansion-mrr",
    term: "Expansion MRR / ARR Rate",
    short: "Velocity at which existing accounts buy add-ons, seats, or premium tiers.",
    definition:
      "Tracks recurring revenue added inside the install base through upsell, cross-sell, seat growth, and tier upgrades — the engine behind NRR above 100%.",
    formula: "Expansion Rate = Expansion MRR in period ÷ Starting MRR",
    whyItMatters: "It is the only retention lever that grows the number rather than defending it.",
    tags: ["expansion", "upsell", "revenue", "mrr", "arr"],
  },
  {
    id: "contraction-arr",
    term: "Contraction (Downsell) ARR",
    short: "Contract value lost to downgrades or seat reductions without full cancellation.",
    definition:
      "The silent killer of NRR: customers who stay but shrink. Tracked separately from churn so you can attack the root cause (value gap, budget pressure, exec change).",
    formula: "Contraction ARR = Σ (Prior ARR − New ARR) for non-churned downgrades",
    tags: ["contraction", "downsell", "arr"],
  },
  {
    id: "mrr-churn",
    term: "MRR Churn",
    short: "Recurring revenue lost month-over-month from cancellations.",
    definition: "The monthly read on revenue leaving the system entirely — distinct from contraction.",
    formula: "MRR Churn = Lost MRR in month ÷ Starting MRR",
    tags: ["churn", "mrr", "revenue"],
  },
  {
    id: "arr-churn",
    term: "ARR Churn",
    short: "Recurring revenue lost year-over-year from cancellations.",
    definition: "Annual equivalent of MRR churn — the headline number boards look at.",
    formula: "ARR Churn = Lost ARR in year ÷ Starting ARR",
    tags: ["churn", "arr", "revenue"],
  },
  {
    id: "ltv",
    term: "Customer Lifetime Value (CLV / LTV)",
    short: "Projected gross revenue across a customer's full tenure.",
    definition: "Used to size acquisition spend, segment investment, and model long-term unit economics.",
    formula: "LTV = ARPA × Gross Margin ÷ Customer Churn Rate",
    tags: ["ltv", "clv", "lifetime", "revenue"],
  },
  {
    id: "ltv-cac",
    term: "LTV : CAC Ratio",
    short: "Lifetime value divided by cost to acquire — the unit-economics scoreboard.",
    definition: "Captures whether the business is creating more value than it spends to land a customer.",
    formula: "LTV : CAC = LTV ÷ CAC  (healthy ≥ 3:1)",
    whyItMatters: "Below 3:1 you are buying revenue; above 5:1 you are likely under-investing in growth.",
    tags: ["ltv", "cac", "unit economics"],
  },
  {
    id: "arpa",
    term: "Average Revenue Per Account (ARPA)",
    short: "Mean recurring revenue per customer.",
    definition: "Used to segment high-value accounts from volume accounts and to size CSM coverage models.",
    formula: "ARPA = Total Recurring Revenue ÷ Number of Accounts",
    tags: ["arpa", "revenue", "segmentation"],
  },
  {
    id: "acv",
    term: "Annual Contract Value (ACV)",
    short: "Annualized revenue of a single subscription contract.",
    definition: "Normalizes multi-year deals to a single year so deals of different lengths are comparable.",
    formula: "ACV = Total Contract Value ÷ Contract Term (years)",
    tags: ["acv", "contract", "revenue"],
  },
  // ===== Churn & Retention =====
  {
    id: "logo-churn",
    term: "Logo Churn Rate",
    short: "Percentage of customer accounts that cancel in a period.",
    definition: "Counts accounts, not dollars — the cleanest read on whether the product is sticky for the typical customer.",
    formula: "Logo Churn = Logos Lost in period ÷ Logos at Start of period",
    tags: ["churn", "logo", "retention"],
  },
  {
    id: "logo-retention",
    term: "Logo Retention Rate",
    short: "Inverse of logo churn — share of customers retained.",
    formula: "Logo Retention = 1 − Logo Churn Rate",
    definition: "The simple positive framing of logo churn, useful in board narrative.",
    tags: ["retention", "logo"],
  },
  {
    id: "atr",
    term: "Available to Renew (ATR) Retention",
    short: "Retention measured only against contracts up for renewal in the window.",
    definition:
      "Strips out accounts that weren't actually decisioning in the period. The most honest read on renewal performance.",
    formula: "ATR Retention = Renewed ARR ÷ ARR Available to Renew in period",
    tags: ["atr", "renewal", "retention"],
  },
  {
    id: "voluntary-churn",
    term: "Voluntary Churn Rate",
    short: "Cancellations driven by customer choice.",
    definition: "Signals product fit, value realization, or competitive loss — addressable by CS.",
    tags: ["churn", "voluntary"],
  },
  {
    id: "involuntary-churn",
    term: "Involuntary Churn Rate",
    short: "Cancellations caused by payment failures or bankruptcies.",
    definition: "Largely an ops + finance problem (dunning, card updaters) rather than CS.",
    tags: ["churn", "involuntary", "payments"],
  },
  {
    id: "cohort-retention",
    term: "Cohort Retention Rate",
    short: "Retention curve of customers who signed in the same period.",
    definition: "Surfaces whether retention is improving or decaying generation over generation.",
    tags: ["cohort", "retention"],
  },
  {
    id: "renewal-rate",
    term: "Account Renewal Rate",
    short: "Share of expiring contracts that execute a renewal.",
    formula: "Renewal Rate = Renewed Accounts ÷ Accounts Eligible to Renew",
    definition: "Transaction-level read on renewal motion health.",
    tags: ["renewal", "retention"],
  },
  {
    id: "early-churn",
    term: "Early Churn Rate",
    short: "Customers who churn inside the first 90–180 days.",
    definition: "Almost always a broken onboarding or mis-sold deal — distinct root cause from late-tenure churn.",
    tags: ["churn", "onboarding", "early"],
  },
  // ===== Adoption & Engagement =====
  {
    id: "dau-mau",
    term: "DAU / MAU Stickiness Ratio",
    short: "Daily active users divided by monthly active users.",
    formula: "Stickiness = DAU ÷ MAU",
    definition: "Higher ratios mean the product is part of daily workflow rather than occasional use.",
    tags: ["dau", "mau", "stickiness", "engagement"],
  },
  {
    id: "feature-adoption",
    term: "Feature Adoption Rate (Breadth)",
    short: "Share of active users using a specific feature.",
    formula: "Adoption = Users of Feature ÷ Total Active Users",
    tags: ["adoption", "feature", "breadth"],
  },
  {
    id: "feature-depth",
    term: "Feature Depth",
    short: "How intensely power users engage with high-value workflows.",
    definition: "Counts repeated, advanced use rather than first-touch — the real signal of stickiness.",
    tags: ["feature", "depth", "power users"],
  },
  {
    id: "license-utilization",
    term: "License Utilization Rate",
    short: "Share of paid seats that are actually active.",
    formula: "Utilization = Active Seats ÷ Provisioned Seats",
    whyItMatters: "Low utilization is the loudest renewal-risk signal in seat-based SaaS.",
    tags: ["license", "utilization", "seats"],
  },
  {
    id: "user-activation",
    term: "User Activation Rate",
    short: "Share of new users hitting an initial usage milestone.",
    definition: "The leading indicator of onboarding success at the user (not account) level.",
    tags: ["activation", "onboarding"],
  },
  {
    id: "session-duration",
    term: "Product Session Duration",
    short: "Average time per active session inside the product.",
    definition: "Directional only — combine with workflow completion to avoid rewarding aimless time-in-app.",
    tags: ["session", "engagement"],
  },
  {
    id: "workflow-completion",
    term: "Core Workflow Completion Rate",
    short: "Share of started high-value workflows that finish.",
    definition: "Tracks whether users get to the outcome the product was bought for — a true value signal.",
    tags: ["workflow", "completion", "value"],
  },
  {
    id: "multi-module",
    term: "Multi-Product / Module Adoption Index",
    short: "Number of distinct modules an account uses in parallel.",
    definition: "Multi-module accounts churn dramatically less than single-module ones — track and drive it.",
    tags: ["multi-product", "adoption", "modules"],
  },
  {
    id: "session-frequency",
    term: "Session Frequency per User",
    short: "Average sessions per user over 7- or 30-day windows.",
    definition: "Frequency is a stronger habit signal than session duration.",
    tags: ["session", "frequency"],
  },
  {
    id: "guide-completion",
    term: "In-App Guide Completion Rate",
    short: "Share of users finishing in-app walkthroughs.",
    definition: "Diagnostic for self-serve onboarding quality and content placement.",
    tags: ["onboarding", "guides", "in-app"],
  },
  // ===== Sentiment & Experience =====
  {
    id: "nps-relationship",
    term: "NPS — Relationship",
    short: "Periodic survey of overall customer affinity and referral likelihood.",
    formula: "NPS = % Promoters − % Detractors  (scale 0–10)",
    tags: ["nps", "sentiment", "relationship"],
  },
  {
    id: "nps-transactional",
    term: "NPS — Transactional",
    short: "Survey fired immediately after a defined event or milestone.",
    definition: "Captures sentiment when memory is fresh — better signal for moment-specific changes.",
    tags: ["nps", "transactional", "survey"],
  },
  {
    id: "csat",
    term: "Customer Satisfaction Score (CSAT)",
    short: "Short-term satisfaction check after a specific interaction.",
    formula: "CSAT = Satisfied Responses ÷ Total Responses",
    tags: ["csat", "sentiment", "support"],
  },
  {
    id: "ces",
    term: "Customer Effort Score (CES)",
    short: "How easy or hard it was for the customer to get something done.",
    definition: "High effort predicts churn even when satisfaction is fine — friction compounds.",
    tags: ["ces", "effort", "experience"],
  },
  {
    id: "composite-health",
    term: "Composite Customer Health Score",
    short: "Single index blending usage, sentiment, and support signals.",
    definition: "Operational dashboard read that gives CSMs one number to triage portfolios by.",
    tags: ["health", "composite", "score"],
  },
  {
    id: "survey-response",
    term: "Survey Response Rate",
    short: "Share of surveyed users who reply.",
    definition: "Low response is itself a health signal — apathetic accounts don't fill in feedback.",
    tags: ["survey", "response", "feedback"],
  },
  {
    id: "sentiment-trajectory",
    term: "Customer Sentiment Trajectory",
    short: "AI-classified trend across emails, calls, and tickets.",
    definition: "Captures direction of feeling over time — far more predictive than any single score.",
    tags: ["sentiment", "ai", "trajectory"],
  },
  // ===== Onboarding & Value =====
  {
    id: "aha-moment",
    term: "Time to First Aha Moment",
    short: "Time to the specific event where users recognize the product's value.",
    definition: "More granular than TTV — focused on the user-level moment of realization.",
    tags: ["aha", "value", "onboarding"],
  },
  {
    id: "onboarding-velocity",
    term: "Onboarding Milestone Velocity",
    short: "Average time taken to clear each structured onboarding phase.",
    definition: "Surfaces which phase (data, config, training) is slowing time-to-value.",
    tags: ["onboarding", "milestone"],
  },
  {
    id: "impl-variance",
    term: "Implementation Time vs. Estimated",
    short: "Variance between projected and actual deployment time.",
    definition: "Persistent overruns mean scoping is broken or PS capacity is mismatched.",
    tags: ["implementation", "variance", "services"],
  },
  {
    id: "signature-to-kickoff",
    term: "Time from Signature to Kickoff",
    short: "Days between contract signature and CS kickoff call.",
    whyItMatters: "Every dead day here erodes momentum and TTV — usually a handoff process problem.",
    tags: ["handoff", "kickoff", "onboarding"],
  },
  {
    id: "phase-exit",
    term: "Onboarding Phase Exit Rate",
    short: "Share of accounts graduating onboarding on schedule.",
    definition: "Direct read on whether the onboarding factory is running at design speed.",
    tags: ["onboarding", "exit", "graduation"],
  },
  {
    id: "self-reported-value",
    term: "Self-Reported Value Realization Score",
    short: "Customer confirmation that pre-sale business objectives were met.",
    definition: "The honest mirror to product telemetry — captures the buyer's own scorecard.",
    tags: ["value", "realization", "outcomes"],
  },
  // ===== Ops & Team =====
  {
    id: "arr-per-csm",
    term: "ARR per CSM",
    short: "Total ARR managed by one Customer Success Manager.",
    formula: "ARR per CSM = Total Managed ARR ÷ Number of CSMs",
    tags: ["csm", "arr", "capacity"],
  },
  {
    id: "accounts-per-csm",
    term: "Account Load per CSM",
    short: "Number of distinct accounts assigned to one CSM.",
    definition: "Balances against ARR per CSM to size coverage models correctly.",
    tags: ["csm", "accounts", "capacity"],
  },
  {
    id: "cost-to-serve",
    term: "Customer Cost-to-Serve (CTS)",
    short: "Fully loaded cost of maintaining an account.",
    definition: "Combines CSM, support, PS, and infra costs — the input to true gross margin per customer.",
    tags: ["cost", "margin", "ops"],
  },
  {
    id: "ticket-escalation",
    term: "Support Ticket Escalation Volume",
    short: "Count of high-priority tickets from an account.",
    definition: "Sustained spikes signal product friction or implementation debt — not just one bad week.",
    tags: ["support", "escalation", "tickets"],
  },
  {
    id: "art",
    term: "Average Ticket Resolution Time (ART)",
    short: "How fast priority tickets get closed.",
    formula: "ART = Σ Resolution Time ÷ Number of Tickets Closed",
    tags: ["support", "resolution", "art"],
  },
  {
    id: "sponsor-turnover",
    term: "Executive Sponsor Turnover Rate",
    short: "Rate at which primary stakeholders leave client accounts.",
    whyItMatters: "Sponsor change is one of the highest-correlation churn predictors in B2B SaaS.",
    tags: ["sponsor", "turnover", "stakeholder"],
  },
  {
    id: "qbr-completion",
    term: "QBR / Success Connect Completion Rate",
    short: "Share of assigned accounts that actually complete planned QBRs.",
    definition: "Cadence integrity check — what's planned vs. what's delivered.",
    tags: ["qbr", "ebr", "cadence"],
  },
  {
    id: "expansion-velocity",
    term: "Expansion Pipeline Velocity",
    short: "Average days from CSM-flagged expansion lead to closed deal.",
    definition: "Bottleneck diagnostic for the CS-to-Sales handoff on expansion plays.",
    tags: ["expansion", "pipeline", "velocity"],
  },
];

export function filterGlossary(items: GlossaryItem[], query: string): GlossaryItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((it) => {
    const haystack = [it.term, it.short, it.definition ?? "", it.whyItMatters ?? "", ...(it.tags ?? [])]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

