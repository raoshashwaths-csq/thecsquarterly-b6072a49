import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { CSFactorsSidebar } from "@/components/csfactors/CSFactorsSidebar";
import { MobileNavDrawer } from "@/components/csfactors/MobileNavDrawer";
import { CSFLogo } from "@/components/csfactors/CSFLogo";
import { WorkspacePane } from "@/components/csfactors/WorkspacePane";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { MetricCard, MetricGrid } from "@/components/dashboard/MetricCard";
import { ProgressGauge } from "@/components/dashboard/ProgressGauge";
import { BurningThree } from "@/components/csfactors/BurningThree";
import { AnalyticsHeader } from "@/components/csfactors/AnalyticsHeader";
import { AccountsGrid } from "@/components/csfactors/AccountsGrid";
import { AccountDrawer } from "@/components/csfactors/AccountDrawer";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import { TierGateOverlay } from "@/components/site/TierGateOverlay";
import { NrrWaterfallView } from "@/components/csfactors/threeSixty/NrrWaterfallView";
import { RetentionFunnelView } from "@/components/csfactors/threeSixty/RetentionFunnelView";
import { StakeholderRadarView } from "@/components/csfactors/threeSixty/StakeholderRadarView";
import { TeamLeaderboardView } from "@/components/csfactors/threeSixty/TeamLeaderboardView";
import { listAccounts, type CSAccount } from "@/lib/csfactors.functions";

export const Route = createFileRoute("/csfactors/360")({
  head: () => ({
    meta: [
      { title: "360 Dashboard — CSFactors" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "All four analytics lenses on a single consolidated page: NRR waterfall, retention funnel, stakeholder radar, and team leaderboard." },
    ],
  }),
  component: ThreeSixtyPage,
});

const LENSES = [
  { id: "portfolio",    label: "Portfolio Command",  to: "/account/executive/analytics" as const },
  { id: "nrr",          label: "NRR Waterfall",      to: "/account/analytics/nrr-waterfall" as const },
  { id: "retention",    label: "Retention Funnel",   to: "/account/analytics/retention-funnel" as const },
  { id: "stakeholders", label: "Stakeholder Radar",  to: "/account/analytics/stakeholder-radar" as const },
  { id: "team",         label: "Team Leaderboard",   to: "/account/analytics/team-leaderboard" as const },
];

function StandaloneLink({ to }: { to: typeof LENSES[number]["to"] }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-accent border border-border hover:border-accent px-2.5 py-1 transition-colors"
    >
      Standalone
      <ArrowUpRight className="h-3 w-3" />
    </Link>
  );
}

