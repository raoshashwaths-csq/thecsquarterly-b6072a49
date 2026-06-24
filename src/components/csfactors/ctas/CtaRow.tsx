// Single CTA row used in Action Centre panel + List view.
import { cn } from "@/lib/utils";
import { CTA_CONFIG, PRIORITY_CONFIG, CTA_TONE_CLASS, dueDateTone, initials } from "./CtaConfig";
import type { Cta } from "@/lib/ctas.functions";

export function CtaRow({ cta, onClick }: { cta: Cta; onClick?: () => void }) {
  const meta = CTA_CONFIG[cta.cta_type];
  const prio = PRIORITY_CONFIG[cta.priority];
  const tone = dueDateTone(cta.due_date);
  const dueLabel = cta.due_date
    ? new Date(cta.due_date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "—";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full grid grid-cols-[24px_1fr_auto_auto_auto_auto] items-center gap-3 py-3 px-1 hover:bg-muted/40 text-left transition-colors"
    >
      <span className={cn("text-lg leading-none", CTA_TONE_CLASS[meta.tone])}>{meta.icon}</span>
      <div className="min-w-0">
        <div className="text-sm truncate">{cta.title}</div>
        <div className="font-mono uppercase tracking-wider text-[10px] text-muted-foreground truncate">
          {cta.account_name ?? (cta.team_wide ? "PORTFOLIO-WIDE" : "—")}
        </div>
      </div>
      <span className={cn("text-xs font-mono", prio.toneClass)}>●</span>
      <span className="w-6 h-6 rounded-full bg-muted text-[10px] flex items-center justify-center">
        {initials(cta.assigned_to_name)}
      </span>
      <span
        className={cn(
          "font-mono uppercase tracking-wider text-[10px]",
          tone === "overdue" && "text-destructive",
          tone === "today" && "text-[color:var(--secondary-accent)]",
          tone === "future" && "text-foreground/70",
          tone === "none" && "text-foreground/40",
        )}
      >
        {dueLabel}
      </span>
      <span className="font-mono uppercase tracking-wider text-[9px] text-foreground/40">
        {cta.status === "in_progress" ? "WIP" : cta.status.toUpperCase()}
      </span>
    </button>
  );
}
