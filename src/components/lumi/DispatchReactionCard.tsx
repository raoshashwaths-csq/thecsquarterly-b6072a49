import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Send, Loader2, Check } from "lucide-react";
import { LumiMark } from "@/components/site/LumiMark";
import {
  submitPostReaction,
  getPostReactionStats,
  getMyPostReaction,
} from "@/lib/post-reactions.functions";
import { continueSituation } from "@/lib/situation-room.functions";
import { useAuth } from "@/hooks/useAuth";

type Reaction = "applied" | "language" | "confirmed" | "disagree";

const OPTIONS: Array<{ key: Reaction; label: string; shortLabel: string }> = [
  { key: "applied", label: "Changed how I'll approach an account this week", shortLabel: "changed their approach" },
  { key: "language", label: "Gave me language I didn't have", shortLabel: "got new language" },
  { key: "confirmed", label: "Confirmed something I already believed", shortLabel: "confirmed a held belief" },
  { key: "disagree", label: "I disagree with the thesis.", shortLabel: "disagreed with the thesis" },
];

type Stats = {
  total: number;
  counts: Record<Reaction, number>;
};

type ChatMsg = { role: "user" | "assistant"; content: string };

function topReaction(stats: Stats): { key: Reaction; pct: number; label: string } | null {
  if (!stats.total) return null;
  let best: Reaction = "applied";
  for (const k of ["applied", "language", "confirmed", "disagree"] as Reaction[]) {
    if (stats.counts[k] > stats.counts[best]) best = k;
  }
  const pct = Math.round((stats.counts[best] / stats.total) * 100);
  const opt = OPTIONS.find((o) => o.key === best)!;
  return { key: best, pct, label: opt.shortLabel };
}

export function DispatchReactionCard({ postId, slug }: { postId: string; slug: string }) {
  const { user } = useAuth();
  const submit = useServerFn(submitPostReaction);
  const fetchStats = useServerFn(getPostReactionStats);
  const fetchMine = useServerFn(getMyPostReaction);
  const cont = useServerFn(continueSituation);

  const [stats, setStats] = useState<Stats>({
    total: 0,
    counts: { applied: 0, language: 0, confirmed: 0, disagree: 0 },
  });
  const [chosen, setChosen] = useState<Reaction | null>(null);
  const [disagreeSessionId, setDisagreeSessionId] = useState<string | null>(null);
  const [pending, setPending] = useState<Reaction | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Disagreement thread state
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial load: aggregate + my reaction (if signed in).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const s = await fetchStats({ data: { postId } });
        if (active) setStats(s);
      } catch { /* */ }
      if (user) {
        try {
          const mine = await fetchMine({ data: { postId } });
          if (active && mine.reaction) {
            setChosen(mine.reaction);
            setDisagreeSessionId(mine.disagreeSessionId);
          }
        } catch { /* */ }
      }
    })();
    return () => { active = false; };
  }, [postId, user, fetchStats, fetchMine]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  async function pick(r: Reaction) {
    if (!user) {
      // Send to login but preserve where they came from.
      window.location.href = `/login?next=${encodeURIComponent(`/insights/${slug}`)}`;
      return;
    }
    if (pending) return;
    setPending(r);
    setError(null);
    try {
      const res = await submit({ data: { postId, reaction: r } });
      setChosen(res.reaction);
      setStats(res.stats);
      setDisagreeSessionId(res.disagreeSessionId);
      if (r === "disagree" && messages.length === 0) {
        // Seed the thread with the assistant opener (mirrors what's stored server-side).
        setMessages([{
          role: "assistant",
          content: `You just pushed back on this dispatch. Tell Lumi where the thesis breaks for you — your pushback may shape the next dispatch.`,
        }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your signal.");
    } finally {
      setPending(null);
    }
  }

  async function sendPushback() {
    if (!disagreeSessionId || !draft.trim() || sending) return;
    const text = draft.trim();
    setDraft("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setSending(true);
    try {
      const res = await cont({ data: { sessionId: disagreeSessionId, message: text } });
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch (e) {
      setMessages((m) => [...m, {
        role: "assistant",
        content: e instanceof Error ? `Lumi: ${e.message}` : "Lumi couldn't reply just now.",
      }]);
    } finally {
      setSending(false);
    }
  }

  const top = topReaction(stats);

  return (
    <section
      aria-labelledby="reader-signal-heading"
      className="mt-16 border border-border bg-card/40 backdrop-blur-sm p-6 md:p-8 rounded-sm"
    >
      <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-3">
        Reader signal · one tap
      </div>
      <h3 id="reader-signal-heading" className="font-display text-2xl md:text-3xl leading-tight mb-2">
        What did this change for you?
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        One signal per reader. Results shape the next dispatch.
      </p>

      {/* Options */}
      <div className="grid gap-2">
        {OPTIONS.map((o) => {
          const isChosen = chosen === o.key;
          const isPending = pending === o.key;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => pick(o.key)}
              disabled={!!pending}
              aria-pressed={isChosen}
              className={`group flex items-center justify-between gap-3 text-left px-4 py-3 border transition-colors rounded-sm ${
                isChosen
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-border hover:border-accent hover:bg-muted/30 text-foreground"
              }`}
            >
              <span className="text-sm md:text-base leading-snug">{o.label}</span>
              <span className="shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-full border border-border group-hover:border-accent">
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : isChosen ? <Check className="h-3 w-3 text-accent" /> : null}
              </span>
            </button>
          );
        })}
      </div>

      {error && <div className="mt-3 text-xs text-destructive">{error}</div>}

      {/* Aggregate readout */}
      {(chosen || stats.total > 0) && (
        <div className="mt-6 pt-5 border-t border-border">
          {top ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-display text-foreground text-base">{top.pct}%</span> of operators{" "}
              {top.label} this week.{" "}
              <span className="font-mono text-xs uppercase tracking-widest ml-1">
                {stats.total} signal{stats.total === 1 ? "" : "s"}
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Be the first to signal.</p>
          )}
        </div>
      )}

      {/* Disagree → inline Lumi pushback thread */}
      {chosen === "disagree" && disagreeSessionId && (
        <div className="mt-6 border border-border rounded-sm overflow-hidden">
          <div className="bg-muted/40 px-4 py-3 border-b border-border flex items-center gap-2">
            <LumiMark variant="emblem" className="h-5 w-5" />
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Pushback thread · saved to your Situation Room
            </div>
          </div>
          <div ref={scrollRef} className="max-h-72 overflow-y-auto px-4 py-3 space-y-3 bg-background">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-sm leading-relaxed ${
                  m.role === "assistant" ? "text-foreground" : "text-foreground/80 pl-4 border-l-2 border-accent"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent mb-1">Lumi</div>
                )}
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Lumi is thinking…
              </div>
            )}
          </div>
          <form
            className="flex items-center gap-2 border-t border-border px-3 py-2 bg-background"
            onSubmit={(e) => { e.preventDefault(); void sendPushback(); }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Where does the thesis break?"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              className="inline-flex items-center justify-center h-8 w-8 rounded-sm bg-accent text-accent-foreground disabled:opacity-40"
              aria-label="Send pushback"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground bg-muted/20">
            <Link to="/situation-room" className="underline underline-offset-2 hover:text-accent">
              Continue in Situation Room →
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
