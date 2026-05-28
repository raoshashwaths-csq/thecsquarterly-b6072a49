import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Slider } from "@/components/ui/slider";
import { MetricCard, MetricGrid } from "@/components/dashboard/MetricCard";
import { ProgressGauge } from "@/components/dashboard/ProgressGauge";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { ArrowLeft } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "NRR ROI Calculator, The CS Quarterly" },
      {
        name: "description",
        content:
          "Model the five-year revenue impact of a one-point NRR improvement against your current trajectory. Three sliders, one number.",
      },
      { property: "og:title", content: "NRR ROI Calculator" },
      {
        property: "og:description",
        content:
          "What a single point of net revenue retention is worth, compounded over five years.",
      },
      { property: "og:url", content: "/calculator" },
    ],
    links: [{ rel: "canonical", href: "/calculator" }],
  }),
  component: CalculatorPage,
});

const fmtMoney = (n: number) => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

function CalculatorPage() {
  const [arr, setArr] = useState(50); // $M
  const [currentNrr, setCurrentNrr] = useState(102); // %
  const [targetNrr, setTargetNrr] = useState(115); // %

  const data = useMemo(() => {
    const base = arr * 1_000_000;
    const cur = currentNrr / 100;
    const tgt = targetNrr / 100;
    return Array.from({ length: 6 }).map((_, year) => ({
      year: `Y${year}`,
      current: Math.round(base * Math.pow(cur, year)),
      target: Math.round(base * Math.pow(tgt, year)),
    }));
  }, [arr, currentNrr, targetNrr]);

  const y5 = data[5];
  const deltaY5 = y5.target - y5.current;
  const cumulativeDelta = data.reduce((s, d) => s + (d.target - d.current), 0);
  const spread = targetNrr - currentNrr;
  const targetMultiple = y5.current > 0 ? y5.target / y5.current : 1;
  const confidence = Math.max(0, Math.min(100, 55 + spread * 3));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-10 pt-8 md:pt-12 pb-20 animate-fade-up">
        <Link
          to="/csfactors"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.22em] text-foreground bg-card border border-border px-3 py-2 hover:border-accent hover:text-accent transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to CSFactors
        </Link>

        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8 md:mb-10 pb-6 border-b border-border">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent font-semibold mb-3">
              Analytics / ROI model
            </div>
            <h1 className="font-display text-4xl md:text-6xl leading-[0.95] tracking-tight text-balance">
              NRR impact command model.
            </h1>
            <p className="text-foreground/70 mt-3 max-w-2xl text-sm md:text-base">
              Model the five-year revenue delta between today’s retention curve and the target operating state.
            </p>
          </div>
          <div className="border border-border bg-card px-4 py-3 min-w-[220px]">
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground mb-1">
              NRR spread
            </div>
            <div className="font-display text-4xl tracking-tight text-accent tabular-nums">
              {spread >= 0 ? "+" : ""}{spread}<span className="text-base text-muted-foreground"> pts</span>
            </div>
          </div>
        </header>

        <section className="mb-8">
          <MetricGrid cols={4} className="gap-4 md:gap-px">
            <MetricCard
              eyebrow="Year 5 ARR delta"
              value={`${deltaY5 >= 0 ? "+" : ""}${fmtMoney(deltaY5)}`}
              accent="accent"
              trend={`${targetNrr}% target NRR`}
              trendDirection={deltaY5 >= 0 ? "up" : "down"}
            />
            <MetricCard
              eyebrow="Cumulative gap"
              value={`${cumulativeDelta >= 0 ? "+" : ""}${fmtMoney(cumulativeDelta)}`}
              accent="secondary"
              trend="Five-year carry"
              trendDirection={cumulativeDelta >= 0 ? "up" : "down"}
            />
            <MetricCard
              eyebrow="Target multiple"
              value={`${targetMultiple.toFixed(2)}×`}
              accent="neutral"
              trend="Versus current path"
              trendDirection="flat"
            />
            <MetricCard
              eyebrow="Compounding signal"
              value={confidence}
              unit="/100"
              accent={confidence >= 75 ? "success" : "secondary"}
              footer={<ProgressGauge value={confidence} accent={confidence >= 75 ? "success" : "secondary"} />}
            />
          </MetricGrid>
        </section>

        <div className="grid lg:grid-cols-[420px_minmax(0,1fr)] gap-6 md:gap-8 items-start">
          <SectionCard
            title="Model controls"
            eyebrow="Inputs"
            description="Tune the operating assumptions and watch the board-level revenue gap update instantly."
          >
            <div className="space-y-8">
              <SliderRow
                label="Current ARR"
                value={`$${arr}M`}
                min={5}
                max={500}
                step={5}
                v={arr}
                onChange={setArr}
              />
              <SliderRow
                label="Current NRR"
                value={`${currentNrr}%`}
                min={70}
                max={140}
                step={1}
                v={currentNrr}
                onChange={setCurrentNrr}
              />
              <SliderRow
                label="Target NRR"
                value={`${targetNrr}%`}
                min={70}
                max={150}
                step={1}
                v={targetNrr}
                onChange={setTargetNrr}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Trajectory comparison"
            eyebrow="Forecast"
            description="Current path against the improved retention operating model."
          >
            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
                  <XAxis
                    dataKey="year"
                    stroke="var(--muted-foreground)"
                    tick={{ fontFamily: "JetBrains Mono", fontSize: 11 }}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    tick={{ fontFamily: "JetBrains Mono", fontSize: 11 }}
                    tickFormatter={(v) => fmtMoney(Number(v))}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--background)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                      fontFamily: "JetBrains Mono",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => fmtMoney(v)}
                  />
                  <Legend wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="current"
                    name={`Current (${currentNrr}%)`}
                    stroke="var(--muted-foreground)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    name={`Target (${targetNrr}%)`}
                    stroke="var(--accent)"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        <section className="mt-6 border border-border bg-card px-4 md:px-6 py-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Method: ARR<sub>n</sub> equals ARR<sub>0</sub> compounded by the chosen NRR rate for n years. The model holds new-logo bookings flat to isolate the retention lever; use it as a board-room proxy, not an FP&amp;A substitute.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  v,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  v: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {label}
        </span>
        <span className="font-display text-2xl tracking-tight">{value}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[v]}
        onValueChange={(arr) => onChange(arr[0])}
      />
    </div>
  );
}
