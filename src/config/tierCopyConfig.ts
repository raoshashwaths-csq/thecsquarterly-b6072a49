// Centralized tier-aware copy registry.
// Single source of truth for every feature card / paywall / gated CTA on the
// site. Each feature key has an entry for every tier state so the UI never
// falls through to "Unlocks at Practitioner" copy for a Practitioner user.
//
// To add a new card:
//   1. Add a new key here with all 7 tier states defined.
//   2. In the card component, call useTierCopy("your-key").
//   3. Render badge / headline / body / cta from the returned copy.
//
// IMPORTANT: copy only. No design, schema, or component-rename changes.

export type TierCopyKey =
  | "visitor"
  | "free"
  | "reader"
  | "practitioner"
  | "operator"
  | "team"
  | "scale";

export type BadgeVariant = "locked" | "neutral" | "active";
export type CtaVariant = "ghost" | "gold";

export type TierCopyEntry = {
  badge: string;
  badgeVariant: BadgeVariant;
  headline?: string;
  body?: string;
  cta: string;
  ctaVariant: CtaVariant;
  lockIcon: boolean;
  /** Codex individual-playbook only — show purchase affordance. */
  purchaseVisible?: boolean;
  /** Lumi only — session-state chip text. */
  sessionInfo?: string | null;
  /** Job board only — additional bonus copy. */
  bonusNote?: string;
};

export type FeatureId =
  | "codex-library"
  | "codex-individual-playbook"
  | "diagnostics"
  | "lumi"
  | "csfactors"
  | "map-engine"
  | "ebr-builder"
  | "cta-engine"
  | "community"
  | "job-board"
  | "whatsapp"
  | "expansion-engine"
  | "retention-ledger";

type FeatureConfig = Record<TierCopyKey, TierCopyEntry>;

