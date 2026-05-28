import { useEffect, useMemo, useRef, useState } from "react";
import { useRouterState, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { askQ, getQEntitlement } from "@/lib/q-agent.functions";
import { getMonthlyQUsage } from "@/lib/q-usage.functions";
import { globalSearch, type SearchHit } from "@/lib/discovery.functions";
import { NODES } from "@/lib/q-trees";
import { SUGGESTED_VECTORS } from "@/lib/q-vectors";
import { detectFrictionKeywords } from "@/lib/sentiment.keywords";
import { useAuth } from "@/hooks/useAuth";
import { useTour } from "@/hooks/useTour";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { QMark } from "@/components/site/QMark";
import { BookOpen, Compass, FileText, Highlighter, Bookmark, Lightbulb, Mic, Sparkles, Square } from "lucide-react";
import { useElevenLabsSpeechInput } from "@/hooks/useElevenLabsSpeechInput";
import { FeatureGlossary } from "@/components/enablement/FeatureGlossary";
import { RouteTipsList } from "@/components/enablement/RouteTipsList";
import { PlaybookTour } from "@/components/enablement/PlaybookTour";

const TRIAL_KEY = "q.trial.used";
const DRAFT_KEY = "q.draft.global";
const FLAG_KEY = "q.flagged.today";

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
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [trialUsed, setTrialUsed] = useState(false);
  const [unlimited, setUnlimited] = useState(false);
  const [gateModal, setGateModal] = useState(false);
  const [panel, setPanel] = useState<"tips" | "glossary" | null>(null);

  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  const ask = useServerFn(askQ);
  const fetchEntitlement = useServerFn(getQEntitlement);
  const fetchUsage = useServerFn(getMonthlyQUsage);
  const runUniversal = useServerFn(globalSearch);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const tour = useTour();
  const speech = useElevenLabsSpeechInput({
    onTranscript: (text) => {
      setQuery((current) => (current ? `${current} ${text}` : text));
      inputRef.current?.focus();
    },
  });

  // Hydrate trial state + draft cache on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setTrialUsed(localStorage.getItem(TRIAL_KEY) === "1");
      const draft = sessionStorage.getItem(DRAFT_KEY);
      if (draft) setQuery(draft);
    } catch { /* */ }
  }, []);

  // Persist draft as user types (resilience layer).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (query) sessionStorage.setItem(DRAFT_KEY, query);
      else sessionStorage.removeItem(DRAFT_KEY);
    } catch { /* */ }
  }, [query]);

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

  const handleOpen = () => { setOpen(true); };


  // Monthly Q interaction cap (designation-tier scoped).
  const usage = useQuery({
    queryKey: ["q-monthly-usage"],
    queryFn: () => fetchUsage(),
    enabled: !!user && open,
    staleTime: 30_000,
  });
  const capped = !!usage.data && usage.data.cap !== null && usage.data.used >= usage.data.cap;

  const gated = !user || (trialUsed && !unlimited) || capped;
  const needsSignIn = !user;

  const handleAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;
    if (gated) { if (!user) setGateModal(true); return; }
    // Friction keyword detection — flag for end-of-day check-in.
    if (user && typeof window !== "undefined") {
      const kws = detectFrictionKeywords(query);
      if (kws.length > 0) {
        try { sessionStorage.setItem(FLAG_KEY, `${new Date().toISOString().slice(0,10)}|${kws.join(",")}`); } catch { /* */ }
      }
    }
    setLoading(true);
    setAnswer(null);
    try {
      const prefix = scope === "workspace"
        ? "Answer using ONLY the operator's saved Workspace context if relevant; otherwise say you have nothing on file.\n\nQuestion: "
        : "";
      const { reply } = await ask({ data: { question: prefix + query, witty: false } });
      setAnswer(reply);
      try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* */ }
      usage.refetch();
      if (!unlimited) {
        try { localStorage.setItem(TRIAL_KEY, "1"); } catch { /* */ }
        setTrialUsed(true);
        if (!user) setGateModal(true);
      }
    } catch (err) {
      toast.error((err as Error).message || "Q couldn't reply.");
    } finally {
      setLoading(false);
    }
  };

  if (pathname.startsWith("/admin") || pathname.startsWith("/csfactors")) return null;


  const currentPlaceholder = ROLLING_PROMPTS[placeholderIdx];

  return (
    <>
      {/* Floating Meet Q. */}
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Meet Q, the CS operator agent"
        className="group fixed bottom-20 right-5 md:bottom-28 md:right-8 z-40 flex items-end gap-0 pl-4 pr-3 py-2.5 md:pl-5 md:pr-4 md:py-3 bg-foreground text-background border border-foreground shadow-[0_12px_40px_-12px_rgba(0,0,0,0.55)] hover:shadow-[0_18px_50px_-12px_rgba(0,0,0,0.7)] transition-all duration-300"
      >
        <QMark className="font-display leading-none text-3xl md:text-4xl tracking-tight" periodClassName="text-accent ml-0.5 q-period" />
        <span className="sr-only">Meet Q.</span>
      </button>


      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[460px] md:max-w-[42vw] bg-background border-l border-border p-0 overflow-y-auto"
        >
          <div className="p-7 md:p-9">
            <SheetHeader className="text-left mb-7">
              <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-5">
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
                className={`px-4 py-2 font-mono text-xs uppercase tracking-[0.25em] transition-colors ${
                  scope === "universal" ? "bg-foreground text-background" : "hover:bg-muted"
                }`}
              >
                Universal
              </button>
              <button
                type="button"
                onClick={() => { setScope("workspace"); setHits([]); }}
                disabled={!user}
                className={`px-4 py-2 font-mono text-xs uppercase tracking-[0.25em] transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  scope === "workspace" ? "bg-foreground text-background" : "hover:bg-muted"
                }`}
              >
                Workspace
              </button>
            </div>

            {/* Search bar with rolling placeholder */}
            <form onSubmit={handleAsk} className="mb-3">
              <div className="flex items-stretch border border-border focus-within:border-foreground transition-colors bg-background">
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={loading}
                  maxLength={1000}
                  placeholder={needsSignIn ? "Sign in to ask Q." : gated ? "Subscribe to Vanguard to keep asking Q." : currentPlaceholder}
                  className="min-w-0 flex-1 bg-transparent px-4 py-3.5 font-body text-base focus:outline-none disabled:opacity-50"
                />
                {speech.supported ? (
                  <button
                    type="button"
                    onClick={speech.toggle}
                    disabled={loading || speech.transcribing || gated}
                    className={`shrink-0 w-12 inline-flex items-center justify-center border-l border-border hover:text-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${speech.recording ? "text-accent animate-pulse" : ""}`}
                    aria-label={speech.recording ? "Stop recording" : "Ask by voice"}
                    title={speech.error ?? (speech.transcribing ? "Transcribing…" : "Ask by voice")}
                  >
                    {speech.recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                ) : null}
              </div>
              <button
                type="submit"
                disabled={loading || gated || !query.trim()}
                className="w-full mt-2 py-3.5 bg-foreground text-background font-mono text-xs uppercase tracking-[0.3em] hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? <><QMark periodClassName="text-accent-foreground/70" /> is thinking…</> : needsSignIn ? "Sign in to ask" : gated ? "Trial used" : <>Ask <QMark periodClassName="text-accent-foreground/70" /></>}
              </button>
            </form>

            {/* Suggested Vectors — premium parchment pills, always visible */}
            {!answer && (
              <div className="mb-5">
                <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-3">
                  Suggested Vectors
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
                  {SUGGESTED_VECTORS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => { setQuery(v); inputRef.current?.focus(); }}
                      className="snap-start shrink-0 max-w-[280px] text-left text-xs font-body leading-snug border border-border bg-card/70 px-3 py-2.5 hover:border-accent hover:text-accent transition-colors"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}


            {/* Live search results */}
            {query && (
              <div className="mb-5 space-y-2">
                {searchLoading && hits.length === 0 && (
                  <div className="font-mono uppercase tracking-widest text-xs text-muted-foreground">Searching…</div>
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
                <div className="font-mono uppercase tracking-widest text-xs text-foreground/50 mb-2">
                  <QMark /> replies
                </div>
                <div className="font-body text-[15px] text-foreground/85 leading-relaxed whitespace-pre-wrap">
                  {answer}
                </div>
              </div>
            )}

            {needsSignIn ? (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="block text-center mb-3 py-3 border border-foreground font-mono text-xs uppercase tracking-[0.25em] hover:bg-foreground hover:text-background transition-all"
              >
                Sign in to ask <QMark />
              </Link>
            ) : gated && (
              <Link
                to="/pricing"
                onClick={() => setOpen(false)}
                className="block text-center mb-3 py-3 border border-foreground font-mono text-xs uppercase tracking-[0.25em] hover:bg-foreground hover:text-background transition-all"
              >
                Unlock unlimited <QMark periodClassName="text-accent-foreground/70" /> · Vanguard
              </Link>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Anonymous gate modal — fires after the single trial answer. */}
      <Dialog open={gateModal} onOpenChange={setGateModal}>
        <DialogContent className="max-w-md bg-background border border-border p-7">
          <DialogHeader className="text-left">
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-3">
              <QMark /> · Trial complete
            </div>
            <DialogTitle asChild>
              <h3 className="font-display text-3xl leading-[0.95] tracking-tight">
                One on the house.
              </h3>
            </DialogTitle>
            <DialogDescription className="font-body text-base text-foreground/75 leading-relaxed pt-2">
              Sign in to keep asking <QMark />, or unlock unlimited reasoning with Vanguard.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Link
              to="/login"
              onClick={() => { setGateModal(false); setOpen(false); }}
              className="text-center py-3 border border-foreground font-mono text-xs uppercase tracking-[0.25em] hover:bg-foreground hover:text-background transition-all"
            >
              Sign in
            </Link>
            <Link
              to="/pricing"
              onClick={() => { setGateModal(false); setOpen(false); }}
              className="text-center py-3 bg-foreground text-background font-mono text-xs uppercase tracking-[0.25em] hover:bg-accent transition-colors"
            >
              See pricing
            </Link>
          </div>
        </DialogContent>
      </Dialog>
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
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-secondary-accent mb-0.5">
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
