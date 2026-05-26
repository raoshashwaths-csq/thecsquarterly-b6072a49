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
  const [openL2, setOpenL2] = useState<string | null>(null);
  const [runTerminal, setRunTerminal] = useState<TreeNode | null>(null);

  useEffect(() => {
    if (loading || !user) { setHasVanguard(user ? false : null); return; }
    (async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .eq("tier", "vanguard")
        .maybeSingle();
      setHasVanguard(!!data);
    })();
  }, [user, loading]);

  if (loading) return <CanvasShell><Centered>Loading…</Centered></CanvasShell>;
  if (!user) return <CanvasShell><GateCard kind="signin" /></CanvasShell>;
  if (hasVanguard === false) return <CanvasShell><GateCard kind="vanguard" /></CanvasShell>;
  if (hasVanguard === null) return <CanvasShell><Centered>Checking access…</Centered></CanvasShell>;

  const treeNodes = nodesForTree(activeTree);
  const tree = TREES.find((t) => t.id === activeTree)!;

  return (
    <CanvasShell>
      <div className="mb-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-3">
          Operator Canvas · Q.
        </div>
        <h1 className="font-display text-5xl md:text-6xl leading-[0.95] tracking-tight text-balance max-w-3xl">
          What decision are you running today?
        </h1>
        <p className="font-body text-base text-foreground/70 mt-4 max-w-2xl">
          Pick a tree. Walk the path. Q returns a 3-zone response: diagnosis, playbook, executable.
        </p>
      </div>

      {/* Tree picker rail */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {TREES.map((t) => {
          const active = t.id === activeTree;
          return (
            <button
              key={t.id}
              onClick={() => { setActiveTree(t.id); setOpenL2(null); }}
              className={`text-left p-4 border transition-colors ${
                active
                  ? "border-foreground bg-foreground text-background"
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

      {/* Selected tree header */}
      <div className="border-t border-border pt-6 mb-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-2">
          {tree.eyebrow}
        </div>
        <h2 className="font-display text-3xl md:text-4xl leading-tight">{tree.title}</h2>
        <p className="font-body text-sm text-foreground/65 mt-2 max-w-2xl">{tree.blurb}</p>
      </div>

      {/* Desktop: SVG canvas. Mobile: accordion. */}
      <div className="hidden md:block">
        <TreeCanvas
          nodes={treeNodes}
          openL2={openL2}
          onOpenL2={setOpenL2}
          onTerminal={setRunTerminal}
        />
      </div>
      <div className="md:hidden">
        <TreeAccordion
          nodes={treeNodes}
          openL2={openL2}
          onOpenL2={setOpenL2}
          onTerminal={setRunTerminal}
        />
      </div>

      <RunDrawer node={runTerminal} onClose={() => setRunTerminal(null)} />
    </CanvasShell>
  );
}

function CanvasShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen pt-32 pb-32">
      <div className="container max-w-6xl mx-auto px-6 md:px-10">{children}</div>
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[40vh] flex items-center justify-center font-mono text-xs uppercase tracking-[0.25em] text-foreground/50">{children}</div>;
}

function GateCard({ kind }: { kind: "signin" | "vanguard" }) {
  return (
    <div className="max-w-xl mx-auto border border-border p-10 md:p-14 mt-20">
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

// ============ Canvas (SVG) ============
function TreeCanvas({
  nodes, openL2, onOpenL2, onTerminal,
}: {
  nodes: TreeNode[];
  openL2: string | null;
  onOpenL2: (id: string | null) => void;
  onTerminal: (n: TreeNode) => void;
}) {
  const l1 = nodes.find((n) => n.level === 1)!;
  const l2 = nodes.filter((n) => n.level === 2);
  const visibleL3 = nodes.filter((n) => n.level === 3 && n.parentId === openL2);

  // edges
  const edges: Array<[TreeNode, TreeNode]> = [];
  l2.forEach((n) => edges.push([l1, n]));
  visibleL3.forEach((n) => {
    const parent = l2.find((p) => p.id === n.parentId);
    if (parent) edges.push([parent, n]);
  });

  return (
    <div className="relative w-full" style={{ height: "560px" }}>
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={a.position.x} y1={a.position.y}
            x2={b.position.x} y2={b.position.y}
            stroke="currentColor"
            strokeWidth="0.15"
            className="text-border"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {/* L1 */}
      <NodePill node={l1} variant="root" />
      {/* L2 */}
      {l2.map((n) => (
        <NodePill
          key={n.id}
          node={n}
          variant={openL2 === n.id ? "branch-open" : "branch"}
          onClick={() => onOpenL2(openL2 === n.id ? null : n.id)}
        />
      ))}
      {/* L3 */}
      {visibleL3.map((n) => (
        <NodePill
          key={n.id}
          node={n}
          variant="terminal"
          onClick={() => onTerminal(n)}
        />
      ))}
    </div>
  );
}

function NodePill({
  node, variant, onClick,
}: {
  node: TreeNode;
  variant: "root" | "branch" | "branch-open" | "terminal";
  onClick?: () => void;
}) {
  const base = "absolute -translate-x-1/2 -translate-y-1/2 px-4 py-2 font-display text-sm md:text-[15px] leading-tight whitespace-nowrap transition-all duration-200 ease-[cubic-bezier(0.22,0.61,0.36,1)]";
  const styles: Record<string, string> = {
    root: "bg-foreground text-background border border-foreground",
    branch: "bg-background border border-border hover:border-foreground hover:-translate-y-[calc(50%+2px)] cursor-pointer",
    "branch-open": "bg-background border border-foreground shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] cursor-pointer",
    terminal: "bg-background border border-accent text-foreground hover:bg-accent hover:text-background cursor-pointer font-mono text-[11px] uppercase tracking-[0.15em]",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={variant === "root"}
      className={`${base} ${styles[variant]}`}
      style={{ left: `${node.position.x}%`, top: `${node.position.y}%` }}
    >
      {variant === "terminal" ? <>◉ {node.label}</> : node.label}
    </button>
  );
}

// ============ Mobile accordion ============
function TreeAccordion({
  nodes, openL2, onOpenL2, onTerminal,
}: {
  nodes: TreeNode[];
  openL2: string | null;
  onOpenL2: (id: string | null) => void;
  onTerminal: (n: TreeNode) => void;
}) {
  const l2 = nodes.filter((n) => n.level === 2);
  return (
    <div className="border-t border-border">
      {l2.map((branch) => {
        const open = openL2 === branch.id;
        const children = nodes.filter((n) => n.level === 3 && n.parentId === branch.id);
        return (
          <div key={branch.id} className="border-b border-border">
            <button
              onClick={() => onOpenL2(open ? null : branch.id)}
              className="w-full text-left py-4 flex items-center justify-between"
            >
              <span className="font-display text-lg">{branch.label}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/50">
                {open ? "Close" : `${children.length} options`}
              </span>
            </button>
            {open && (
              <ul className="pb-4 space-y-2">
                {children.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => onTerminal(c)}
                      className="w-full text-left px-4 py-3 border border-border hover:border-accent hover:bg-accent hover:text-background font-mono text-[11px] uppercase tracking-[0.15em] transition-colors"
                    >
                      ◉ {c.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
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
