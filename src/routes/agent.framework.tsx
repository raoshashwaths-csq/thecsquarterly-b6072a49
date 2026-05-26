import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { runQNode } from "@/lib/q-agent.functions";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import {
  TREES, NODES, nodesForTree, getNode, breadcrumbFor, type TreeId, type TreeNode,
} from "@/lib/q-trees";

export const Route = createFileRoute("/agent/framework")({
  head: () => ({
    meta: [
      { title: "Q · Operator Canvas — The CS Quarterly" },
      { name: "description", content: "Navigate Q's decision graph to a benchmark-grounded, immediately executable response. Vanguard only." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Q · Operator Canvas" },
      { property: "og:description", content: "The institutional memory of a 40-year CS operator. Available at 11pm." },
    ],
  }),
  component: AgentFrameworkPage,
});

function AgentFrameworkPage() {
  const { user, loading } = useAuth();
  const [hasVanguard, setHasVanguard] = useState<boolean | null>(null);
  const [activeTree, setActiveTree] = useState<TreeId>("T1");
  const [runTerminal, setRunTerminal] = useState<TreeNode | null>(null);

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
      <header className="mb-12 animate-fade-up">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-3">
          Operator Canvas · Q.
        </div>
        <h1 className="font-display text-5xl md:text-6xl leading-[0.95] tracking-tight text-balance max-w-3xl">
          What decision are you running today<span className="text-accent">?</span>
        </h1>
        <p className="font-body text-base text-foreground/70 mt-4 max-w-2xl">
          Pick a tree. Walk the path. Q returns a 3-zone response: diagnosis, playbook, executable.
        </p>
      </header>

      {/* Tree picker rail */}
      <RevealBlock>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-14">
          {TREES.map((t) => {
            const active = t.id === activeTree;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTree(t.id)}
                className={`text-left p-4 border transition-all duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)] hover:-translate-y-0.5 ${
                  active
                    ? "border-foreground bg-foreground text-background shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)]"
                    : "border-border hover:border-foreground"
                }`}
              >
                <div className={`font-mono text-[9px] uppercase tracking-[0.25em] mb-1.5 ${active ? "text-background/70" : "text-accent"}`}>
                  {t.eyebrow}
                </div>
                <div className="font-display text-base leading-tight">{t.title}</div>
              </button>
            );
          })}
        </div>
      </RevealBlock>

      {/* Selected tree header */}
      <RevealBlock>
        <div className="border-t border-border pt-6 mb-10">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-2">
            {tree.eyebrow}
          </div>
          <h2 className="font-display text-3xl md:text-4xl leading-tight">{tree.title}</h2>
          <p className="font-body text-sm text-foreground/65 mt-2 max-w-2xl">{tree.blurb}</p>
        </div>
      </RevealBlock>

      {/* Desktop: circular wheel. Mobile: stacked cards. */}
      <RevealBlock>
        <div className="hidden md:block">
          <TreeWheel
            key={activeTree}
            tree={tree}
            terminals={terminals}
            onTerminal={setRunTerminal}
          />
        </div>
        <div className="md:hidden">
          <TreeStack
            tree={tree}
            terminals={terminals}
            onTerminal={setRunTerminal}
          />
        </div>
      </RevealBlock>

      <RunDrawer node={runTerminal} onClose={() => setRunTerminal(null)} />
    </CanvasShell>
  );
}

function CanvasShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 pt-28 md:pt-32 pb-24">
        <div className="container max-w-6xl mx-auto px-6 md:px-10">{children}</div>
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
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-4">
        {kind === "signin" ? "Sign in required" : "Vanguard only"}
      </div>
      <h1 className="font-display text-4xl md:text-5xl leading-[0.95] tracking-tight mb-4">
        Q's canvas is reserved for Vanguard subscribers<span className="text-accent">.</span>
      </h1>
      <p className="font-body text-foreground/70 mb-8">
        {kind === "signin"
          ? "Sign in to your Vanguard account to open the operator canvas."
          : "The decision graph, structured prompt injection, and 3-zone response engine ship with Vanguard. Free readers keep the single-question trial via the floating Q. button."}
      </p>
      <div className="flex gap-3">
        <Link
          to={kind === "signin" ? "/login" : "/pricing"}
          className="px-6 py-3 bg-foreground text-background font-mono text-[10px] uppercase tracking-[0.25em] hover:bg-accent transition-colors"
        >
          {kind === "signin" ? "Sign in" : "See Vanguard"}
        </Link>
        <Link
          to="/"
          className="px-6 py-3 border border-border font-mono text-[10px] uppercase tracking-[0.25em] hover:border-foreground transition-colors"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}

