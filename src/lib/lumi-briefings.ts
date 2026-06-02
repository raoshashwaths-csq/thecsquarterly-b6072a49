import type { CSAccount } from "@/lib/csfactors.functions";

export type LumiBriefing = {
  eyebrow: string;
  headline: string;
  body: string;
  bullets: string[];
  accountId?: string;
  accountName?: string;
};

type LedgerKind = "ESCALATION" | "HEALTH" | "CHANGE" | "USAGE" | "INSIGHT" | "UPDATE" | "DAILY BRIEF";

export function buildLedgerBriefing(args: {
  time: string;
  tag: LedgerKind;
  headline: string;
  account?: CSAccount | null;
}): LumiBriefing {
  const { time, tag, headline, account } = args;
  const eyebrow = `Lumi Insight · ${time} · ${tag}`;
  const accountName = account?.name;
  const arr = account ? `$${Math.round(account.arr / 1000).toLocaleString()}K ARR` : null;
  const health = account ? `Health ${account.health}/100` : null;

  switch (tag) {
    case "ESCALATION":
      return {
        eyebrow,
        headline: accountName ? `${accountName} — executive churn risk` : headline,
        body:
          "Detractor signal crossed the escalation threshold. Treat this as a 48-hour intervention window — sequence champion + economic-buyer outreach before the next renewal touchpoint.",
        bullets: [
          arr ? `Exposure: ${arr}` : "Exposure: unknown",
          health ?? "Health: unknown",
          "Recommended: pre-mortem call with the deal desk today.",
        ],
        accountId: account?.id,
        accountName,
      };
    case "HEALTH":
      return {
        eyebrow,
        headline: accountName ? `${accountName} — health declining` : headline,
        body:
          "Composite health dropped through the warn band. Likely drivers: ticket volume, usage cliff, or sentiment shift. Pull the last 30 days of events before the next sync.",
        bullets: [
          arr ?? "Exposure: unknown",
          health ?? "Health: unknown",
          "Recommended: log a recovery play in Workspace.",
        ],
        accountId: account?.id,
        accountName,
      };
    case "CHANGE":
      return {
        eyebrow,
        headline,
        body:
          "A renewal-relevant change landed in the ledger. Confirm the new date with procurement and re-stage Mutual Action Plan milestones.",
        bullets: [
          arr ?? "Exposure: unknown",
          "Recommended: update the renewal forecast row.",
          "Notify champion in writing within 24h.",
        ],
        accountId: account?.id,
        accountName,
      };
    case "USAGE":
      return {
        eyebrow,
        headline,
        body:
          "Usage telemetry crossed the drop threshold for one or more accounts. Cross-reference with onboarding milestones — silent customers churn quietly.",
        bullets: [
          "Run the value-realization audit.",
          "Schedule a power-user interview this week.",
          "Flag any account ≤ 50% adoption to the QBR queue.",
        ],
      };
    case "INSIGHT":
      return {
        eyebrow,
        headline,
        body:
          "Expansion telemetry suggests accounts with multi-product affinity. Sequence the next AE+CSM joint touch with a tailored land-and-expand brief.",
        bullets: [
          "Pull last quarter's product adoption deltas.",
          "Confirm budget cycle with the economic buyer.",
          "Co-sell motion: AE owns commercials, CSM owns proof.",
        ],
        accountId: account?.id,
        accountName,
      };
    case "UPDATE":
      return {
        eyebrow,
        headline,
        body:
          "Net Revenue Retention expanded above target. Tag the playbook used so the rest of the team can run it.",
        bullets: [
          arr ?? "Exposure: unknown",
          "Recommended: capture the win-note in Outcome Forum.",
          "Schedule the reference call.",
        ],
        accountId: account?.id,
        accountName,
      };
    default:
      return {
        eyebrow,
        headline,
        body: "Daily brief — review the heatmap, then the Burning Three, then move.",
        bullets: [
          "Top of book: highest impact × likelihood cells.",
          "QBRs overdue: book the first one before noon.",
          "Champion check-ins: at least three before EOD.",
        ],
      };
  }
}
