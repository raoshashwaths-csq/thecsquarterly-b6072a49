import { useEffect, useMemo, useRef, useState } from "react";
import { useRouterState, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { askQ, getQEntitlement } from "@/lib/q-agent.functions";
import { getMonthlyQUsage } from "@/lib/q-usage.functions";
import { globalSearch, type SearchHit } from "@/lib/discovery.functions";
import { NODES } from "@/lib/q-trees";
import { TreeVectorList } from "@/components/site/TreeVectorList";
import { getFutureOperatorNotification } from "@/lib/future-operator.functions";
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
import { LumiBadgeButton } from "@/components/site/LumiBadgeButton";
import { BookOpen, Compass, FileText, Highlighter, Bookmark, Lightbulb, Mic, Sparkles, Square } from "lucide-react";
import { useElevenLabsSpeechInput } from "@/hooks/useElevenLabsSpeechInput";
import { FeatureGlossary } from "@/components/enablement/FeatureGlossary";
import { RouteTipsList } from "@/components/enablement/RouteTipsList";
import { PlaybookTour } from "@/components/enablement/PlaybookTour";
import { trackLumiEvent } from "@/lib/lumi-analytics";
import { useLumiPageContext } from "@/hooks/useLumiPageContext";
import { useEntitlements } from "@/hooks/useEntitlements";
import { LumiBubble } from "@/components/lumi/LumiBubble";
import { LumiDrawerActions } from "@/components/lumi/LumiDrawerActions";
import type { LumiAction } from "@/config/lumiPageActions";

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
  const [seeded, setSeeded] = useState<{ id: string; message: string; subtext: string | null } | null>(null);

  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  const ask = useServerFn(askQ);
  const fetchEntitlement = useServerFn(getQEntitlement);
  const fetchUsage = useServerFn(getMonthlyQUsage);
  const runUniversal = useServerFn(globalSearch);
  const fetchSeed = useServerFn(getFutureOperatorNotification);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.search as Record<string, unknown> });
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const tour = useTour();
  const pageContext = useLumiPageContext();
  const { rank: tierRank } = useEntitlements();
  const isVanguard = tierRank >= 1;
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

  // Future Operator notification seed reader. Reflection prompts route here
  // via `?lumi=open&seed=<notificationId>`. We open the drawer, load the
  // notification (auto-marking it read), and pre-pend it as the first turn.
  // Then we strip the params so a refresh doesn't re-open.
  const seedId = typeof search?.seed === "string" ? (search.seed as string) : null;
  const wantsOpen = search?.lumi === "open";
  useEffect(() => {
    if (!seedId || !wantsOpen || !user) return;
    let cancelled = false;
    setOpen(true);
    fetchSeed({ data: { id: seedId } })
      .then((r) => {
        if (cancelled) return;
        if (r.notification) {
          const n = r.notification as { id: string; message: string; subtext: string | null };
          setSeeded({ id: n.id, message: n.message, subtext: n.subtext });
          trackLumiEvent("drawer.open", { surface: "site", briefingShown: true, messageCount: 1 });
        }
      })
      .catch(() => { /* silent */ })
      .finally(() => {
        if (cancelled) return;
        // Strip the seed/lumi params so refresh doesn't replay.
        navigate({
          to: ".",
          search: (prev) => {
            const next = { ...(prev as Record<string, unknown>) };
            delete next.lumi;
            delete next.seed;
            return next;
          },
          replace: true,
        });
      });
    return () => { cancelled = true; };
  }, [seedId, wantsOpen, user, fetchSeed, navigate]);

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
    setSearchLoading(true);
    const t = setTimeout(() => {
      runUniversal({ data: { q } })
        .then((r) => setHits(r.hits ?? []))
        .catch(() => setHits([]))
        .finally(() => setSearchLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [query, runUniversal]);

  const handleOpen = () => {
    setOpen(true);
    trackLumiEvent("drawer.open", { surface: "site", briefingShown: false, messageCount: answer ? 1 : 0 });
  };


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

  const submitQuestion = async (question: string) => {
    if (!question.trim() || loading) return;
    if (gated) { if (!user) setGateModal(true); return; }
    if (user && typeof window !== "undefined") {
      const kws = detectFrictionKeywords(question);
      if (kws.length > 0) {
        try { sessionStorage.setItem(FLAG_KEY, `${new Date().toISOString().slice(0,10)}|${kws.join(",")}`); } catch { /* */ }
      }
    }
    setLoading(true);
    setAnswer(null);
    try {
      try { sessionStorage.setItem("lumi_messaged", "1"); } catch { /* */ }
      const { reply } = await ask({ data: { question, witty: false } });
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

  const handleAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await submitQuestion(query);
  };


  if (pathname.startsWith("/admin") || pathname.startsWith("/csfactors")) return null;


  const currentPlaceholder = ROLLING_PROMPTS[placeholderIdx];

  return (
    <>
      {/* Floating Lumi badge. */}
      <LumiBadgeButton
        onClick={handleOpen}
        tone="hero"
        className="fixed bottom-5 right-5 md:bottom-8 md:right-8 z-40"
        label="Meet Lumi, the CS operator agent"
      />

      <LumiBubble
        pageContext={pageContext}
        drawerOpen={open}
        onOpen={(action: LumiAction) => {
          setQuery(action.prompt);
          setOpen(true);
          trackLumiEvent("drawer.open", { surface: "site", briefingShown: false, messageCount: 0 });
        }}
      />





      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[460px] md:max-w-[42vw] bg-background border-l border-border p-0 overflow-y-auto"
        >
          <div className="p-7 md:p-9">
            <SheetHeader className="text-left mb-6">
              <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-5">
                Operator Agent · Beta
              </div>
              <SheetTitle asChild>
                <h2 className="font-display text-5xl md:text-6xl leading-[0.9] tracking-tight">
                  Meet <QMark />
                </h2>
              </SheetTitle>
              <SheetDescription className="sr-only">
                Ask Lumi, take a guided tour of this page, browse quick tips, or open the feature glossary.
              </SheetDescription>
            </SheetHeader>

            {/* Action row — tour / tips / glossary */}
            <div className="mb-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!tour.hasTour) return;
                  setOpen(false);
                  tour.start();
                }}
                disabled={!tour.hasTour}
                title={tour.hasTour ? "Tour this page" : "No tour for this page yet"}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-border font-mono text-[10px] uppercase tracking-[0.25em] hover:border-accent hover:text-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Compass className="h-3 w-3" />
                {tour.hasTour ? "Tour page" : "No tour"}
              </button>
              <button
                type="button"
                onClick={() => setPanel((p) => (p === "tips" ? null : "tips"))}
                aria-pressed={panel === "tips"}
                className={`inline-flex items-center gap-1.5 px-3 py-2 border font-mono text-[10px] uppercase tracking-[0.25em] transition-colors ${
                  panel === "tips" ? "border-accent text-accent" : "border-border hover:border-accent hover:text-accent"
                }`}
              >
                <Lightbulb className="h-3 w-3" />
                Quick Tips
              </button>
              <button
                type="button"
                onClick={() => setPanel((p) => (p === "glossary" ? null : "glossary"))}
                aria-pressed={panel === "glossary"}
                className={`inline-flex items-center gap-1.5 px-3 py-2 border font-mono text-[10px] uppercase tracking-[0.25em] transition-colors ${
                  panel === "glossary" ? "border-accent text-accent" : "border-border hover:border-accent hover:text-accent"
                }`}
              >
                <BookOpen className="h-3 w-3" />
                Glossary
              </button>
            </div>

            {/* Contextual Lumi action grid — empty conversation state. */}
            {!answer && !panel && (
              <div className="mb-5">
                <LumiDrawerActions
                  pageContext={pageContext}
                  isVanguard={isVanguard}
                  visible={!answer}
                  onActionSelect={(prompt) => {
                    setQuery(prompt);
                    void submitQuestion(prompt);
                  }}
                />
              </div>
            )}



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
                  placeholder={needsSignIn ? "Sign in to ask Lumi." : gated ? "Subscribe to Vanguard to keep asking Lumi." : currentPlaceholder}
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

            {/* Q replies */}
            {answer && (
              <div className="mb-5 border-l-2 border-accent pl-4 py-1">
                <div className="font-mono uppercase tracking-widest text-xs text-foreground/50 mb-2">
                  <QMark /> replies
                </div>
                <div className="font-body text-[15px] text-foreground/85 leading-relaxed whitespace-pre-wrap">
                  {answer}
                </div>
                <button
                  type="button"
                  onClick={() => { setAnswer(null); setQuery(""); }}
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 border border-border font-mono text-[10px] uppercase tracking-[0.25em] hover:border-accent hover:text-accent transition-colors"
                >
                  ← Ask another
                </button>
              </div>
            )}

            {/* Inline panel (tips / glossary) — replaces vectors + results when open */}
            {panel === "tips" ? (
              <div className="mb-5 animate-fade-in">
                <RouteTipsList onNavigate={() => setOpen(false)} />
              </div>
            ) : panel === "glossary" ? (
              <div className="mb-5 animate-fade-in">
                <FeatureGlossary />
              </div>
            ) : (
              <>
                {/* Suggested Vectors — vertical tree heading list */}
                {!answer && (
                  <div className="mb-5">
                    <TreeVectorList onPick={() => setOpen(false)} maxHeight="max-h-[52vh]" />
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
                        No matches — ask <QMark /> directly instead.
                      </div>
                    )}
                    {hits.slice(0, 6).map((h) => (
                      <ResultRow key={`${h.kind}-${h.id}`} hit={h} onClose={() => setOpen(false)} />
                    ))}
                  </div>
                )}
              </>
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

      {tour.active && tour.step ? (
        <PlaybookTour
          step={tour.step}
          index={tour.stepIndex}
          total={tour.total}
          onNext={tour.next}
          onSkip={tour.skip}
        />
      ) : null}
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
