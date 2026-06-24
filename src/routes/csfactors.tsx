import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, X } from "lucide-react";
import { CSFactorsSidebar } from "@/components/csfactors/CSFactorsSidebar";
import { MobileNavDrawer } from "@/components/csfactors/MobileNavDrawer";
import { WorkspacePane } from "@/components/csfactors/WorkspacePane";
import { QFilterProvider, useQFilter, applyQFilter } from "@/components/csfactors/QFilterContext";
import { AddAccountDialog } from "@/components/csfactors/AddAccountDialog";
import { ImportCsvDialog } from "@/components/csfactors/ImportCsvDialog";
import { AccountsGrid } from "@/components/csfactors/AccountsGrid";
import { AccountDrawer } from "@/components/csfactors/AccountDrawer";
import {
  LumiDrawerProvider,
  useLumiDrawer,
} from "@/components/csfactors/AskLumiDrawer";
import { LumiMark } from "@/components/site/LumiMark";
import { LumiBadgeButton } from "@/components/site/LumiBadgeButton";
import { CSFLogo } from "@/components/csfactors/CSFLogo";
import { PulseDashboard } from "@/components/csfactors/pulse/PulseDashboard";
import { TaggedLumiRunsWidget } from "@/components/csfactors/TaggedLumiRunsWidget";
import { QErrorBoundary } from "@/components/site/QErrorBoundary";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import { TierGateOverlay } from "@/components/site/TierGateOverlay";
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

function CSFactorsPage() {
  return (
    <QFilterProvider>
      <LumiDrawerProvider>
        <CSFactorsPageInner />
      </LumiDrawerProvider>
    </QFilterProvider>
  );
}

function AskLumiTrigger() {
  const lumi = useLumiDrawer();
  return (
    <LumiBadgeButton
      onClick={() => lumi.open()}
      data-state={lumi.isOpen ? "active" : "idle"}
      tone="cta"
    />
  );
}

function CSFactorsPageInner() {
  const { user, loading: authLoading } = useAuth();
  const { designation, loading: entLoading } = useEntitlements();
  const qc = useQueryClient();
  const list = useServerFn(listAccounts);
  const { filter, setFilter } = useQFilter();
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  // Pulse dashboard is designed for the midnight slate theme — force dark on this route.
  useMemo(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.add("dark");
    }
    return null;
  }, []);


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
  const drawerAccount = useMemo(
    () => accounts.find((a) => a.id === drawerId) ?? null,
    [accounts, drawerId],
  );

  const firstName = (user?.user_metadata?.display_name || user?.email?.split("@")[0] || "operator")
    .split(" ")[0];

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
          <Link to="/csfactors" aria-label="CSFactors home">
            <CSFLogo size="md" />
          </Link>
          <ThemeToggle />
        </div>

        <div className="max-w-[1600px] mx-auto px-4 md:px-10 pt-4 md:pt-10 pb-32 animate-fade-up">
          <Link
            to="/"
            className="mb-5 inline-flex items-center gap-2 font-mono uppercase tracking-[0.22em] text-xs text-muted-foreground hover:text-accent border-b border-transparent hover:border-accent pb-1 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to The CS Quarterly
          </Link>

          {filter ? (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/40 text-accent px-3 py-1.5 font-mono uppercase tracking-[0.2em] text-xs">
                Active filter: {filter.label}
                <button
                  type="button"
                  onClick={() => setFilter(null)}
                  className="hover:opacity-70 p-1 -m-1"
                  aria-label="Clear filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ) : null}

          {!authLoading && !user ? (
            <div className="border border-dashed border-border bg-card p-10 text-center">
              <p className="text-sm text-foreground/70 mb-4">
                Sign in to see your personalized command center.
              </p>
              <Link to="/login" className="font-mono text-xs uppercase tracking-widest border-b border-foreground/40 hover:text-accent hover:border-accent pb-1">
                Sign in →
              </Link>
            </div>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground py-6">Loading your portfolio…</p>
          ) : (
            <>
              <div className="mb-6 flex flex-wrap items-center justify-end gap-2">
                <span className="hidden md:inline-flex"><ThemeToggle /></span>
                <AskLumiTrigger />
                <ImportCsvDialog />
                <AddAccountDialog />
              </div>

              <QErrorBoundary label="Pulse">
                <PulseDashboard
                  accounts={accounts}
                  firstName={firstName}
                  onRowClick={onRowClick}
                />
              </QErrorBoundary>

              <div className="mt-8">
                <QErrorBoundary label="Tagged Lumi Runs">
                  <TaggedLumiRunsWidget />
                </QErrorBoundary>
              </div>
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
              <div className="eyebrow text-secondary-accent mb-1">Accounts · Fullscreen</div>
              <h2 className="font-display text-xl tracking-tight">Master Account Matrix</h2>
            </div>
          </header>
          <div className="flex-1 overflow-auto p-6">
            <AccountsGrid accounts={accounts} onRowClick={onRowClick} />
          </div>
        </DialogContent>
      </Dialog>

      <WorkspacePane open={workspaceOpen} onOpenChange={setWorkspaceOpen} />
    </div>
  );
}
