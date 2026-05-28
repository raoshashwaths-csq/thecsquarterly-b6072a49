import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CSFactorsSidebar } from "@/components/csfactors/CSFactorsSidebar";
import { AddAccountDialog } from "@/components/csfactors/AddAccountDialog";
import { ImportCsvDialog } from "@/components/csfactors/ImportCsvDialog";
import { BurningThree } from "@/components/csfactors/BurningThree";
import { MetricCard, MetricGrid } from "@/components/dashboard/MetricCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { HealthChip, QBRText } from "@/components/dashboard/HealthChip";
import { ProgressGauge } from "@/components/dashboard/ProgressGauge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import {
  listAccounts, updateAccount, logAccountEvent,
  type CSAccount, type QBRStatus,
} from "@/lib/csfactors.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/csfactors")({
  head: () => ({
    meta: [
      { title: "CSFactors — CS Quarterly Executive Pulse" },
      { name: "description", content: "Executive dashboard for current-quarter revenue protection and QBR tracking. Personalized to you." },
      { property: "og:title", content: "CSFactors — Executive Pulse" },
      { property: "og:description", content: "Cross-platform CS executive dashboard for revenue protection and QBR tracking." },
    ],
    links: [{ rel: "canonical", href: "/csfactors" }],
  }),
  component: CSFactorsPage,
});

function compact(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function CSFactorsPage() {
  const { user, loading: authLoading } = useAuth();
  const qc = useQueryClient();
  const list = useServerFn(listAccounts);
  const update = useServerFn(updateAccount);
  const logEv = useServerFn(logAccountEvent);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["cs-accounts"],
    queryFn: () => list(),
    enabled: !!user,
  });

  const totalARR = useMemo(() => accounts.reduce((s, a) => s + Number(a.arr), 0), [accounts]);
  const atRisk = useMemo(
    () => accounts.filter((a) => a.health < 50).reduce((s, a) => s + Number(a.arr), 0),
    [accounts],
  );
  const compliance = useMemo(() => {
    if (!accounts.length) return 0;
    const done = accounts.filter((a) => a.qbr_status === "Completed").length;
    return Math.round((done / accounts.length) * 100);
  }, [accounts]);

  async function setQBR(a: CSAccount, next: QBRStatus) {
    await update({ data: { id: a.id, patch: { qbr_status: next } } });
    await logEv({ data: { account_id: a.id, kind: "qbr.override", payload: { from: a.qbr_status, to: next } } });
    await qc.invalidateQueries({ queryKey: ["cs-accounts"] });
    toast.success(`${a.name}: QBR ${next.toLowerCase()}`);
  }

  const firstName = (user?.user_metadata?.display_name || user?.email?.split("@")[0] || "operator")
    .split(" ")[0];

  return (
    <div className="min-h-screen flex bg-background">
      <CSFactorsSidebar />
      <main className="flex-1 min-w-0">
        <div className="max-w-7xl mx-auto px-6 md:px-10 pt-10 pb-24 animate-fade-up">
          {/* Personalized header */}
          <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 pb-6 border-b border-border">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent font-semibold mb-3">
                CSFactors / Executive Console
              </div>
              <h1 className="font-display text-4xl md:text-6xl leading-[0.95] tracking-tight">
                {greeting()},{" "}
                <span className="italic text-accent">{firstName}.</span>
              </h1>
              <p className="text-foreground/70 mt-3 max-w-2xl">
                Your portfolio at a glance. Gainsight depth, Totango agility — written for one person: you.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ImportCsvDialog />
              <AddAccountDialog />
            </div>
          </header>

          {/* Auth gate */}
          {!authLoading && !user ? (
            <div className="border border-dashed border-border bg-card p-10 text-center">
              <p className="text-sm text-foreground/70 mb-4">
                Sign in to see your personalized executive pulse.
              </p>
              <Link to="/login" className="font-mono text-[11px] uppercase tracking-widest border-b border-foreground/40 hover:text-accent hover:border-accent pb-1">
                Sign in →
              </Link>
            </div>
          ) : (
            <>
              {/* Burning Three */}
              <section className="mb-10">
                <BurningThree accounts={accounts} />
              </section>

              {/* Metric Pillars */}
              <section className="mb-10">
                <MetricGrid cols={3}>
                  <MetricCard
                    eyebrow="Total Portfolio ARR"
                    value={compact(totalARR)}
                    accent="accent"
                    trend={accounts.length ? `${accounts.length} accounts tracked` : "Add your first account"}
                    trendDirection="flat"
                  />
                  <MetricCard
                    eyebrow="ARR At Immediate Risk"
                    value={compact(atRisk)}
                    accent="danger"
                    trend="Health below 50"
                    trendDirection="down"
                  />
                  <MetricCard
                    eyebrow="QBR Compliance"
                    value={compliance}
                    unit="%"
                    accent="secondary"
                    footer={
                      <ProgressGauge value={compliance} accent={compliance >= 75 ? "success" : compliance >= 50 ? "secondary" : "danger"} />
                    }
                  />
                </MetricGrid>
              </section>

              {/* Portfolio Grid */}
              <SectionCard
                title="Portfolio & Execution Grid"
                eyebrow="Accounts"
                description="Live override. Changes recalculate the pulse layer above instantly."
                actions={
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {accounts.length} accounts
                  </span>
                }
              >
                {isLoading ? (
                  <p className="text-sm text-muted-foreground py-6">Loading…</p>
                ) : accounts.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm text-foreground/70 mb-4">No accounts yet. Add one or import a CSV.</p>
                    <div className="inline-flex gap-2">
                      <AddAccountDialog />
                      <ImportCsvDialog />
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-6">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40">
                        <tr className="text-left font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          <th className="px-6 py-3 font-semibold">Account</th>
                          <th className="px-4 py-3 font-semibold">ARR</th>
                          <th className="px-4 py-3 font-semibold">Renewal</th>
                          <th className="px-4 py-3 font-semibold text-center">Health</th>
                          <th className="px-4 py-3 font-semibold">QBR</th>
                          <th className="px-6 py-3 font-semibold text-right">Override</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accounts.map((a) => (
                          <tr key={a.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4">
                              <Link
                                to="/csfactors/$accountId"
                                params={{ accountId: a.id }}
                                className="font-display text-base font-semibold leading-tight hover:text-accent"
                              >
                                {a.name}
                              </Link>
                              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                                {a.tier}
                              </div>
                            </td>
                            <td className="px-4 py-4 font-mono tabular-nums">
                              ${Number(a.arr).toLocaleString("en-US")}
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center px-2.5 py-1 bg-muted text-foreground/80 font-mono text-[11px] tracking-wide border border-border">
                                {a.renewal_quarter}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <HealthChip score={a.health} />
                            </td>
                            <td className="px-4 py-4">
                              <QBRText status={a.qbr_status as QBRStatus} />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Select value={a.qbr_status} onValueChange={(v) => setQBR(a, v as QBRStatus)}>
                                <SelectTrigger className="w-[180px] h-9 bg-background ml-auto">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Completed">Mark Completed</SelectItem>
                                  <SelectItem value="Scheduled">Mark Scheduled</SelectItem>
                                  <SelectItem value="Overdue">Flag Overdue</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
