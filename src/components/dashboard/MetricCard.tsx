import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { useFreshness, type FreshnessInput } from "./useFreshness";

type Accent = "neutral" | "accent" | "secondary" | "danger" | "success";
type TopAccent = "gold" | "success" | "danger" | "warn" | "secondary";

export type MetricCardProps = {
  eyebrow: string;
  value: ReactNode;
  unit?: string;
  trend?: string;
  trendDirection?: "up" | "down" | "flat";
  accent?: Accent;
  /** Thin colored rail pinned to the very top edge of the card. */
  topAccent?: TopAccent;
  footer?: ReactNode;
  className?: string;
  /** When the underlying value last changed. Older than 7 days → soft gold glow. */
  updatedAt?: FreshnessInput;
};

const ACCENT_BAR: Record<Accent, string> = {
  neutral: "bg-border",
  accent: "bg-accent",
  secondary: "bg-secondary-accent",
  danger: "bg-destructive",
  success: "bg-emerald-500",
};

const TOP_RAIL: Record<TopAccent, string> = {
  gold: "bg-accent",
  success: "bg-emerald-500",
  danger: "bg-destructive",
  warn: "bg-secondary-accent",
  secondary: "bg-secondary-accent",
};

const TREND_COLOR: Record<NonNullable<MetricCardProps["trendDirection"]>, string> = {
  up: "text-emerald-700 dark:text-emerald-400",
  down: "text-destructive",
  flat: "text-muted-foreground",
};

export function MetricCard({
  eyebrow,
  value,
  unit,
  trend,
  trendDirection = "flat",
  accent = "neutral",
  topAccent,
  footer,
  className,
  updatedAt,
}: MetricCardProps) {
  const { stale, label } = useFreshness(updatedAt);
  return (
    <div
      data-stale={stale ? "true" : undefined}
      className={cn(
        "relative bg-card p-5 md:p-6 border border-border overflow-hidden group rounded-none csf-widget widget-lift",
        "transition-colors hover:border-foreground/40",
        stale && "stale-glow",
        className,
      )}
    >
      {topAccent ? (
        <span aria-hidden className={cn("absolute inset-x-0 top-0 h-[2px]", TOP_RAIL[topAccent])} />
      ) : (
        <div className={cn("absolute left-0 top-0 h-[2px] w-10", ACCENT_BAR[accent])} />
      )}
      {stale && label ? (
        <span
          title="This metric hasn't refreshed in over a week."
          className="absolute top-2 right-2 font-mono text-[9px] uppercase tracking-[0.22em] text-secondary-accent border border-secondary-accent/40 px-1.5 py-0.5"
        >
          {label}
        </span>
      ) : null}
      <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground mb-4 font-semibold">
        {eyebrow}
      </div>
      <div className="font-display text-4xl md:text-5xl tracking-tight leading-none mb-3 flex items-baseline gap-1">
        <span>{value}</span>
        {unit ? <span className="text-2xl text-muted-foreground">{unit}</span> : null}
      </div>
      {trend ? (
        <div className={cn("text-[11px] font-mono uppercase tracking-[0.22em]", TREND_COLOR[trendDirection])}>
          {trendDirection === "up" ? "↑ " : trendDirection === "down" ? "↓ " : "→ "}
          {trend}
        </div>
      ) : null}
      {footer ? <div className="mt-4 pt-4 border-t border-border/60">{footer}</div> : null}
    </div>
  );
}

export function MetricGrid({ children, cols = 3, className }: { children: ReactNode; cols?: 2 | 3 | 4; className?: string }) {
  const c =
    cols === 2 ? "md:grid-cols-2" : cols === 4 ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3";
  return <div className={cn("grid gap-px bg-border border border-border", c, className)}>{children}</div>;
}
