import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { TierGateOverlay } from "@/components/site/TierGateOverlay";
import { BurningThree } from "@/components/csfactors/BurningThree";
import { AnalyticsHeader } from "@/components/csfactors/AnalyticsHeader";
import { AccountsGrid } from "@/components/csfactors/AccountsGrid";
import { AccountDrawer } from "@/components/csfactors/AccountDrawer";
import { MetricCard, MetricGrid } from "@/components/dashboard/MetricCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { ProgressGauge } from "@/components/dashboard/ProgressGauge";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import { listAccounts, type CSAccount } from "@/lib/csfactors.functions";

export const Route = createFileRoute("/account/executive/analytics")({
  head: () => ({
    meta: [
      { title: "Executive Analytics — The CS Quarterly" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Portfolio analytics, stakeholder risk matrices, and real-time NPS tracking for CS operators." },
    ],
  }),
  component: ExecutiveAnalyticsPage,
});

function compact(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function ExecutiveAnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const ent = useEntitlements();
  const qc = useQueryClient();
  const list = useServerFn(listAccounts);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["exec-analytics-accounts"],
    queryFn: () => list(),
    enabled: !!user && ent.canExecAnalytics,
  });

  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [teamScope, setTeamScope] = useState<"me" | "team">("me");
  const drawerAccount = useMemo(
    () => accounts.find((a) => a.id === drawerId) ?? null,
    [accounts, drawerId],
  );

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

  // While entitlement query loads, show the shell so we don't flash the gate.
  if (authLoading || ent.loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 max-w-5xl mx-auto px-6 py-16 w-full">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-4">
            Loading…
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 max-w-5xl mx-auto px-6 py-16 w-full text-center">
          <p className="text-foreground/70 mb-4">Sign in to view executive analytics.</p>
          <Link to="/login" className="font-mono text-xs uppercase tracking-widest border-b border-foreground/40 hover:text-accent hover:border-accent pb-1">
            Sign in →
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-[1600px] mx-auto px-6 md:px-10 py-12 w-full">
        <header className="mb-10 pb-6 border-b border-border">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-3 font-semibold">
            Account / Executive Analytics
          </div>
          <h1 className="font-display text-4xl md:text-6xl leading-[0.95] tracking-tight">
            Portfolio command{" "}
            <span className="italic text-accent">center.</span>
          </h1>
          <p className="text-foreground/70 mt-3 max-w-2xl">
            Stakeholder risk matrices, real-time NPS, and renewal pressure across your book of business.
          </p>

          {ent.canTeamScope ? (
            <div className="mt-6 inline-flex items-stretch border border-border">
              <button
                type="button"
                onClick={() => setTeamScope("me")}
                className={`px-4 py-2 font-mono text-xs uppercase tracking-[0.25em] transition-colors ${
                  teamScope === "me" ? "bg-foreground text-background" : "hover:bg-muted"
                }`}
              >
                My accounts
              </button>
              <button
                type="button"
                onClick={() => setTeamScope("team")}
                className={`px-4 py-2 font-mono text-xs uppercase tracking-[0.25em] transition-colors ${
                  teamScope === "team" ? "bg-foreground text-background" : "hover:bg-muted"
                }`}
              >
                Whole team
              </button>
            </div>
          ) : null}
        </header>

        <section className="mb-10">
          <BurningThree accounts={accounts} />
        </section>

        <section className="mb-10">
          <AnalyticsHeader accounts={accounts} />
        </section>

        <section className="mb-10">
          <MetricGrid cols={3}>
            <MetricCard
              eyebrow="Total Portfolio ARR"
              value={compact(totalARR)}
              accent="accent"
              trend={accounts.length ? `${accounts.length} accounts` : "Add your first account"}
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

        <SectionCard
          title="Master Account Matrix"
          eyebrow="Accounts"
          description={
            ent.canTeamScope && teamScope === "team"
              ? "Aggregate portfolio scoped to your whole team."
              : "Your isolated book of business — 32 fields per account."
          }
        >
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6">Loading…</p>
          ) : accounts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-foreground/70 mb-4">No accounts yet.</p>
              <Link to="/csfactors" className="font-mono text-xs uppercase tracking-widest border-b border-foreground/40 hover:text-accent hover:border-accent pb-1">
                Open CSFactors to add →
              </Link>
            </div>
          ) : (
            <AccountsGrid accounts={accounts} onRowClick={(a: CSAccount) => setDrawerId(a.id)} />
          )}
        </SectionCard>
      </main>
      <SiteFooter />

      <AccountDrawer
        account={drawerAccount}
        open={!!drawerId}
        onOpenChange={(o) => {
          if (!o) {
            setDrawerId(null);
            qc.invalidateQueries({ queryKey: ["exec-analytics-accounts"] });
          }
        }}
      />

      {/* Tier gate — rendered LAST so it sits above the page */}
      {!ent.canExecAnalytics ? (
        <TierGateOverlay
          requiredTier="operator"
          title="Unlock the CS Factors Command Center"
          description="Upgrade to Operator or Team to manage your portfolio, evaluate stakeholder risk matrices, and run real-time NPS tracking computations."
        />
      ) : null}
    </div>
  );
}
