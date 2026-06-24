import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { TREES, CATEGORY_COLOR } from "@/lib/q-trees";

/**
 * Vertical list of all Lumi decision-tree headings.
 * Replaces the legacy horizontal "Suggested Vectors" scroll strip.
 * Each row deep-links to /agent/framework?tree=Tx and closes the parent drawer.
 */
export function TreeVectorList({
  onPick,
  maxHeight = "max-h-[60vh]",
  heading = "Suggested Vectors",
}: {
  onPick?: () => void;
  maxHeight?: string;
  heading?: string;
}) {
  return (
    <div>
      {heading ? (
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-3">
          {heading}
        </div>
      ) : null}
      <div className={`flex flex-col divide-y divide-border border border-border bg-card/40 ${maxHeight} overflow-y-auto`}>
        {TREES.map((t) => {
          const color = CATEGORY_COLOR[t.category];
          return (
            <Link
              key={t.id}
              to="/agent/framework"
              search={{ tree: t.id }}
              onClick={onPick}
              className="group flex items-center gap-3 px-3 py-2.5 hover:bg-accent/5 transition-colors"
            >
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: color.hex }}
              />
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
                  {t.eyebrow}
                </div>
                <div className="font-display text-sm leading-tight truncate">
                  {t.title}
                </div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-foreground/40 group-hover:text-accent transition-colors shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
