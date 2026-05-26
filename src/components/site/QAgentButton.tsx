import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { askQ } from "@/lib/q.functions";

type Tone = "analytical" | "witty";
type Turn = { role: "user" | "q"; text: string; tone?: Tone };

const TRIAL_KEY = "q_trial_used_v1";
const SEEN_KEY = "q_first_seen_v1";

/**
 * Q — floating typographic agent entry point.
 * Reads like the wordmark: serif "Q" with a bouncing period.
 * Click opens a right drawer with a single free question, witty/analytical toggle, then paywall.
 */
export function QAgentButton() {
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState<Tone>("analytical");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [trialUsed, setTrialUsed] = useState(false);
  const [attention, setAttention] = useState(false);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const prevUserId = useRef<string | null>(null);
  const askQFn = useServerFn(askQ);

  // Initial trial state + first-visit attention pulse
  useEffect(() => {
    if (typeof window === "undefined") return;
    setTrialUsed(window.localStorage.getItem(TRIAL_KEY) === "1");
    const seen = window.localStorage.getItem(SEEN_KEY);
    if (!seen) {
      setAttention(true);
      window.localStorage.setItem(SEEN_KEY, "1");
      const t = window.setTimeout(() => setAttention(false), 6000);
      return () => window.clearTimeout(t);
    }
  }, []);

  // Re-trigger attention pulse on login
  useEffect(() => {
    const currentId = user?.id ?? null;
    if (currentId && prevUserId.current !== currentId && prevUserId.current !== null) {
      setAttention(true);
      const t = window.setTimeout(() => setAttention(false), 6000);
      prevUserId.current = currentId;
      return () => window.clearTimeout(t);
    }
    prevUserId.current = currentId;
  }, [user?.id]);

  // Hide on admin and inside future /agent/* workspace
  if (pathname.startsWith("/admin") || pathname.startsWith("/agent")) return null;

  const submit = async () => {
    if (!prompt.trim() || loading) return;
    if (trialUsed) return;
    const userText = prompt.trim();
    setLoading(true);
    setTurns((t) => [...t, { role: "user", text: userText }]);
    setPrompt("");
    try {
      const res = await askQFn({ data: { prompt: userText, tone } });
      setTurns((t) => [...t, { role: "q", text: res.text, tone: res.tone as Tone }]);
      window.localStorage.setItem(TRIAL_KEY, "1");
      setTrialUsed(true);
    } catch (e) {
      toast.error((e as Error).message || "Q couldn't respond.");
      setTurns((t) => t.slice(0, -1));
      setPrompt(userText);
    } finally {
      setLoading(false);
    }
  };

  const wittyClass = tone === "witty" ? "tone-witty" : "";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setAttention(false);
        }}
        aria-label="Open Q, the Chief of Staff agent"
        className={`group fixed z-40 bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] flex items-baseline gap-[2px] px-4 py-2.5 rounded-md bg-background/85 backdrop-blur-md border border-foreground/15 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)] hover:border-accent hover:shadow-[0_14px_40px_-12px_rgba(0,0,0,0.55)] transition-all duration-300 ${attention ? "animate-q-attention" : ""}`}
      >
        <span
          aria-hidden
          className="font-display text-foreground leading-none tracking-tight"
          style={{ fontSize: "2rem", fontWeight: 500, fontVariationSettings: '"opsz" 72' }}
        >
          Q
        </span>
        <span
          aria-hidden
          className="font-display leading-none animate-q-period text-accent group-hover:text-secondary-accent transition-colors"
          style={{ fontSize: "2rem", fontWeight: 700 }}
        >
          .
        </span>
        <span className="sr-only">Open Q</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className={`w-full sm:max-w-[440px] md:max-w-[38vw] bg-background border-l border-border p-0 overflow-y-auto ${wittyClass}`}
        >
          <div className="p-7 md:p-9">
            <SheetHeader className="text-left mb-6">
              <div className="flex items-baseline gap-[3px] mb-5">
                <span
                  className="font-display text-foreground leading-none"
                  style={{ fontSize: "2.75rem", fontWeight: 500, fontVariationSettings: '"opsz" 72' }}
                >
                  Q
                </span>
                <span
                  className="font-display leading-none animate-q-period text-accent"
                  style={{ fontSize: "2.75rem", fontWeight: 700 }}
                >
                  .
                </span>
                <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent self-center">
                  Operator Agent · Preview
                </span>
              </div>
              <SheetTitle className="font-display text-3xl md:text-4xl leading-[1] tracking-tight">
                Your operator-grade canvas for the four moments that decide a Customer Success quarter.
              </SheetTitle>
              <SheetDescription className="font-body text-[15px] text-foreground/70 leading-relaxed">
                Ask Q one question, in either voice. Subscribers get the full canvas, escalation drawers, and the 6 PM retrospective.
              </SheetDescription>

              {/* Witty / Analytical toggle */}
              <div className="mt-5 inline-flex border border-border rounded-sm overflow-hidden self-start" role="tablist" aria-label="Q voice">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tone === "analytical"}
                  onClick={() => setTone("analytical")}
                  className={`px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.22em] transition-colors ${tone === "analytical" ? "bg-foreground text-background" : "hover:bg-muted text-foreground/70"}`}
                >
                  Analytical
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tone === "witty"}
                  onClick={() => setTone("witty")}
                  className={`px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.22em] transition-colors ${tone === "witty" ? "bg-foreground text-background" : "hover:bg-muted text-foreground/70"}`}
                >
                  Witty
                </button>
              </div>
            </SheetHeader>

            {/* Conversation */}
            <div className="space-y-5 mb-6">
              {turns.length === 0 && (
                <div className="border border-dashed border-border p-5 text-sm text-foreground/65">
                  Try: <span className="italic">"My champion just left for a competitor. What do I do in the next 24 hours?"</span>
                </div>
              )}
              {turns.map((t, i) => (
                <div key={i} className={t.role === "user" ? "" : "border-l-2 border-accent pl-4 animate-tone-swap"}>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/45 mb-1.5">
                    {t.role === "user" ? "You" : t.tone === "witty" ? "Q · witty" : "Q · analytical"}
                  </div>
                  <p className="font-body text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {t.text}
                  </p>
                </div>
              ))}
              {loading && (
                <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/40">
                  Q is thinking<span className="animate-q-period">.</span>
                </div>
              )}
            </div>

            {/* Input or paywall */}
            {!trialUsed ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit();
                }}
                className="space-y-3"
              >
                <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">
                  One free question · {tone === "witty" ? "Wodehouse voice" : "McKinsey voice"}
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask Q about an escalation, champion change, upsell, or appraisal…"
                  rows={3}
                  maxLength={2000}
                  disabled={loading}
                  className="w-full border border-border bg-background px-4 py-3 font-body text-[15px] leading-relaxed focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className="w-full py-3.5 bg-foreground text-background font-mono text-[10px] uppercase tracking-[0.25em] hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {loading ? "Asking Q…" : "Ask Q"}
                </button>
              </form>
            ) : (
              <div className="border border-foreground p-5 space-y-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">
                  Trial complete
                </div>
                <p className="font-body text-[15px] leading-relaxed text-foreground/85">
                  You've used your free question. Vanguard members get unlimited sessions with Q, both voices, and the full operator canvas.
                </p>
                <Link
                  to="/pricing"
                  onClick={() => setOpen(false)}
                  className="block text-center py-3.5 bg-foreground text-background font-mono text-[10px] uppercase tracking-[0.25em] hover:bg-accent transition-colors"
                >
                  See Vanguard pricing
                </Link>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
