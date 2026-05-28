import { useMemo } from "react";
import { MetricCard, MetricGrid } from "@/components/dashboard/MetricCard";
import { computeNPS, computeSentimentIndex, type CSAccount } from "@/lib/csfactors.functions";

function SplitBar({
  segments,
}: {
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="space-y-2">
      <div className="flex h-2 overflow-hidden border border-border bg-muted">
        {segments.map((s) => (
          <div
            key={s.label}
            className={s.color}
            style={{ width: `${(s.value / total) * 100}%` }}
            title={`${s.label}: ${s.value}`}
          />
        ))}
      </div>
      <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {segments.map((s) => (
          <span key={s.label} className="tabular-nums">
            {s.label} {s.value}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsHeader({ accounts }: { accounts: CSAccount[] }) {
  const nps = useMemo(() => computeNPS(accounts), [accounts]);
  const sentiment = useMemo(() => computeSentimentIndex(accounts), [accounts]);

  return (
    <MetricGrid cols={2}>
      <MetricCard
        eyebrow="Organizational NPS"
        value={nps.n ? nps.score : "—"}
        unit={nps.n ? "" : ""}
        accent={nps.score >= 30 ? "success" : nps.score >= 0 ? "secondary" : "danger"}
        trend={nps.n ? `Across ${nps.n} scored account${nps.n === 1 ? "" : "s"}` : "No scores yet"}
        trendDirection={nps.score >= 0 ? "up" : "down"}
        footer={
          nps.n ? (
            <SplitBar
              segments={[
                { label: "Promoters", value: nps.promoters, color: "bg-emerald-600" },
                { label: "Passives", value: nps.passives, color: "bg-secondary-accent" },
                { label: "Detractors", value: nps.detractors, color: "bg-destructive" },
              ]}
            />
          ) : null
        }
      />
      <MetricCard
        eyebrow="CSM Sentiment Index"
        value={sentiment.n ? sentiment.healthPct : "—"}
        unit={sentiment.n ? "%" : ""}
        accent={sentiment.healthPct >= 70 ? "success" : sentiment.healthPct >= 40 ? "secondary" : "danger"}
        trend={sentiment.n ? `${sentiment.positive} positive / ${sentiment.critical} critical` : "No sentiment yet"}
        trendDirection={sentiment.healthPct >= 50 ? "up" : "down"}
        footer={
          sentiment.n ? (
            <SplitBar
              segments={[
                { label: "Positive", value: sentiment.positive, color: "bg-emerald-600" },
                { label: "Neutral", value: sentiment.neutral, color: "bg-secondary-accent" },
                { label: "Critical", value: sentiment.critical, color: "bg-destructive" },
              ]}
            />
          ) : null
        }
      />
    </MetricGrid>
  );
}
