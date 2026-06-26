import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QMark } from "@/components/site/QMark";
import { getLumiNudge, resolveLumiNudge } from "@/lib/lumi-memory.functions";

/**
 * Surfaces a 14+ day old "situation" memory so Lumi can check in: did this
 * resolve, is it still active, or dismiss. Renders nothing when there is no
 * eligible memory.
 */
export function LumiMemoryNudge() {
  const fetchNudge = useServerFn(getLumiNudge);
  const resolve = useServerFn(resolveLumiNudge);
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["lumi-nudge"],
    queryFn: () => fetchNudge(),
    staleTime: 5 * 60_000,
  });
  const row = q.data?.nudge;
  if (!row) return null;

  const days = Math.floor((Date.now() - new Date(row.created_at).getTime()) / 86400000);
  const ago = days >= 14 ? `${Math.round(days / 7)} weeks ago` : `${days} days ago`;

  const handle = async (action: "resolved" | "still_open" | "dismiss") => {
    try {
      await resolve({ data: { id: row.id, action } });
      if (action === "resolved") toast.success("Glad to hear it. Lumi will retire that note.");
      qc.invalidateQueries({ queryKey: ["lumi-nudge"] });
      qc.invalidateQueries({ queryKey: ["lumi-memory"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update.");
    }
  };

  return (
    <div className="border border-border bg-foreground/[0.02] p-5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 shrink-0 rounded-full bg-foreground/5 border border-border flex items-center justify-center mt-0.5">
          <QMark className="text-xs" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-1.5">
            Lumi check-in
          </div>
          <p className="text-sm font-serif leading-relaxed mb-3">
            You mentioned this {ago}: <span className="italic">"{row.content}"</span> — how did it go?
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handle("resolved")}
              className="px-3 py-1.5 bg-foreground text-background font-mono text-[10px] uppercase tracking-widest"
            >
              Resolved
            </button>
            <button
              type="button"
              onClick={() => handle("still_open")}
              className="px-3 py-1.5 border border-border font-mono text-[10px] uppercase tracking-widest hover:border-foreground transition-colors"
            >
              Still open
            </button>
            <button
              type="button"
              onClick={() => handle("dismiss")}
              className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
