import { createFileRoute, Link } from "@tanstack/react-router";
import { LumiRouteLoader } from "@/components/site/LumiRouteLoader";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { TrendingDown, GitMerge, Radar, Trophy, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/account/analytics/")({
  pendingComponent: LumiRouteLoader,
  head: () => ({
    meta: [
      { title: "Analytics — The CS Quarterly" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Four operator-grade dashboards: retention funnel, NRR waterfall, stakeholder radar, team leaderboard." },
    ],
  }),
  component: AnalyticsIndex,
});

const CARDS = [
  {
    to: "/account/analytics/retention-funnel",
    eyebrow: "Cohort",
    title: "Retention Funnel",
    desc: "Stage-by-stage drop-off across the customer lifecycle. See where they leak.",
    icon: TrendingDown,
  },
  {
    to: "/account/analytics/nrr-waterfall",
    eyebrow: "Revenue Movement",
    title: "NRR Waterfall",
    desc: "Starting ARR through expansion, contraction, and churn to ending ARR.",
    icon: GitMerge,
  },
  {
    to: "/account/analytics/stakeholder-radar",
    eyebrow: "Account Health",
    title: "Stakeholder Radar",
    desc: "Five-axis pentagon of health, NPS, implementation, QBR cadence, and sentiment.",
    icon: Radar,
  },
  {
    to: "/account/analytics/team-leaderboard",
    eyebrow: "Team Performance",
    title: "Team Leaderboard",
    desc: "CSM-level ranking by ARR, average health, and QBR completion.",
    icon: Trophy,
  },
] as const;

function AnalyticsIndex() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-10 pt-8 md:pt-12 pb-24 animate-fade-up">
        <header className="mb-10 md:mb-14 pb-6 border-b border-border">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent font-semibold mb-3">
            Analytics / Dashboards
          </div>
          <h1 className="font-display text-3xl md:text-6xl leading-[0.95] tracking-tight">
            Four lenses on the <span className="not-italic text-accent">portfolio.</span>
          </h1>
          <p className="text-foreground/70 mt-3 max-w-2xl text-sm md:text-base">
            Built from your CSFactors data. No new entry required — switch lens, see the same accounts a different way.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-px bg-border border border-border">
          {CARDS.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.to}
                to={c.to}
                className="group bg-card p-6 md:p-8 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-6">
                  <Icon className="h-6 w-6 text-accent" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                </div>
                <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-2">
                  {c.eyebrow}
                </div>
                <h2 className="font-display text-2xl md:text-3xl tracking-tight mb-2">{c.title}</h2>
                <p className="text-sm text-foreground/65">{c.desc}</p>
              </Link>
            );
          })}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