function compact(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function ThreeSixtyPage() {
  const { user, loading: authLoading } = useAuth();
  const ent = useEntitlements();
  const { designation, loading: entLoading } = ent;
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
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

  if (!authLoading && !entLoading && user) {
    const rank = { reader: 0, practitioner: 1, operator: 2, team: 3, scale: 4, enterprise: 5, strategic_partner: 6 } as const;
    if (rank[designation] < rank.operator) {
      return (
        <TierGateOverlay
          requiredTier="operator"
          title="The 360 Dashboard is the Operator unlock."
          description="All four analytics lenses together on one consolidated page. Available from the Operator tier."
          ctaLabel="Upgrade to Operator"
        />
      );
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      <CSFactorsSidebar onOpenWorkspace={() => setWorkspaceOpen(true)} />
      <main className="flex-1 min-w-0">
        <div className="md:hidden sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-3 py-2 flex items-center justify-between gap-2">
          <MobileNavDrawer onOpenWorkspace={() => setWorkspaceOpen(true)} />
          <Link to="/csfactors" aria-label="CSFactors home">
            <CSFLogo size="md" />
          </Link>
          <ThemeToggle />
        </div>

        <div className="max-w-[1600px] mx-auto px-4 md:px-10 pt-4 md:pt-10 pb-32 animate-fade-up">
          <Link
            to="/csfactors"
            className="mb-5 inline-flex items-center gap-2 font-mono uppercase tracking-[0.22em] text-xs text-muted-foreground hover:text-accent border-b border-transparent hover:border-accent pb-1 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Pulse
          </Link>

          <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 md:mb-10 pb-6 border-b border-border">
            <div className="min-w-0">
              <div className="font-mono uppercase tracking-[0.3em] text-secondary-accent font-semibold mb-3 text-xs">
                CSFactors / 360 Dashboard
              </div>
              <h1 className="font-display text-4xl md:text-6xl leading-[0.95] tracking-tight">
                Every lens, <span className="italic text-accent">one page.</span>
              </h1>
              <p className="text-foreground/70 mt-3 max-w-2xl text-sm md:text-base">
                NRR movement, retention drop-off, stakeholder posture, and team performance — read in one scroll.
              </p>
            </div>
            <span className="hidden md:inline-flex"><ThemeToggle /></span>
          </header>

          <nav
            aria-label="Jump to lens"
            className="mb-8 md:mb-10 -mx-4 md:mx-0 px-4 md:px-0 overflow-x-auto md:sticky md:top-4 md:z-20"
          >
            <ul className="flex items-center gap-1 md:gap-2 min-w-max md:min-w-0 bg-card/80 backdrop-blur border border-border md:w-fit px-2 py-2">
              {LENSES.map((l) => (
                <li key={l.id}>
                  <a
                    href={`#${l.id}`}
                    className="inline-flex font-mono uppercase tracking-[0.2em] text-xs text-foreground/70 hover:text-accent px-3 py-1.5 whitespace-nowrap transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {!authLoading && !user ? (
            <div className="border border-dashed border-border bg-card p-10 text-center">
              <p className="text-sm text-foreground/70 mb-4">Sign in to see the 360 Dashboard.</p>
              <Link to="/login" className="font-mono text-xs uppercase tracking-widest border-b border-foreground/40 hover:text-accent hover:border-accent pb-1">
                Sign in →
              </Link>
            </div>
          ) : (
            <div className="space-y-10">
              <section id="portfolio" className="scroll-mt-24 space-y-8">
                <SectionCard
                  eyebrow="Lens 00 / Portfolio Command"
                  title="Burning Three"
                  description="The three accounts most likely to detonate this quarter — by ARR weight × risk."
                >
                  <BurningThree accounts={accounts} />
                </SectionCard>

                <SectionCard eyebrow="Portfolio" title="Analytics overview">
                  <AnalyticsHeader accounts={accounts} />
                </SectionCard>

                {ent.canTeamScope ? (
                  <div className="inline-flex items-stretch border border-border">
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
              </section>

              <section id="nrr" className="scroll-mt-24">
                <SectionCard
                  eyebrow="Lens 01 / Revenue Movement"
                  title="NRR Waterfall"
                  description="Starting ARR through expansion, contraction, and churn to ending ARR."
                  actions={<StandaloneLink to="/account/analytics/nrr-waterfall" />}
                >
                  <NrrWaterfallView />
                </SectionCard>
              </section>

              <section id="retention" className="scroll-mt-24">
                <SectionCard
                  eyebrow="Lens 02 / Cohort"
                  title="Retention Funnel"
                  description="Stage-by-stage drop-off across the customer lifecycle."
                  actions={<StandaloneLink to="/account/analytics/retention-funnel" />}
                >
                  <RetentionFunnelView />
                </SectionCard>
              </section>

              <section id="stakeholders" className="scroll-mt-24">
                <SectionCard
                  eyebrow="Lens 03 / Account Health"
                  title="Stakeholder Radar"
                  description="Five-axis pentagon across health, NPS, implementation, QBR cadence, and sentiment."
                  actions={<StandaloneLink to="/account/analytics/stakeholder-radar" />}
                >
                  <StakeholderRadarView />
                </SectionCard>
              </section>

              <section id="team" className="scroll-mt-24">
                <SectionCard
                  eyebrow="Lens 04 / People"
                  title="Team Leaderboard"
                  description="CSM-level performance: book of business, average health, and QBR completion."
                  actions={<StandaloneLink to="/account/analytics/team-leaderboard" />}
                >
                  <TeamLeaderboardView />
                </SectionCard>
              </section>
            </div>
          )}
        </div>
      </main>

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

      <WorkspacePane open={workspaceOpen} onOpenChange={setWorkspaceOpen} />
    </div>
  );
}
