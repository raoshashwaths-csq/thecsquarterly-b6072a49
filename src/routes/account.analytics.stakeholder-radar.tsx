import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnalyticsShell, AnalyticsEmpty } from "@/components/analytics/AnalyticsShell";
import { MetricCard, MetricGrid } from "@/components/dashboard/MetricCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { HealthChip } from "@/components/dashboard/HealthChip";
import { TierGateOverlay } from "@/components/site/TierGateOverlay";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import { listAccounts, type CSAccount } from "@/lib/csfactors.functions";

export const Route = createFileRoute("/account/analytics/stakeholder-radar")({
  head: () => ({
    meta: [
      { title: "Stakeholder Radar — Analytics" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Five-axis radar across health, NPS, implementation, QBR cadence, and sentiment." },
    ],
  }),
  component: StakeholderRadarPage,
});

const AXES = [
  { key: "health", label: "Health" },
  { key: "nps", label: "NPS" },
  { key: "implementation", label: "Implementation" },
  { key: "qbr", label: "QBR Cadence" },
  { key: "sentiment", label: "Sentiment" },
] as const;

type AxisKey = typeof AXES[number]["key"];

function scoreAccount(a: CSAccount): Record<AxisKey, number> {
  return {
    health: a.health,
    nps: a.final_cs_nps != null ? (a.final_cs_nps / 10) * 100 : 50,
    implementation: a.implementation_progress ?? 0,
    qbr: a.qbr_status === "Completed" ? 100 : a.qbr_status === "Scheduled" ? 65 : 25,
    sentiment: a.csm_sentiment === "Positive" ? 100 : a.csm_sentiment === "Neutral" ? 60 : a.csm_sentiment === "Critical" ? 20 : 50,
  };
}

function avg(accounts: CSAccount[]): Record<AxisKey, number> {
  if (!accounts.length) return { health: 0, nps: 0, implementation: 0, qbr: 0, sentiment: 0 };
  const sums = accounts.map(scoreAccount).reduce(
    (acc, s) => {
      for (const k of Object.keys(s) as AxisKey[]) acc[k] += s[k];
      return acc;
    },
    { health: 0, nps: 0, implementation: 0, qbr: 0, sentiment: 0 },
  );
  for (const k of Object.keys(sums) as AxisKey[]) sums[k] = Math.round(sums[k] / accounts.length);
  return sums;
}

function polygonPoints(scores: Record<AxisKey, number>, cx: number, cy: number, r: number) {
  return AXES.map((axis, i) => {
    const a = (Math.PI * 2 * i) / AXES.length - Math.PI / 2;
    const v = scores[axis.key] / 100;
    return `${cx + Math.cos(a) * r * v},${cy + Math.sin(a) * r * v}`;
  }).join(" ");
}

function StakeholderRadarPage() {
  const { user, loading: authLoading } = useAuth();
  const ent = useEntitlements();
  const list = useServerFn(listAccounts);
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["analytics-accounts"],
    queryFn: () => list(),
    enabled: !!user && ent.canExecAnalytics,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => (selectedId ? accounts.find((a) => a.id === selectedId) ?? null : null),
    [accounts, selectedId],
  );

  const portfolio = useMemo(() => avg(accounts), [accounts]);
  const focus = selected ? scoreAccount(selected) : portfolio;
  const compositeFocus = Math.round(
    (Object.values(focus).reduce((s, v) => s + v, 0)) / AXES.length,
  );

  const stakeholders = useMemo(
    () => [...accounts]
      .sort((a, b) => a.health - b.health)
      .slice(0, 6),
    [accounts],
  );

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

  const SIZE = 320;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = SIZE * 0.4;
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <AnalyticsShell
      eyebrow="Analytics / Stakeholder Radar"
      title={<>Five axes. <span className="italic text-accent">One account.</span></>}
      description="Health, NPS, implementation, QBR cadence, and sentiment plotted as a pentagon. Compare any account to the portfolio average."
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground py-12">Loading…</p>
      ) : accounts.length === 0 ? (
        <AnalyticsEmpty message="No accounts yet. Add accounts in CSFactors to plot stakeholder radar." />
      ) : (
        <>
          <MetricGrid cols={3}>
            <MetricCard eyebrow="Composite Score" value={compositeFocus} unit="/100" accent={compositeFocus >= 75 ? "success" : compositeFocus >= 50 ? "secondary" : "danger"} trend={selected ? selected.name : "Portfolio average"} trendDirection="flat" />
            <MetricCard eyebrow="Avg Health" value={portfolio.health} accent="accent" trend={`${accounts.length} accounts`} trendDirection="flat" />
            <MetricCard eyebrow="Avg QBR" value={portfolio.qbr} unit="/100" accent="secondary" trend="Cadence index" trendDirection="flat" />
          </MetricGrid>

          <div className="grid lg:grid-cols-[1fr,1fr] gap-6 mt-8">
            <SectionCard
              eyebrow="Radar"
              title={selected ? selected.name : "Portfolio average"}
              description="Solid = current focus. Dashed = portfolio benchmark."
            >
              <div className="flex flex-col items-center">
                <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[360px] h-auto">
                  {rings.map((r, i) => (
                    <polygon
                      key={i}
                      points={AXES.map((_, idx) => {
                        const a = (Math.PI * 2 * idx) / AXES.length - Math.PI / 2;
                        return `${cx + Math.cos(a) * R * r},${cy + Math.sin(a) * R * r}`;
                      }).join(" ")}
                      fill="none"
                      stroke="hsl(var(--border, 0 0% 80%))"
                      className="stroke-border"
                      strokeWidth={0.5}
                    />
                  ))}
                  {AXES.map((axis, i) => {
                    const a = (Math.PI * 2 * i) / AXES.length - Math.PI / 2;
                    return (
                      <line
                        key={axis.key}
                        x1={cx}
                        y1={cy}
                        x2={cx + Math.cos(a) * R}
                        y2={cy + Math.sin(a) * R}
                        className="stroke-border"
                        strokeWidth={0.5}
                      />
                    );
                  })}
                  {selected && (
                    <polygon
                      points={polygonPoints(portfolio, cx, cy, R)}
                      className="fill-secondary-accent/10 stroke-secondary-accent"
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                    />
                  )}
                  <polygon
                    points={polygonPoints(focus, cx, cy, R)}
                    className="fill-accent/25 stroke-accent"
                    strokeWidth={2}
                  />
                  {AXES.map((axis, i) => {
                    const a = (Math.PI * 2 * i) / AXES.length - Math.PI / 2;
                    const x = cx + Math.cos(a) * (R + 22);
                    const y = cy + Math.sin(a) * (R + 22);
                    return (
                      <text
                        key={axis.key}
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-foreground font-mono text-[10px] uppercase tracking-widest"
                      >
                        {axis.label}
                      </text>
                    );
                  })}
                </svg>
                {selected && (
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-accent"
                  >
                    ← Back to portfolio average
                  </button>
                )}
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Accounts"
              title="Pick a stakeholder"
              description="Sorted by lowest health first — your highest-leverage attention."
            >
              <ul className="divide-y divide-border">
                {stakeholders.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(a.id)}
                      className={`w-full text-left py-3 flex items-center justify-between gap-3 hover:text-accent transition-colors ${selectedId === a.id ? "text-accent" : ""}`}
                    >
                      <div className="min-w-0">
                        <div className="font-display text-base truncate">{a.name}</div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                          {a.tier} · {a.csm_name ?? "Unassigned"}
                        </div>
                      </div>
                      <HealthChip score={a.health} />
                    </button>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>

          <SectionCard eyebrow="Next Moves" title="Three plays for this account" className="mt-6">
            <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
              {[
                { tag: "Health", play: focus.health < 50 ? "Schedule executive sponsor check-in within 7 days." : "Hold cadence — bank the trust." },
                { tag: "QBR", play: focus.qbr < 60 ? "Lock a QBR date this quarter — non-negotiable." : "Use QBR to introduce expansion path." },
                { tag: "Sentiment", play: focus.sentiment < 60 ? "Run a 30-min listening session with the champion." : "Ask for a quote / referral while sentiment is warm." },
              ].map((m, i) => (
                <div key={i} className="bg-card p-5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-secondary-accent mb-2">
                    {m.tag}
                  </div>
                  <p className="text-sm">{m.play}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}
    </AnalyticsShell>
  );
}
