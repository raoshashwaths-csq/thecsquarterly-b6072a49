import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { askQ } from "@/lib/q.functions";
import { useAuth } from "@/hooks/useAuth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

const TRIAL_KEY = "q.trial.used.v1";
const SEEN_KEY = "q.seen.v1";

export function QAgentButton() {
  const [open, setOpen] = useState(false);
  const [attention, setAttention] = useState(false);
  const [witty, setWitty] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [trialUsed, setTrialUsed] = useState(false);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const ask = useServerFn(askQ);

  // First-visit / fresh-login attention pulse
  useEffect(() => {
    if (typeof window === "undefined") return;
    setTrialUsed(localStorage.getItem(TRIAL_KEY) === "1");
    const seen = localStorage.getItem(SEEN_KEY);
    if (!seen || (user && seen !== `u:${user.id}`)) {
      setAttention(true);
      localStorage.setItem(SEEN_KEY, user ? `u:${user.id}` : "anon");
      const t = setTimeout(() => setAttention(false), 6000);
      return () => clearTimeout(t);
    }
  }, [user]);

  if (pathname.startsWith("/admin") || pathname.startsWith("/agent")) return null;

  const onAsk = async () => {
    if (!question.trim() || loading) return;
    if (trialUsed && !user) {
      toast.error("Your trial question is used. Sign in or join Vanguard for unlimited Q.");
      return;
    }
    setLoading(true);
    setAnswer(null);
    try {
      const { answer: a } = await ask({ data: { question: question.trim(), witty } });
      setAnswer(a);
      if (!user) {
        localStorage.setItem(TRIAL_KEY, "1");
        setTrialUsed(true);
      }
    } catch (e) {
      toast.error((e as Error).message || "Q is unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Q. wordmark — not a circle */}
      <button
        type="button"
        onClick={() => { setOpen(true); setAttention(false); }}
        aria-label="Open Q, the CS operator agent"
        className={[
          "group fixed z-40",
          "bottom-10 right-4 md:bottom-14 md:right-8",
          "px-5 py-3 md:px-6 md:py-3.5",
          "bg-foreground text-background",
          "border border-foreground/90",
          "shadow-[0_10px_40px_-12px_rgba(0,0,0,0.55)]",
          "hover:shadow-[0_16px_50px_-12px_rgba(0,0,0,0.7)]",
          "hover:bg-background hover:text-foreground hover:border-accent",
          "transition-all duration-300",
          "rounded-sm",
          attention ? "q-attention" : "",
        ].join(" ")}
      >
        <span className="font-display leading-none tracking-tight text-3xl md:text-4xl flex items-baseline">
          <span>Q</span>
          <span className="q-dot-bounce text-accent ml-0.5">.</span>
        </span>
        <span className="sr-only">Open Q</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[420px] md:max-w-[38vw] bg-background border-l border-border p-0 overflow-y-auto"
        >
          <div className="p-8 md:p-10">
            <SheetHeader className="text-left mb-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-4">
                Operator Agent · Preview
              </div>
              <SheetTitle className="font-display text-4xl md:text-5xl leading-[0.95] tracking-tight">
                Meet <span className="font-display">Q<span className="text-accent">.</span></span>
              </SheetTitle>
              <SheetDescription className="font-body text-base text-foreground/70 leading-relaxed">
                Your operator-grade canvas for the four moments that decide a Customer Success quarter.
              </SheetDescription>

              {/* Witty mode toggle — directly under description, per PRD voice system */}
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/80">
                    Witty mode
                  </div>
                  <div className="text-xs text-foreground/55 mt-0.5">
                    {witty ? "Wodehouse-style narrative." : "McKinsey-style analysis."}
                  </div>
                </div>
                <Switch checked={witty} onCheckedChange={setWitty} aria-label="Toggle Q witty mode" />
              </div>
            </SheetHeader>

            {/* Trial / ask box */}
            <div className="border border-border p-5 mb-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50 mb-3">
                {user ? "Ask Q" : trialUsed ? "Trial used" : "Free trial · 1 question"}
              </div>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. My champion just left. The incoming VP is hostile. First 48 hours?"
                rows={3}
                disabled={loading || (!user && trialUsed)}
                className="w-full bg-background border border-border px-3 py-2 text-sm font-body resize-none focus:outline-none focus:border-accent disabled:opacity-50"
              />
              <button
                type="button"
                onClick={onAsk}
                disabled={loading || !question.trim() || (!user && trialUsed)}
                className="mt-3 w-full py-3 bg-foreground text-background font-mono text-[10px] uppercase tracking-[0.25em] hover:bg-accent transition-colors disabled:opacity-40"
              >
                {loading ? "Q is thinking…" : "Ask Q"}
              </button>

              {answer && (
                <div className="mt-5 pt-5 border-t border-border">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">
                    {witty ? "Q · witty" : "Q · analytical"}
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                    {answer}
                  </div>
                </div>
              )}

              {!user && trialUsed && (
                <div className="mt-4 text-xs text-foreground/60">
                  That was your trial question.{" "}
                  <Link to="/pricing" className="underline hover:text-accent">
                    Join Vanguard
                  </Link>{" "}
                  for unlimited Q.
                </div>
              )}
            </div>

            <div className="border-t border-border pt-5 mb-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50 mb-3">
                The Four Trees
              </div>
              <ul className="space-y-3">
                {TREES.map((t) => (
                  <li key={t.code} className="flex gap-4">
                    <span className="font-mono text-[11px] text-accent pt-0.5 shrink-0 w-8">{t.code}</span>
                    <div>
                      <div className="font-display text-base leading-tight">{t.title}</div>
                      <div className="text-xs text-foreground/55 mt-0.5">{t.sub}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full py-3 border border-foreground font-mono text-[10px] uppercase tracking-[0.25em] hover:bg-foreground hover:text-background transition-all"
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
