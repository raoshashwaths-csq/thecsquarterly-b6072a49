import { useMemo } from "react";
import type { CSAccount } from "@/lib/csfactors.functions";
import { useLumiDrawer } from "@/components/csfactors/AskLumiDrawer";
import { buildLedgerBriefing } from "@/lib/lumi-briefings";

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
  const lumi = useLumiDrawer();

  return (
    <aside className="lg:sticky lg:top-6">
      <div className="eyebrow text-secondary-accent mb-4">Reckoning Ledger</div>
      <ol className="relative space-y-4">
        {/* vertical rail centered behind the dots */}
        <span
          aria-hidden
          className="absolute top-2 bottom-2 left-[3px] w-px bg-border"
        />
        {entries.map((e) => {
          const account = e.accountId ? accounts.find((a) => a.id === e.accountId) ?? null : null;
          return (
            <li key={e.id} className="relative pl-6">
              <span
                aria-hidden
                className="absolute left-0 top-[7px] h-[7px] w-[7px] rounded-full bg-accent ring-2 ring-background"
              />
              <button
                type="button"
                onClick={() =>
                  lumi.open(
                    buildLedgerBriefing({
                      time: e.time,
                      tag: e.tag,
                      headline: e.headline,
                      account,
                    }),
                  )
                }
                className="block w-full text-left group hover:bg-muted/30 -mx-2 px-2 py-1 transition-colors"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1 tabular-nums">
                  {e.time}
                </div>
                <div className="font-display text-[15px] leading-snug tracking-tight text-foreground group-hover:text-accent transition-colors">
                  {e.headline}
                </div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                  {e.who.split(" · ")[0]} <span className="text-accent">·</span> {e.tag}
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
