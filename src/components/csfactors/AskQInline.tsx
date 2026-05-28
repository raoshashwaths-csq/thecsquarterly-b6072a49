import { useState } from "react";
import { QMark } from "@/components/site/QMark";
import { Sparkle } from "lucide-react";

const PROMPTS = [
  "Slice NRR by Enterprise segment",
  "Show low-health accounts",
  "Filter high-risk cohort",
  "QBRs overdue this quarter",
];

export function AskQInline({
  onSubmit,
  onChip,
  onOpenDrawer,
}: {
  onSubmit: (text: string) => void;
  onChip: (text: string) => void;
  onOpenDrawer: () => void;
}) {
  const [value, setValue] = useState("");
  return (
    <div className="border border-border bg-card/80 backdrop-blur-sm p-3 md:p-4">
      <div className="flex items-center justify-between mb-2 gap-3">
        <div className="font-mono uppercase tracking-[0.25em] text-xs text-secondary-accent font-semibold flex items-center gap-2">
          <Sparkle className="h-3 w-3" />
          Ask <QMark /> — slice your portfolio
        </div>
        <button
          type="button"
          onClick={onOpenDrawer}
          className="font-mono uppercase tracking-[0.2em] text-xs text-muted-foreground hover:text-accent border-b border-transparent hover:border-accent pb-0.5"
        >
          Open chat →
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const v = value.trim();
          if (!v) return;
          onSubmit(v);
          setValue("");
        }}
        className="flex items-center gap-2 border border-border bg-background px-3 py-2 focus-within:border-accent"
      >
        <span className="font-display text-base leading-none shrink-0">
          <QMark />
        </span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask Q to filter — e.g. 'Enterprise accounts with health under 60'"
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground min-w-0"
          aria-label="Ask Q"
        />
        <button
          type="submit"
          className="font-mono uppercase tracking-[0.2em] text-xs bg-accent text-accent-foreground px-3 py-1.5 hover:opacity-90 disabled:opacity-40 shrink-0"
          disabled={!value.trim()}
        >
          Ask
        </button>
      </form>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChip(p)}
            className="font-mono uppercase tracking-[0.18em] text-xs border border-border bg-background px-2.5 py-1 hover:border-accent hover:text-accent transition-colors"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
