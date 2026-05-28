import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnalyticsShell, AnalyticsEmpty } from "@/components/analytics/AnalyticsShell";
import { MetricCard, MetricGrid } from "@/components/dashboard/MetricCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { TierGateOverlay } from "@/components/site/TierGateOverlay";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import { listAccounts, type CSAccount } from "@/lib/csfactors.functions";

export const Route = createFileRoute("/account/analytics/retention-funnel")({
  head: () => ({
    meta: [
      { title: "Retention Funnel — Analytics" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Stage-by-stage retention drop-off across the customer lifecycle." },
    ],
  }),
  component: RetentionFunnelPage,
});

const STAGES = [
  { key: "Signed", label: "Signed", match: (a: CSAccount) => true },
  { key: "Onboarding", label: "Onboarding", match: (a: CSAccount) => (a.implementation_progress ?? 0) > 0 },
  { key: "Go-live", label: "Go-live", match: (a: CSAccount) => !!a.actual_go_live || (a.implementation_progress ?? 0) >= 100 },
  { key: "Adopted", label: "Adopted", match: (a: CSAccount) => a.health >= 50 && (a.implementation_progress ?? 0) >= 100 },
  { key: "Renewed", label: "Renewed", match: (a: CSAccount) => a.qbr_status === "Completed" && a.health >= 65 },
] as const;

function pct(n: number, d: number) {
  return d ? Math.round((n / d) * 100) : 0;
}
function compact(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function RetentionFunnelPage() {
  const { user, loading: authLoading } = useAuth();
  const ent = useEntitlements();
  const list = useServerFn(listAccounts);
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["analytics-accounts"],
    queryFn: () => list(),
    enabled: !!user && ent.canExecAnalytics,
  });

  const stages = useMemo(
    () => STAGES.map((s) => {
      const matched = accounts.filter(s.match);
      return { ...s, count: matched.length, arr: matched.reduce((sum, a) => sum + Number(a.arr || 0), 0) };
    }),
    [accounts],
  );
  const total = stages[0]?.count ?? 0;
  const retained = stages[stages.length - 1]?.count ?? 0;
  const overallRetention = pct(retained, total);
  const biggestLeak = useMemo(() => {
    let worst = { from: "—", to: "—", drop: 0 };
    for (let i = 1; i < stages.length; i++) {
      const drop = stages[i - 1].count - stages[i].count;
      if (drop > worst.drop) worst = { from: stages[i - 1].label, to: stages[i].label, drop };
    }
    return worst;
  }, [stages]);

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

  return (
    <AnalyticsShell
      eyebrow="Analytics / Retention Funnel"
      title={<>Where they <span className="italic text-accent">leak.</span></>}
      description="Stage-by-stage drop-off across the customer lifecycle. Built from journey stage, implementation progress, health, and QBR status."
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground py-12">Loading…</p>
      ) : accounts.length === 0 ? (
        <AnalyticsEmpty message="No accounts yet. Add accounts in CSFactors to see retention stages." />
      ) : (
        <>
          <MetricGrid cols={4}>
            <MetricCard eyebrow="Total Accounts" value={total} accent="neutral" trend="In funnel" trendDirection="flat" />
            <MetricCard eyebrow="Retained" value={retained} accent="success" trend={`${overallRetention}% end-to-end`} trendDirection="up" />
            <MetricCard eyebrow="Overall Retention" value={overallRetention} unit="%" accent="accent" />
            <MetricCard eyebrow="Biggest Drop" value={biggestLeak.drop} accent="danger" trend={`${biggestLeak.from} → ${biggestLeak.to}`} trendDirection="down" />
          </MetricGrid>

          <SectionCard
            eyebrow="Funnel"
            title="Stage-by-stage progression"
            description="Each bar is sized to the count of accounts at that stage. Width = retention vs. previous stage."
            className="mt-8"
          >
            <div className="space-y-4">
              {stages.map((s, i) => {
                const widthPct = pct(s.count, total) || 2;
                const stageDrop = i === 0 ? 0 : stages[i - 1].count - s.count;
                const stageRetention = i === 0 ? 100 : pct(s.count, stages[i - 1].count);
                return (
                  <div key={s.key} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <div className="flex items-baseline gap-3 min-w-0">
                        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground w-6 shrink-0">
                          0{i + 1}
                        </span>
                        <span className="font-display text-base md:text-lg tracking-tight truncate">{s.label}</span>
                      </div>
                      <div className="flex items-baseline gap-4 font-mono text-xs tabular-nums whitespace-nowrap">
                        <span>{s.count}</span>
                        <span className="text-muted-foreground hidden sm:inline">{compact(s.arr)}</span>
                        {i > 0 && (
                          <span className={stageDrop > 0 ? "text-destructive" : "text-emerald-600"}>
                            {stageDrop > 0 ? `−${stageDrop}` : "0"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-9 bg-muted/40 relative overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-700 ease-out flex items-center justify-end pr-3"
                        style={{ width: `${widthPct}%` }}
                      >
                        {widthPct > 15 && (
                          <span className="font-mono uppercase tracking-widest text-xs text-accent-foreground">
                            {stageRetention}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Diagnosis"
            title="Where they leak"
            description="The largest stage-over-stage drop is your highest-leverage fix."
            className="mt-6"
          >
            <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
              {stages.slice(1).map((s, i) => {
                const prev = stages[i];
                const drop = prev.count - s.count;
                const dropPct = pct(drop, prev.count);
                return (
                  <div key={s.key} className="bg-card p-5">
                    <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
                      {prev.label} → {s.label}
                    </div>
                    <div className="font-display text-3xl tracking-tight mb-1 tabular-nums">
                      {dropPct}%
                    </div>
                    <div className={`font-mono text-xs uppercase tracking-wider ${drop > 0 ? "text-destructive" : "text-emerald-600"}`}>
                      {drop > 0 ? `↓ ${drop} lost` : "→ no drop"}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </>
      )}
    </AnalyticsShell>
  );
}
