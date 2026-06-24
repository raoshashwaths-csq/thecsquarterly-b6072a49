import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { useFreshness, type FreshnessInput } from "./useFreshness";

export function SectionCard({
  title,
  eyebrow,
  description,
  actions,
  children,
  className,
  updatedAt,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Pass the most-recent updated_at of the data this card surfaces. Cards with data older than 7 days get a soft gold glow. */
  updatedAt?: FreshnessInput;
}) {
  const { stale, label } = useFreshness(updatedAt);
  return (
    <section
      data-stale={stale ? "true" : undefined}
      className={cn(
        "relative border border-border bg-card csf-widget widget-lift",
        stale && "stale-glow",
        className,
      )}
    >
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 px-4 md:px-6 pt-5 md:pt-6 pb-4 border-b border-border">
        <div>
          {eyebrow ? (
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent font-semibold mb-2">
              {eyebrow}
            </div>
          ) : null}
          <h2 className="font-display text-xl md:text-2xl tracking-tight">{title}</h2>
          {description ? (
            <p className="text-sm text-foreground/65 mt-1 max-w-2xl">{description}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {stale && label ? (
            <span
              title="Underlying portfolio data hasn't refreshed in over a week."
              className="font-mono text-[10px] uppercase tracking-[0.25em] text-secondary-accent border border-secondary-accent/40 px-2 py-0.5"
            >
              {label}
            </span>
          ) : null}
          {actions}
        </div>
      </header>
      <div className="p-4 md:p-6">{children}</div>
    </section>
  );
}
