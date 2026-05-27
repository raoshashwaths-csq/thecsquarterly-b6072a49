import { useEffect, useMemo, useRef, useState } from "react";
import { useRouterState, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { askQ, getQEntitlement } from "@/lib/q-agent.functions";
import { globalSearch, searchUserWorkspace, type SearchHit } from "@/lib/discovery.functions";
import { NODES } from "@/lib/q-trees";
import { useAuth } from "@/hooks/useAuth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { QMark } from "@/components/site/QMark";
import { FileText, BookOpen, Sparkles, Bookmark, Highlighter } from "lucide-react";

const TRIAL_KEY = "q.trial.used";
const SEEN_KEY = "q.attention.seen";
const LOGIN_HINT_KEY = "q.hint.login";

// Rotating capability messages for the floating Meet Q. speech bubble.
const CAPABILITY_LINES = [
  "I can defuse a board-level escalation in 24 hours.",
  "I can rebuild a QBR a customer actually wants to attend.",
  "I can map a new champion after a reorg.",
  "I can read renewal risk 90 days out.",
  "I can write your appraisal narrative — retained ARR first.",
  "I can break a 60-day silence without sounding desperate.",
  "I can call upsell from coverage masking churn.",
];

// Rolling placeholder prompts pulled from the 8 trees' terminal nodes,
// reframed as the question an operator would actually type.
const ROLLING_PROMPTS = [
  "How do I contain a board-level escalation in 24 hours?",
  "How do I handle a champion who just left for a competitor?",
  "Is this expansion signal real, or coverage masking churn?",
  "What does our True Health Index say 90 days before renewal?",
  "Build me a 45-minute QBR with a new C-level sponsor.",
  "Onboarding has stalled on customer-side data — what now?",
  "Procurement is being weaponized. What's my concession ladder?",
  "Write a self-appraisal that leads with retained ARR.",
];

export function QAgentButton() {
  const [open, setOpen] = useState(false);
  const [attention, setAttention] = useState(false);
  const [bubble, setBubble] = useState(false);
  const [bubbleLeaving, setBubbleLeaving] = useState(false);
  const [bubbleIdx, setBubbleIdx] = useState(0);
  const [scope, setScope] = useState<"universal" | "workspace">("universal");
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [trialUsed, setTrialUsed] = useState(false);
  const [unlimited, setUnlimited] = useState(false);

  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  const ask = useServerFn(askQ);
  const fetchEntitlement = useServerFn(getQEntitlement);
  const runUniversal = useServerFn(globalSearch);
  const runWorkspace = useServerFn(searchUserWorkspace);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const prevUserIdRef = useRef<string | null>(null);

  // Sample 3 terminal-node prompt templates to seed the suggestion chips.
  const suggestions = useMemo(() => {
    const terminals = NODES.filter((n) => n.isTerminal && n.promptTemplate);
    const picks: string[] = [];
    const step = Math.max(1, Math.floor(terminals.length / 3));
    for (let i = 0; i < terminals.length && picks.length < 3; i += step) {
      picks.push(terminals[i].label);
    }
    return picks;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setTrialUsed(localStorage.getItem(TRIAL_KEY) === "1");
      if (localStorage.getItem(SEEN_KEY) !== "1") {
        const t = setTimeout(() => {
          setAttention(true);
          setBubble(true);
        }, 1200);
        return () => clearTimeout(t);
      }
    } catch { /* */ }
  }, []);

  // Rotate capability messages in the floating speech bubble.
  useEffect(() => {
    if (!bubble) return;
    const t = setInterval(() => {
      setBubbleIdx((i) => (i + 1) % CAPABILITY_LINES.length);
    }, 3800);
    return () => clearInterval(t);
  }, [bubble]);

  // Rotate placeholder prompts inside the search bar.
  useEffect(() => {
    if (!open || query.length > 0) return;
    const t = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % ROLLING_PROMPTS.length);
    }, 3200);
    return () => clearInterval(t);
  }, [open, query.length]);

  useEffect(() => {
    if (!user) { setUnlimited(false); return; }
    let cancelled = false;
    fetchEntitlement()
      .then((r) => { if (!cancelled) setUnlimited(!!r.unlimited); })
      .catch(() => { if (!cancelled) setUnlimited(false); });
    return () => { cancelled = true; };
  }, [user, fetchEntitlement]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    const prev = prevUserIdRef.current;
    const current = user?.id ?? null;
    prevUserIdRef.current = current;
    if (!current || prev === current) return;
    try {
      const key = `${LOGIN_HINT_KEY}.${current}`;
      if (localStorage.getItem(key) === "1") return;
      localStorage.setItem(key, "1");
    } catch { /* */ }
    const inT = window.setTimeout(() => {
      setAttention(true);
      setBubbleLeaving(false);
      setBubble(true);
    }, 800);
    const leaveT = window.setTimeout(() => setBubbleLeaving(true), 800 + 8000);
    const outT = window.setTimeout(() => setBubble(false), 800 + 8000 + 320);
    return () => { window.clearTimeout(inT); window.clearTimeout(leaveT); window.clearTimeout(outT); };
  }, [user?.id]);

  // Debounced live search as the operator types.
  useEffect(() => {
    const q = query.trim();
    if (!q) { setHits([]); return; }
    if (scope === "workspace" && !user) { setHits([]); return; }
    setSearchLoading(true);
    const t = setTimeout(() => {
      const call = scope === "universal"
        ? runUniversal({ data: { q } })
        : runWorkspace({ data: { q } });
      call
        .then((r) => setHits(r.hits ?? []))
        .catch(() => setHits([]))
        .finally(() => setSearchLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [query, scope, user, runUniversal, runWorkspace]);

  const dismissAttention = () => {
    setAttention(false);
    setBubbleLeaving(true);
    window.setTimeout(() => setBubble(false), 300);
    try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* */ }
  };

  const handleOpen = () => { setOpen(true); dismissAttention(); };

  const gated = trialUsed && !unlimited;

  const handleAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;
    if (gated) return;
    setLoading(true);
    setAnswer(null);
    try {
      const prefix = scope === "workspace"
        ? "Answer using ONLY the operator's saved Workspace context if relevant; otherwise say you have nothing on file.\n\nQuestion: "
        : "";
      const { reply } = await ask({ data: { question: prefix + query, witty: false } });
      setAnswer(reply);
      if (!unlimited) {
        try { localStorage.setItem(TRIAL_KEY, "1"); } catch { /* */ }
        setTrialUsed(true);
      }
    } catch (err) {
      toast.error((err as Error).message || "Q couldn't reply.");
    } finally {
      setLoading(false);
    }
  };

  if (pathname.startsWith("/admin") || pathname.startsWith("/agent")) return null;

  const currentPlaceholder = ROLLING_PROMPTS[placeholderIdx];

  return (
    <>
      {/* Floating Meet Q. — unchanged */}
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Meet Q, the CS operator agent"
        className={`group fixed bottom-20 right-5 md:bottom-28 md:right-8 z-40 flex items-end gap-0 pl-4 pr-3 py-2.5 md:pl-5 md:pr-4 md:py-3 bg-foreground text-background border border-foreground shadow-[0_12px_40px_-12px_rgba(0,0,0,0.55)] hover:shadow-[0_18px_50px_-12px_rgba(0,0,0,0.7)] transition-all duration-300 ${attention ? "q-attention" : ""}`}
      >
        <QMark className="font-display leading-none text-3xl md:text-4xl tracking-tight" periodClassName="text-accent ml-0.5 q-period" />
        <span className="sr-only">Meet Q.</span>
      </button>

      {/* Rotating capability speech bubble */}
      {bubble && (
        <div
          role="status"
          aria-live="polite"
          data-leaving={bubbleLeaving ? "true" : "false"}
          onClick={dismissAttention}
          className="q-hint fixed z-40 bottom-[6.25rem] right-[5.5rem] md:bottom-[8.25rem] md:right-[6.75rem] cursor-pointer select-none max-w-[260px] md:max-w-[320px]"
          style={{ transform: "translateY(-50%)" }}
        >
          <div className="relative bg-foreground text-background px-4 py-2.5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)]">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-secondary-accent mb-1">
              Meet <QMark periodClassName="text-accent" />
            </div>
            <div
              key={bubbleIdx}
              className="font-display text-[13px] md:text-sm leading-snug animate-fade-up"
            >
              {CAPABILITY_LINES[bubbleIdx]}
            </div>
            <span aria-hidden className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-foreground rotate-45" />
          </div>
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[460px] md:max-w-[42vw] bg-background border-l border-border p-0 overflow-y-auto"
        >
          <div className="p-7 md:p-9">
            <SheetHeader className="text-left mb-7">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-5">
                Operator Agent · Beta
              </div>
              <SheetTitle asChild>
                <h2 className="font-display text-5xl md:text-6xl leading-[0.9] tracking-tight">
                  Ask <QMark />
                </h2>
              </SheetTitle>
              <SheetDescription className="font-body text-base text-foreground/75 leading-relaxed pt-3">
                Type the question. <QMark /> searches as you type and reasons when you ask.
              </SheetDescription>
            </SheetHeader>

            {/* Scope toggle — ABOVE the search bar */}
            <div className="mb-3 inline-flex items-stretch border border-border">
              <button
                type="button"
                onClick={() => { setScope("universal"); setHits([]); }}
                className={`px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] transition-colors ${
                  scope === "universal" ? "bg-foreground text-background" : "hover:bg-muted"
                }`}
              >
                Universal
              </button>
              <button
                type="button"
                onClick={() => { setScope("workspace"); setHits([]); }}
                disabled={!user}
                className={`px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  scope === "workspace" ? "bg-foreground text-background" : "hover:bg-muted"
                }`}
              >
                Workspace
              </button>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/55 mb-3">
              {scope === "universal"
                ? "Every dispatch, codex entry, playbook."
                : user
                  ? "Only your saved links, files, and highlights."
                  : "Sign in to search your saved Workspace."}
            </p>

            {/* Search bar with rolling placeholder */}
            <form onSubmit={handleAsk} className="mb-3">
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading}
                maxLength={1000}
                placeholder={gated ? "Subscribe to Vanguard to keep asking Q." : currentPlaceholder}
                className="w-full border border-border bg-background px-4 py-3.5 font-body text-base focus:outline-none focus:border-foreground transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || gated || !query.trim()}
                className="w-full mt-2 py-3.5 bg-foreground text-background font-mono text-[11px] uppercase tracking-[0.3em] hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? <><QMark periodClassName="text-accent-foreground/70" /> is thinking…</> : gated ? "Trial used" : <>Ask <QMark periodClassName="text-accent-foreground/70" /></>}
              </button>
            </form>

            {/* Suggestion chips — only when empty */}
            {!query && !answer && suggestions.length > 0 && (
              <div className="mb-5">
                <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-foreground/45 mb-2">
                  Try
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setQuery(s); inputRef.current?.focus(); }}
                      className="text-left text-xs font-body border border-border px-2.5 py-1.5 hover:border-foreground hover:bg-foreground/5 transition-colors max-w-full break-words"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Live search results */}
            {query && (
              <div className="mb-5 space-y-2">
                {searchLoading && hits.length === 0 && (
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Searching…</div>
                )}
                {!searchLoading && hits.length === 0 && (
                  <div className="text-sm text-foreground/60">
                    {scope === "workspace"
                      ? <>Nothing in your Workspace matches. <Link to="/account/workspace" onClick={() => setOpen(false)} className="underline">Open Workspace →</Link></>
                      : <>No matches — ask <QMark /> directly instead.</>}
                  </div>
                )}
                {hits.slice(0, 6).map((h) => (
                  <ResultRow key={`${h.kind}-${h.id}`} hit={h} onClose={() => setOpen(false)} />
                ))}
              </div>
            )}

            {/* Q replies */}
            {answer && (
              <div className="mb-5 border-l-2 border-accent pl-4 py-1">
                <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50 mb-2">
                  <QMark /> replies
                </div>
                <div className="font-body text-[15px] text-foreground/85 leading-relaxed whitespace-pre-wrap">
                  {answer}
                </div>
              </div>
            )}

            {gated && (
              <Link
                to="/pricing"
                onClick={() => setOpen(false)}
                className="block text-center mb-3 py-3 border border-foreground font-mono text-[10px] uppercase tracking-[0.25em] hover:bg-foreground hover:text-background transition-all"
              >
                Unlock unlimited <QMark periodClassName="text-accent-foreground/70" /> · Vanguard
              </Link>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function ResultRow({ hit, onClose }: { hit: SearchHit; onClose: () => void }) {
  const Icon = hit.kind === "article" ? FileText
    : hit.kind === "playbook" ? BookOpen
    : hit.kind === "workspace" ? Bookmark
    : hit.kind === "annotation" ? Highlighter
    : Sparkles;
  const isExternal = hit.href.startsWith("http");

  const Inner = (
    <div className="flex items-start gap-3 border border-border p-3 hover:border-accent transition-colors group">
      <Icon className="w-4 h-4 mt-0.5 text-accent shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-secondary-accent mb-0.5">
          {hit.kind}{hit.category ? ` · ${hit.category}` : ""}
        </div>
        <div className="font-display text-[15px] leading-snug group-hover:text-accent transition-colors break-words">
          {hit.title}
        </div>
        {hit.excerpt && (
          <p className="text-xs text-foreground/60 mt-0.5 line-clamp-2 break-words">{hit.excerpt}</p>
        )}
      </div>
    </div>
  );

  if (isExternal) {
    return (
      <a href={hit.href} target="_blank" rel="noreferrer" className="block">{Inner}</a>
    );
  }
  return (
    <Link to={hit.href} onClick={onClose} className="block">{Inner}</Link>
  );
}
