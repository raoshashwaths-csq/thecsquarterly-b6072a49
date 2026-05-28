import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Maximize2 } from "lucide-react";
import { CSFactorsSidebar } from "@/components/csfactors/CSFactorsSidebar";
import { AddAccountDialog } from "@/components/csfactors/AddAccountDialog";
import { ImportCsvDialog } from "@/components/csfactors/ImportCsvDialog";
import { BurningThree } from "@/components/csfactors/BurningThree";
import { AnalyticsHeader } from "@/components/csfactors/AnalyticsHeader";
import { AccountsGrid } from "@/components/csfactors/AccountsGrid";
import { AccountDrawer } from "@/components/csfactors/AccountDrawer";
import { QAgentDrawer, QAgentLauncher } from "@/components/csfactors/QAgentDrawer";
import { MetricCard, MetricGrid } from "@/components/dashboard/MetricCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { ProgressGauge } from "@/components/dashboard/ProgressGauge";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { listAccounts, type CSAccount } from "@/lib/csfactors.functions";


export const Route = createFileRoute("/csfactors")({
  head: () => ({
    meta: [
      { title: "CSFactors — Revenue Operations Command Center" },
      { name: "description", content: "High-density CS command center with 32-field account grid, stakeholder power-map, and contract vault. Personalized to you." },
      { property: "og:title", content: "CSFactors — Command Center" },
      { property: "og:description", content: "Account matrices, stakeholder mapping, and contract storage built for CS leaders." },
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

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["cs-accounts"],
    queryFn: () => list(),
    enabled: !!user,
  });

  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [qOpen, setQOpen] = useState(false);
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

  const firstName = (user?.user_metadata?.display_name || user?.email?.split("@")[0] || "operator")
    .split(" ")[0];

  function onRowClick(a: CSAccount) {
    setDrawerId(a.id);
  }

  return (
    <div className="min-h-screen flex bg-background">
      <CSFactorsSidebar />
      <main className="flex-1 min-w-0">
        <div className="max-w-[1600px] mx-auto px-6 md:px-10 pt-10 pb-24 animate-fade-up">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 pb-6 border-b border-border">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent font-semibold mb-3">
                CSFactors / Command Center
              </div>
              <h1 className="font-display text-4xl md:text-6xl leading-[0.95] tracking-tight">
                {greeting()},{" "}
                <span className="italic text-accent">{firstName}.</span>
              </h1>
              <p className="text-foreground/70 mt-3 max-w-2xl">
                Your portfolio at a glance. Account matrix, stakeholder power-map, and contract vault — written for one person: you.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ImportCsvDialog />
              <AddAccountDialog />
            </div>
          </header>

          {!authLoading && !user ? (
            <div className="border border-dashed border-border bg-card p-10 text-center">
              <p className="text-sm text-foreground/70 mb-4">
                Sign in to see your personalized command center.
              </p>
              <Link to="/login" className="font-mono text-[11px] uppercase tracking-widest border-b border-foreground/40 hover:text-accent hover:border-accent pb-1">
                Sign in →
              </Link>
            </div>
          ) : (
            <>
              {/* Burning Three */}
              <section className="mb-10" id="reminders">
                <BurningThree accounts={accounts} />
              </section>

              {/* Live analytics: NPS + CSM Sentiment */}
              <section className="mb-10">
                <AnalyticsHeader accounts={accounts} />
              </section>

              {/* Portfolio pillars */}
              <section className="mb-10" id="renewals">
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

              {/* Master grid */}
              <SectionCard
                title="Master Account Matrix"
                eyebrow="Accounts"
                description="32 fields per account. Click any row to open the optimization drawer. Name and UCC stay frozen as you scroll right."
                className="mb-10"
              >
                {isLoading ? (
                  <p className="text-sm text-muted-foreground py-6">Loading…</p>
                ) : accounts.length === 0 ? (
                  <div className="py-12 text-center" id="accounts">
                    <p className="text-sm text-foreground/70 mb-4">No accounts yet. Add one or import a CSV.</p>
                    <div className="inline-flex gap-2">
                      <AddAccountDialog />
                      <ImportCsvDialog />
                    </div>
                  </div>
                ) : (
                  <div id="accounts">
                    <AccountsGrid accounts={accounts} onRowClick={onRowClick} />
                  </div>
                )}
              </SectionCard>
            </>
          )}
        </div>
      </main>

      <AccountDrawer
        account={drawerAccount}
        open={!!drawerId}
        onOpenChange={(o) => {
          if (!o) {
            setDrawerId(null);
            qc.invalidateQueries({ queryKey: ["cs-accounts"] });
          }
        }}
      />
    </div>
  );
}
