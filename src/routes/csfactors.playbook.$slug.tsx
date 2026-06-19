import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { ArrowLeft, AlertTriangle, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { HealthChip } from "@/components/dashboard/HealthChip";
import { listAccounts } from "@/lib/csfactors.functions";
import { listPlaybooks } from "@/lib/playbooks.functions";
import { runPlaybookOnPortfolio, hasPlaybookRunner } from "@/lib/playbook-runner";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/csfactors/playbook/$slug")({
  head: ({ params }) => ({
    meta: [{ title: `Run playbook on portfolio · ${params.slug}` }],
  }),
  component: PlaybookRunnerPage,
});

function PlaybookRunnerPage() {
  const { slug } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const fetchAccounts = useServerFn(listAccounts);
  const fetchPlaybooks = useServerFn(listPlaybooks);

  const accounts = useQuery({
    queryKey: ["accounts"],
    queryFn: () => fetchAccounts(),
    enabled: !!user,
  });
  const playbooks = useQuery({
    queryKey: ["playbooks"],
    queryFn: () => fetchPlaybooks(),
  });

  const pb = playbooks.data?.find((p) => p.slug === slug);
  const result = useMemo(
    () => (accounts.data ? runPlaybookOnPortfolio(slug, accounts.data) : null),
    [accounts.data, slug],
  );

  if (!loading && !user) {
    navigate({ to: "/login" });
    return null;
  }

  const supported = hasPlaybookRunner(slug);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="max-w-6xl w-full mx-auto px-6 pt-12 pb-20 flex-1 animate-fade-up">
        <Link
          to="/codex/$slug"
          params={{ slug }}
          className="inline-flex items-center gap-2 font-mono uppercase tracking-widest text-xs text-muted-foreground hover:text-accent mb-6"
        >
          <ArrowLeft size={14} /> Back to playbook
        </Link>
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-3">
          Playbook · Live on your portfolio
        </div>
        <h1 className="font-display text-4xl md:text-5xl leading-tight tracking-tight mb-3 max-w-3xl">
          {pb?.title ?? "Run this playbook"}
        </h1>
        <p className="text-foreground/70 max-w-2xl mb-10">
          We&rsquo;ve scanned your CSFactors portfolio for the exact signals this playbook describes. Each match comes with the next move suggested by the framework.
        </p>

        {!supported ? (
          <SectionCard title="Runner not yet wired" eyebrow="Coming soon">
            <p className="text-sm text-foreground/70">
              This playbook is published, but the automated portfolio scan for its specific signals is being tuned. In the meantime, open{" "}
              <Link to="/csfactors" className="text-accent underline">CSFactors</Link> to apply the framework manually.
            </p>
          </SectionCard>
        ) : accounts.isLoading || !result ? (
          <div className="font-mono uppercase tracking-widest text-xs text-muted-foreground">Scanning portfolio…</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard eyebrow="Accounts matched" value={String(result.insights.length)} topAccent="gold" />
              <MetricCard
                eyebrow="High-severity"
                value={String(result.insights.filter((i) => i.severity === "high").length)}
                topAccent="danger"
              />
              <MetricCard
                eyebrow="Combined ARR"
                value={`$${Math.round(
                  result.insights.reduce((s, i) => s + (i.arr ?? 0), 0) / 1000,
                )}K`}
                topAccent="secondary"
              />
            </div>

            <SectionCard
              title={result.headline}
              eyebrow="The signal"
              description={result.guidance}
            >
              {result.insights.length === 0 ? (
                <div className="flex items-center gap-3 text-sm text-foreground/70 py-6">
                  <Sparkles size={16} className="text-accent" />
                  Nothing in your portfolio currently matches this playbook&rsquo;s trigger. Re-run after your next CSFactors sync.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {result.insights.map((i) => (
                    <li key={i.accountId} className="py-4 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <Link
                            to="/csfactors/$accountId"
                            params={{ accountId: i.accountId }}
                            className="font-display text-lg hover:text-accent truncate"
                          >
                            {i.accountName}
                          </Link>
                          <HealthChip
                            label={i.severity === "high" ? "High" : i.severity === "medium" ? "Watch" : "Healthy"}
                            tone={i.severity === "high" ? "critical" : i.severity === "medium" ? "warning" : "ok"}
                          />
                        </div>
                        <p className="text-xs text-foreground/65 mb-1">{i.reason}</p>
                        <p className="text-sm text-foreground/85 flex items-start gap-2">
                          <AlertTriangle size={14} className="text-accent mt-1 shrink-0" />
                          <span>{i.nextStep}</span>
                        </p>
                      </div>
                      <Link
                        to="/csfactors/$accountId"
                        params={{ accountId: i.accountId }}
                        className="shrink-0 self-start font-mono uppercase tracking-widest text-xs px-3 py-2 border border-border hover:border-accent hover:text-accent transition-colors"
                      >
                        Open account →
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/codex/$slug"
                params={{ slug }}
                className="font-mono uppercase tracking-widest text-xs px-4 py-3 border border-border hover:border-accent hover:text-accent"
              >
                ← Re-read the playbook
              </Link>
              <Link
                to="/csfactors"
                className="font-mono uppercase tracking-widest text-xs px-4 py-3 bg-foreground text-background hover:bg-accent transition-colors"
              >
                Open CSFactors
              </Link>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
