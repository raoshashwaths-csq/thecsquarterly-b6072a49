import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMonthlySentiment } from "@/lib/sentiment.functions";

const COLORS = {
  positive: "hsl(152 60% 42%)", // emerald
  neutral: "hsl(var(--foreground) / 0.35)",
  negative: "hsl(var(--destructive))",
} as const;

export function SentimentTrendPanel() {
  const fetcher = useServerFn(getMonthlySentiment);
  const { data, isLoading, error } = useQuery({
    queryKey: ["sentiment-monthly"],
    queryFn: () => fetcher(),
    staleTime: 60_000,
  });

  const rows = data?.rows ?? [];
  const dist = useMemo(() => {
    const counts = { positive: 0, neutral: 0, negative: 0 };
    for (const r of rows) counts[r.calculated_sentiment_score] += 1;
    return counts;
  }, [rows]);
  const total = rows.length;

  return (
    <section className="mt-12 border-t border-border pt-10">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-2">
        Monthly · Sentiment
      </div>
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <h2 className="font-display text-2xl md:text-3xl tracking-tight">
          Occupational resilience<span className="text-accent">.</span>
        </h2>
        <p className="font-body text-sm text-foreground/65 max-w-md">
          A 30-day rolling trace of your end-of-day check-ins — emotional metrics,
          resilience, and the workplace-anxiety pattern Q has flagged.
        </p>
      </div>

      {isLoading ? (
        <div className="font-mono uppercase tracking-widest text-xs text-muted-foreground">Loading…</div>
      ) : error ? (
        <div className="font-mono text-xs text-destructive">{(error as Error).message}</div>
      ) : total === 0 ? (
        <div className="border border-dashed border-border p-6 text-sm text-foreground/60">
          No check-ins logged yet. Q will prompt you in the evening after a high-friction day.
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {(["positive", "neutral", "negative"] as const).map((k) => {
            const pct = Math.round((dist[k] / total) * 100);
            return (
              <div key={k} className="border border-border p-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/55 mb-2">{k}</div>
                <div className="font-display text-4xl tracking-tight mb-1">{dist[k]}</div>
                <div className="font-mono uppercase tracking-widest text-xs text-foreground/45">{pct}% of month</div>
                <div className="mt-3 h-1 bg-border">
                  <div className="h-full" style={{ width: `${pct}%`, background: COLORS[k] }} />
                </div>
              </div>
            );
          })}

          <div className="md:col-span-3 border border-border p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/55 mb-3">
              30-day trace
            </div>
            <Sparkline rows={rows} />
          </div>
        </div>
      )}
    </section>
  );
}

function Sparkline({ rows }: { rows: Array<{ date: string; calculated_sentiment_score: "positive" | "neutral" | "negative" }> }) {
  const w = 720;
  const h = 80;
  const step = rows.length > 1 ? w / (rows.length - 1) : w;
  const valueFor = (s: string) => (s === "positive" ? 1 : s === "negative" ? -1 : 0);
  const points = rows.map((r, i) => {
    const v = valueFor(r.calculated_sentiment_score);
    const y = h / 2 - (v * (h / 2 - 6));
    return `${i * step},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20" preserveAspectRatio="none" aria-hidden>
      <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="hsl(var(--border))" strokeWidth="1" />
      {points.length > 1 ? (
        <polyline
          fill="none"
          stroke="hsl(var(--foreground))"
          strokeWidth="1.5"
          points={points.join(" ")}
        />
      ) : null}
      {rows.map((r, i) => (
        <circle
          key={r.date}
          cx={i * step}
          cy={h / 2 - valueFor(r.calculated_sentiment_score) * (h / 2 - 6)}
          r="3"
          fill={COLORS[r.calculated_sentiment_score]}
        />
      ))}
    </svg>
  );
}
