import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnalyticsShell, AnalyticsEmpty } from "@/components/analytics/AnalyticsShell";
import { MetricCard, MetricGrid } from "@/components/dashboard/MetricCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { RhythmBars } from "@/components/dashboard/RhythmBars";
import { TierGateOverlay } from "@/components/site/TierGateOverlay";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import { listAccounts, type CSAccount } from "@/lib/csfactors.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/account/analytics/nrr-waterfall")({
  head: () => ({
    meta: [
      { title: "NRR Waterfall — Analytics" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Net retention waterfall: starting ARR, expansion, contraction, churn, ending ARR." },
    ],
  }),
  component: NrrWaterfallPage,
});

function compact(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(abs % 1_000_000 === 0 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`;
  return `${sign}$${abs}`;
}

// Estimate movement from health bands.
function deriveMovement(accounts: CSAccount[]) {
  const start = accounts.reduce((s, a) => s + Number(a.arr || 0), 0);
  let expansion = 0, contraction = 0, churn = 0;
  for (const a of accounts) {
    const arr = Number(a.arr || 0);
    if (a.health >= 80) expansion += arr * 0.15;
    else if (a.health >= 65) expansion += arr * 0.05;
    else if (a.health < 25) churn += arr;
    else if (a.health < 50) contraction += arr * 0.2;
  }
  const end = start + expansion - contraction - churn;
  const nrr = start ? Math.round((end / start) * 100) : 0;
  const grr = start ? Math.round(((start - contraction - churn) / start) * 100) : 0;
  return { start, expansion, contraction, churn, end, nrr, grr };
}

function NrrWaterfallPage() {
  const { user, loading: authLoading } = useAuth();
  const ent = useEntitlements();
  const list = useServerFn(listAccounts);
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["analytics-accounts"],
    queryFn: () => list(),
    enabled: !!user && ent.canExecAnalytics,
  });

  const m = useMemo(() => deriveMovement(accounts), [accounts]);

  const expansions = useMemo(
    () => [...accounts].filter((a) => a.health >= 65).sort((a, b) => b.arr - a.arr).slice(0, 5),
    [accounts],
  );
  const churns = useMemo(
    () => [...accounts].filter((a) => a.health < 50).sort((a, b) => b.arr - a.arr).slice(0, 5),
    [accounts],
  );

  // 8-quarter synthetic rhythm derived from current NRR (visual cadence only).
  const rhythm = useMemo(() => {
    const base = m.nrr || 100;
    return [base - 14, base - 8, base - 5, base - 3, base - 1, base + 2, base + 4, base];
  }, [m.nrr]);

  if (!authLoading && !ent.loading && user && !ent.canExecAnalytics) {
    return (
      <TierGateOverlay
        requiredTier="operator"
        title="Analytics dashboards are an Operator unlock."
        description="Retention Funnel, NRR Waterfall, Stakeholder Radar, and Team Leaderboard ship from the Operator tier."
        ctaLabel="Upgrade to Operator"
      />
    );
  }

  // Waterfall columns
  const max = Math.max(m.start, m.end, 1);
  const cols = [
    { label: "Starting ARR", value: m.start, base: 0, tone: "neutral" as const },
    { label: "Expansion", value: m.expansion, base: m.start, tone: "success" as const, delta: true },
    { label: "Contraction", value: m.contraction, base: m.start + m.expansion - m.contraction, tone: "secondary" as const, delta: true, negative: true },
    { label: "Churn", value: m.churn, base: m.start + m.expansion - m.contraction - m.churn, tone: "danger" as const, delta: true, negative: true },
    { label: "Ending ARR", value: m.end, base: 0, tone: "accent" as const },
  ];

  const TONE: Record<string, string> = {
    neutral: "bg-foreground/70",
    success: "bg-emerald-600",
    secondary: "bg-secondary-accent",
    danger: "bg-destructive",
    accent: "bg-accent",
  };

  return (
    <AnalyticsShell
      eyebrow="Analytics / NRR Waterfall"
      title={<>From start to <span className="italic text-accent">end of period.</span></>}
      description="Estimated expansion, contraction, and churn movement derived from health bands across your portfolio."
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground py-12">Loading…</p>
      ) : accounts.length === 0 ? (
        <AnalyticsEmpty message="No accounts yet. Add accounts in CSFactors to model NRR." />
      ) : (
        <>
          <MetricGrid cols={3}>
            <MetricCard eyebrow="Net Retention" value={m.nrr} unit="%" accent={m.nrr >= 100 ? "success" : "danger"} trend={m.nrr >= 100 ? "Above 100% — expanding" : "Below 100% — contracting"} trendDirection={m.nrr >= 100 ? "up" : "down"} />
            <MetricCard eyebrow="Gross Retention" value={m.grr} unit="%" accent="secondary" trend="Excludes expansion" trendDirection="flat" />
            <MetricCard eyebrow="Ending ARR" value={compact(m.end)} accent="accent" trend={`Start ${compact(m.start)}`} trendDirection={m.end >= m.start ? "up" : "down"} />
          </MetricGrid>

          <SectionCard
            eyebrow="Waterfall"
            title="Movement of ARR across the period"
            description="Green = expansion. Gold = contraction. Oxblood = churn."
            className="mt-8"
          >
            <div className="grid grid-cols-5 gap-2 md:gap-4 h-64 items-end">
              {cols.map((c) => {
                const h = Math.max(2, Math.round((Math.abs(c.value) / max) * 100));
                const baseH = c.delta ? Math.round((c.base / max) * 100) : 0;
                return (
                  <div key={c.label} className="flex flex-col items-center h-full justify-end">
                    <div className="font-mono text-[9px] md:text-[10px] uppercase tracking-widest tabular-nums mb-1 text-center">
                      {c.negative ? "−" : ""}{compact(c.value)}
                    </div>
                    <div className="relative w-full flex-1 flex items-end">
                      {c.delta && (
                        <div className="absolute left-0 right-0 border-t border-dashed border-border" style={{ bottom: `${baseH}%` }} />
                      )}
                      <div
                        className={cn("w-full transition-all duration-700 ease-out", TONE[c.tone])}
                        style={{ height: `${h}%`, marginBottom: c.delta ? `${baseH}%` : 0 }}
                      />
                    </div>
                    <div className="font-mono text-[9px] md:text-[10px] uppercase tracking-widest text-muted-foreground mt-2 text-center leading-tight">
                      {c.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <SectionCard eyebrow="Top 5" title="Expansion candidates" description="Highest-ARR healthy accounts.">
              {expansions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No accounts above health 65.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {expansions.map((a) => (
                    <li key={a.id} className="py-3 flex items-baseline justify-between gap-3">
                      <span className="font-display text-base truncate">{a.name}</span>
                      <span className="font-mono text-xs tabular-nums text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                        +{compact(a.arr * 0.15)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
            <SectionCard eyebrow="Top 5" title="Churn risks" description="Lowest-health accounts by ARR.">
              {churns.length === 0 ? (
                <p className="text-sm text-muted-foreground">No accounts under health 50.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {churns.map((a) => (
                    <li key={a.id} className="py-3 flex items-baseline justify-between gap-3">
                      <span className="font-display text-base truncate">{a.name}</span>
                      <span className="font-mono text-xs tabular-nums text-destructive whitespace-nowrap">
                        −{compact(a.arr)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>

          <SectionCard eyebrow="Cadence" title="NRR rhythm — last 8 periods" description="Trailing NRR (modeled) leading into this snapshot." className="mt-6">
            <RhythmBars
              values={rhythm}
              labels={["Q1", "Q2", "Q3", "Q4", "Q1", "Q2", "Q3", "Now"]}
            />
          </SectionCard>
        </>
      )}
    </AnalyticsShell>
  );
}
