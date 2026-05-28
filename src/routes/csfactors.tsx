import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Maximize2, X } from "lucide-react";
import { CSFactorsSidebar } from "@/components/csfactors/CSFactorsSidebar";
import { MobileNavDrawer } from "@/components/csfactors/MobileNavDrawer";
import { WorkspacePane } from "@/components/csfactors/WorkspacePane";
import { QFilterProvider, useQFilter, applyQFilter } from "@/components/csfactors/QFilterContext";
import { AddAccountDialog } from "@/components/csfactors/AddAccountDialog";
import { ImportCsvDialog } from "@/components/csfactors/ImportCsvDialog";
import { BurningThree } from "@/components/csfactors/BurningThree";
import { AnalyticsHeader } from "@/components/csfactors/AnalyticsHeader";
import { AccountsGrid } from "@/components/csfactors/AccountsGrid";
import { AccountDrawer } from "@/components/csfactors/AccountDrawer";
import { QAgentDrawer, QAgentDock } from "@/components/csfactors/QAgentDrawer";
import { QErrorBoundary } from "@/components/site/QErrorBoundary";
import { QMark } from "@/components/site/QMark";
import { MetricCard, MetricGrid } from "@/components/dashboard/MetricCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { ProgressGauge } from "@/components/dashboard/ProgressGauge";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import { TierGateOverlay } from "@/components/site/TierGateOverlay";
import { listAccounts, type CSAccount } from "@/lib/csfactors.functions";
import { askCSFactorsQ } from "@/lib/csfactors-q.functions";
import { toast } from "sonner";


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
  return (
    <QFilterProvider>
      <CSFactorsPageInner />
    </QFilterProvider>
  );
}

function CSFactorsPageInner() {
  const { user, loading: authLoading } = useAuth();
  const { designation, loading: entLoading } = useEntitlements();
  const qc = useQueryClient();
  const list = useServerFn(listAccounts);
  const ask = useServerFn(askCSFactorsQ);
  const { filter, setFilter, applyPrompt } = useQFilter();
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  // Operator-tier gate
  if (!authLoading && !entLoading && user) {
    const rank = { reader: 0, practitioner: 1, operator: 2, team: 3, scale: 4, enterprise: 5, strategic_partner: 6 } as const;
    if (rank[designation] < rank.operator) {
      return (
        <TierGateOverlay
          requiredTier="operator"
          title="CSFactors is the Operator unlock."
          description="Your personal CS command center — 32-field account matrix, stakeholder power-map, contract vault. Available from the Operator tier."
          ctaLabel="Upgrade to Operator"
        />
      );
    }
  }

  const { data: allAccounts = [], isLoading } = useQuery({
    queryKey: ["cs-accounts"],
    queryFn: () => list(),
    enabled: !!user,
  });

  const accounts = useMemo(() => applyQFilter(allAccounts, filter), [allAccounts, filter]);

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

  const dockAsk = useMutation({
    mutationFn: async (q: string) => ask({ data: { question: q, history: [] } }),
    onSuccess: (res) => {
      toast.message("Q says", { description: res.reply?.slice(0, 280) ?? "(no reply)" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleDockSubmit(text: string) {
    const applied = applyPrompt(text);
    if (applied) {
      toast.success(`Filter applied: ${applied.label}`);
    } else {
      dockAsk.mutate(text);
    }
  }

  function handleChip(text: string) {
    const applied = applyPrompt(text);
    if (applied) toast.success(`Filter applied: ${applied.label}`);
    else setQOpen(true);
  }

  function onRowClick(a: CSAccount) {
    setDrawerId(a.id);
  }

  return (
    <div className="min-h-screen flex bg-background">
      <CSFactorsSidebar onOpenWorkspace={() => setWorkspaceOpen(true)} />
      <main className="flex-1 min-w-0">
        {/* Mobile sticky header */}
        <div className="md:hidden sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-3 py-2 flex items-center justify-between gap-2">
          <MobileNavDrawer onOpenWorkspace={() => setWorkspaceOpen(true)} />
          <Link to="/csfactors" className="flex items-center gap-1.5 font-display text-sm tracking-tight">
            <QMark className="h-5 w-5" /> CSFactors
          </Link>
          <ThemeToggle />
        </div>

        <div className="max-w-[1600px] mx-auto px-4 md:px-10 pt-6 md:pt-10 pb-32 animate-fade-up">
          {/* Active filter badge */}
          {filter ? (
            <div className="mb-4 flex items-center gap-2">
              <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/40 text-accent px-3 py-1.5 font-mono text-xs uppercase tracking-[0.2em]">
                Active filter: {filter.label}
                <button
                  type="button"
                  onClick={() => setFilter(null)}
                  className="hover:opacity-70"
                  aria-label="Clear filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ) : null}

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-6 mb-8 md:mb-10 pb-6 border-b border-border">
            <div className="min-w-0">
              <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent font-semibold mb-3">
                CSFactors / Command Center
              </div>
              <h1 className="font-display text-3xl md:text-6xl leading-[0.95] tracking-tight">
                {greeting()},{" "}
                <span className="italic text-accent">{firstName}.</span>
              </h1>
              <p className="text-foreground/70 mt-3 max-w-2xl text-sm md:text-base">
                Your portfolio at a glance. Account matrix, stakeholder power-map, and contract vault — written for one person: you.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="hidden md:inline-flex"><ThemeToggle /></span>
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
              <section className="mb-10" id="reminders">
                <BurningThree accounts={accounts} />
              </section>

              <section className="mb-10">
                <AnalyticsHeader accounts={accounts} />
              </section>

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

              <SectionCard
                title="Master Account Matrix"
                eyebrow="Accounts"
                description="32 fields per account. Click any row to open the optimization drawer. Name and UCC stay frozen as you scroll right."
                className="mb-10"
                actions={
                  <button
                    type="button"
                    onClick={() => setFullscreen(true)}
                    className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.2em] border border-border hover:border-accent hover:text-accent px-3 py-1.5 transition-colors"
                    title="Expand matrix to full screen"
                  >
                    <Maximize2 className="h-3 w-3" />
                    Fullscreen
                  </button>
                }
              >
                {isLoading ? (
                  <p className="text-sm text-muted-foreground py-6">Loading…</p>
                ) : accounts.length === 0 ? (
                  <div className="py-12 text-center" id="accounts">
                    <p className="text-sm text-foreground/70 mb-4">
                      {filter ? "No accounts match the active filter." : "No accounts yet. Add one or import a CSV."}
                    </p>
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

      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-[98vw] w-[98vw] h-[95vh] p-0 flex flex-col bg-background border-border">
          <header className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent font-semibold mb-1">
                Accounts · Fullscreen
              </div>
              <h2 className="font-display text-xl tracking-tight">Master Account Matrix</h2>
            </div>
          </header>
          <div className="flex-1 overflow-auto p-6">
            <AccountsGrid accounts={accounts} onRowClick={onRowClick} />
          </div>
        </DialogContent>
      </Dialog>

      <WorkspacePane open={workspaceOpen} onOpenChange={setWorkspaceOpen} />

      {/* Bottom-anchored Ask Q dock + deep drawer */}
      <QErrorBoundary label="Q · CSFactors">
        {user ? <QAgentDock onSubmit={handleDockSubmit} onChip={handleChip} /> : null}
        <QAgentDrawer open={qOpen} onOpenChange={setQOpen} />
      </QErrorBoundary>
    </div>
  );
}


