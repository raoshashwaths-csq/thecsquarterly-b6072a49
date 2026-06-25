import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QMark } from "@/components/site/QMark";
import { ReaderWelcomeDialog } from "@/components/site/ReaderWelcomeDialog";
import { unlockSharedRun } from "@/lib/shared-run.functions";

const STORAGE_PREFIX = "lumi-unlock-";

export function isRunUnlocked(runId: string): boolean {
  if (typeof window === "undefined") return false;
  try { return window.localStorage.getItem(STORAGE_PREFIX + runId) === "1"; } catch { return false; }
}

function markUnlocked(runId: string) {
  try { window.localStorage.setItem(STORAGE_PREFIX + runId, "1"); } catch { /* ignore */ }
}

/**
 * Wrap shared Lumi run content. After 50% scroll, freezes the lower half
 * behind a brand-token gradient and asks anonymous viewers for their email.
 * On unlock, fires the Reader welcome dialog and reveals the rest.
 */
export function SharedRunGate({
  runId,
  children,
}: {
  runId: string;
  children: React.ReactNode;
}) {
  const [unlocked, setUnlocked] = useState<boolean>(() => isRunUnlocked(runId));
  const [pastHalf, setPastHalf] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const unlockFn = useServerFn(unlockSharedRun);

  useEffect(() => {
    if (unlocked) return;
    function onScroll() {
      const el = contentRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.scrollHeight;
      const seen = Math.min(total, Math.max(0, window.innerHeight - rect.top));
      if (seen / total >= 0.5) setPastHalf(true);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [unlocked]);

  useEffect(() => {
    if (pastHalf && !unlocked) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [pastHalf, unlocked]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await unlockFn({ data: { runId, email } });
      markUnlocked(runId);
      setUnlocked(true);
      setShowWelcome(true);
      document.body.style.overflow = "";
    } catch (err) {
      toast.error((err as Error).message || "Couldn't unlock — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div ref={contentRef} className={pastHalf && !unlocked ? "relative" : undefined}>
        {children}
        {pastHalf && !unlocked && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-b from-transparent via-background/85 to-background backdrop-blur-sm" />
        )}
      </div>

      {pastHalf && !unlocked && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-5 pb-6 pt-10 bg-gradient-to-t from-background via-background to-background/0">
          <div className="max-w-xl mx-auto border border-accent/40 bg-card rounded-md p-6 shadow-xl">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-2">
              <QMark periodClassName="text-foreground" /> Reader unlock
            </div>
            <h3 className="font-display text-xl md:text-2xl tracking-tight mb-2">
              Share your email to read the rest of this Lumi run<span className="text-accent">.</span>
            </h3>
            <p className="text-sm text-foreground/70 mb-4">
              You'll also unlock the weekly briefing, the Codex, and the free diagnostic score sheet.
            </p>
            <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={busy}>
                {busy ? "Unlocking…" : "Unlock"}
              </Button>
            </form>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/50 mt-3">
              No password. One email. Unsubscribe anytime.
            </p>
          </div>
        </div>
      )}

      <ReaderWelcomeDialog open={showWelcome} onClose={() => setShowWelcome(false)} />
    </>
  );
}
