import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { runQNode, listMyQRuns } from "@/lib/q-agent.functions";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { QMark } from "@/components/site/QMark";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useSubscriptionTier } from "@/hooks/useSubscriptionTier";
import { trackLumiEvent, rememberLastTree, recallLastTree } from "@/lib/lumi-analytics";
import {
  TREES, NODES, nodesForTree, getNode, breadcrumbFor, CATEGORY_COLOR,
  type TreeId, type TreeNode, type TreeCategory,
} from "@/lib/q-trees";

export const Route = createFileRoute("/agent/framework")({
  validateSearch: (search: Record<string, unknown>) => ({
    tree: typeof search.tree === "string" ? (search.tree as TreeId) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Lumi · Operator Canvas — The CS Quarterly" },
      { name: "description", content: "Navigate Lumi's 21-tree decision graph to a benchmark-grounded, immediately executable response. Vanguard only." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Lumi · Operator Canvas" },
      { property: "og:description", content: "The institutional memory of a 40-year CS operator. Available at 11pm." },
    ],
  }),
  component: AgentFrameworkPage,
});

// Strip the "T1 · " prefix from a tree eyebrow.
function cleanEyebrow(eyebrow: string): string {
  return eyebrow.replace(/^T\d+\s*[·•]\s*/i, "").trim();
}

