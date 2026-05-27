import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Link as LinkIcon,
  Upload,
  Trash2,
  Tag,
  Sparkles,
  MessageSquare,
  Highlighter,
  FolderOpen,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/account/workspace")({
  head: () => ({
    meta: [
      { title: "Your Workspace, The CS Quarterly" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspacePage,
});

// ---------- types & storage ----------
type Annotation = {
  id: string;
  slug: string;
  kind: "highlight" | "note";
  text: string;
  note?: string;
  createdAt: number;
};
type SavedLink = { id: string; url: string; title: string; tag: string; createdAt: number };
type SavedAsset = { id: string; name: string; size: number; type: string; tag: string; createdAt: number };
type QRun = { id: string; node_id: string; created_at: string; context: Record<string, unknown> };

const LINKS_KEY = "csq.workspace.links";
const ASSETS_KEY = "csq.workspace.assets";
const HINT_KEY = "csq.hint.workspace.knowledge";

const loadJSON = <T,>(k: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try { return JSON.parse(localStorage.getItem(k) || "null") ?? fallback; } catch { return fallback; }
};
const saveJSON = (k: string, v: unknown) => {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ }
};

// ---------- auto-tagging ----------
const TAG_RULES: Array<{ tag: string; match: RegExp }> = [
  { tag: "Internal Escalation", match: /escalat|churn risk|red account|war room/i },
  { tag: "SaaS Benchmarks", match: /benchmark|nrr|grr|payback|arr|saas/i },
  { tag: "AI in CS", match: /\bai\b|agent|llm|automation|copilot/i },
  { tag: "Negotiation", match: /negotiat|renewal|contract|pricing/i },
  { tag: "Stakeholder", match: /stakeholder|executive|c-?level|sponsor|qbr/i },
  { tag: "Playbooks", match: /playbook|framework|template|protocol/i },
];
function autoTag(text: string): string {
  for (const r of TAG_RULES) if (r.match.test(text)) return r.tag;
  return "General";
}

function loadAllAnnotations(): Annotation[] {
  if (typeof window === "undefined") return [];
  const out: Annotation[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith("csq.annotations.")) continue;
    try {
      const arr = JSON.parse(localStorage.getItem(key) || "[]");
      if (Array.isArray(arr)) out.push(...arr);
    } catch { /* ignore */ }
  }
  return out.sort((a, b) => b.createdAt - a.createdAt);
}

