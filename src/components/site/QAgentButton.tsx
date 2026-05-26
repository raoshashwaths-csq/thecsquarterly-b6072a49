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
 * Typographic wordmark "Q." (no circular chip). The period carries a subtle
 * bounce to signal the agent is alive. Visual-only for now.
 */
export function QAgentButton() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname.startsWith("/admin") || pathname.startsWith("/agent")) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Q, the CS operator agent"
        className="group fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-40 inline-flex items-end leading-none font-display text-foreground hover:text-accent transition-colors duration-300 select-none [text-shadow:0_1px_0_var(--background),0_2px_18px_color-mix(in_oklab,var(--background)_75%,transparent)]"
        style={{ fontSize: "clamp(56px, 9vw, 88px)" }}
      >
        <span className="italic font-medium tracking-tight">Q</span>
        <span
          aria-hidden
          className="ml-[0.04em] inline-block text-accent animate-q-bounce"
        >
          .
        </span>
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
