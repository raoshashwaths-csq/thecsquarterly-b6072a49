import type { CSAccount } from "@/lib/csfactors.functions";

export type PortfolioInsight = {
  accountId: string;
  accountName: string;
  arr: number;
  reason: string;
  nextStep: string;
  severity: "high" | "medium" | "low";
};

export type PlaybookRunResult = {
  headline: string;
  guidance: string;
  insights: PortfolioInsight[];
};

const fmtMoney = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`;

function withinDays(dateStr: string | null | undefined, days: number): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr).getTime();
  if (Number.isNaN(d)) return false;
  const diff = (d - Date.now()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= days;
}

function severityFromHealth(h: number): "high" | "medium" | "low" {
  if (h < 50) return "high";
  if (h < 70) return "medium";
  return "low";
}

type Runner = (accounts: CSAccount[]) => PlaybookRunResult;

const NO_MATCH = (headline: string, guidance: string): PlaybookRunResult => ({
  headline,
  guidance,
  insights: [],
});

export const PLAYBOOK_RUNNERS: Record<string, Runner> = {
  "renewal-conversation-backwards": (accounts) => {
    const matched = accounts
      .filter((a) => withinDays(a.contract_renewal_date, 120))
      .sort((a, b) => (a.contract_renewal_date! < b.contract_renewal_date! ? -1 : 1));
    return {
      headline: `${matched.length} renewal conversation${matched.length === 1 ? "" : "s"} land in the next 120 days`,
      guidance:
        "Rule 5: open the evidence call on the second-to-last meeting. Lead with the outcome number, not the question.",
      insights: matched.map((a) => ({
        accountId: a.id,
        accountName: a.name,
        arr: a.arr,
        reason: `Renewal on ${a.contract_renewal_date?.slice(0, 10)} · health ${a.health}/100 · ${fmtMoney(a.arr)} ARR`,
        nextStep:
          a.health < 60
            ? "Run the Gap Acknowledgment before they name the friction."
            : "Draft the Evidence Statement: one outcome number they did not have 12 months ago.",
        severity: severityFromHealth(a.health),
      })),
    };
  },

  "feature-request-never-built": (accounts) => {
    const matched = accounts.filter(
      (a) => (a.notes ?? "").toLowerCase().match(/feature|request|roadmap|gap/) || a.health < 65,
    );
    return {
      headline: `${matched.length} account${matched.length === 1 ? "" : "s"} carrying an open product expectation`,
      guidance:
        "Confirm the product decision in writing, then deliver the answer in the first sentence — with a genuine alternative path.",
      insights: matched.slice(0, 12).map((a) => ({
        accountId: a.id,
        accountName: a.name,
        arr: a.arr,
        reason: a.notes
          ? `Notes mention an open expectation · health ${a.health}/100`
          : `Health ${a.health}/100 — likely carrying unspoken product friction`,
        nextStep: "Get a current answer from product. Schedule the honest conversation this week.",
        severity: severityFromHealth(a.health),
      })),
    };
  },

  "champion-leaves-48-hours": (accounts) => {
    const matched = accounts.filter(
      (a) => !a.champion || a.champion.trim() === "" || a.csm_sentiment === "Critical",
    );
    return {
      headline: `${matched.length} account${matched.length === 1 ? "" : "s"} with a fragile or missing champion`,
      guidance:
        "Start the 48-hour clock. Hours 0–8: intelligence + departing-champion outreach. Hours 24–48: meet the new stakeholder.",
      insights: matched.slice(0, 15).map((a) => ({
        accountId: a.id,
        accountName: a.name,
        arr: a.arr,
        reason: !a.champion
          ? `No named champion on file · ${fmtMoney(a.arr)} ARR exposed`
          : `Sentiment critical · champion ${a.champion} at risk`,
        nextStep:
          "Map secondary contact, draft the 24-hour outreach, do not pitch on first call.",
        severity: "high",
      })),
    };
  },

  "escalation-first-60-seconds": (accounts) => {
    const matched = accounts.filter(
      (a) => a.csm_sentiment === "Critical" || a.health < 45,
    );
    return {
      headline: `${matched.length} account${matched.length === 1 ? "" : "s"} sitting at or near escalation`,
      guidance:
        "Open with the impact in their language, not your fix. One keepable promise. Engineering joins after the first 30 minutes.",
      insights: matched.map((a) => ({
        accountId: a.id,
        accountName: a.name,
        arr: a.arr,
        reason: `${a.csm_sentiment ?? "Unknown"} sentiment · health ${a.health}/100 · ${fmtMoney(a.arr)} ARR`,
        nextStep:
          "Draft the 0–60 second acknowledgment naming the specific business impact before any resolution talk.",
        severity: "high",
      })),
    };
  },

  "executive-digest-replaces-qbr": (accounts) => {
    const matched = accounts.filter(
      (a) => a.qbr_status === "Scheduled" || a.qbr_status === "Overdue",
    );
    return {
      headline: `${matched.length} QBR${matched.length === 1 ? "" : "s"} to convert into Executive Digests`,
      guidance:
        "One page, five sections, delivered two days before the call. No 90-minute deck.",
      insights: matched.slice(0, 20).map((a) => ({
        accountId: a.id,
        accountName: a.name,
        arr: a.arr,
        reason: `QBR ${a.qbr_status?.toLowerCase()} · renewal ${a.renewal_quarter}`,
        nextStep:
          a.qbr_status === "Overdue"
            ? "Send the Digest this week — lead with the headline number and one ask."
            : "Replace the deck with a 1-page Digest 48 hours before the meeting.",
        severity: a.qbr_status === "Overdue" ? "high" : "medium",
      })),
    };
  },

  "expansion-conversation-no-pitch": (accounts) => {
    const matched = accounts
      .filter((a) => a.health >= 70 && a.csm_sentiment !== "Critical")
      .sort((a, b) => b.arr - a.arr);
    return {
      headline: `${matched.length} healthy account${matched.length === 1 ? "" : "s"} ready for a friction-mapping research call`,
      guidance:
        "Do not pitch. Book a 30-minute research call to surface the initiative they are already working on.",
      insights: matched.slice(0, 12).map((a) => ({
        accountId: a.id,
        accountName: a.name,
        arr: a.arr,
        reason: `Health ${a.health}/100 · ${fmtMoney(a.arr)} ARR · ${a.tier}`,
        nextStep:
          "Schedule the Research Call. Ask the friction question, not the interest question.",
        severity: "low",
      })),
    };
  },

  "managing-up-without-politics": (accounts) => {
    // Pattern: 3+ accounts sharing a critical/at-risk signal
    const flagged = accounts.filter(
      (a) => a.csm_sentiment === "Critical" || a.health < 55,
    );
    const arrTotal = flagged.reduce((s, a) => s + (a.arr ?? 0), 0);
    const isPattern = flagged.length >= 3;
    return {
      headline: isPattern
        ? `Pattern detected: ${flagged.length} accounts at risk · ${fmtMoney(arrTotal)} combined ARR`
        : `${flagged.length} account${flagged.length === 1 ? "" : "s"} at risk — not yet a pattern`,
      guidance: isPattern
        ? "Bring this to your manager as a systemic conversation. Quantify in dollars. Propose the path."
        : "Below the 3-account threshold. Track for one more cycle before escalating as systemic.",
      insights: flagged.slice(0, 10).map((a) => ({
        accountId: a.id,
        accountName: a.name,
        arr: a.arr,
        reason: `Health ${a.health}/100 · ${a.csm_sentiment ?? "Neutral"} sentiment · ${fmtMoney(a.arr)} ARR`,
        nextStep: isPattern
          ? "Use this in the Pattern Declaration to leadership this week."
          : "Continue account-level remediation. Re-check in 30 days.",
        severity: severityFromHealth(a.health),
      })),
    };
  },
};

export function runPlaybookOnPortfolio(slug: string, accounts: CSAccount[]): PlaybookRunResult | null {
  const runner = PLAYBOOK_RUNNERS[slug];
  if (!runner) return null;
  if (!accounts.length) {
    return NO_MATCH(
      "No accounts in your portfolio yet",
      "Add accounts in CSFactors to run this playbook against live data.",
    );
  }
  return runner(accounts);
}

export function hasPlaybookRunner(slug: string): boolean {
  return slug in PLAYBOOK_RUNNERS;
}
