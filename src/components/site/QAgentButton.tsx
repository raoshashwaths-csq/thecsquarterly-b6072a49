import { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import qMark from "@/assets/q-mark.png";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

/**
 * Q — floating agent entry point.
 * Visual-only for now. Opens a 35%-width right drawer (per PRD v3 layout grid).
 * Logic trees (Escalation / Champion / Upsell / Career) wire up later.
 */
export function QAgentButton() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Hide on admin and inside the future /agent/* workspace (which will own its own UI).
  if (pathname.startsWith("/admin") || pathname.startsWith("/agent")) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Q, the CS operator agent"
        className="group fixed bottom-6 right-6 z-40 h-16 w-16 rounded-full bg-background border border-foreground/20 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.5)] hover:border-accent transition-all duration-300 flex items-center justify-center"
      >
        <img
          src={qMark}
          alt=""
          className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-110 dark:invert"
        />
        <span className="sr-only">Open Q</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[420px] md:max-w-[35vw] bg-background border-l border-border p-0 overflow-y-auto"
        >
          <div className="p-8 md:p-10">
            <SheetHeader className="text-left mb-8">
              <div className="flex items-center gap-3 mb-6">
                <img src={qMark} alt="" className="h-9 w-9 object-contain dark:invert" />
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent">
                  Operator Agent · Preview
                </span>
              </div>
              <SheetTitle className="font-display text-4xl md:text-5xl leading-[0.95] tracking-tight">
                Meet <span className="italic">Q.</span>
              </SheetTitle>
              <SheetDescription className="font-body text-base text-foreground/70 leading-relaxed">
                Your operator-grade canvas for working through the four moments that decide a Customer Success quarter.
              </SheetDescription>
            </SheetHeader>

            <div className="border-t border-border pt-6 mb-8">
              <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50 mb-4">
                The Four Trees
              </div>
              <ul className="space-y-4">
                {TREES.map((t) => (
                  <li key={t.code} className="flex gap-4">
                    <span className="font-mono text-[11px] text-accent pt-0.5 shrink-0 w-8">{t.code}</span>
                    <div>
                      <div className="font-display text-lg leading-tight">{t.title}</div>
                      <div className="text-sm text-foreground/60 mt-0.5">{t.sub}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-border p-5 mb-8">
              <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50 mb-2">
                Status
              </div>
              <p className="text-sm text-foreground/80">
                Q's canvas is being wired in. You're seeing the introduction sheet; the live node graph, resolution drawers,
                and the 6 PM retrospective land in the next release.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full py-3.5 border border-foreground font-mono text-[10px] uppercase tracking-[0.25em] hover:bg-foreground hover:text-background transition-all"
            >
              Close
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

const TREES = [
  { code: "1.0", title: "Manage an Escalation", sub: "Boardroom temperature, 24-hour containment, Voss-style audits." },
  { code: "2.0", title: "Handle Champion Change", sub: "The departed evangelist, the hostile incoming heir." },
  { code: "3.0", title: "Qualify an Upsell", sub: "True Health Index, seat thresholds, churn-safe expansion." },
  { code: "4.0", title: "Career & Alignment", sub: "Appraisal disputes, stretch burden, CFT/HOD conflict." },
];