const TIER_COPY: Record<FeatureId, FeatureConfig> = {
  // ─── CODEX PLAYBOOKS ─────────────────────────────
  "codex-library": {
    visitor: {
      badge: "PREMIUM",
      badgeVariant: "locked",
      headline: "The CS Codex",
      body: "Six practitioner playbooks covering the highest-stakes scenarios in customer success. $49 each or included with Practitioner.",
      cta: "VIEW PLAYBOOKS",
      ctaVariant: "ghost",
      lockIcon: true,
    },
    free: {
      badge: "PREMIUM",
      badgeVariant: "locked",
      headline: "The CS Codex",
      body: "Six practitioner playbooks. Purchase individually at $49 each, or upgrade to Practitioner for full library access.",
      cta: "SEE PLAYBOOKS",
      ctaVariant: "ghost",
      lockIcon: true,
    },
    reader: {
      badge: "INCLUDED",
      badgeVariant: "active",
      headline: "Your Codex Library",
      body: "All six playbooks are included with your Reader plan.",
      cta: "OPEN CODEX →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    practitioner: {
      badge: "INCLUDED",
      badgeVariant: "active",
      headline: "Your Codex Library",
      body: "All six playbooks are included with your Practitioner plan. Run any playbook directly on your portfolio.",
      cta: "OPEN CODEX →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    operator: {
      badge: "INCLUDED",
      badgeVariant: "active",
      headline: "Your Codex Library",
      body: "All six playbooks are included. Run any playbook directly on your portfolio from CSFactors.",
      cta: "OPEN CODEX →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    team: {
      badge: "INCLUDED",
      badgeVariant: "active",
      headline: "Your Codex Library",
      body: "All six playbooks included for your full team. Run and assign playbooks from CSFactors.",
      cta: "OPEN CODEX →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    scale: {
      badge: "INCLUDED",
      badgeVariant: "active",
      headline: "Your Codex Library",
      body: "All six playbooks included for your full team.",
      cta: "OPEN CODEX →",
      ctaVariant: "gold",
      lockIcon: false,
    },
  },

  "codex-individual-playbook": {
    visitor: {
      badge: "PREMIUM",
      badgeVariant: "locked",
      cta: "$49 — PURCHASE",
      ctaVariant: "ghost",
      lockIcon: true,
      purchaseVisible: true,
    },
    free: {
      badge: "PREMIUM",
      badgeVariant: "locked",
      cta: "$49 — PURCHASE",
      ctaVariant: "ghost",
      lockIcon: true,
      purchaseVisible: true,
    },
    reader: {
      badge: "INCLUDED",
      badgeVariant: "active",
      cta: "READ PLAYBOOK →",
      ctaVariant: "gold",
      lockIcon: false,
      purchaseVisible: false,
    },
    practitioner: {
      badge: "INCLUDED",
      badgeVariant: "active",
      cta: "RUN THIS PLAYBOOK →",
      ctaVariant: "gold",
      lockIcon: false,
      purchaseVisible: false,
    },
    operator: {
      badge: "INCLUDED",
      badgeVariant: "active",
      cta: "RUN THIS PLAYBOOK →",
      ctaVariant: "gold",
      lockIcon: false,
      purchaseVisible: false,
    },
    team: {
      badge: "INCLUDED",
      badgeVariant: "active",
      cta: "RUN THIS PLAYBOOK →",
      ctaVariant: "gold",
      lockIcon: false,
      purchaseVisible: false,
    },
    scale: {
      badge: "INCLUDED",
      badgeVariant: "active",
      cta: "RUN THIS PLAYBOOK →",
      ctaVariant: "gold",
      lockIcon: false,
      purchaseVisible: false,
    },
  },

  // ─── DIAGNOSTICS ─────────────────────────────────
  diagnostics: {
    visitor: {
      badge: "FREE DIAGNOSTIC",
      badgeVariant: "neutral",
      headline: "CS Intelligence Diagnostics",
      body: "Assess your team's capability across 8 operational dimensions. The AI Readiness score is free. Full blueprints require Practitioner.",
      cta: "VIEW DIAGNOSTICS",
      ctaVariant: "ghost",
      lockIcon: false,
    },
    free: {
      badge: "FREE SCORE",
      badgeVariant: "neutral",
      headline: "CS Intelligence Diagnostics",
      body: "Your score is included free. Upgrade to Practitioner to unlock the full remediation blueprint.",
      cta: "START DIAGNOSTIC",
      ctaVariant: "ghost",
      lockIcon: false,
    },
    reader: {
      badge: "INCLUDED",
      badgeVariant: "active",
      headline: "CS Intelligence Diagnostics",
      body: "All diagnostics and full blueprints included with your Reader plan.",
      cta: "START DIAGNOSTIC →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    practitioner: {
      badge: "INCLUDED",
      badgeVariant: "active",
      headline: "Your Diagnostics",
      body: "All diagnostics and full remediation blueprints included. Results sync to your CSFactors account.",
      cta: "START DIAGNOSTIC →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    operator: {
      badge: "INCLUDED",
      badgeVariant: "active",
      headline: "Your Diagnostics",
      body: "All 8 diagnostics included. Run them across your portfolio from the Expansion tab.",
      cta: "START DIAGNOSTIC →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    team: {
      badge: "INCLUDED",
      badgeVariant: "active",
      headline: "Your Diagnostics",
      body: "All 8 diagnostics available for your full team. Run portfolio-wide assessments from CSFactors.",
      cta: "START DIAGNOSTIC →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    scale: {
      badge: "INCLUDED",
      badgeVariant: "active",
      headline: "Your Diagnostics",
      body: "All diagnostics included across your organisation.",
      cta: "START DIAGNOSTIC →",
      ctaVariant: "gold",
      lockIcon: false,
    },
  },

  // ─── LUMI ────────────────────────────────────────
  lumi: {
    visitor: {
      badge: "AI ADVISOR",
      badgeVariant: "neutral",
      headline: "Lumi — Your CS Advisor",
      body: "The institutional knowledge of a 40-year CS veteran. Available at 11pm. Free accounts get 1 session per week.",
      cta: "CREATE FREE ACCOUNT",
      ctaVariant: "gold",
      lockIcon: false,
      sessionInfo: null,
    },
    free: {
      badge: "1 SESSION/WEEK",
      badgeVariant: "neutral",
      headline: "Lumi — Your CS Advisor",
      body: "You have 1 Lumi session available this week. Practitioner members get 50 sessions per month.",
      cta: "ASK LUMI →",
      ctaVariant: "gold",
      lockIcon: false,
      sessionInfo: "FREE PLAN",
    },
    reader: {
      badge: "20 SESSIONS/MONTH",
      badgeVariant: "active",
      headline: "Lumi — Your CS Advisor",
      body: "Your 20 monthly sessions cover all 21 decision trees.",
      cta: "OPEN LUMI →",
      ctaVariant: "gold",
      lockIcon: false,
      sessionInfo: "READER",
    },
    practitioner: {
      badge: "50 SESSIONS/MONTH",
      badgeVariant: "active",
      headline: "Lumi — Your CS Advisor",
      body: "Your 50 monthly sessions cover all 21 decision trees across every CS scenario.",
      cta: "OPEN LUMI →",
      ctaVariant: "gold",
      lockIcon: false,
      sessionInfo: "PRACTITIONER",
    },
    operator: {
      badge: "100 SESSIONS/MONTH",
      badgeVariant: "active",
      headline: "Lumi — Your CS Advisor",
      body: "100 monthly sessions. Proactive alerts when account signals warrant immediate attention.",
      cta: "OPEN LUMI →",
      ctaVariant: "gold",
      lockIcon: false,
      sessionInfo: "OPERATOR",
    },
    team: {
      badge: "500 SESSIONS/MONTH",
      badgeVariant: "active",
      headline: "Lumi — Your Team Advisor",
      body: "500 shared monthly sessions across your team. Shared account context across all CSMs.",
      cta: "OPEN LUMI →",
      ctaVariant: "gold",
      lockIcon: false,
      sessionInfo: "TEAM POOL",
    },
    scale: {
      badge: "2,000 SESSIONS/MONTH",
      badgeVariant: "active",
      headline: "Lumi — Your Team Advisor",
      body: "2,000 shared monthly sessions across your organisation.",
      cta: "OPEN LUMI →",
      ctaVariant: "gold",
      lockIcon: false,
      sessionInfo: "SCALE POOL",
    },
  },

  // ─── CSFACTORS ───────────────────────────────────
  csfactors: {
    visitor: {
      badge: "PRACTITIONER+",
      badgeVariant: "locked",
      headline: "CSFactors Dashboard",
      body: "The operating dashboard where intelligence becomes action. Pulse, 360 view, portfolio tracking, and all 9 PM features.",
      cta: "SEE PLANS →",
      ctaVariant: "ghost",
      lockIcon: true,
    },
    free: {
      badge: "PRACTITIONER+",
      badgeVariant: "locked",
      headline: "CSFactors Dashboard",
      body: "Unlock your CS operating dashboard. Upgrade to Practitioner to access Pulse, health scoring, and portfolio management.",
      cta: "UPGRADE TO PRACTITIONER →",
      ctaVariant: "gold",
      lockIcon: true,
    },
    reader: {
      badge: "UPGRADE TO ACCESS",
      badgeVariant: "locked",
      headline: "CSFactors Dashboard",
      body: "Your Reader plan includes the full editorial layer. Add the operating dashboard by upgrading to Practitioner for $20 more per month.",
      cta: "UPGRADE TO PRACTITIONER →",
      ctaVariant: "gold",
      lockIcon: true,
    },
    practitioner: {
      badge: "ACTIVE",
      badgeVariant: "active",
      headline: "Your CSFactors Dashboard",
      body: "Pulse, 360 view, MAP Engine, and full portfolio management. Your operating layer is live.",
      cta: "OPEN CSFACTORS →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    operator: {
      badge: "ACTIVE",
      badgeVariant: "active",
      headline: "Your CSFactors Dashboard",
      body: "Full access including EBR Builder, Risk Register, Renewal War Room, and all advanced PM features.",
      cta: "OPEN CSFACTORS →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    team: {
      badge: "TEAM ACTIVE",
      badgeVariant: "active",
      headline: "Your Team Dashboard",
      body: "Team Pulse, shared CTAs, and all PM features active across your team.",
      cta: "OPEN CSFACTORS →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    scale: {
      badge: "ORG ACTIVE",
      badgeVariant: "active",
      headline: "Your CSFactors Dashboard",
      body: "Organisation-wide access with SSO, white-label reports, and 2,000 monthly Lumi sessions.",
      cta: "OPEN CSFACTORS →",
      ctaVariant: "gold",
      lockIcon: false,
    },
  },

  // ─── MAP ENGINE ──────────────────────────────────
  "map-engine": {
    visitor: {
      badge: "PRACTITIONER+",
      badgeVariant: "locked",
      headline: "MAP Engine",
      body: "Mutual Action Plans that live in CSFactors. Share them with customers. Track milestones. Measure TTV.",
      cta: "SEE PLANS →",
      ctaVariant: "ghost",
      lockIcon: true,
    },
    free: {
      badge: "PRACTITIONER+",
      badgeVariant: "locked",
      headline: "MAP Engine",
      body: "Create customer-facing action plans and track time-to-value. Included in Practitioner and above.",
      cta: "UPGRADE →",
      ctaVariant: "ghost",
      lockIcon: true,
    },
    reader: {
      badge: "UPGRADE TO ACCESS",
      badgeVariant: "locked",
      headline: "MAP Engine",
      body: "Mutual Action Plans are included in Practitioner and above.",
      cta: "UPGRADE TO PRACTITIONER →",
      ctaVariant: "ghost",
      lockIcon: true,
    },
    practitioner: {
      badge: "ACTIVE",
      badgeVariant: "active",
      headline: "MAP Engine",
      body: "Create and share Mutual Action Plans. Up to 5 active MAPs on your Practitioner plan.",
      cta: "OPEN MAP ENGINE →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    operator: {
      badge: "ACTIVE",
      badgeVariant: "active",
      headline: "MAP Engine",
      body: "Unlimited active MAPs. Customer share links. TTV tracking against Retention Ledger benchmarks.",
      cta: "OPEN MAP ENGINE →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    team: {
      badge: "TEAM ACTIVE",
      badgeVariant: "active",
      headline: "MAP Engine",
      body: "Unlimited MAPs across your team. Shared visibility into all active account plans.",
      cta: "OPEN MAP ENGINE →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    scale: {
      badge: "ORG ACTIVE",
      badgeVariant: "active",
      headline: "MAP Engine",
      body: "Unlimited MAPs across your organisation.",
      cta: "OPEN MAP ENGINE →",
      ctaVariant: "gold",
      lockIcon: false,
    },
  },

  // ─── EBR BUILDER ─────────────────────────────────
  "ebr-builder": {
    visitor: {
      badge: "OPERATOR+",
      badgeVariant: "locked",
      headline: "EBR Builder",
      body: "AI-generated Executive Business Reviews. Lumi writes them from your CSFactors data in under 4 minutes.",
      cta: "SEE PLANS →",
      ctaVariant: "ghost",
      lockIcon: true,
    },
    free: {
      badge: "OPERATOR+",
      badgeVariant: "locked",
      headline: "EBR Builder",
      body: "Generate board-ready EBRs automatically. Included in Operator and above.",
      cta: "UPGRADE →",
      ctaVariant: "ghost",
      lockIcon: true,
    },
    reader: {
      badge: "OPERATOR+",
      badgeVariant: "locked",
      headline: "EBR Builder",
      body: "AI-generated Executive Business Reviews. Included in Operator and above.",
      cta: "UPGRADE TO OPERATOR →",
      ctaVariant: "ghost",
      lockIcon: true,
    },
    practitioner: {
      badge: "OPERATOR+",
      badgeVariant: "locked",
      headline: "EBR Builder",
      body: "Generate board-ready EBRs from your CSFactors data. Upgrade to Operator to unlock.",
      cta: "UPGRADE TO OPERATOR →",
      ctaVariant: "ghost",
      lockIcon: true,
    },
    operator: {
      badge: "ACTIVE",
      badgeVariant: "active",
      headline: "EBR Builder",
      body: "Lumi generates complete EBRs from your CSFactors data. Share with customers or download as PDF.",
      cta: "CREATE AN EBR →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    team: {
      badge: "TEAM ACTIVE",
      badgeVariant: "active",
      headline: "EBR Builder",
      body: "Team EBR generation. Track which accounts have received reviews and when they're due.",
      cta: "CREATE AN EBR →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    scale: {
      badge: "ORG ACTIVE",
      badgeVariant: "active",
      headline: "EBR Builder",
      body: "Organisation-wide EBR generation with white-label export.",
      cta: "CREATE AN EBR →",
      ctaVariant: "gold",
      lockIcon: false,
    },
  },

  // ─── CTA ENGINE ──────────────────────────────────
  "cta-engine": {
    visitor: {
      badge: "PRACTITIONER+",
      badgeVariant: "locked",
      headline: "Action Centre",
      body: "Native CTA management that replaces the Notion boards and Salesforce task hacks. Raise, assign, and track account actions.",
      cta: "SEE PLANS →",
      ctaVariant: "ghost",
      lockIcon: true,
    },
    free: {
      badge: "PRACTITIONER+",
      badgeVariant: "locked",
      headline: "Action Centre",
      body: "Native action management for CS teams. Included in Practitioner and above.",
      cta: "UPGRADE →",
      ctaVariant: "ghost",
      lockIcon: true,
    },
    reader: {
      badge: "UPGRADE TO ACCESS",
      badgeVariant: "locked",
      headline: "Action Centre",
      body: "Raise and track CTAs against your accounts. Included in Practitioner and above.",
      cta: "UPGRADE TO PRACTITIONER →",
      ctaVariant: "ghost",
      lockIcon: true,
    },
    practitioner: {
      badge: "ACTIVE",
      badgeVariant: "active",
      headline: "Your Action Centre",
      body: "Raise, track, and close CTAs from Pulse or any account view. Lumi pushes actions here automatically.",
      cta: "OPEN ACTION CENTRE →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    operator: {
      badge: "ACTIVE",
      badgeVariant: "active",
      headline: "Your Action Centre",
      body: "Full CTA management with Kanban board view, Lumi integration, and WhatsApp CTA raise.",
      cta: "OPEN ACTION CENTRE →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    team: {
      badge: "TEAM ACTIVE",
      badgeVariant: "active",
      headline: "Team Action Centre",
      body: "Assign CTAs across your team. Track completion rates and overdue actions per CSM.",
      cta: "OPEN ACTION CENTRE →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    scale: {
      badge: "ORG ACTIVE",
      badgeVariant: "active",
      headline: "Team Action Centre",
      body: "Organisation-wide CTA management and reporting.",
      cta: "OPEN ACTION CENTRE →",
      ctaVariant: "gold",
      lockIcon: false,
    },
  },

  // ─── COMMUNITY ───────────────────────────────────
  community: {
    visitor: {
      badge: "READER+",
      badgeVariant: "locked",
      headline: "The Vanguard Community",
      body: "A private community for CS practitioners who take the practice seriously. Reader plan and above.",
      cta: "START FREE →",
      ctaVariant: "ghost",
      lockIcon: true,
    },
    free: {
      badge: "READER+",
      badgeVariant: "locked",
      headline: "The Vanguard Community",
      body: "Join the private CS Quarterly community. Upgrade to Reader to access.",
      cta: "UPGRADE TO READER →",
      ctaVariant: "ghost",
      lockIcon: true,
    },
    reader: {
      badge: "INCLUDED",
      badgeVariant: "active",
      headline: "The Vanguard Community",
      body: "You have full access to the CS Quarterly community. General and CS Ops spaces are open.",
      cta: "JOIN THE COMMUNITY →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    practitioner: {
      badge: "INCLUDED",
      badgeVariant: "active",
      headline: "The Vanguard Community",
      body: "Full access including the Practitioner-only space and Resident Expert AMAs.",
      cta: "OPEN COMMUNITY →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    operator: {
      badge: "INCLUDED",
      badgeVariant: "active",
      headline: "The Vanguard Community",
      body: "All spaces including the VP & Director forum.",
      cta: "OPEN COMMUNITY →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    team: {
      badge: "TEAM INCLUDED",
      badgeVariant: "active",
      headline: "The Vanguard Community",
      body: "Full community access for your team, including team discussion spaces.",
      cta: "OPEN COMMUNITY →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    scale: {
      badge: "INCLUDED",
      badgeVariant: "active",
      headline: "The Vanguard Community",
      body: "Full community access across your organisation.",
      cta: "OPEN COMMUNITY →",
      ctaVariant: "gold",
      lockIcon: false,
    },
  },

  // ─── JOB BOARD ───────────────────────────────────
  "job-board": {
    visitor: {
      badge: "FREE TO BROWSE",
      badgeVariant: "neutral",
      headline: "CS Jobs",
      body: "CS leadership and practitioner roles curated from the best operators in the market.",
      cta: "BROWSE JOBS →",
      ctaVariant: "ghost",
      lockIcon: false,
    },
    free: {
      badge: "FREE TO BROWSE",
      badgeVariant: "neutral",
      headline: "CS Jobs",
      body: "Browse all live CS roles. Upgrade to Practitioner to set up job alerts.",
      cta: "BROWSE JOBS →",
      ctaVariant: "ghost",
      lockIcon: false,
    },
    reader: {
      badge: "INCLUDED",
      badgeVariant: "active",
      headline: "CS Jobs",
      body: "Browse all roles and set up job alerts for your criteria.",
      cta: "BROWSE JOBS →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    practitioner: {
      badge: "INCLUDED",
      badgeVariant: "active",
      headline: "CS Jobs",
      body: "Full access including job alerts. You also get 1 free job posting credit per quarter.",
      cta: "BROWSE JOBS →",
      ctaVariant: "gold",
      lockIcon: false,
      bonusNote: "1 FREE POSTING/QUARTER",
    },
    operator: {
      badge: "INCLUDED",
      badgeVariant: "active",
      headline: "CS Jobs",
      body: "Full browse access plus 2 free posting credits per quarter for your open roles.",
      cta: "BROWSE JOBS →",
      ctaVariant: "gold",
      lockIcon: false,
      bonusNote: "2 FREE POSTINGS/QUARTER",
    },
    team: {
      badge: "INCLUDED",
      badgeVariant: "active",
      headline: "CS Jobs",
      body: "Full browse access plus 3 posting credits per quarter.",
      cta: "BROWSE JOBS →",
      ctaVariant: "gold",
      lockIcon: false,
      bonusNote: "3 FREE POSTINGS/QUARTER",
    },
    scale: {
      badge: "INCLUDED",
      badgeVariant: "active",
      headline: "CS Jobs",
      body: "Full access including priority job listing placement.",
      cta: "BROWSE JOBS →",
      ctaVariant: "gold",
      lockIcon: false,
    },
  },

  // ─── WHATSAPP ────────────────────────────────────
  whatsapp: {
    visitor: {
      badge: "PRACTITIONER+",
      badgeVariant: "locked",
      headline: "WhatsApp Integration",
      body: "Update health scores, raise CTAs, and query Lumi from WhatsApp. Renewal alerts sent to your phone.",
      cta: "SEE PLANS →",
      ctaVariant: "ghost",
      lockIcon: true,
    },
    free: {
      badge: "PRACTITIONER+",
      badgeVariant: "locked",
      headline: "WhatsApp Integration",
      body: "Connect CSFactors to WhatsApp. Included in Practitioner and above.",
      cta: "UPGRADE →",
      ctaVariant: "ghost",
      lockIcon: true,
    },
    reader: {
      badge: "UPGRADE TO ACCESS",
      badgeVariant: "locked",
      headline: "WhatsApp Integration",
      body: "Connect CSFactors to WhatsApp. Included in Practitioner and above.",
      cta: "UPGRADE TO PRACTITIONER →",
      ctaVariant: "ghost",
      lockIcon: true,
    },
    practitioner: {
      badge: "AVAILABLE",
      badgeVariant: "active",
      headline: "WhatsApp Integration",
      body: "Connect your WhatsApp to CSFactors. Update health scores and raise CTAs without opening a browser.",
      cta: "CONNECT WHATSAPP →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    operator: {
      badge: "AVAILABLE",
      badgeVariant: "active",
      headline: "WhatsApp Integration",
      body: "Full WhatsApp integration including renewal alerts, Lumi queries, and post-meeting capture.",
      cta: "CONNECT WHATSAPP →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    team: {
      badge: "TEAM AVAILABLE",
      badgeVariant: "active",
      headline: "WhatsApp Integration",
      body: "Team-wide WhatsApp alerts. Each CSM connects individually from their account settings.",
      cta: "CONNECT WHATSAPP →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    scale: {
      badge: "AVAILABLE",
      badgeVariant: "active",
      headline: "WhatsApp Integration",
      body: "Full integration available for all team members.",
      cta: "CONNECT WHATSAPP →",
      ctaVariant: "gold",
      lockIcon: false,
    },
  },

  // ─── EXPANSION ENGINE ────────────────────────────
  "expansion-engine": {
    visitor: {
      badge: "OPERATOR+",
      badgeVariant: "locked",
      headline: "Expansion Engine",
      body: "Live expansion readiness scoring across every account. Know which accounts are ready to expand before you ask.",
      cta: "SEE PLANS →",
      ctaVariant: "ghost",
      lockIcon: true,
    },
    free: {
      badge: "OPERATOR+",
      badgeVariant: "locked",
      headline: "Expansion Engine",
      body: "Expansion readiness scoring per account. Included in Operator and above.",
      cta: "UPGRADE →",
      ctaVariant: "ghost",
      lockIcon: true,
    },
    reader: {
      badge: "OPERATOR+",
      badgeVariant: "locked",
      headline: "Expansion Engine",
      body: "Live expansion scoring across your portfolio. Included in Operator and above.",
      cta: "UPGRADE TO OPERATOR →",
      ctaVariant: "ghost",
      lockIcon: true,
    },
    practitioner: {
      badge: "OPERATOR+",
      badgeVariant: "locked",
      headline: "Expansion Engine",
      body: "Live expansion readiness scoring. Upgrade to Operator to unlock.",
      cta: "UPGRADE TO OPERATOR →",
      ctaVariant: "ghost",
      lockIcon: true,
    },
    operator: {
      badge: "ACTIVE",
      badgeVariant: "active",
      headline: "Expansion Engine",
      body: "Live readiness scoring across all 4 expansion motions for every account in your portfolio.",
      cta: "VIEW EXPANSION SIGNALS →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    team: {
      badge: "TEAM ACTIVE",
      badgeVariant: "active",
      headline: "Expansion Engine",
      body: "Team-wide expansion signals. Gap Closer digest shows which accounts are one condition from Green.",
      cta: "VIEW EXPANSION SIGNALS →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    scale: {
      badge: "ORG ACTIVE",
      badgeVariant: "active",
      headline: "Expansion Engine",
      body: "Organisation-wide expansion tracking with Expansion Performance reporting.",
      cta: "VIEW EXPANSION SIGNALS →",
      ctaVariant: "gold",
      lockIcon: false,
    },
  },

  // ─── RETENTION LEDGER ────────────────────────────
  "retention-ledger": {
    visitor: {
      badge: "PRACTITIONER+",
      badgeVariant: "locked",
      headline: "The Retention Ledger",
      body: "Live benchmarks from 500+ CS organisations. See where your NRR, TTV, and team structure stands vs. peers.",
      cta: "SEE PLANS →",
      ctaVariant: "ghost",
      lockIcon: true,
    },
    free: {
      badge: "PRACTITIONER+",
      badgeVariant: "locked",
      headline: "The Retention Ledger",
      body: "Full benchmark dataset included in Practitioner and above.",
      cta: "UPGRADE →",
      ctaVariant: "ghost",
      lockIcon: true,
    },
    reader: {
      badge: "INCLUDED",
      badgeVariant: "active",
      headline: "The Retention Ledger",
      body: "Full benchmark access included with your Reader plan.",
      cta: "VIEW BENCHMARKS →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    practitioner: {
      badge: "INCLUDED",
      badgeVariant: "active",
      headline: "The Retention Ledger",
      body: "Full benchmark access. Your CSFactors data is overlaid on the Retention Ledger automatically.",
      cta: "VIEW BENCHMARKS →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    operator: {
      badge: "INCLUDED",
      badgeVariant: "active",
      headline: "The Retention Ledger",
      body: "Full benchmark access with portfolio overlay and quarterly PDF reports.",
      cta: "VIEW BENCHMARKS →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    team: {
      badge: "INCLUDED",
      badgeVariant: "active",
      headline: "The Retention Ledger",
      body: "Team benchmarking with segment-specific peer comparison.",
      cta: "VIEW BENCHMARKS →",
      ctaVariant: "gold",
      lockIcon: false,
    },
    scale: {
      badge: "INCLUDED",
      badgeVariant: "active",
      headline: "The Retention Ledger",
      body: "Full benchmark access including white-label quarterly reports.",
      cta: "VIEW BENCHMARKS →",
      ctaVariant: "gold",
      lockIcon: false,
    },
  },
};

export default TIER_COPY;
