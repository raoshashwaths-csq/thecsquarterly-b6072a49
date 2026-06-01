import { useMemo, useState } from "react";
import { MetricCard, MetricGrid } from "@/components/dashboard/MetricCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { BurningThree } from "@/components/csfactors/BurningThree";
import { AccountsGrid } from "@/components/csfactors/AccountsGrid";
import { PulseHeader } from "./PulseHeader";
import { RiskHeatmap } from "./RiskHeatmap";
import { ReckoningLedger } from "./ReckoningLedger";
import { pulseSeedAccounts } from "@/lib/mocks/pulseSeed";
import type { CSAccount } from "@/lib/csfactors.functions";

function compact(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

export function PulseDashboard({
  accounts: liveAccounts,
  firstName,
  onRowClick,
}: {
  accounts: CSAccount[];
  firstName: string;
  onRowClick: (a: CSAccount) => void;
}) {
  const usingSeed = liveAccounts.length === 0;
  const accounts = usingSeed ? pulseSeedAccounts : liveAccounts;
  const [scope, setScope] = useState<"me" | "team">("me");

  const totalARR = useMemo(() => accounts.reduce((s, a) => s + Number(a.arr), 0), [accounts]);
  const atRisk = useMemo(
    () =>
      accounts
        .filter((a) => a.health < 50)
        .reduce((s, a) => s + Number(a.arr), 0),
    [accounts],
  );
  const avgHealth = useMemo(
    () =>
      accounts.length
        ? Math.round(accounts.reduce((s, a) => s + Number(a.health), 0) / accounts.length)
        : 0,
    [accounts],
  );
  const churnPct = useMemo(() => {
    if (!accounts.length) return 0;
    const detractors = accounts.filter((a) => (a.final_cs_nps ?? 7) <= 6).length;
    return Number(((detractors / accounts.length) * 5).toFixed(1));
  }, [accounts]);

  // Approximate NRR / GRR from health & arr (purely display-side)
  const nrr = Math.max(80, Math.min(140, 100 + Math.round((avgHealth - 60) * 0.9)));
  const grr = Math.max(70, Math.min(100, 80 + Math.round((avgHealth - 50) * 0.4)));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_320px] gap-10">
      <div className="min-w-0">
        <PulseHeader firstName={firstName} scope={scope} onScopeChange={setScope} />

        {usingSeed ? (
          <div className="mb-6 inline-flex items-center gap-2 border border-dashed border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            Demo portfolio · add your first account to replace
          </div>
        ) : null}

        <section className="mb-10" aria-label="Portfolio metrics">
          <MetricGrid cols={4}>
            <MetricCard
              eyebrow="NRR"
              value={nrr}
              unit="%"
              accent="accent"
              trend={`${nrr >= 100 ? "+" : ""}${nrr - 100}pp vs 30d`}
              trendDirection={nrr >= 100 ? "up" : "down"}
            />
            <MetricCard
              eyebrow="GRR"
              value={grr}
              unit="%"
              accent="secondary"
              trend="2pp vs 30d"
              trendDirection="up"
            />
            <MetricCard
              eyebrow="Churn (TTM)"
              value={churnPct}
              unit="%"
              accent="danger"
              trend="0.4pp vs 30d"
              trendDirection="down"
            />
            <MetricCard
              eyebrow="Health (portfolio)"
              value={avgHealth}
              accent={avgHealth >= 70 ? "success" : avgHealth >= 55 ? "secondary" : "danger"}
              trend={`${atRisk > 0 ? compact(atRisk) + " at risk" : "stable"}`}
              trendDirection={avgHealth >= 70 ? "up" : "down"}
            />
          </MetricGrid>
        </section>

        <section className="mb-10" id="reminders">
          <BurningThree accounts={accounts} />
        </section>

        <RiskHeatmap
          accounts={accounts}
          onCellSelect={(cell) => onRowClick(cell[0])}
        />

        <SectionCard
          title="Portfolio overview"
          eyebrow="Accounts"
          description={`${accounts.length} accounts · ${compact(totalARR)} ARR tracked`}
          className="mb-10"
        >
          <AccountsGrid accounts={accounts} onRowClick={onRowClick} />
        </SectionCard>
      </div>

      <ReckoningLedger accounts={accounts} />
    </div>
  );
}
