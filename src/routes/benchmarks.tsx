import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Reveal } from "@/components/site/Reveal";
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

  const grouped: Record<string, any[]> = {};
  (data ?? []).forEach((b: any) => {
    (grouped[b.period] ||= []).push(b);
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-6 py-16 max-w-5xl">
        <Reveal>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-6">
            Benchmarks
          </p>
          <h1 className="font-display text-5xl md:text-6xl tracking-tight leading-[0.95]">
            What good actually looks like.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            Operator-sourced NRR, payback, and retention numbers, segmented by ACV band.
          </p>
        </Reveal>

        <div className="mt-12 space-y-12">
          {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
          {data && data.length === 0 && (
            <p className="text-muted-foreground text-sm italic">
              No benchmark drops published yet. The first quarterly drop ships once we have a
              statistically meaningful sample.
            </p>
          )}
          {Object.entries(grouped).map(([period, rows]) => (
            <section key={period}>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-4">
                {period}
              </p>
              <table className="w-full text-sm border-t border-border">
                <thead>
                  <tr className="text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 font-normal">Metric</th>
                    <th className="py-2 font-normal">Segment</th>
                    <th className="py-2 font-normal text-right">Value</th>
                    <th className="py-2 font-normal">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((b) => (
                    <tr key={b.id} className="border-t border-border">
                      <td className="py-3">{b.metric}</td>
                      <td className="py-3 text-muted-foreground">{b.segment ?? "—"}</td>
                      <td className="py-3 text-right font-display text-xl tracking-tight">
                        {b.value}
                      </td>
                      <td className="py-3 text-muted-foreground text-xs">{b.notes ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