// ---------- main page ----------
function WorkspacePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"history" | "highlights" | "ledger">("history");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const tabs = [
    { id: "history" as const, label: "Interaction History", icon: MessageSquare },
    { id: "highlights" as const, label: "Highlights & Annotations", icon: Highlighter },
    { id: "ledger" as const, label: "Knowledge Ledger", icon: FolderOpen },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-6xl mx-auto px-4 md:px-6 py-10 w-full">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-3">
          Members · Workspace
        </div>
        <h1 className="font-display text-4xl md:text-6xl tracking-tight mb-2">
          Your Workspace<span className="text-accent">.</span>
        </h1>
        <p className="text-foreground/65 mb-8 max-w-2xl">
          Your transcripts, annotations, and saved intel — in one operator-grade ledger.
        </p>

        <DailyBriefing />

        {/* tabs — swipe-bar on mobile */}
        <div className="mt-10 -mx-4 md:mx-0 overflow-x-auto scroll-smooth snap-x snap-mandatory">
          <div className="flex gap-2 px-4 md:px-0 border-b border-border min-w-max">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`snap-start min-h-[44px] min-w-[44px] inline-flex items-center gap-2 px-4 py-3 font-mono text-[11px] uppercase tracking-widest border-b-2 transition-colors ${
                    active
                      ? "border-accent text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 will-change-transform">
          {tab === "history" && <HistoryPanel />}
          {tab === "highlights" && <HighlightsPanel />}
          {tab === "ledger" && <LedgerPanel />}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

// ---------- Daily Briefing ----------
function DailyBriefing() {
  const [links, setLinks] = useState<SavedLink[]>([]);
  const [assets, setAssets] = useState<SavedAsset[]>([]);

  useEffect(() => {
    setLinks(loadJSON<SavedLink[]>(LINKS_KEY, []));
    setAssets(loadJSON<SavedAsset[]>(ASSETS_KEY, []));
  }, []);

  const insights = useMemo(() => {
    const tagCounts = new Map<string, number>();
    [...links, ...assets].forEach((x) => tagCounts.set(x.tag, (tagCounts.get(x.tag) ?? 0) + 1));
    const top = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);
    const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    const out: string[] = [];
    if (links.length === 0 && assets.length === 0) {
      out.push("Your Knowledge Ledger is empty. Drop a URL or file to start building your operator memory.");
      out.push("Pinned reading: this week's dispatch covers the 105% to 128% NRR rebuild.");
      out.push("Run your first diagnostic to unlock a tailored briefing.");
      return { today, list: out };
    }
    out.push(`You have ${links.length} link${links.length === 1 ? "" : "s"} and ${assets.length} asset${assets.length === 1 ? "" : "s"} in your ledger.`);
    if (top[0]) out.push(`Concentration risk: ${top[0][1]} item${top[0][1] === 1 ? "" : "s"} clustered under "${top[0][0]}" — consider broadening.`);
    if (top[1]) out.push(`Secondary theme: "${top[1][0]}". Worth a Tuesday block to consolidate.`);
    out.push("Open a saved link to refresh context before your next QBR.");
    return { today, list: out.slice(0, 4) };
  }, [links, assets]);

  return (
    <section className="mt-8 border-2 border-accent bg-accent/5 p-6 md:p-8">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-2 font-semibold">
        <Sparkles className="w-3 h-3" />
        Daily Operational Briefing · {insights.today}
      </div>
      <h2 className="font-display text-2xl md:text-3xl mb-4 tracking-tight">
        What to focus on today.
      </h2>
      <ul className="space-y-2.5">
        {insights.list.map((line, i) => (
          <li key={i} className="flex gap-3 text-sm md:text-base text-foreground/85">
            <span aria-hidden className="mt-1.5 inline-block w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------- A. History ----------
function HistoryPanel() {
  const { user } = useAuth();
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const runs = useQuery({
    queryKey: ["q-runs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("q_runs")
        .select("id, node_id, created_at, context")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as QRun[];
    },
  });

  if (runs.isLoading) return <p className="text-muted-foreground">Loading transcripts…</p>;
  const items = runs.data ?? [];
  if (items.length === 0) {
    return (
      <div className="border border-dashed border-border p-10 text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">No transcripts yet</p>
        <p className="text-foreground/70 mb-4">Run a diagnostic with Q to see it land here.</p>
        <Link to="/agent/framework" className="inline-block px-5 py-3 bg-foreground text-background font-mono text-[10px] uppercase tracking-widest">
          Open Q canvas →
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border border border-border">
      {items.map((r) => {
        const isOpen = !!open[r.id];
        return (
          <li key={r.id}>
            <button
              onClick={() => setOpen((s) => ({ ...s, [r.id]: !s[r.id] }))}
              className="w-full text-left flex items-center gap-3 p-4 hover:bg-muted/30 min-h-[44px]"
            >
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-widest text-accent">
                  {r.node_id}
                </div>
                <div className="text-sm text-foreground/80 truncate">
                  {new Date(r.created_at).toLocaleString()}
                </div>
              </div>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 pl-11">
                <pre className="text-xs bg-muted/30 p-3 rounded overflow-x-auto whitespace-pre-wrap font-mono">
                  {JSON.stringify(r.context, null, 2)}
                </pre>
                <Link
                  to="/agent/response/$runId"
                  params={{ runId: r.id }}
                  className="inline-block mt-3 font-mono text-[10px] uppercase tracking-widest underline underline-offset-4 hover:text-accent"
                >
                  Open full response →
                </Link>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ---------- B. Highlights ----------
function HighlightsPanel() {
  const [items, setItems] = useState<Annotation[]>([]);
  useEffect(() => { setItems(loadAllAnnotations()); }, []);

  const exportPDF = async () => {
    if (items.length === 0) {
      toast.error("Nothing to export yet.");
      return;
    }
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const M = 56;
    let y = M;

    // Brand header
    doc.setFillColor(20, 20, 20);
    doc.rect(0, 0, W, 72, "F");
    doc.setTextColor(245, 240, 230);
    doc.setFont("times", "bold");
    doc.setFontSize(22);
    doc.text("The CS Quarterly", M, 44);
    doc.setTextColor(208, 106, 76);
    doc.text(".", M + doc.getTextWidth("The CS Quarterly"), 44);
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.setTextColor(245, 240, 230);
    doc.text("WORKSPACE EXPORT", W - M, 44, { align: "right" });

    y = 110;
    doc.setTextColor(20, 20, 20);
    doc.setFont("times", "bold");
    doc.setFontSize(28);
    doc.text("Your margin.", M, y);
    y += 20;
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`${items.length} ENTRIES · ${new Date().toLocaleDateString()}`, M, y);
    y += 30;

    doc.setDrawColor(208, 106, 76);
    doc.setLineWidth(1);
    doc.line(M, y, W - M, y);
    y += 24;

    items.forEach((a) => {
      if (y > H - 100) {
        doc.addPage();
        y = M;
      }
      doc.setFont("courier", "bold");
      doc.setFontSize(8);
      doc.setTextColor(208, 106, 76);
      doc.text(`${a.kind.toUpperCase()} · ${new Date(a.createdAt).toLocaleDateString()} · ${a.slug}`, M, y);
      y += 14;
      doc.setFont("times", "italic");
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      const quoted = doc.splitTextToSize(`"${a.text}"`, W - 2 * M);
      doc.text(quoted, M, y);
      y += quoted.length * 14 + 4;
      if (a.note) {
        doc.setFont("times", "normal");
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        const note = doc.splitTextToSize(`Note: ${a.note}`, W - 2 * M);
        doc.text(note, M, y);
        y += note.length * 13;
      }
      y += 16;
      doc.setDrawColor(230, 225, 215);
      doc.line(M, y - 8, W - M, y - 8);
    });

    // Footer on last page
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text("thecsquarterly.com · Operator-grade Customer Success", M, H - 30);

    doc.save(`csq-workspace-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("Workspace exported.");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {items.length} entries across the site
        </p>
        <button
          onClick={exportPDF}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-foreground text-background font-mono text-[10px] uppercase tracking-widest hover:bg-accent transition-colors min-h-[44px]"
        >
          <Download className="w-3.5 h-3.5" /> Export Workspace to PDF
        </button>
      </div>

      {items.length === 0 ? (
        <div className="border border-dashed border-border p-10 text-center">
          <p className="text-foreground/70">Highlight any passage on a dispatch — it lands here.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border border border-border">
          {items.map((a) => (
            <li key={a.id} className="p-4 flex gap-3">
              <span className={`mt-1.5 inline-block w-1.5 h-1.5 rounded-full shrink-0 ${a.kind === "highlight" ? "bg-secondary-accent" : "bg-accent"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  <span>{a.kind}</span>
                  <Link
                    to="/insights/$slug"
                    params={{ slug: a.slug }}
                    className="text-accent hover:underline truncate"
                  >
                    {a.slug}
                  </Link>
                  <span className="ml-auto opacity-60">{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm italic text-foreground/80">&ldquo;{a.text}&rdquo;</p>
                {a.note && <p className="mt-1.5 text-sm">{a.note}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------- C. Ledger ----------
function LedgerPanel() {
  const [links, setLinks] = useState<SavedLink[]>([]);
  const [assets, setAssets] = useState<SavedAsset[]>([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [drag, setDrag] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const l = loadJSON<SavedLink[]>(LINKS_KEY, []);
    const a = loadJSON<SavedAsset[]>(ASSETS_KEY, []);
    setLinks(l);
    setAssets(a);
    try {
      const seen = localStorage.getItem(HINT_KEY) === "1";
      if (!seen && l.length === 0 && a.length === 0) setShowHint(true);
    } catch { /* ignore */ }
  }, []);

  const dismissHint = () => {
    setShowHint(false);
    try { localStorage.setItem(HINT_KEY, "1"); } catch { /* ignore */ }
  };

  const addLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    const t = title.trim() || url.trim();
    const next: SavedLink = {
      id: crypto.randomUUID(),
      url: url.trim(),
      title: t,
      tag: autoTag(`${t} ${url}`),
      createdAt: Date.now(),
    };
    const updated = [next, ...links];
    setLinks(updated);
    saveJSON(LINKS_KEY, updated);
    setUrl(""); setTitle("");
    toast.success(`Saved under "${next.tag}"`);
    dismissHint();
  };

  const onFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const adds: SavedAsset[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      type: f.type || "file",
      tag: autoTag(f.name),
      createdAt: Date.now(),
    }));
    const updated = [...adds, ...assets];
    setAssets(updated);
    saveJSON(ASSETS_KEY, updated);
    toast.success(`Added ${adds.length} asset${adds.length === 1 ? "" : "s"}`);
    dismissHint();
  };

  const removeLink = (id: string) => {
    const u = links.filter((l) => l.id !== id);
    setLinks(u); saveJSON(LINKS_KEY, u);
  };
  const removeAsset = (id: string) => {
    const u = assets.filter((a) => a.id !== id);
    setAssets(u); saveJSON(ASSETS_KEY, u);
  };

  const tagGroups = useMemo(() => {
    const map = new Map<string, { links: SavedLink[]; assets: SavedAsset[] }>();
    links.forEach((l) => {
      if (!map.has(l.tag)) map.set(l.tag, { links: [], assets: [] });
      map.get(l.tag)!.links.push(l);
    });
    assets.forEach((a) => {
      if (!map.has(a.tag)) map.set(a.tag, { links: [], assets: [] });
      map.get(a.tag)!.assets.push(a);
    });
    return [...map.entries()].sort((a, b) =>
      (b[1].links.length + b[1].assets.length) - (a[1].links.length + a[1].assets.length),
    );
  }, [links, assets]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <form onSubmit={addLink} className="border border-border p-4">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">
            <LinkIcon className="w-3.5 h-3.5" /> Save a link
          </div>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            type="url"
            inputMode="url"
            placeholder="https://…"
            className="w-full border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-accent min-h-[44px]"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Optional title"
            className="mt-2 w-full border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-accent min-h-[44px]"
          />
          <button
            type="submit"
            className="mt-3 w-full min-h-[44px] py-3 bg-foreground text-background font-mono text-[10px] uppercase tracking-widest hover:bg-accent transition-colors"
          >
            Save to ledger
          </button>
        </form>

        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); onFiles(e.dataTransfer.files); }}
          className={`relative mt-4 block border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
            drag ? "border-accent bg-accent/5"
              : showHint ? "border-accent bg-accent/10 animate-pulse"
              : "border-border hover:border-accent"
          }`}
        >
          <input
            type="file"
            multiple
            className="sr-only"
            onChange={(e) => onFiles(e.target.files)}
          />
          <Upload className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Drop files or tap to upload
          </div>
          {showHint && (
            <div className="mt-3 inline-flex items-center gap-2 px-2 py-1 bg-accent text-accent-foreground font-mono text-[10px] uppercase tracking-widest">
              <Sparkles className="w-3 h-3" /> New · start your ledger
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); dismissHint(); }}
                className="ml-1 opacity-80 hover:opacity-100"
                aria-label="Dismiss"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </label>
      </div>

      <div>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">
          <Tag className="w-3.5 h-3.5" /> Auto-organized
        </div>
        {tagGroups.length === 0 ? (
          <p className="text-foreground/60 text-sm">Nothing saved yet. Add a link or file to start.</p>
        ) : (
          <div className="space-y-4">
            {tagGroups.map(([tag, group]) => (
              <details key={tag} open className="border border-border">
                <summary className="cursor-pointer p-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-widest min-h-[44px]">
                  <span className="text-accent">{tag}</span>
                  <span className="text-muted-foreground">
                    {group.links.length + group.assets.length}
                  </span>
                </summary>
                <ul className="divide-y divide-border border-t border-border">
                  {group.links.map((l) => (
                    <li key={l.id} className="p-3 flex items-start gap-3 text-sm">
                      <LinkIcon className="w-3.5 h-3.5 mt-1 text-muted-foreground shrink-0" />
                      <a href={l.url} target="_blank" rel="noreferrer noopener" className="flex-1 min-w-0 truncate underline-offset-4 hover:underline">
                        {l.title}
                      </a>
                      <button onClick={() => removeLink(l.id)} aria-label="Remove" className="text-muted-foreground hover:text-accent">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                  {group.assets.map((a) => (
                    <li key={a.id} className="p-3 flex items-start gap-3 text-sm">
                      <FolderOpen className="w-3.5 h-3.5 mt-1 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{a.name}</div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          {(a.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                      <button onClick={() => removeAsset(a.id)} aria-label="Remove" className="text-muted-foreground hover:text-accent">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
