import { QMark } from "@/components/site/QMark";
import { cn } from "@/lib/utils";

/**
 * QHint — a passive, presentational hint line attributed to Q.
 * Used on the home page to attach one-liner context under or onto cards.
 * Pure CSS, no state, no drawer wiring — safe to render anywhere.
 */
type Props = {
  children: React.ReactNode;
  variant?: "inline" | "floating";
  className?: string;
};

export function QHint({ children, variant = "inline", className }: Props) {
  if (variant === "floating") {
    return (
      <span
        className={cn(
          "pointer-events-none absolute top-2 right-3 inline-flex items-center gap-1.5",
          "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80",
          className,
        )}
      >
        <QMark className="font-display text-xs leading-none text-foreground/80" />
        <span aria-hidden className="hidden sm:inline">hint</span>
      </span>
    );
  }
  return (
    <p
      className={cn(
        "mt-3 inline-flex items-start gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground leading-snug",
        className,
      )}
    >
      <QMark className="font-display text-xs leading-none text-foreground shrink-0 mt-0.5" />
      <span className="normal-case tracking-normal font-body text-xs text-foreground/70">
        {children}
      </span>
    </p>
  );
}
