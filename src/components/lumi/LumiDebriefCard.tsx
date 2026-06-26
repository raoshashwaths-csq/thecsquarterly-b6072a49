import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { X, Send, Loader2, ArrowRight } from "lucide-react";
import { LumiMark } from "@/components/site/LumiMark";
import { startDispatchDebrief } from "@/lib/dispatch-debrief.functions";
import { continueSituation } from "@/lib/situation-room.functions";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionTier } from "@/hooks/useSubscriptionTier";

type ChatMsg = { role: "user" | "assistant"; content: string };

const SHOWN_KEY_PREFIX = "csq.debrief.shown.";
const TRIGGER_PROGRESS = 0.9;

export function LumiDebriefCard({
  postId,
  slug,
  title,
  progress,
}: {
  postId: string;
  slug: string;
  title: string;
  progress: number; // 0..1
}) {
  const { user, loading: authLoading } = useAuth();
  const sub = useSubscriptionTier();
  const start = useServerFn(startDispatchDebrief);
  const cont = useServerFn(continueSituation);

  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedToWorkspace, setSavedToWorkspace] = useState(false);
  const reducedMotion = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Detect reduced motion + dismissal once.
  useEffect(() => {
    if (typeof window === "undefined") return;
    reducedMotion.current = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    try {
      if (sessionStorage.getItem(SHOWN_KEY_PREFIX + slug) === "1") setDismissed(true);
    } catch { /* */ }
  }, [slug]);

  // Trigger at 90% scroll, once per session per slug.
  useEffect(() => {
    if (visible || dismissed) return;
    if (authLoading) return;
    if (!user) return; // visitors: no debrief
    if (progress < TRIGGER_PROGRESS) return;
    setVisible(true);
    try { sessionStorage.setItem(SHOWN_KEY_PREFIX + slug, "1"); } catch { /* */ }
  }, [progress, visible, dismissed, user, authLoading, slug]);

  // Auto-scroll thread.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const startMut = useMutation({
    mutationFn: () => start({ data: { postId } }),
    onSuccess: (res) => {
      setSessionId(res.sessionId);
      setMessages([{ role: "assistant", content: res.opening }]);
    },
    onError: (e: Error) => {
      if (e.message === "DEBRIEF_FREE_CAP_REACHED") setError("FREE_CAP");
      else if (e.message === "Q_MONTHLY_CAP_REACHED") setError("LUMI_CAP");
      else setError(e.message);
    },
  });

  const contMut = useMutation({
    mutationFn: (msg: string) => cont({ data: { sessionId: sessionId!, message: msg } }),
    onSuccess: (res) => {
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    },
    onError: (e: Error) => setError(e.message),
  });

  if (!visible || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
  };

  const handleStart = () => {
    setError(null);
    startMut.mutate();
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || !sessionId) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    contMut.mutate(text);
  };

  const isFree = sub.tier === "free";
  const showFreeCap = error === "FREE_CAP";
  const showLumiCap = error === "LUMI_CAP";

  return (
    <div
      className={`fixed z-40 right-5 bottom-5 md:right-8 md:bottom-8 w-[min(420px,calc(100vw-32px))] ${
        reducedMotion.current ? "animate-fade-up" : "lumi-debrief-slide-in"
      }`}
      role="dialog"
      aria-label="Lumi debrief"
    >
      <div className="rounded-lg border border-secondary-accent/70 bg-background shadow-[0_8px_32px_rgba(0,0,0,0.18)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/40">
          <div className="flex items-center gap-2">
            <LumiMark variant="gold" size={18} />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/65">
              Lumi · Debrief
            </span>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss debrief"
            className="text-foreground/45 hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        {!sessionId && !showFreeCap && !showLumiCap && (
          <div className="px-4 py-4">
            <p className="font-serif text-[15px] leading-[1.5] text-foreground">
              You just finished <em>{title}</em>. Want to work through the one actionable on a real account?
            </p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
                {isFree ? "Free debrief · 1 per month" : "Counts as 1 Lumi run"}
              </p>
              <button
                type="button"
                onClick={handleStart}
                disabled={startMut.isPending}
                className="lumi-cta inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-mono uppercase tracking-[0.16em] rounded disabled:opacity-50"
              >
                {startMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                Start
              </button>
            </div>
          </div>
        )}

        {/* Free cap */}
        {showFreeCap && (
          <div className="px-4 py-4">
            <p className="font-serif text-[14px] leading-[1.5] text-foreground">
              You've used your free debrief this month. Debriefs reset on the 1st.
            </p>
            <Link
              to="/pricing"
              className="lumi-cta mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-mono uppercase tracking-[0.16em] rounded"
            >
              Upgrade for unlimited
            </Link>
          </div>
        )}

        {/* Lumi cap (paid over monthly pool) */}
        {showLumiCap && (
          <div className="px-4 py-4">
            <p className="font-serif text-[14px] leading-[1.5] text-foreground">
              You've used all your Lumi runs this month. Pool resets on the 1st.
            </p>
            <Link
              to="/pricing"
              className="lumi-cta mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-mono uppercase tracking-[0.16em] rounded"
            >
              Increase your pool
            </Link>
          </div>
        )}

        {/* Active conversation */}
        {sessionId && (
          <>
            <div
              ref={scrollRef}
              className="px-4 py-3 max-h-[40vh] overflow-y-auto space-y-3"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === "assistant"
                      ? "font-serif text-[14px] leading-[1.55] text-foreground"
                      : "font-serif text-[14px] leading-[1.55] text-foreground/85 pl-3 border-l-2 border-secondary-accent/60"
                  }
                >
                  {m.role === "assistant" && (
                    <span className="block font-mono text-[9px] uppercase tracking-[0.22em] text-secondary-accent mb-0.5">
                      Lumi
                    </span>
                  )}
                  {m.content}
                </div>
              ))}
              {contMut.isPending && (
                <div className="flex items-center gap-2 text-foreground/55 font-mono text-[10px] uppercase tracking-[0.18em]">
                  <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
                </div>
              )}
              {error && !showFreeCap && !showLumiCap && (
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-destructive">
                  {error}
                </p>
              )}
            </div>
            <div className="border-t border-border px-3 py-2 flex items-end gap-2 bg-secondary/30">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder="Name the account…"
                className="flex-1 resize-none bg-background border border-border rounded px-2.5 py-1.5 font-serif text-[13px] leading-[1.4] text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-secondary-accent/70 max-h-32"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || contMut.isPending}
                aria-label="Send"
                className="lumi-cta inline-flex items-center justify-center h-8 w-8 rounded disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="px-4 py-2 border-t border-border flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/55">
              <span>{savedToWorkspace ? "Saved to Situation Room" : "Auto-saving to Situation Room"}</span>
              <Link to="/situation-room" className="hover:text-foreground transition-colors" onClick={() => setSavedToWorkspace(true)}>
                Open ↗
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
