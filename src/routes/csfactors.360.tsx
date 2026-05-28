import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, TrendingDown, GitMerge, Radar, Trophy } from "lucide-react";
import { CSFactorsSidebar } from "@/components/csfactors/CSFactorsSidebar";
import { MobileNavDrawer } from "@/components/csfactors/MobileNavDrawer";
import { CSFLogo } from "@/components/csfactors/CSFLogo";
import { WorkspacePane } from "@/components/csfactors/WorkspacePane";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { MetricCard, MetricGrid } from "@/components/dashboard/MetricCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { HealthChip } from "@/components/dashboard/HealthChip";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import { TierGateOverlay } from "@/components/site/TierGateOverlay";
import { listAccounts } from "@/lib/csfactors.functions";
import { useState } from "react";

export const Route = createFileRoute("/csfactors/360")({
  head: () => ({
    meta: [
      { title: "360 Dashboard — CSFactors" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Consolidated analytics view: retention funnel, NRR movement, stakeholder radar, and team performance — together on one page." },
    ],
  }),
  component: ThreeSixtyPage,
});

function compact(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

const LENSES = [
  {
    to: "/account/analytics" as const,
    eyebrow: "Executive",
    title: "Executive Portfolio",
    desc: "Open the four-lens index page in its own view.",
    Icon: Trophy,
  },
  {
    to: "/account/analytics/nrr-waterfall" as const,
    eyebrow: "Revenue Movement",
    title: "NRR Waterfall",
    desc: "Starting ARR through expansion, contraction, churn to ending ARR.",
    Icon: GitMerge,
  },
  {
    to: "/account/analytics/stakeholder-radar" as const,
    eyebrow: "Account Health",
    title: "Stakeholder Radar",
    desc: "Five-axis pentagon across health, NPS, implementation, QBR, sentiment.",
    Icon: Radar,
  },
  {
    to: "/account/analytics/retention-funnel" as const,
    eyebrow: "Cohort",
    title: "Retention Funnel",
    desc: "Stage-by-stage drop-off across the customer lifecycle.",
    Icon: TrendingDown,
  },
];

function ThreeSixtyPage() {
  const { user, loading: authLoading } = useAuth();
  const { designation, loading: entLoading } = useEntitlements();
  const list = useServerFn(listAccounts);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["cs-accounts"],
    queryFn: () => list(),
    enabled: !!user,
  });

  const summary = useMemo(() => {
    const total = accounts.length;
    const arr = accounts.reduce((s, a) => s + Number(a.arr || 0), 0);
    const atRiskArr = accounts.filter((a) => a.health < 50).reduce((s, a) => s + Number(a.arr || 0), 0);
    const avgHealth = total ? Math.round(accounts.reduce((s, a) => s + a.health, 0) / total) : 0;
    const qbrDone = accounts.filter((a) => a.qbr_status === "Completed").length;
    const qbrPct = total ? Math.round((qbrDone / total) * 100) : 0;
    const npsVals = accounts.map((a) => a.final_cs_nps).filter((n): n is number => n != null);
    const avgNps = npsVals.length ? Math.round(npsVals.reduce((s, n) => s + n, 0) / npsVals.length) : 0;
    return { total, arr, atRiskArr, avgHealth, qbrPct, avgNps };
  }, [accounts]);

  const lowest = useMemo(
    () => [...accounts].sort((a, b) => a.health - b.health).slice(0, 5),
    [accounts],
  );

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
                Portfolio-wide health, retention movement, and the accounts that need you most — consolidated.
              </p>
            </div>
            <span className="hidden md:inline-flex"><ThemeToggle /></span>
          </header>

          {isLoading ? (
            <p className="text-sm text-muted-foreground py-12">Loading…</p>
          ) : (
            <>
              <MetricGrid cols={4} className="mb-10">
                <MetricCard eyebrow="Accounts" value={summary.total} accent="neutral" trend="In portfolio" trendDirection="flat" />
                <MetricCard eyebrow="Total ARR" value={compact(summary.arr)} accent="accent" />
                <MetricCard
                  eyebrow="Avg Health"
                  value={summary.avgHealth}
                  accent={summary.avgHealth >= 75 ? "success" : summary.avgHealth >= 50 ? "secondary" : "danger"}
                  trend={`${summary.avgNps || "—"} avg NPS`}
                  trendDirection="flat"
                />
                <MetricCard
                  eyebrow="ARR at Risk"
                  value={compact(summary.atRiskArr)}
                  accent="danger"
                  trend={`${summary.qbrPct}% QBR done`}
                  trendDirection="down"
                />
              </MetricGrid>

              <SectionCard
                eyebrow="Attention Required"
                title="Lowest-health accounts"
                description="Sorted by lowest health first — your highest-leverage attention."
                className="mb-10"
              >
                {lowest.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6">No accounts yet. Add accounts in CSFactors.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {lowest.map((a) => (
                      <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-display text-base truncate">{a.name}</div>
                          <div className="font-mono uppercase tracking-widest text-xs text-muted-foreground mt-0.5">
                            {a.tier} · {compact(Number(a.arr || 0))} · {a.csm_name ?? "Unassigned"}
                          </div>
                        </div>
                        <HealthChip score={a.health} />
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>

              <SectionCard
                eyebrow="Deep dives"
                title="All four analytics lenses"
                description="Each lens opens its own dedicated dashboard with the full visualisation set."
              >
                <div className="grid md:grid-cols-2 gap-px bg-border border border-border">
                  {LENSES.map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      className="group bg-card p-6 md:p-8 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-6">
                        <l.Icon className="h-6 w-6 text-accent" />
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                      </div>
                      <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-2">
                        {l.eyebrow}
                      </div>
                      <h3 className="font-display text-2xl md:text-3xl tracking-tight mb-2">{l.title}</h3>
                      <p className="text-sm text-foreground/65">{l.desc}</p>
                    </Link>
                  ))}
                </div>
              </SectionCard>
            </>
          )}
        </div>
      </main>

      <WorkspacePane open={workspaceOpen} onOpenChange={setWorkspaceOpen} />
    </div>
  );
}
