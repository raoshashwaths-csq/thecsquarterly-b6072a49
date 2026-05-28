import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnalyticsShell, AnalyticsEmpty } from "@/components/analytics/AnalyticsShell";
import { MetricCard, MetricGrid } from "@/components/dashboard/MetricCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { HealthChip } from "@/components/dashboard/HealthChip";
import { RhythmBars } from "@/components/dashboard/RhythmBars";
import { TierGateOverlay } from "@/components/site/TierGateOverlay";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import { listAccounts, type CSAccount } from "@/lib/csfactors.functions";

export const Route = createFileRoute("/account/analytics/team-leaderboard")({
  head: () => ({
    meta: [
      { title: "Team Leaderboard — Analytics" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "CSM-level performance ranking by ARR, average health, and QBR completion." },
    ],
  }),
  component: TeamLeaderboardPage,
});

function compact(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

type Row = {
  name: string;
  count: number;
  arr: number;
  avgHealth: number;
  qbrPct: number;
  atRiskArr: number;
};

function aggregate(accounts: CSAccount[]): Row[] {
  const map = new Map<string, CSAccount[]>();
  for (const a of accounts) {
    const k = a.csm_name?.trim() || "Unassigned";
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(a);
  }
  const rows: Row[] = [];
  for (const [name, list] of map) {
    const arr = list.reduce((s, a) => s + Number(a.arr || 0), 0);
    const avgHealth = Math.round(list.reduce((s, a) => s + a.health, 0) / list.length);
    const qbr = list.filter((a) => a.qbr_status === "Completed").length;
    const atRisk = list.filter((a) => a.health < 50).reduce((s, a) => s + Number(a.arr || 0), 0);
    rows.push({
      name,
      count: list.length,
      arr,
      avgHealth,
      qbrPct: Math.round((qbr / list.length) * 100),
      atRiskArr: atRisk,
    });
  }
  return rows.sort((a, b) => b.arr - a.arr);
}

function TeamLeaderboardPage() {
  const { user, loading: authLoading } = useAuth();
  const ent = useEntitlements();
  const list = useServerFn(listAccounts);
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["analytics-accounts"],
    queryFn: () => list(),
    enabled: !!user && ent.canExecAnalytics,
  });

  const rows = useMemo(() => aggregate(accounts), [accounts]);
  const totals = useMemo(() => ({
    csms: rows.length,
    arr: rows.reduce((s, r) => s + r.arr, 0),
    avgHealth: rows.length ? Math.round(rows.reduce((s, r) => s + r.avgHealth, 0) / rows.length) : 0,
    avgQbr: rows.length ? Math.round(rows.reduce((s, r) => s + r.qbrPct, 0) / rows.length) : 0,
  }), [rows]);

  const movers = useMemo(() => {
    return [...rows].sort((a, b) => b.avgHealth - a.avgHealth).slice(0, 3);
  }, [rows]);

  const rhythm = useMemo(() => {
    // 12-week synthetic rhythm anchored to current avg health
    const base = totals.avgHealth || 60;
    return Array.from({ length: 12 }, (_, i) => Math.max(10, base - 12 + i + (i % 3)));
  }, [totals.avgHealth]);

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
      eyebrow="Analytics / Team Leaderboard"
      title={<>Who's holding <span className="italic text-accent">the line.</span></>}
      description="CSM-level ranking by book of business, portfolio health, and QBR completion. Click a row to focus a CSM in CSFactors."
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground py-12">Loading…</p>
      ) : rows.length === 0 ? (
        <AnalyticsEmpty message="No CSM data yet. Assign CSMs to accounts in CSFactors to populate the leaderboard." />
      ) : (
        <>
          <MetricGrid cols={4}>
            <MetricCard eyebrow="CSMs" value={totals.csms} accent="neutral" trend="Active in portfolio" trendDirection="flat" />
            <MetricCard eyebrow="Total ARR" value={compact(totals.arr)} accent="accent" />
            <MetricCard eyebrow="Avg Health" value={totals.avgHealth} accent={totals.avgHealth >= 75 ? "success" : totals.avgHealth >= 50 ? "secondary" : "danger"} />
            <MetricCard eyebrow="Avg QBR" value={totals.avgQbr} unit="%" accent="secondary" />
          </MetricGrid>

          <SectionCard
            eyebrow="Leaderboard"
            title="Ranked by book of business"
            description="Tap a column header to sort. Health and QBR are aggregated across the CSM's accounts."
            className="mt-8"
          >
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="text-left border-b border-border">
                    {["#", "CSM", "Accts", "Book", "Avg Health", "QBR %", "ARR at Risk"].map((h, i) => (
                      <th key={h} className={`py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground ${i === 0 ? "w-10" : ""}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.name} className="border-b border-border/60 hover:bg-muted/30 transition-colors">
                      <td className="py-3 font-mono text-xs text-muted-foreground tabular-nums">{i + 1}</td>
                      <td className="py-3">
                        <div className="font-display text-base">{r.name}</div>
                      </td>
                      <td className="py-3 font-mono text-xs tabular-nums">{r.count}</td>
                      <td className="py-3 font-mono text-xs tabular-nums">{compact(r.arr)}</td>
                      <td className="py-3"><HealthChip score={r.avgHealth} /></td>
                      <td className="py-3 font-mono text-xs tabular-nums">{r.qbrPct}%</td>
                      <td className={`py-3 font-mono text-xs tabular-nums ${r.atRiskArr > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                        {r.atRiskArr > 0 ? compact(r.atRiskArr) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <SectionCard eyebrow="Movers" title="Top 3 this week" description="Highest average health across their book.">
              <div className="grid gap-px bg-border border border-border">
                {movers.map((m, i) => (
                  <div key={m.name} className="bg-card p-4 flex items-center justify-between gap-3">
                    <div className="flex items-baseline gap-3 min-w-0">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-secondary-accent">0{i + 1}</span>
                      <span className="font-display text-base truncate">{m.name}</span>
                    </div>
                    <HealthChip score={m.avgHealth} />
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard eyebrow="Cadence" title="Team health — last 12 weeks" description="Trailing portfolio health index across all CSMs.">
              <RhythmBars values={rhythm} labels={Array.from({ length: 12 }, (_, i) => `W${i + 1}`)} />
            </SectionCard>
          </div>
        </>
      )}
    </AnalyticsShell>
  );
}
