import { useEffect, useMemo, useRef, useState } from "react";
import { useRouterState, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { askQ, getQEntitlement } from "@/lib/q-agent.functions";
import { globalSearch, type SearchHit } from "@/lib/discovery.functions";
import { TREES } from "@/lib/q-trees";
import { useAuth } from "@/hooks/useAuth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { QMark } from "@/components/site/QMark";
import { Search, Sparkles, X } from "lucide-react";

const TRIAL_KEY = "q.trial.used";
const SEEN_KEY = "q.attention.seen";
const LOGIN_HINT_KEY = "q.hint.login";
const SEARCH_HINT_KEY = "csq.hint.q.search";

type LocalDoc = { title: string; body: string; href?: string; kind: string };

function loadLocalCorpus(): LocalDoc[] {
  if (typeof window === "undefined") return [];
  const out: LocalDoc[] = [];
  try {
    const links = JSON.parse(localStorage.getItem("csq.workspace.links") || "[]");
    if (Array.isArray(links)) {
      for (const l of links) out.push({ title: l.title || l.url, body: `${l.title} ${l.url} ${l.tag}`, href: l.url, kind: "link" });
    }
    const assets = JSON.parse(localStorage.getItem("csq.workspace.assets") || "[]");
    if (Array.isArray(assets)) {
      for (const a of assets) out.push({ title: a.name, body: `${a.name} ${a.tag}`, kind: "file" });
    }
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith("csq.annotations.")) continue;
      const arr = JSON.parse(localStorage.getItem(k) || "[]");
      const slug = k.slice("csq.annotations.".length);
      if (Array.isArray(arr)) {
        for (const a of arr) out.push({
          title: a.text?.slice(0, 80) ?? "Highlight",
          body: `${a.text ?? ""} ${a.note ?? ""}`,
          href: `/insights/${slug}`,
          kind: a.kind ?? "highlight",
        });
      }
    }
  } catch { /* ignore */ }
  return out;
}

