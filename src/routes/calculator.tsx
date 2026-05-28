import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Reveal } from "@/components/site/Reveal";
import { Slider } from "@/components/ui/slider";
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

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border">
          <div className="container mx-auto px-6 py-16 md:py-24 max-w-5xl">
            <Reveal>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-6">
                The Calculator
              </p>
              <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-balance">
                What one point of NRR is worth.
              </h1>
              <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                Three inputs. Five years. The number every CFO understands and
                most CS leaders cannot quote on demand.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="container mx-auto px-6 py-16 max-w-5xl grid md:grid-cols-2 gap-12">
            <div className="space-y-10">
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

            <div className="space-y-6">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">
                  Year 5 ARR delta
                </p>
                <p className="font-display text-5xl md:text-6xl tracking-tight text-accent">
                  {deltaY5 >= 0 ? "+" : ""}
                  {fmtMoney(deltaY5)}
                </p>
              </div>
              <div className="border-t border-border pt-6">
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">
                  Cumulative 5-year revenue gap
                </p>
                <p className="font-display text-3xl tracking-tight">
                  {cumulativeDelta >= 0 ? "+" : ""}
                  {fmtMoney(cumulativeDelta)}
                </p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Holding logo retention and new logo growth constant, this is the
                ARR the business carries with it into year five purely from the
                expansion-and-churn delta.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="container mx-auto px-6 py-16 max-w-5xl">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-6">
              Trajectory comparison
            </p>
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="year"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontFamily: "JetBrains Mono", fontSize: 11 }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontFamily: "JetBrains Mono", fontSize: 11 }}
                    tickFormatter={(v) => fmtMoney(Number(v))}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
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
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    name={`Target (${targetNrr}%)`}
                    stroke="hsl(var(--accent))"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section>
          <div className="container mx-auto px-6 py-16 max-w-3xl">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Method: ARR<sub>n</sub> equals ARR<sub>0</sub> compounded by the
              chosen NRR rate for n years. The model holds new-logo bookings
              flat to isolate the retention lever. Use it as a board-room
              proxy, not an FP&amp;A substitute.
            </p>
          </div>
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