function AgentFrameworkPage() {
  const { user, loading } = useAuth();
  const sub = useSubscriptionTier();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [hasVanguard, setHasVanguard] = useState<boolean | null>(null);
  // Initial tree resolution priority: ?tree= → localStorage last → T1.
  const [activeTree, setActiveTree] = useState<TreeId>(() => {
    if (search.tree && TREES.some((t) => t.id === search.tree)) return search.tree;
    const remembered = recallLastTree();
    if (remembered && TREES.some((t) => t.id === remembered)) return remembered as TreeId;
    return "T1";
  });
  // focusMode = picker collapsed, wheel surfaced after a user selection.
  const [focusMode, setFocusMode] = useState<boolean>(!!search.tree);
  const [runTerminal, setRunTerminal] = useState<TreeNode | null>(null);
  const [witty, setWitty] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Mirror URL → state when ?tree changes (deep links, back/forward).
  useEffect(() => {
    if (search.tree && TREES.some((t) => t.id === search.tree) && search.tree !== activeTree) {
      setActiveTree(search.tree);
      setFocusMode(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.tree]);

  // Mirror state → URL + localStorage on every active-tree change.
  useEffect(() => {
    rememberLastTree(activeTree);
    if (search.tree !== activeTree) {
      navigate({ to: "/agent/framework", search: { tree: activeTree }, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTree]);

  function handlePickTree(id: TreeId) {
    const fromTree = activeTree;
    setActiveTree(id);
    setFocusMode(true);
    trackLumiEvent("tree.select", { treeId: id, surface: "canvas", meta: { from: fromTree } });
    trackLumiEvent("tree.focus", { treeId: id, surface: "canvas" });
    // Smooth-scroll the wheel into the viewport centre after the animation kicks off.
    // Use block: "center" so the entire decision wheel sits in the middle of the screen
    // rather than snapping the top edge to the viewport top (which pushed short pages
    // to the bottom). Fall back to "start" if the wheel is taller than the viewport.
    setTimeout(() => {
      const el = wheelRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const block: ScrollLogicalPosition =
        rect.height > window.innerHeight - 80 ? "start" : "center";
      el.scrollIntoView({ behavior: "smooth", block });
    }, 80);

  }

  function handleBackToPicker() {
    trackLumiEvent("tree.unfocus", { treeId: activeTree, surface: "canvas" });
    setFocusMode(false);
  }


  useEffect(() => {
    if (loading || !user) { setHasVanguard(user ? false : null); return; }
    (async () => {
      const [{ data: roles }, { data: sub }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .eq("tier", "vanguard")
          .maybeSingle(),
      ]);
      const isAdmin = (roles ?? []).some((r) => r.role === "admin");
      setHasVanguard(isAdmin || !!sub);
    })();
  }, [user, loading]);

  if (loading) return <CanvasShell><Centered>Loading…</Centered></CanvasShell>;
  if (!user) return <CanvasShell><GateCard kind="signin" /></CanvasShell>;
  if (hasVanguard === false) return <CanvasShell><GateCard kind="vanguard" /></CanvasShell>;
  if (hasVanguard === null) return <CanvasShell><Centered>Checking access…</Centered></CanvasShell>;

  const treeNodes = nodesForTree(activeTree);
  const tree = TREES.find((t) => t.id === activeTree)!;
  const terminals = treeNodes.filter((n) => n.level === 3);

  return (
    <CanvasShell>
      <header className="mb-10 animate-fade-up">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-3">
          Operator Canvas · <QMark periodClassName="text-foreground" />
        </div>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[0.95] tracking-tight text-balance max-w-3xl">
          What decision are you running today<span className="text-accent">?</span>
        </h1>
        <p className="font-body text-base text-foreground/70 mt-4 max-w-2xl">
          Pick a tree. Walk the path. <QMark /> returns a 3-zone response: diagnosis, playbook, executable.
        </p>

        {/* Global voice toggle */}
        <div className="mt-6 inline-flex items-center gap-4 border border-border rounded-full px-4 py-2">
          <div className="flex flex-col leading-tight">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-foreground/70">Voice</span>
            <span className="text-xs text-foreground/55">{witty ? "Wodehouse — witty" : "McKinsey — analytical"}</span>
          </div>
          <Switch checked={witty} onCheckedChange={setWitty} aria-label="Toggle witty voice" />
        </div>
      </header>

      <LumiSessionBanner sub={sub} />


      {/* Tree picker rail — collapses into a "Back to all decision trees" pill once a tree is focused. */}
      <RevealBlock>
        <div
          className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)] ${
            focusMode ? "max-h-0 opacity-0 pointer-events-none -translate-y-2" : "max-h-[3000px] opacity-100 translate-y-0"
          }`}
          aria-hidden={focusMode}
        >
          <div className="space-y-6 mb-10">
            {(["core", "ops", "shared", "leadership"] as TreeCategory[]).map((cat) => {
              const group = TREES.filter((t) => t.category === cat);
              if (group.length === 0) return null;
              const c = CATEGORY_COLOR[cat];
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.hex }} />
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/60">{c.label}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {group.map((t) => {
                      const active = t.id === activeTree;
                      return (
                        <button
                          key={t.id}
                          onClick={() => handlePickTree(t.id)}
                          className={`relative text-left p-4 border transition-all duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)] hover:-translate-y-0.5 ${
                            active
                              ? "border-foreground bg-foreground text-background shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)]"
                              : "border-border hover:border-foreground"
                          }`}
                          style={!active ? { boxShadow: `inset 3px 0 0 0 ${c.hex}` } : undefined}
                        >
                          <div className={`font-mono text-xs uppercase tracking-[0.25em] mb-1.5 break-words ${active ? "text-background/70" : "text-accent"}`}>
                            {cleanEyebrow(t.eyebrow)}
                          </div>
                          <div className="font-display text-base leading-tight break-words">{t.title}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="border border-border bg-card/40 p-4 mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(["core", "ops", "shared", "leadership"] as TreeCategory[]).map((cat) => {
              const c = CATEGORY_COLOR[cat];
              return (
                <div key={cat} className="flex items-start gap-2.5">
                  <span aria-hidden className="mt-1.5 inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: c.hex }} />
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/80">{c.label}</div>
                    <div className="text-xs text-foreground/60 leading-snug">{c.blurb}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Back-to-picker pill — shown only in focus mode */}
        {focusMode && (
          <div className="mb-8 animate-fade-up">
            <button
              type="button"
              onClick={handleBackToPicker}
              className="inline-flex items-center gap-2 border border-border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.25em] text-foreground/70 hover:border-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All decision trees
            </button>
          </div>
        )}
      </RevealBlock>

      {/* Selected tree header */}
      <RevealBlock>
        <div
          key={`hdr-${activeTree}`}
          className="border-t border-border pt-6 mb-10 animate-fade-up"
        >
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent mb-2">
            {cleanEyebrow(tree.eyebrow)}
          </div>
          <h2 className="font-display text-3xl md:text-4xl leading-tight">{tree.title}</h2>
          <p className="font-body text-sm text-foreground/65 mt-2 max-w-2xl">{tree.blurb}</p>
        </div>
      </RevealBlock>

      {/* Desktop (lg+): circular wheel. Tablet & mobile: stacked cards. */}
      <RevealBlock>
        <div ref={wheelRef} key={`wheel-${activeTree}`} className="animate-fade-up">
          <div className="hidden lg:block">
            <TreeWheel
              tree={tree}
              terminals={terminals}
              onTerminal={setRunTerminal}
            />
          </div>
          <div className="lg:hidden">
            <TreeStack
              tree={tree}
              terminals={terminals}
              onTerminal={setRunTerminal}
            />
          </div>
        </div>
      </RevealBlock>


      <RunHistory />

      <RunDrawer node={runTerminal} witty={witty} setWitty={setWitty} onClose={() => setRunTerminal(null)} />
    </CanvasShell>
  );
}

function CanvasShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 pt-28 md:pt-32 pb-24">
        <div className="container max-w-6xl 2xl:max-w-[88rem] 3xl:max-w-[104rem] mx-auto px-5 sm:px-6 md:px-10 2xl:px-14">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

function RevealBlock({ children, index = 0 }: { children: React.ReactNode; index?: number }) {
  const ref = useScrollReveal<HTMLDivElement>(index);
  return <div ref={ref} className="reveal-up">{children}</div>;
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[40vh] flex items-center justify-center font-mono text-xs uppercase tracking-[0.25em] text-foreground/50">{children}</div>;
}

function GateCard({ kind }: { kind: "signin" | "vanguard" }) {
  return (
    <div className="max-w-xl mx-auto border border-border p-10 md:p-14 mt-12 animate-fade-up">
      <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-4">
        {kind === "signin" ? "Sign in required" : "Vanguard only"}
      </div>
      <h1 className="font-display text-4xl md:text-5xl leading-[0.95] tracking-tight mb-4">
        <QMark />'s canvas is reserved for Vanguard subscribers<span className="text-accent">.</span>
      </h1>
      <p className="font-body text-foreground/70 mb-8">
        {kind === "signin"
          ? "Sign in to your Vanguard account to open the operator canvas."
          : <>The decision graph, structured prompt injection, and 3-zone response engine ship with Vanguard. Free readers keep the single-question trial via the floating <QMark /> button.</>}
      </p>
      <div className="flex gap-3">
        <Link
          to={kind === "signin" ? "/login" : "/pricing"}
          className="px-6 py-3 bg-foreground text-background font-mono text-xs uppercase tracking-[0.25em] hover:bg-accent transition-colors"
        >
          {kind === "signin" ? "Sign in" : "See Vanguard"}
        </Link>
        <Link
          to="/"
          className="px-6 py-3 border border-border font-mono text-xs uppercase tracking-[0.25em] hover:border-foreground transition-colors"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}

// ============ Terminal card with expand-on-hover / long-press ============
function TerminalCard({
  node, index, onActivate, layout,
}: {
  node: TreeNode;
  index: number;
  onActivate: (n: TreeNode) => void;
  layout: "wheel" | "stack";
}) {
  const [open, setOpen] = useState(false);
  const parent = node.parentId ? getNode(node.parentId) : undefined;
  const pressTimer = useState<{ id: number | null }>({ id: null })[0];

  function startPress() {
    if (pressTimer.id) window.clearTimeout(pressTimer.id);
    pressTimer.id = window.setTimeout(() => setOpen(true), 380) as unknown as number;
  }
  function cancelPress() {
    if (pressTimer.id) { window.clearTimeout(pressTimer.id); pressTimer.id = null; }
  }

  const base =
    "group relative text-left bg-background border rounded-md p-4 transition-all duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)] shadow-[0_8px_24px_-16px_rgba(0,0,0,0.35)] hover:border-foreground hover:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.45)] focus:outline-none focus-visible:border-foreground";
  const stateBorder = open ? "border-foreground" : "border-border";

  return (
    <button
      type="button"
      onClick={() => (open ? onActivate(node) : setOpen(true))}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchMove={cancelPress}
      onTouchCancel={cancelPress}
      className={`${base} ${stateBorder} ${layout === "wheel" ? "w-full" : "w-full"}`}
      style={layout === "wheel"
        ? { animation: `fade-up 0.6s cubic-bezier(0.22, 0.61, 0.36, 1) ${index * 70}ms both` }
        : { animation: `fade-up 0.5s cubic-bezier(0.22,0.61,0.36,1) ${index * 50}ms both` }}
    >
      <div className="flex items-start gap-3">
        <span className="font-mono text-xs uppercase tracking-[0.25em] text-accent shrink-0 mt-0.5">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          {parent && (
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/45 mb-1 break-words">
              {parent.label}
            </div>
          )}
          <div className="font-display text-[15px] leading-snug text-foreground group-hover:text-accent transition-colors break-words">
            {node.label}
          </div>
          <div
            className={`grid transition-all duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)] ${
              open ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0 mt-0"
            }`}
          >
            <div className="overflow-hidden">
              <p className="font-body text-[12.5px] leading-relaxed text-foreground/70 break-words">
                {node.promptTemplate?.slice(0, 220) ?? ""}
                {node.promptTemplate && node.promptTemplate.length > 220 ? "…" : ""}
              </p>
              <div className="mt-3 font-mono text-xs uppercase tracking-[0.25em] text-accent">
                Tap to open →
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

// ============ Circular tree wheel (desktop ≥ lg) ============
function TreeWheel({
  tree, terminals, onTerminal,
}: {
  tree: { id: TreeId; title: string; eyebrow: string; blurb: string };
  terminals: TreeNode[];
  onTerminal: (n: TreeNode) => void;
}) {
  const count = terminals.length;
  const cardW = 240;
  const cardH = 150;
  const radiusX = 340;
  const radiusY = 260;
  // Add generous vertical breathing room so the top + bottom cards have space to expand on hover.
  const expandSlack = 220;
  const containerH = radiusY * 2 + cardH + 60 + expandSlack;
  const containerW = radiusX * 2 + cardW + 60;

  return (
    <div className="relative w-full" style={{ height: `${containerH}px` }}>
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: `${containerW}px`, height: `${containerH}px` }}
      >
        <svg
          className="absolute inset-0 w-full h-full text-border pointer-events-none"
          viewBox={`0 0 ${containerW} ${containerH}`}
          preserveAspectRatio="none"
        >
          {terminals.map((_, i) => {
            const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
            const cx = containerW / 2;
            const cy = containerH / 2;
            const x = cx + Math.cos(angle) * radiusX;
            const y = cy + Math.sin(angle) * radiusY;
            return (
              <line
                key={i}
                x1={cx} y1={cy} x2={x} y2={y}
                stroke="currentColor" strokeWidth="1"
                strokeDasharray="2 4"
              />
            );
          })}
        </svg>

        {/* center hub */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background border border-foreground shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] flex flex-col items-center justify-center text-center p-8"
          style={{ width: 280, height: 280 }}
        >
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-3 break-words">
            {cleanEyebrow(tree.eyebrow)}
          </div>
          <div className="font-display text-xl leading-tight mb-3 text-balance break-words">
            {tree.title}
          </div>
          <div className="font-body text-[12px] text-foreground/60 leading-relaxed text-balance max-w-[210px] break-words">
            {tree.blurb}
          </div>
        </div>

        {terminals.map((node, i) => {
          const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
          const cx = containerW / 2;
          const cy = containerH / 2;
          const x = cx + Math.cos(angle) * radiusX;
          const y = cy + Math.sin(angle) * radiusY;
          return (
            <div
              key={node.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: `${x}px`, top: `${y}px`, width: `${cardW}px` }}
            >
              <TerminalCard node={node} index={i} onActivate={onTerminal} layout="wheel" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ Tablet/Mobile stack ============
function TreeStack({
  tree, terminals, onTerminal,
}: {
  tree: { id: TreeId; title: string; eyebrow: string; blurb: string };
  terminals: TreeNode[];
  onTerminal: (n: TreeNode) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-full border border-foreground bg-background p-6 text-center mx-auto max-w-xs aspect-square flex flex-col items-center justify-center">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-2 break-words">
          {cleanEyebrow(tree.eyebrow)}
        </div>
        <div className="font-display text-lg leading-tight mb-2 text-balance break-words">
          {tree.title}
        </div>
        <div className="font-body text-xs text-foreground/60 leading-relaxed text-balance break-words">
          {tree.blurb}
        </div>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {terminals.map((node, i) => (
          <li key={node.id}>
            <TerminalCard node={node} index={i} onActivate={onTerminal} layout="stack" />
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============ Recent runs (history) ============
function RunHistory() {
  const list = useServerFn(listMyQRuns);
  const [runs, setRuns] = useState<Array<{ id: string; node_id: string; created_at: string; witty: boolean; shared: boolean }> | null>(null);

  useEffect(() => {
    let alive = true;
    list({}).then((r) => { if (alive) setRuns(r.runs); }).catch(() => { if (alive) setRuns([]); });
    return () => { alive = false; };
  }, [list]);

  if (!runs || runs.length === 0) return null;

  return (
    <RevealBlock>
      <section className="mt-20 border-t border-border pt-10">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-2">
              Run history
            </div>
            <h3 className="font-display text-2xl md:text-3xl tracking-tight">Your recent decisions</h3>
          </div>
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-foreground/45">
            Last {runs.length}
          </span>
        </div>
        <ul className="divide-y divide-border border-t border-b border-border">
          {runs.map((r) => {
            const node = getNode(r.node_id);
            const date = new Date(r.created_at);
            return (
              <li key={r.id}>
                <Link
                  to="/agent/response/$runId"
                  params={{ runId: r.id }}
                  className="flex items-center justify-between gap-4 py-4 hover:bg-foreground/[0.03] px-2 -mx-2 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-base leading-tight truncate">
                      {node?.label ?? "Decision"}
                    </div>
                    <div className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/50 mt-1 truncate">
                      {node ? breadcrumbFor(node.id).join(" › ") : r.node_id}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs uppercase tracking-[0.25em] text-foreground/55">
                      {date.toLocaleDateString()}
                    </div>
                    <div className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40 mt-1">
                      {r.witty ? "Witty" : "Analytical"}{r.shared ? " · Shared" : ""}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </RevealBlock>
  );
}

// ============ Run drawer ============
function RunDrawer({ node, witty, setWitty, onClose }: {
  node: TreeNode | null;
  witty: boolean;
  setWitty: (v: boolean) => void;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const run = useServerFn(runQNode);
  const [submitting, setSubmitting] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => { setValues({}); }, [node?.id]);

  const breadcrumb = useMemo(() => node ? breadcrumbFor(node.id) : [], [node]);
  const fields = node?.contextFields ?? [];
  const canSubmit = !!node && fields.every((f) => !f.required || (values[f.key] && values[f.key].trim()));

  async function handleRun() {
    if (!node || !canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const res = await run({ data: { nodeId: node.id, context: values, witty } });
      onClose();
      navigate({ to: "/agent/response/$runId", params: { runId: res.runId } });
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === "VANGUARD_REQUIRED") {
        toast.error("Vanguard subscription required.");
        navigate({ to: "/pricing" });
      } else {
        toast.error(msg || "Q couldn't run that.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={!!node} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[460px] md:max-w-[40vw] bg-background border-l border-border p-0 overflow-y-auto">
        <div className="p-7 md:p-9">
          <SheetHeader className="text-left mb-6">
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-4 break-words">
              {breadcrumb.join(" › ")}
            </div>
            <SheetTitle asChild>
              <h2 className="font-display text-3xl md:text-4xl leading-tight tracking-tight break-words">
                {node?.label}<span className="text-accent">.</span>
              </h2>
            </SheetTitle>
            <SheetDescription className="font-body text-sm text-foreground/65 pt-2">
              Give <QMark /> the operator context. The response lands in three zones.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mb-6">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="font-mono text-xs uppercase tracking-[0.25em] text-foreground/55 block mb-1.5">
                  {f.label}{f.required && <span className="text-accent ml-1">·</span>}
                </label>
                {f.kind === "select" ? (
                  <select
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full border border-border bg-background px-3 py-2.5 font-body text-sm focus:outline-none focus:border-foreground"
                  >
                    <option value="">Select…</option>
                    {f.options!.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <textarea
                    rows={3}
                    maxLength={f.maxLength ?? 240}
                    placeholder={f.placeholder}
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full border border-border bg-background px-3 py-2.5 font-body text-sm resize-none focus:outline-none focus:border-foreground"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mb-6 pt-4 border-t border-border">
            <div>
              <div className="font-mono text-xs uppercase tracking-[0.25em] text-foreground/70">Voice</div>
              <div className="text-xs text-foreground/55 mt-0.5">
                {witty ? "Wodehouse — witty" : "McKinsey — analytical"}
              </div>
            </div>
            <Switch checked={witty} onCheckedChange={setWitty} aria-label="Toggle witty voice" />
          </div>

          <button
            onClick={handleRun}
            disabled={!canSubmit || submitting}
            className="w-full py-3 bg-foreground text-background font-mono text-xs uppercase tracking-[0.25em] hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? <><QMark periodClassName="text-accent-foreground/70" /> is working…</> : <>Run <QMark periodClassName="text-accent-foreground/70" /></>}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

void NODES;

// Lumi tier-aware banner. Pure presentation — server still enforces caps via assertQUnderCap.
function LumiSessionBanner({ sub }: { sub: ReturnType<typeof useSubscriptionTier> }) {
  if (sub.loading) return null;
  if (sub.tier === "visitor") return null; // gate card already shown upstream

  const used = sub.lumiSessionsUsed;
  const allowed = sub.lumiSessionsAllowed;
  const remaining = Math.max(0, allowed - used);

  if (sub.tier === "free") {
    const exhausted = used >= allowed;
    return (
      <div className={`mb-8 border ${exhausted ? "border-destructive/40" : "border-border"} bg-card px-5 py-3 flex items-center justify-between gap-4 flex-wrap`}>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-secondary-accent mb-1">Free plan · 1 session / week</div>
          <div className="text-sm text-foreground/80">
            {exhausted
              ? "Session used. Resets on Monday. Practitioner gets 50 sessions per month."
              : "1 free session available this week — make it count."}
          </div>
        </div>
        {exhausted && (
          <Link to="/pricing" className="font-mono text-[11px] uppercase tracking-[0.22em] bg-accent text-accent-foreground px-4 py-2 hover:opacity-90">
            Upgrade ($39/mo)
          </Link>
        )}
      </div>
    );
  }

  // Paid tiers
  const lowHeadroom = remaining > 0 && remaining <= Math.max(1, Math.floor(allowed * 0.1));
  const pool = sub.tier === "team" || sub.tier === "scale" || sub.tier === "enterprise";
  return (
    <div className="mb-8 border border-border bg-card px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
      <div className={`font-mono text-[11px] uppercase tracking-[0.22em] ${lowHeadroom ? "text-secondary-accent" : "text-foreground/70"}`}>
        {pool ? `${used} / ${allowed} team sessions used this month` : `${used} of ${allowed} sessions used this month`}
      </div>
      {lowHeadroom && sub.tier !== "enterprise" && (
        <Link to="/pricing" className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent border-b border-accent/40 hover:border-accent pb-0.5">
          {remaining} left · upgrade →
        </Link>
      )}
    </div>
  );
}

