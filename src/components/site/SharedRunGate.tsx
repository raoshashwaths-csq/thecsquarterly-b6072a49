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
      if (total > 0 && seen / total >= 0.5) setPastHalf(true);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [unlocked]);

  // Freeze page scroll while gated — lock html + body so iOS Safari respects it.
  useEffect(() => {
    if (pastHalf && !unlocked) {
      const prevHtml = document.documentElement.style.overflow;
      const prevBody = document.body.style.overflow;
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      return () => {
        document.documentElement.style.overflow = prevHtml;
        document.body.style.overflow = prevBody;
      };
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
    } catch (err) {
      toast.error((err as Error).message || "Couldn't unlock — please try again.");
    } finally {
      setBusy(false);
    }
  }

  const gated = pastHalf && !unlocked;

  return (
    <>
      <div ref={contentRef}>{children}</div>

      {gated && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          {/* Solid opaque wash — no backdrop-filter (kills mobile perf and freezes scroll) */}
          <div
            className="absolute inset-0 pointer-events-auto"
            style={{
              background:
                "linear-gradient(to bottom, hsl(var(--background) / 0.85) 0%, hsl(var(--background)) 40%)",
            }}
            aria-hidden
          />
          <div className="relative pointer-events-auto w-full max-w-xl mx-auto px-4">
            <div className="border border-accent/40 bg-card rounded-md p-5 sm:p-6 shadow-2xl">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-2">
                <QMark periodClassName="text-foreground" /> Reader unlock
              </div>
              <h3 className="font-display text-xl sm:text-2xl tracking-tight mb-2">
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
        </div>
      )}


      <ReaderWelcomeDialog open={showWelcome} onClose={() => setShowWelcome(false)} />
    </>
  );
}
