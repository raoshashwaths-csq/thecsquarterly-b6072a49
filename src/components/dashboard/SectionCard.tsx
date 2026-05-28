import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function SectionCard({
  title,
  eyebrow,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border border-border bg-card", className)}>
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 px-4 md:px-6 pt-5 md:pt-6 pb-4 border-b border-border">
        <div>
          {eyebrow ? (
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent font-semibold mb-2">
              {eyebrow}
            </div>
          ) : null}
          <h2 className="font-display text-xl md:text-2xl tracking-tight">{title}</h2>
          {description ? (
            <p className="text-sm text-foreground/65 mt-1 max-w-2xl">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2 flex-wrap">{actions}</div> : null}
      </header>
      <div className="p-4 md:p-6">{children}</div>

    </section>
  );
}