// ============ Circular tree wheel (desktop) ============
function TreeWheel({
  tree, terminals, onTerminal,
}: {
  tree: { id: TreeId; title: string; eyebrow: string; blurb: string };
  terminals: TreeNode[];
  onTerminal: (n: TreeNode) => void;
}) {
  const count = terminals.length;
  // Geometry: cards arranged on an ellipse around a central hub.
  // Container is 100% wide with a fixed aspect ratio.
  const cardW = 230; // px
  const cardH = 116; // px
  const radiusX = 360;
  const radiusY = 280;
  const containerH = radiusY * 2 + cardH + 40;
  const containerW = radiusX * 2 + cardW + 40;

  return (
    <div className="relative w-full overflow-hidden" style={{ height: `${containerH}px` }}>
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: `${containerW}px`, height: `${containerH}px` }}
      >
        {/* connecting lines (SVG) */}
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
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-3">
            {tree.eyebrow}
          </div>
          <div className="font-display text-xl leading-tight mb-3 text-balance">
            {tree.title}
          </div>
          <div className="font-body text-[12px] text-foreground/60 leading-relaxed text-balance max-w-[200px]">
            {tree.blurb}
          </div>
        </div>

        {/* terminal nodes */}
        {terminals.map((node, i) => {
          const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
          const cx = containerW / 2;
          const cy = containerH / 2;
          const x = cx + Math.cos(angle) * radiusX;
          const y = cy + Math.sin(angle) * radiusY;
          const parent = node.parentId ? getNode(node.parentId) : undefined;
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => onTerminal(node)}
              className="group absolute -translate-x-1/2 -translate-y-1/2 text-left bg-background border border-border hover:border-foreground hover:-translate-y-[calc(50%+3px)] transition-all duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)] rounded-md p-4 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.35)] reveal-up is-revealed"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                width: `${cardW}px`,
                minHeight: `${cardH}px`,
                animation: `fade-up 0.6s var(--ease-out-expo, cubic-bezier(0.22, 0.61, 0.36, 1)) ${i * 70}ms both`,
              }}
            >
              <div className="flex items-start gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent shrink-0 mt-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  {parent && (
                    <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/45 mb-1 truncate">
                      {parent.label}
                    </div>
                  )}
                  <div className="font-display text-[15px] leading-snug text-foreground group-hover:text-accent transition-colors">
                    {node.label}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============ Mobile stack ============
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
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-2">
          {tree.eyebrow}
        </div>
        <div className="font-display text-lg leading-tight mb-2 text-balance">
          {tree.title}
        </div>
        <div className="font-body text-xs text-foreground/60 leading-relaxed text-balance">
          {tree.blurb}
        </div>
      </div>
      <ul className="space-y-3">
        {terminals.map((node, i) => {
          const parent = node.parentId ? getNode(node.parentId) : undefined;
          return (
            <li key={node.id}>
              <button
                onClick={() => onTerminal(node)}
                className="w-full text-left bg-background border border-border hover:border-foreground rounded-md p-4 transition-colors"
                style={{ animation: `fade-up 0.5s cubic-bezier(0.22,0.61,0.36,1) ${i * 50}ms both` }}
              >
                <div className="flex items-start gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent shrink-0 mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    {parent && (
                      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/45 mb-1">
                        {parent.label}
                      </div>
                    )}
                    <div className="font-display text-base leading-snug">
                      {node.label}
                    </div>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ============ Run drawer ============
function RunDrawer({ node, onClose }: { node: TreeNode | null; onClose: () => void }) {
  const navigate = useNavigate();
  const run = useServerFn(runQNode);
  const [witty, setWitty] = useState(false);
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
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-4">
              {breadcrumb.join(" › ")}
            </div>
            <SheetTitle asChild>
              <h2 className="font-display text-3xl md:text-4xl leading-tight tracking-tight">
                {node?.label}<span className="text-accent">.</span>
              </h2>
            </SheetTitle>
            <SheetDescription className="font-body text-sm text-foreground/65 pt-2">
              Give Q the operator context. The response lands in three zones.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mb-6">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/55 block mb-1.5">
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
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/70">Witty mode</div>
              <div className="text-xs text-foreground/55 mt-0.5">{witty ? "Wodehouse register" : "McKinsey register"}</div>
            </div>
            <Switch checked={witty} onCheckedChange={setWitty} aria-label="Toggle witty mode" />
          </div>

          <button
            onClick={handleRun}
            disabled={!canSubmit || submitting}
            className="w-full py-3 bg-foreground text-background font-mono text-[10px] uppercase tracking-[0.25em] hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Q is working…" : "Run Q"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// re-export so unused linter doesn't complain about NODES helper usage
void NODES;
