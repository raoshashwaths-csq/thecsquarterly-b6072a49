import { cn } from "@/lib/utils";

export function healthAccent(score: number) {
  if (score >= 75) return "success" as const;
  if (score >= 50) return "warn" as const;
  return "danger" as const;
}

export function HealthChip({ score }: { score: number }) {
  const tone =
    score >= 75
      ? "bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border-emerald-600/40"
      : score >= 50
        ? "bg-secondary-accent/15 text-secondary-accent border-secondary-accent/40"
        : "bg-destructive/15 text-destructive border-destructive/40";
  return (
    <span
      className={cn(
        "inline-flex min-w-14 justify-center items-center px-3 py-1.5 border font-mono text-xs font-semibold tabular-nums",
        tone,
      )}
    >
      {score}
      <span className="opacity-50 ml-0.5">/100</span>
    </span>
  );
}

export function QBRText({ status }: { status: "Completed" | "Scheduled" | "Overdue" }) {
  const cls =
    status === "Completed"
      ? "text-emerald-700 dark:text-emerald-400"
      : status === "Scheduled"
        ? "text-secondary-accent"
        : "text-destructive underline underline-offset-4 decoration-destructive/60";
  return (
    <span className={cn("font-mono text-xs font-semibold uppercase tracking-widest", cls)}>
      {status}
    </span>
  );
}
