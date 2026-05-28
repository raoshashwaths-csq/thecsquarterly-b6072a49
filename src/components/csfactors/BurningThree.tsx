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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-accent" />
          <h2 className="font-display text-xl tracking-tight">
            Today's <span className="italic text-accent">burning three</span>
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRewrite}
          disabled={busy}
          className="gap-2 font-mono uppercase tracking-widest text-xs"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          Rewrite with Q.
        </Button>
      </div>
      <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
        {items.map((it) => (
          <div
            key={it.id}
            className={cn(
              "bg-card p-5 border-l-[3px] flex flex-col gap-2",
              ACCENT[it.accent],
            )}
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
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
