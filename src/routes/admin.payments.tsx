import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { getMe } from "@/lib/auth.functions";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { MetricCard, MetricGrid } from "@/components/dashboard/MetricCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { HealthChip } from "@/components/dashboard/HealthChip";
import { getPaddleEnvironment } from "@/lib/paddle";
import { getPaymentsAnalytics } from "@/lib/payments-analytics.functions";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({
    meta: [
      { title: "Payments Analytics · The CS Quarterly" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaymentsAnalyticsPage,
});

function fmtUSD(cents: number) {
  return `$${Math.round(cents / 100).toLocaleString()}`;
}

function fmtPct(n: number, digits = 1) {
  return `${(n * 100).toFixed(digits)}%`;
}

function PaymentsAnalyticsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const fetchMe = useServerFn(getMe);
  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe(), enabled: !!user });

  const env = getPaddleEnvironment();
  const fetchAnalytics = useServerFn(getPaymentsAnalytics);
  const analytics = useQuery({
    queryKey: ["payments-analytics", env],
    queryFn: () => fetchAnalytics({ data: { environment: env } }),
    enabled: !!me.data?.isAdmin,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  if (me.data && !me.data.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center px-6 py-20 text-center">
          <div>
            <div className="font-mono uppercase tracking-widest text-xs text-accent mb-3">Restricted</div>
            <h1 className="font-display text-4xl mb-4">Editorial access only.</h1>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const d = analytics.data;
  const churnTone =
    d && d.totals.churnRate30d > 0.1 ? "danger"
    : d && d.totals.churnRate30d > 0.05 ? "warn"
    : "success";

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-[1400px] mx-auto px-6 py-10 w-full">
        <div className="mb-8 flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-2">
              Payments analytics · {env === "sandbox" ? "Test" : "Live"}
            </div>
            <h1 className="font-display text-5xl">Conversion, tier mix, churn.</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Sourced from Paddle subscription events synced into the platform. Last refreshed{" "}
              {d ? new Date(d.generatedAt).toLocaleTimeString() : "—"}.
            </p>
          </div>
          <Link
            to="/admin"
            className="font-mono text-xs uppercase tracking-[0.25em] border border-border px-3 py-2 hover:bg-muted/40"
          >
            ← Newsroom
          </Link>
        </div>

        {analytics.isLoading && (
          <div className="border border-border p-10 text-center text-sm text-muted-foreground">
            Loading subscription events…
          </div>
        )}
        {analytics.error && (
          <div className="border border-destructive/40 bg-destructive/5 p-6 text-sm">
            {(analytics.error as Error).message}
          </div>
        )}

        {d && (
          <div className="space-y-8">
            <MetricGrid cols={4}>
              <MetricCard
                eyebrow="Active paid members"
                value={d.totals.activePaid}
                trend={`${d.totals.netNew30d} new in last 30d`}
                trendDirection={d.totals.netNew30d > 0 ? "up" : "flat"}
                topAccent="gold"
              />
              <MetricCard
                eyebrow="MRR"
                value={fmtUSD(d.totals.mrrCents)}
                trend={`ARR ${fmtUSD(d.totals.arrCents)}`}
                trendDirection="up"
                topAccent="success"
              />
              <MetricCard
                eyebrow="30-day churn"
                value={fmtPct(d.totals.churnRate30d)}
                trend={`${d.totals.canceled30d} canceled · 90d: ${d.totals.canceled90d}`}
                trendDirection={d.totals.churnRate30d > 0.05 ? "down" : "flat"}
                topAccent={churnTone}
              />
              <MetricCard
                eyebrow="Checkout conversion"
                value={
                  d.conversion.available && d.conversion.rate !== null
                    ? fmtPct(d.conversion.rate)
                    : "—"
                }
                trend={
                  d.conversion.available
                    ? `${d.conversion.completed ?? 0} of ${d.conversion.started ?? 0} sessions`
                    : d.conversion.error ?? "Awaiting Paddle data"
                }
                trendDirection="flat"
                topAccent="secondary"
              />
            </MetricGrid>

            <SectionCard
              eyebrow="By tier"
              title="Active members and recurring revenue"
              description="Counts include active, trialing and past-due subscriptions in the current environment."
            >
              {d.byTier.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No paid subscriptions in the {env === "sandbox" ? "test" : "live"} environment yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">Tier</th>
                        <th className="text-right py-2 px-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">Active</th>
                        <th className="text-right py-2 px-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">Monthly $</th>
                        <th className="text-right py-2 px-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">MRR</th>
                        <th className="text-right py-2 px-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">Canceled 30d</th>
                        <th className="text-right py-2 pl-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.byTier.map((t) => {
                        const share = d.totals.activePaid > 0 ? t.active / d.totals.activePaid : 0;
                        return (
                          <tr key={t.designation} className="border-b border-border/60 last:border-b-0">
                            <td className="py-3 pr-4 font-medium">{t.label}</td>
                            <td className="py-3 px-2 text-right">{t.active}</td>
                            <td className="py-3 px-2 text-right text-muted-foreground">${t.monthlyValue}</td>
                            <td className="py-3 px-2 text-right">{fmtUSD(t.mrrCents)}</td>
                            <td className="py-3 px-2 text-right">
                              {t.canceled30d > 0 ? (
                                <span className="text-destructive">{t.canceled30d}</span>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              )}
                            </td>
                            <td className="py-3 pl-2 text-right font-mono text-xs">{fmtPct(share, 0)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>

            <SectionCard
              eyebrow="Acquisition"
              title="New paid subscriptions — last 30 days"
              description="Daily count of new paid subscriptions created by Paddle subscription.created events."
            >
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={d.signups30d} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => v.slice(5)}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <RTooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                      labelFormatter={(l) => `Day ${l}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--accent))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Churn"
              title="Recent cancellations"
              description="Paddle subscription.canceled events in the last 30 days."
            >
              {d.recentCancels.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No cancellations in the last 30 days. <HealthChip tone="success" label="Healthy" />
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {d.recentCancels.map((c) => (
                    <li key={c.paddle_subscription_id ?? c.updated_at} className="py-3 flex items-center justify-between gap-4 text-sm">
                      <div>
                        <div className="font-medium">{c.designation ?? "—"}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {c.paddle_subscription_id ?? "no paddle id"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          {new Date(c.updated_at).toLocaleDateString()}
                        </div>
                        {c.current_period_end && (
                          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                            Access until {new Date(c.current_period_end).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
