import { cn } from "@/lib/utils";

export function ProgressGauge({
  value,
  label,
  sub,
  accent = "accent",
  className,
}: {
  value: number; // 0..100
  label?: string;
  sub?: string;
  accent?: "accent" | "secondary" | "success" | "danger";
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const color =
    accent === "secondary"
      ? "bg-secondary-accent"
      : accent === "success"
        ? "bg-emerald-600"
        : accent === "danger"
          ? "bg-destructive"
          : "bg-accent";
  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <div className="flex items-baseline justify-between">
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {label}
          </div>
          <div className="font-display text-2xl tracking-tight tabular-nums">
            {pct}
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>
      ) : null}
      <div className="h-2 w-full bg-muted overflow-hidden">
        <div
          className={cn("h-full transition-all duration-700 ease-out", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {sub ? <div className="text-xs text-muted-foreground">{sub}</div> : null}
    </div>
  );
}
