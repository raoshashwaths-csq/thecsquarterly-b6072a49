import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouteTips } from "@/hooks/useRouteTips";
import { readSet, writeSet, STORAGE_KEYS } from "@/lib/enablement/storage";

type Props = {
  onNavigate?: () => void;
};

export function RouteTipsList({ onNavigate }: Props) {
  const group = useRouteTips();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setDismissed(readSet(STORAGE_KEYS.dismissedTips));
  }, []);

  const toggleDismiss = (id: string, value: boolean) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      writeSet(STORAGE_KEYS.dismissedTips, next);
      return next;
    });
  };

  const visibleTips = showAll ? group.tips : group.tips.filter((t) => !dismissed.has(t.id));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-secondary-accent">
          {group.label}
        </p>
      </div>

      {visibleTips.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-card/40 p-5 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-secondary-accent">
            All caught up
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {dismissed.size > 0 && !showAll
              ? "You've dismissed every tip for this surface."
              : "No tips registered here yet."}
          </p>
          {dismissed.size > 0 && !showAll ? (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-accent hover:underline"
            >
              Restore dismissed tips →
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="space-y-3">
          {visibleTips.map((tip) => (
            <li
              key={tip.id}
              className="rounded-md border border-border bg-card/60 p-4 transition-colors hover:bg-card animate-fade-in"
            >
              <h4 className="font-display text-base leading-snug">{tip.title}</h4>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{tip.body}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                {tip.cta ? (
                  <Link
                    to={tip.cta.to}
                    onClick={() => onNavigate?.()}
                    className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent underline-offset-4 hover:underline"
                  >
                    {tip.cta.label} →
                  </Link>
                ) : (
                  <span />
                )}
                <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
                  <Checkbox
                    checked={dismissed.has(tip.id)}
                    onCheckedChange={(v) => toggleDismiss(tip.id, Boolean(v))}
                    aria-label="Don't show this tip again"
                  />
                  Don&apos;t show again
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}

      {dismissed.size > 0 && !showAll && visibleTips.length > 0 ? (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
        >
          Show all tips ({dismissed.size} hidden) →
        </button>
      ) : null}
      {showAll && visibleTips.length > 0 ? (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
        >
          Hide dismissed
        </button>
      ) : null}
    </div>
  );
}
