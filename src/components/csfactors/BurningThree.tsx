import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Flame, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  deriveBurningThree,
  rewriteBurningThree,
  type BurningInsight,
  type CSAccount,
} from "@/lib/csfactors.functions";

const ACCENT: Record<BurningInsight["accent"], string> = {
  danger: "border-l-destructive",
  warn: "border-l-secondary-accent",
  info: "border-l-accent",
};

export function BurningThree({ accounts }: { accounts: CSAccount[] }) {
  const base = useMemo(() => deriveBurningThree(accounts), [accounts]);
  const [items, setItems] = useState<BurningInsight[]>(base);
  const [busy, setBusy] = useState(false);
  const rewrite = useServerFn(rewriteBurningThree);

  // Keep insights synced when accounts change
  useMemo(() => setItems(base), [base]);

  async function onRewrite() {
    if (!items.length) return;
    setBusy(true);
    try {
      const res = await rewrite({ data: { insights: items } });
      if (Array.isArray(res.insights) && res.insights.length) {
        setItems(res.insights as BurningInsight[]);
      }
    } finally {
      setBusy(false);
    }
  }

  if (!items.length) {
    return (
      <div className="border border-dashed border-border bg-card p-8 text-center">
        <Flame className="h-5 w-5 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-foreground/70">
          Add your first account to see today's burning three insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-2">
        <div>
          <div className="eyebrow text-secondary-accent mb-1">The Burning Three</div>
          <h2 className="font-display text-2xl md:text-3xl tracking-tight leading-tight">
            The burning three<span className="italic text-accent">.</span>
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRewrite}
          disabled={busy}
          className="gap-2 font-mono uppercase tracking-[0.22em] text-[11px] shrink-0"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          Powered by Lumi
        </Button>
      </div>
      <div
        className={cn(
          "grid gap-4 md:gap-px bg-transparent md:bg-border border-0 md:border border-border",
          items.length === 1 && "md:grid-cols-1",
          items.length === 2 && "md:grid-cols-2",
          items.length >= 3 && "md:grid-cols-3",
        )}
      >

        {items.map((it) => (
          <div
            key={it.id}
            className={cn(
              "bg-card p-5 border-l-[3px] border-r border-t border-b md:border-r-0 md:border-t-0 md:border-b-0 border-border flex flex-col gap-2",
              ACCENT[it.accent],
            )}
          >
            <div className="font-mono uppercase tracking-[0.25em] text-xs text-muted-foreground">
              {it.accent === "danger" ? "At risk" : it.accent === "warn" ? "Overdue" : "Upcoming"}
            </div>
            <div className="font-display text-lg leading-snug tracking-tight">{it.headline}</div>
            <p className="text-sm text-foreground/75 leading-relaxed">{it.detail}</p>
            {it.accountId ? (
              <Link
                to="/csfactors/$accountId"
                params={{ accountId: it.accountId }}
                className="mt-auto pt-2 font-mono uppercase tracking-widest text-xs text-accent hover:underline"
              >
                Open account →
              </Link>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