function localSearch(corpus: LocalDoc[], q: string): LocalDoc[] {
  const n = q.toLowerCase().trim();
  if (!n) return [];
  return corpus
    .map((d) => ({ d, s: d.title.toLowerCase().includes(n) ? 2 : d.body.toLowerCase().includes(n) ? 1 : 0 }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 8)
    .map((x) => x.d);
}

export function QAgentButton() {
  const [open, setOpen] = useState(false);
  const [attention, setAttention] = useState(false);
  const [hint, setHint] = useState(false);
  const [hintLeaving, setHintLeaving] = useState(false);
  const [mode, setMode] = useState<"ask" | "search">("ask");
  const [scope, setScope] = useState<"universal" | "local">("universal");
  const [searchHintDismissed, setSearchHintDismissed] = useState(true);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [trialUsed, setTrialUsed] = useState(false);
  const [unlimited, setUnlimited] = useState(false);

  const [searchQ, setSearchQ] = useState("");
  const [universalHits, setUniversalHits] = useState<SearchHit[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const ask = useServerFn(askQ);
  const fetchEntitlement = useServerFn(getQEntitlement);
  const runSearch = useServerFn(globalSearch);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const prevUserIdRef = useRef<string | null>(null);

  const localCorpus = useMemo(() => (open ? loadLocalCorpus() : []), [open]);
  const localHits = useMemo(
    () => (scope === "local" ? localSearch(localCorpus, searchQ) : []),
    [scope, localCorpus, searchQ],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setTrialUsed(localStorage.getItem(TRIAL_KEY) === "1");
      setSearchHintDismissed(localStorage.getItem(SEARCH_HINT_KEY) === "1");
      if (localStorage.getItem(SEEN_KEY) !== "1") {
        const t = setTimeout(() => setAttention(true), 1200);
        return () => clearTimeout(t);
      }
    } catch { /* */ }
  }, []);

  useEffect(() => {
    if (!user) { setUnlimited(false); return; }
    let cancelled = false;
    fetchEntitlement()
      .then((r) => { if (!cancelled) setUnlimited(!!r.unlimited); })
      .catch(() => { if (!cancelled) setUnlimited(false); });
    return () => { cancelled = true; };
  }, [user, fetchEntitlement]);

  useEffect(() => {
    if (open && mode === "ask" && inputRef.current) inputRef.current.focus();
  }, [open, mode]);

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
    const inT = window.setTimeout(() => { setAttention(true); setHintLeaving(false); setHint(true); }, 800);
    const leaveT = window.setTimeout(() => setHintLeaving(true), 800 + 5600);
    const outT = window.setTimeout(() => setHint(false), 800 + 5600 + 320);
    return () => { window.clearTimeout(inT); window.clearTimeout(leaveT); window.clearTimeout(outT); };
  }, [user?.id]);

  // Debounced universal search
  useEffect(() => {
    if (mode !== "search" || scope !== "universal") return;
    const q = searchQ.trim();
    if (!q) { setUniversalHits([]); return; }
    setSearchLoading(true);
    const t = setTimeout(() => {
      runSearch({ data: { q } })
        .then((r) => setUniversalHits(r.hits ?? []))
        .catch(() => setUniversalHits([]))
        .finally(() => setSearchLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [searchQ, scope, mode, runSearch]);

  const dismissAttention = () => {
    setAttention(false);
    setHintLeaving(true);
    window.setTimeout(() => setHint(false), 300);
    try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* */ }
  };

  const dismissSearchHint = () => {
    setSearchHintDismissed(true);
    try { localStorage.setItem(SEARCH_HINT_KEY, "1"); } catch { /* */ }
  };

  const handleOpen = () => { setOpen(true); dismissAttention(); };

  const gated = trialUsed && !unlimited;

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;
    if (gated) return;
    setLoading(true);
    setAnswer(null);
    try {
      const { reply } = await ask({ data: { question, witty: false } });
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

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Open Q, the CS operator agent"
        className={`group fixed bottom-20 right-5 md:bottom-28 md:right-8 z-40 flex items-end gap-0 pl-4 pr-3 py-2.5 md:pl-5 md:pr-4 md:py-3 bg-foreground text-background border border-foreground shadow-[0_12px_40px_-12px_rgba(0,0,0,0.55)] hover:shadow-[0_18px_50px_-12px_rgba(0,0,0,0.7)] transition-all duration-300 ${attention ? "q-attention" : ""}`}
      >
        <QMark className="font-display leading-none text-3xl md:text-4xl tracking-tight" periodClassName="text-accent ml-0.5 q-period" />
        <span className="sr-only">Ask Q.</span>
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
              Meet <QMark periodClassName="text-accent" />
            </div>
            <div className="font-display text-sm leading-tight mt-0.5">
              Your operator agent is ready<span className="text-accent">.</span>
            </div>
            <span aria-hidden className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-foreground rotate-45" />
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
                Operator Agent · Beta
              </div>
              <SheetTitle asChild>
                <h2 className="font-display text-5xl md:text-6xl leading-[0.9] tracking-tight">
                  Meet <QMark />
                </h2>
              </SheetTitle>
              <SheetDescription className="font-body text-base text-foreground/75 leading-relaxed pt-3">
                Your operator-grade canvas for the eight moments that decide a Customer Success quarter.
              </SheetDescription>

              {/* Mode toggle: Ask vs Search */}
              <div className="mt-5 pt-4 border-t border-border flex items-stretch border border-border">
                <button
                  type="button"
                  onClick={() => setMode("ask")}
                  className={`flex-1 py-2.5 font-mono text-[10px] uppercase tracking-[0.25em] transition-colors ${
                    mode === "ask" ? "bg-foreground text-background" : "hover:bg-muted"
                  }`}
                >
                  Ask <QMark periodClassName={mode === "ask" ? "text-accent" : "text-accent"} />
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("search"); dismissSearchHint(); }}
                  className={`flex-1 py-2.5 font-mono text-[10px] uppercase tracking-[0.25em] transition-colors inline-flex items-center justify-center gap-1.5 ${
                    mode === "search" ? "bg-foreground text-background" : "hover:bg-muted"
                  }`}
                >
                  <Search size={12} strokeWidth={2.75} /> Search
                </button>
              </div>

              {!searchHintDismissed && mode === "ask" && (
                <div className="mt-2 inline-flex items-center gap-2 px-2 py-1 bg-accent text-accent-foreground font-mono text-[10px] uppercase tracking-[0.25em] animate-pulse">
                  <Sparkles className="w-3 h-3" /> New · search across CSQ or your saved intel
                  <button type="button" onClick={dismissSearchHint} className="ml-1 opacity-80 hover:opacity-100" aria-label="Dismiss">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </SheetHeader>

            {mode === "ask" ? (
              <>
                <form onSubmit={handleAsk} className="mb-6">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-foreground/50 block mb-2">
                    {unlimited ? <>Ask <QMark periodClassName="text-accent" /> · unlimited</> : gated ? "Trial used" : <>Ask <QMark periodClassName="text-accent" /> · 1 free question</>}
                  </label>
                  <textarea
                    ref={inputRef}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={loading || gated}
                    rows={3}
                    maxLength={1000}
                    placeholder={gated ? "Subscribe to Vanguard to keep talking to Q." : "How do I contain a board-level escalation in 24 hours?"}
                    className="w-full border border-border bg-background px-3 py-2.5 font-body text-sm resize-none focus:outline-none focus:border-foreground disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={loading || gated || !question.trim()}
                    className="w-full mt-2 py-3 bg-foreground text-background font-mono text-[10px] uppercase tracking-[0.25em] hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? <><QMark periodClassName="text-accent-foreground/70" /> is thinking…</> : gated ? "Trial used" : <>Ask <QMark periodClassName="text-accent-foreground/70" /></>}
                  </button>
                </form>

                {answer && (
                  <div className="mb-6 border-l-2 border-accent pl-4 py-1">
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
              </>
            ) : (
              <div className="mb-6">
                {/* Scope toggle */}
                <div className="flex items-stretch border border-border mb-3">
                  <button
                    type="button"
                    onClick={() => setScope("universal")}
                    className={`flex-1 py-2 font-mono text-[10px] uppercase tracking-[0.25em] ${scope === "universal" ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
                  >
                    Universal
                  </button>
                  <button
                    type="button"
                    onClick={() => setScope("local")}
                    className={`flex-1 py-2 font-mono text-[10px] uppercase tracking-[0.25em] ${scope === "local" ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
                  >
                    Local
                  </button>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/55 mb-2">
                  {scope === "universal"
                    ? "Agentic answer pulled from every CSQ source."
                    : "Answers only from your saved Workspace data."}
                </p>
                <input
                  type="search"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder={scope === "universal" ? "Search dispatches, codex, playbooks…" : "Search your saved links, files, highlights…"}
                  className="w-full border border-border bg-background px-3 py-2.5 font-body text-sm focus:outline-none focus:border-foreground"
                />

                <div className="mt-4 space-y-2">
                  {scope === "universal" && searchLoading && (
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Searching…</div>
                  )}
                  {scope === "universal" && !searchLoading && searchQ && universalHits.length === 0 && (
                    <div className="text-sm text-foreground/60">No matches in the CSQ corpus.</div>
                  )}
                  {scope === "universal" && universalHits.map((h) => (
                    <Link
                      key={h.id}
                      to={h.href}
                      onClick={() => setOpen(false)}
                      className="block border border-border p-3 hover:border-accent hover:text-accent transition-colors"
                    >
                      <div className="font-mono text-[10px] uppercase tracking-widest text-secondary-accent mb-1">{h.kind} {h.category ? `· ${h.category}` : ""}</div>
                      <div className="font-display text-base leading-tight">{h.title}</div>
                      {h.excerpt && <p className="text-xs text-foreground/65 mt-1 line-clamp-2">{h.excerpt}</p>}
                    </Link>
                  ))}

                  {scope === "local" && searchQ && localHits.length === 0 && (
                    <div className="text-sm text-foreground/60">
                      Nothing in your Workspace matches. {" "}
                      <Link to="/account/workspace" onClick={() => setOpen(false)} className="underline">Open Workspace →</Link>
                    </div>
                  )}
                  {scope === "local" && localHits.map((d, i) => (
                    <div key={i} className="border border-border p-3">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-secondary-accent mb-1">{d.kind}</div>
                      <div className="text-sm">{d.title}</div>
                      {d.href && (
                        <a href={d.href.startsWith("/") ? d.href : d.href} target={d.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="font-mono text-[10px] uppercase tracking-widest text-accent mt-1 inline-block">
                          Open →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 mb-6">
              <Link
                to="/agent/framework"
                onClick={() => setOpen(false)}
                className="block text-center py-3 bg-foreground text-background font-mono text-[10px] uppercase tracking-[0.25em] hover:bg-accent transition-colors"
              >
                Open the Canvas →
              </Link>
              {user && (
                <Link
                  to="/account/workspace"
                  onClick={() => setOpen(false)}
                  className="block text-center py-3 border border-foreground font-mono text-[10px] uppercase tracking-[0.25em] hover:bg-foreground hover:text-background transition-colors"
                >
                  Your Workspace →
                </Link>
              )}
            </div>

            <div className="border-t border-border pt-5">
              <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50 mb-4">
                The Eight Trees
              </div>
              <ul className="space-y-3.5">
                {TREES.map((t, i) => (
                  <li key={t.id} className="flex gap-4">
                    <span className="font-mono text-[11px] text-accent pt-1 shrink-0 w-7">
                      {(i + 1).toFixed(1)}
                    </span>
                    <div>
                      <div className="font-display text-base leading-tight">{t.title}</div>
                      <div className="text-xs text-foreground/55 mt-0.5">{t.blurb}</div>
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
