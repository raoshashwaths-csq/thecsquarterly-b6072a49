import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import type { CSAccount } from "@/lib/csfactors.functions";

type LedgerEntry = {
  id: string;
  time: string;
  headline: string;
  who: string;
  tag: "ESCALATION" | "HEALTH" | "CHANGE" | "USAGE" | "INSIGHT" | "UPDATE" | "DAILY BRIEF";
  accountId?: string;
};

function timeStamp(offsetMin: number) {
  const d = new Date(Date.now() - offsetMin * 60_000);
  return d.toTimeString().slice(0, 5);
}

/** Derive a believable ledger client-side from the account portfolio. */
function deriveLedger(accounts: CSAccount[]): LedgerEntry[] {
  const sortedByHealth = [...accounts].sort((a, b) => a.health - b.health);
  const sortedByArr = [...accounts].sort((a, b) => b.arr - a.arr);
  const entries: LedgerEntry[] = [];

  const worst = sortedByHealth[0];
  if (worst) {
    entries.push({
      id: `e-${worst.id}-esc`,
      time: timeStamp(8),
      headline: `${worst.name} flagged executive churn risk`,
      who: `${worst.csm_name ?? "Owner"} · Escalation`,
      tag: "ESCALATION",
      accountId: worst.id,
    });
  }
  const second = sortedByHealth[1];
  if (second) {
    entries.push({
      id: `e-${second.id}-hp`,
      time: timeStamp(35),
      headline: `${second.name} health declined to ${second.health}`,
      who: "System · Health",
      tag: "HEALTH",
      accountId: second.id,
    });
  }
  const renewalMove = sortedByHealth[2];
  if (renewalMove) {
    entries.push({
      id: `e-${renewalMove.id}-mv`,
      time: timeStamp(61),
      headline: `${renewalMove.name} renewal moved to FY26 Q2`,
      who: `${renewalMove.csm_name ?? "Owner"} · Change`,
      tag: "CHANGE",
      accountId: renewalMove.id,
    });
  }
  const overdue = accounts.filter((a) => a.qbr_status === "Overdue").length;
  if (overdue > 0) {
    entries.push({
      id: `e-usage`,
      time: timeStamp(94),
      headline: `Usage drop detected for ${overdue} account${overdue === 1 ? "" : "s"}`,
      who: "System · Usage",
      tag: "USAGE",
    });
  }
  const expansion = sortedByArr.find((a) => a.health >= 80);
  if (expansion) {
    entries.push({
      id: `e-${expansion.id}-ins`,
      time: timeStamp(118),
      headline: `Lumi Insight: expansion opportunity in ${Math.min(5, Math.max(2, Math.round(accounts.length / 3)))} accounts`,
      who: "Lumi · Insight",
      tag: "INSIGHT",
      accountId: expansion.id,
    });
  }
  const top = sortedByArr[0];
  if (top) {
    entries.push({
      id: `e-${top.id}-upd`,
      time: timeStamp(145),
      headline: `${top.name} NRR expanded to 132%`,
      who: `${top.csm_name ?? "Owner"} · Update`,
      tag: "UPDATE",
      accountId: top.id,
    });
  }
  entries.push({
    id: "e-brief",
    time: timeStamp(180),
    headline: "Welcome to your day.",
    who: "System · Daily Brief",
    tag: "DAILY BRIEF",
  });
  return entries;
}

export function ReckoningLedger({ accounts }: { accounts: CSAccount[] }) {
  const entries = useMemo(() => deriveLedger(accounts), [accounts]);
  return (
    <aside className="lg:sticky lg:top-6">
      <div className="eyebrow text-secondary-accent mb-4">Reckoning Ledger</div>
      <ol className="relative pl-5 border-l border-border space-y-5">
        {entries.map((e) => (
          <li key={e.id} className="relative">
            <span
              aria-hidden
              className="absolute -left-[23px] top-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-background"
            />
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-1 tabular-nums">
              {e.time}
            </div>
            {e.accountId ? (
              <Link
                to="/csfactors/$accountId"
                params={{ accountId: e.accountId }}
                className="block font-display text-[15px] leading-snug tracking-tight text-foreground hover:text-accent transition-colors"
              >
                {e.headline}
              </Link>
            ) : (
              <div className="font-display text-[15px] leading-snug tracking-tight text-foreground">
                {e.headline}
              </div>
            )}
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              {e.who.split(" · ")[0]} <span className="text-accent">·</span> {e.tag}
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}
