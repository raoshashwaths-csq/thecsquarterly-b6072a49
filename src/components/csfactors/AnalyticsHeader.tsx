import { useMemo } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { MetricCard, MetricGrid } from "@/components/dashboard/MetricCard";
import { computeNPS, computeSentimentIndex, type CSAccount } from "@/lib/csfactors.functions";

function SplitBar({
  segments,
  height = "h-2",
}: {
  segments: { label: string; value: number; color: string }[];
  height?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="space-y-2">
      <div className={`flex ${height} overflow-hidden border border-border bg-muted`}>
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

function ExpandedNPS({ accounts }: { accounts: CSAccount[] }) {
  const scored = accounts.filter((a) => a.final_cs_nps !== null && a.final_cs_nps !== undefined);
  const promoters = scored.filter((a) => (a.final_cs_nps ?? 0) >= 9);
  const passives = scored.filter((a) => (a.final_cs_nps ?? 0) >= 7 && (a.final_cs_nps ?? 0) <= 8);
  const detractors = scored.filter((a) => (a.final_cs_nps ?? 0) <= 6);
  return (
    <div className="space-y-4">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent font-semibold mb-2">
          NPS Distribution
        </div>
        <SplitBar
          height="h-3"
          segments={[
            { label: "Promoters", value: promoters.length, color: "bg-emerald-600" },
            { label: "Passives", value: passives.length, color: "bg-secondary-accent" },
            { label: "Detractors", value: detractors.length, color: "bg-destructive" },
          ]}
        />
      </div>
      {detractors.length ? (
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-destructive font-semibold mb-2">
            Detractors ({detractors.length})
          </div>
          <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
            {detractors.slice(0, 8).map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between text-xs font-mono border-b border-border/60 pb-1"
              >
                <span className="truncate">{a.name}</span>
                <span className="tabular-nums text-destructive">{a.final_cs_nps}/10</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {promoters.length ? (
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-300 font-semibold mb-2">
            Promoters ({promoters.length})
          </div>
          <ul className="space-y-1 max-h-32 overflow-y-auto pr-1">
            {promoters.slice(0, 6).map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between text-xs font-mono border-b border-border/60 pb-1"
              >
                <span className="truncate">{a.name}</span>
                <span className="tabular-nums text-emerald-700 dark:text-emerald-300">{a.final_cs_nps}/10</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ExpandedSentiment({ accounts }: { accounts: CSAccount[] }) {
  const critical = accounts.filter((a) => a.csm_sentiment === "Critical");
  const neutral = accounts.filter((a) => a.csm_sentiment === "Neutral");
  const positive = accounts.filter((a) => a.csm_sentiment === "Positive");
  return (
    <div className="space-y-4">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent font-semibold mb-2">
          Sentiment Distribution
        </div>
        <SplitBar
          height="h-3"
          segments={[
            { label: "Positive", value: positive.length, color: "bg-emerald-600" },
            { label: "Neutral", value: neutral.length, color: "bg-secondary-accent" },
            { label: "Critical", value: critical.length, color: "bg-destructive" },
          ]}
        />
      </div>
      {critical.length ? (
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-destructive font-semibold mb-2">
            Critical accounts ({critical.length})
          </div>
          <ul className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {critical
              .sort((a, b) => Number(b.arr) - Number(a.arr))
              .slice(0, 10)
              .map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between text-xs font-mono border-b border-border/60 pb-1"
                >
                  <span className="truncate">{a.name}</span>
                  <span className="tabular-nums text-destructive">
                    ${Number(a.arr).toLocaleString()}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function AnalyticsHeader({ accounts }: { accounts: CSAccount[] }) {
  const nps = useMemo(() => computeNPS(accounts), [accounts]);
  const sentiment = useMemo(() => computeSentimentIndex(accounts), [accounts]);

  return (
    <MetricGrid cols={2}>
      <HoverCard openDelay={120} closeDelay={80}>
        <HoverCardTrigger asChild>
          <div className="cursor-help transition-transform hover:-translate-y-0.5">
            <MetricCard
              eyebrow="Organizational NPS · hover for detail"
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
          </div>
        </HoverCardTrigger>
        <HoverCardContent align="start" className="w-[420px] p-5 border-border">
          <ExpandedNPS accounts={accounts} />
        </HoverCardContent>
      </HoverCard>

      <HoverCard openDelay={120} closeDelay={80}>
        <HoverCardTrigger asChild>
          <div className="cursor-help transition-transform hover:-translate-y-0.5">
            <MetricCard
              eyebrow="CSM Sentiment Index · hover for detail"
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
          </div>
        </HoverCardTrigger>
        <HoverCardContent align="start" className="w-[440px] p-5 border-border">
          <ExpandedSentiment accounts={accounts} />
        </HoverCardContent>
      </HoverCard>
    </MetricGrid>
  );
}
