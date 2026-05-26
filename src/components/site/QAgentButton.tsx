import { useEffect, useRef, useState } from "react";
import { useRouterState, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { askQ } from "@/lib/q-agent.functions";
import { useAuth } from "@/hooks/useAuth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

const TRIAL_KEY = "q.trial.used";
const SEEN_KEY = "q.attention.seen";
const LOGIN_HINT_KEY = "q.hint.login";


export function QAgentButton() {
  const [open, setOpen] = useState(false);
  const [attention, setAttention] = useState(false);
  const [hint, setHint] = useState(false);
  const [hintLeaving, setHintLeaving] = useState(false);
  const [witty, setWitty] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [trialUsed, setTrialUsed] = useState(false);
  const ask = useServerFn(askQ);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const prevUserIdRef = useRef<string | null>(null);

  // Login-triggered hint: when the user transitions from signed-out → signed-in,
  // pulse the button and float a one-line label next to it for ~6s. Once per
  // logged-in user per browser (keyed by uid) so it never nags.

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setTrialUsed(localStorage.getItem(TRIAL_KEY) === "1");
      if (localStorage.getItem(SEEN_KEY) !== "1") {
        const t = setTimeout(() => setAttention(true), 1200);
        return () => clearTimeout(t);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  // Watch for sign-in transition (null → user). Trigger attention + hint.
  useEffect(() => {
    const prev = prevUserIdRef.current;
    const current = user?.id ?? null;
    prevUserIdRef.current = current;
    if (!current || prev === current) return;
    // prev was null and we now have a user → just signed in.
    try {
      const key = `${LOGIN_HINT_KEY}.${current}`;
      if (localStorage.getItem(key) === "1") return;
      localStorage.setItem(key, "1");
    } catch {
      // ignore
    }
    const inT = window.setTimeout(() => {
      setAttention(true);
      setHintLeaving(false);
      setHint(true);
    }, 800);
    const leaveT = window.setTimeout(() => setHintLeaving(true), 800 + 5600);
    const outT = window.setTimeout(() => setHint(false), 800 + 5600 + 320);
    return () => {
      window.clearTimeout(inT);
      window.clearTimeout(leaveT);
      window.clearTimeout(outT);
    };
  }, [user?.id]);

  const dismissAttention = () => {
    setAttention(false);
    setHintLeaving(true);
    window.setTimeout(() => setHint(false), 300);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // ignore
    }
  };

  const handleOpen = () => {
    setOpen(true);
    dismissAttention();
  };


  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;
    if (trialUsed) return;
    setLoading(true);
    setAnswer(null);
    try {
      const { reply } = await ask({ data: { question, witty } });
      setAnswer(reply);
      try {
        localStorage.setItem(TRIAL_KEY, "1");
      } catch {
        // ignore
      }
      setTrialUsed(true);
    } catch (err) {
      toast.error((err as Error).message || "Q couldn't reply.");
    } finally {
      setLoading(false);
    }
  };

  if (pathname.startsWith("/admin") || pathname.startsWith("/agent")) return null;

  return (
    <>
      {/* Floating Q. — wordmark style, not a circular avatar */}
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Open Q, the CS operator agent"
        className={`group fixed bottom-20 right-5 md:bottom-28 md:right-8 z-40 flex items-end gap-0 pl-4 pr-3 py-2.5 md:pl-5 md:pr-4 md:py-3 bg-foreground text-background border border-foreground shadow-[0_12px_40px_-12px_rgba(0,0,0,0.55)] hover:shadow-[0_18px_50px_-12px_rgba(0,0,0,0.7)] transition-all duration-300 ${attention ? "q-attention" : ""}`}
      >
        <span className="font-display leading-none text-3xl md:text-4xl tracking-tight">Q</span>
        <span
          aria-hidden
          className="font-display leading-none text-3xl md:text-4xl text-accent ml-0.5 q-period"
        >
          .
        </span>
        <span className="sr-only">Ask Q</span>
      </button>

      {hint && (
        <div
          role="status"
          aria-live="polite"
          data-leaving={hintLeaving ? "true" : "false"}
          onClick={dismissAttention}
          className="q-hint fixed z-40 bottom-[6.25rem] right-[5.5rem] md:bottom-[8.25rem] md:right-[6.75rem] cursor-pointer select-none"
          style={{ transform: "translateY(-50%)" }}
        >
          <div className="relative bg-foreground text-background px-3.5 py-2 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)]">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-background/70">
              Meet Q
            </div>
            <div className="font-display text-sm leading-tight mt-0.5">
              Your operator agent is ready<span className="text-accent">.</span>
            </div>
            {/* Tail pointing at the Q button */}
            <span
              aria-hidden
              className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-foreground rotate-45"
            />
          </div>
        </div>
      )}


      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[440px] md:max-w-[38vw] bg-background border-l border-border p-0 overflow-y-auto"
        >
          <div className="p-7 md:p-9">
            <SheetHeader className="text-left mb-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-5">
                Operator Agent · Preview
              </div>
              <SheetTitle asChild>
                <h2 className="font-display text-5xl md:text-6xl leading-[0.9] tracking-tight">
                  Meet Q<span className="text-accent">.</span>
                </h2>
              </SheetTitle>
              <SheetDescription className="font-body text-base text-foreground/75 leading-relaxed pt-3">
                Your operator-grade canvas for the four moments that decide a Customer Success quarter.
              </SheetDescription>

              {/* Witty mode toggle — sits right under the description */}
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/70">
                    Witty mode
                  </div>
                  <div className="text-xs text-foreground/55 mt-0.5">
                    {witty ? "Wodehouse register" : "McKinsey register"}
                  </div>
                </div>
                <Switch checked={witty} onCheckedChange={setWitty} aria-label="Toggle witty mode" />
              </div>
            </SheetHeader>

            {/* Single-question trial */}
            <form onSubmit={handleAsk} className="mb-6">
              <label className="font-mono text-[10px] uppercase tracking-widest text-foreground/50 block mb-2">
                {trialUsed ? "Trial used" : "Ask Q · 1 free question"}
              </label>
              <textarea
                ref={inputRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={loading || trialUsed}
                rows={3}
                maxLength={1000}
                placeholder={
                  trialUsed
                    ? "Subscribe to Vanguard to keep talking to Q."
                    : "How do I contain a board-level escalation in 24 hours?"
                }
                className="w-full border border-border bg-background px-3 py-2.5 font-body text-sm resize-none focus:outline-none focus:border-foreground disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || trialUsed || !question.trim()}
                className="w-full mt-2 py-3 bg-foreground text-background font-mono text-[10px] uppercase tracking-[0.25em] hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Q is thinking…" : trialUsed ? "Trial used" : "Ask Q"}
              </button>
            </form>

            {answer && (
              <div className={`mb-6 border-l-2 ${witty ? "border-secondary-accent" : "border-accent"} pl-4 py-1`}>
                <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50 mb-2">
                  Q replies · {witty ? "witty" : "analytical"}
                </div>
                <div className="font-body text-[15px] text-foreground/85 leading-relaxed whitespace-pre-wrap">
                  {answer}
                </div>
              </div>
            )}

            {trialUsed && (
              <Link
                to="/pricing"
                onClick={() => setOpen(false)}
                className="block text-center mb-3 py-3 border border-foreground font-mono text-[10px] uppercase tracking-[0.25em] hover:bg-foreground hover:text-background transition-all"
              >
                Unlock unlimited Q · Vanguard
              </Link>
            )}

            <Link
              to="/agent/framework"
              onClick={() => setOpen(false)}
              className="block text-center mb-6 py-3 bg-foreground text-background font-mono text-[10px] uppercase tracking-[0.25em] hover:bg-accent transition-colors"
            >
              Open the Canvas →
            </Link>

            <div className="border-t border-border pt-5">
              <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50 mb-4">
                The Four Trees
              </div>
              <ul className="space-y-3.5">
                {TREES.map((t) => (
                  <li key={t.code} className="flex gap-4">
                    <span className="font-mono text-[11px] text-accent pt-1 shrink-0 w-7">{t.code}</span>
                    <div>
                      <div className="font-display text-base leading-tight">{t.title}</div>
                      <div className="text-xs text-foreground/55 mt-0.5">{t.sub}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

const TREES = [
  { code: "1.0", title: "Manage an Escalation", sub: "Boardroom temperature, 24-hour containment." },
  { code: "2.0", title: "Handle Champion Change", sub: "Departed evangelist, hostile incoming heir." },
  { code: "3.0", title: "Qualify an Upsell", sub: "True Health Index, churn-safe expansion." },
  { code: "4.0", title: "Career & Alignment", sub: "Appraisals, stretch burden, CFT conflict." },
];
