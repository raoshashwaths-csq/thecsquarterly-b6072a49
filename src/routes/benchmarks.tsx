import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Reveal } from "@/components/site/Reveal";
import { MetricCard, MetricGrid } from "@/components/dashboard/MetricCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { listBenchmarks } from "@/lib/enterprise.functions";

export const Route = createFileRoute("/benchmarks")({
  head: () => ({
    meta: [
      { title: "Benchmarks, The CS Quarterly" },
      {
        name: "description",
        content: "Quarterly NRR, payback, and retention benchmarks from operators in our network.",
      },
      { property: "og:title", content: "Benchmarks" },
      { property: "og:description", content: "Operator-sourced retention benchmarks, by quarter and segment." },
    ],
    links: [{ rel: "canonical", href: "/benchmarks" }],
  }),
  component: BenchmarksPage,
});

function BenchmarksPage() {
  const fetchData = useServerFn(listBenchmarks);
  const { data, isLoading } = useQuery({ queryKey: ["benchmarks"], queryFn: () => fetchData() });

  const rows = (data ?? []) as Array<{ id: string; period: string; metric: string; segment: string | null; value: number; notes: string | null }>;
  const grouped: Record<string, typeof rows> = {};
  rows.forEach((b) => { (grouped[b.period] ||= []).push(b); });

  const periods = Object.keys(grouped).sort().reverse();
  const totalMetrics = rows.length;
  const latestPeriod = periods[0] ?? "—";
  const latestCount = periods[0] ? grouped[periods[0]].length : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-6 py-16 max-w-6xl">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-6 font-semibold">
            Benchmarks
          </p>
          <h1 className="font-display text-5xl md:text-6xl tracking-tight leading-[0.95]">
            What good actually looks like.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            Operator-sourced NRR, payback, and retention numbers, segmented by ACV band.
          </p>
        </Reveal>

        <div className="mt-12">
          <MetricGrid cols={3}>
            <MetricCard eyebrow="Latest drop" value={latestPeriod} accent="accent" footer={<span className="text-xs text-muted-foreground">{latestCount} metric{latestCount === 1 ? "" : "s"} published</span>} />
            <MetricCard eyebrow="Periods covered" value={periods.length} accent="secondary" />
            <MetricCard eyebrow="Total data points" value={totalMetrics} />
          </MetricGrid>
        </div>

        <div className="mt-10 space-y-8">
          {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
          {!isLoading && rows.length === 0 && (
            <SectionCard eyebrow="Status" title="No drops published yet">
              <p className="text-muted-foreground text-sm italic">
                The first quarterly drop ships once we have a statistically meaningful sample.
              </p>
            </SectionCard>
          )}
          {periods.map((period) => (
            <SectionCard key={period} eyebrow={period} title="Quarterly retention drop">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <th className="py-2 font-normal">Metric</th>
                    <th className="py-2 font-normal">Segment</th>
                    <th className="py-2 font-normal text-right">Value</th>
                    <th className="py-2 font-normal">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped[period].map((b) => (
                    <tr key={b.id} className="border-t border-border">
                      <td className="py-3">{b.metric}</td>
                      <td className="py-3 text-muted-foreground">{b.segment ?? "—"}</td>
                      <td className="py-3 text-right font-display text-xl tracking-tight tabular-nums">
                        {b.value}
                      </td>
                      <td className="py-3 text-muted-foreground text-xs">{b.notes ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
