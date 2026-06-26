import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { X, History } from "lucide-react";
import { listMyQRuns } from "@/lib/q-agent.functions";
import { getNode } from "@/lib/q-trees";

const SESSION_KEY = "cs_resume_runprompt_seen_v1";

// Shows once per login session. If the signed-in user has a recent Lumi run,
// we offer to re-open it. Closing it (or any navigation) burns the session flag.
export function ResumeRunPrompt() {
  const list = useServerFn(listMyQRuns);
  const [run, setRun] = useState<{ id: string; node_id: string; created_at: string } | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(SESSION_KEY) === "1") return;
    let alive = true;
    list({})
      .then((r) => {
        if (!alive) return;
        const latest = r.runs?.[0];
        if (!latest) {
          window.sessionStorage.setItem(SESSION_KEY, "1");
          return;
        }
        // Only nudge if the run is from the last 14 days.
        const age = Date.now() - new Date(latest.created_at).getTime();
        if (age < 14 * 24 * 60 * 60 * 1000) {
          setRun(latest);
          setOpen(true);
        } else {
          window.sessionStorage.setItem(SESSION_KEY, "1");
        }
      })
      .catch(() => {
        if (alive) window.sessionStorage.setItem(SESSION_KEY, "1");
      });
    return () => { alive = false; };
  }, [list]);

  // Broadcast open/close so LumiBubble can cede priority.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isOpen = open && !!run;
    (window as any).__lumiResumeRunOpen = isOpen;
    window.dispatchEvent(new CustomEvent("lumi:resume-run-open", { detail: { open: isOpen } }));
    return () => {
      (window as any).__lumiResumeRunOpen = false;
      window.dispatchEvent(new CustomEvent("lumi:resume-run-open", { detail: { open: false } }));
    };
  }, [open, run]);

  function dismiss() {
    setOpen(false);
    if (typeof window !== "undefined") window.sessionStorage.setItem(SESSION_KEY, "1");
  }

  if (!open || !run) return null;
  const node = getNode(run.node_id);
  const label = node ? node.label : "your last decision";

  return (
    <div
      role="dialog"
      aria-label="Resume your last Lumi run"
      className="fixed z-50 bottom-[140px] right-5 md:bottom-[180px] md:right-8 max-w-sm border border-border bg-card shadow-lg"
    >

      <div className="p-4">
        <div className="flex items-start gap-3">
          <History className="h-4 w-4 text-secondary-accent mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-secondary-accent mb-1">
              Pick up where you left off
            </div>
            <p className="text-sm text-foreground/80 leading-snug">
              You ran Lumi on <span className="font-medium text-foreground">{label}</span>. Want to re-open it?
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="text-foreground/60 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Link
            to="/agent/response/$runId"
            params={{ runId: run.id }}
            onClick={dismiss}
            className="font-mono text-[11px] uppercase tracking-[0.22em] bg-accent text-accent-foreground px-3 py-1.5 hover:opacity-90"
          >
            Resume run
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="font-mono text-[11px] uppercase tracking-[0.22em] border border-border px-3 py-1.5 hover:border-foreground"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
