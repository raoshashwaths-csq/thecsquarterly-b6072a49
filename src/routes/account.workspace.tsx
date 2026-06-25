import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SentimentTrendPanel } from "@/components/site/SentimentTrendPanel";
import { SiteFooter } from "@/components/site/SiteFooter";
import { RequireAuth } from "@/components/site/RequireAuth";
import { ExportDialog } from "@/components/site/ExportDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  listAnnotations,
  listWorkspaceItems,
  createWorkspaceItem,
  deleteWorkspaceItem,
  deleteAnnotation,
  bulkImportWorkspace,
} from "@/lib/workspace.functions";
import { getTree, NODES, type TreeId } from "@/lib/q-trees";

function resolveRun(nodeId: string) {
  const treeId = nodeId.split("-")[0] as TreeId;
  const tree = getTree(treeId);
  const path: string[] = [];
  let cur = NODES.find((n) => n.id === nodeId);
  while (cur && cur.parentId) {
    path.unshift(cur.label);
    const parentId: string = cur.parentId;
    cur = NODES.find((n) => n.id === parentId);
  }
  return { heading: tree?.title ?? "Scenario", breadcrumb: path.join(" · ") };
}

function pickContextLine(ctx: Record<string, unknown>): string | null {
  const keys = ["one_sentence_context", "context", "summary", "prompt_context"];
  for (const k of keys) {
    const v = ctx?.[k];
    if (typeof v === "string" && v.trim()) {
      const s = v.trim();
      return s.length > 180 ? s.slice(0, 177) + "…" : s;
    }
  }
  return null;
}

export const Route = createFileRoute("/account/workspace")({
  head: () => ({
    meta: [
      { title: "Your Workspace, The CS Quarterly" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspacePage,
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-20 w-full">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-3">Workspace · Error</div>
        <h1 className="font-display text-4xl tracking-tight mb-3">Something snagged.</h1>
        <p className="text-foreground/70 mb-6">{error?.message || "An unexpected error occurred."}</p>
        <button onClick={reset} className="px-5 py-3 bg-foreground text-background font-mono uppercase tracking-widest text-xs">Retry</button>
      </main>
      <SiteFooter />
    </div>
  ),
});

// ---------- types ----------
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

const HINT_KEY = "csq.hint.workspace.knowledge";
const SEARCH_HINT_KEY = "csq.hint.workspace.search";
const MIGRATED_FLAG = "csq.workspace.migrated.v1";
const LEGACY_LINKS_KEY = "csq.workspace.links";
const LEGACY_ASSETS_KEY = "csq.workspace.assets";

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

// ---------- shared query hooks (single source of truth: the DB) ----------
function useWorkspaceData() {
  const { user } = useAuth();
  const fetchItems = useServerFn(listWorkspaceItems);
  const fetchAnns = useServerFn(listAnnotations);

  const itemsQ = useQuery({
    queryKey: ["workspace-items", user?.id],
    enabled: !!user,
    queryFn: () => fetchItems(),
    staleTime: 30_000,
  });
  const annsQ = useQuery({
    queryKey: ["workspace-annotations", user?.id],
    enabled: !!user,
    queryFn: () => fetchAnns({ data: {} }),
    staleTime: 30_000,
  });

  const links: SavedLink[] = useMemo(
    () => (itemsQ.data?.items ?? [])
      .filter((i) => i.kind === "link")
      .map((i) => ({
        id: i.id, url: i.url ?? "", title: i.title, tag: i.tag,
        createdAt: new Date(i.created_at).getTime(),
      })),
    [itemsQ.data],
  );
  const assets: SavedAsset[] = useMemo(
    () => (itemsQ.data?.items ?? [])
      .filter((i) => i.kind === "asset")
      .map((i) => ({
        id: i.id, name: i.title, size: Number(i.size_bytes ?? 0),
        type: i.mime_type ?? "file", tag: i.tag,
        createdAt: new Date(i.created_at).getTime(),
      })),
    [itemsQ.data],
  );
  const annotations: Annotation[] = useMemo(
    () => (annsQ.data?.annotations ?? []).map((a) => ({
      id: a.id, slug: a.slug, kind: a.kind as "highlight" | "note",
      text: a.text, note: a.note ?? undefined,
      createdAt: new Date(a.created_at).getTime(),
    })),
    [annsQ.data],
  );

  return { links, assets, annotations, loading: itemsQ.isLoading || annsQ.isLoading };
}

// ---------- one-time migration of legacy localStorage entries ----------
function useLegacyMigration() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const bulkImport = useServerFn(bulkImportWorkspace);
  useEffect(() => {
    if (!user || typeof window === "undefined") return;
    if (localStorage.getItem(MIGRATED_FLAG)) return;
    const legacyLinks: SavedLink[] = (() => { try { return JSON.parse(localStorage.getItem(LEGACY_LINKS_KEY) || "[]"); } catch { return []; } })();
    const legacyAssets: SavedAsset[] = (() => { try { return JSON.parse(localStorage.getItem(LEGACY_ASSETS_KEY) || "[]"); } catch { return []; } })();
    const legacyAnns: Annotation[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith("csq.annotations.")) continue;
      try {
        const arr = JSON.parse(localStorage.getItem(k) || "[]");
        if (Array.isArray(arr)) legacyAnns.push(...arr);
      } catch { /* */ }
    }
    if (!legacyLinks.length && !legacyAssets.length && !legacyAnns.length) {
      localStorage.setItem(MIGRATED_FLAG, "1");
      return;
    }
    (async () => {
      try {
        await bulkImport({
          data: {
            annotations: legacyAnns.slice(0, 500).map((a) => ({
              slug: a.slug, kind: a.kind, text: a.text, note: a.note ?? null,
            })),
            items: [
              ...legacyLinks.slice(0, 250).map((l) => ({
                kind: "link" as const, title: l.title, url: l.url,
                tag: l.tag || "General", size_bytes: null, mime_type: null,
              })),
              ...legacyAssets.slice(0, 250).map((a) => ({
                kind: "asset" as const, title: a.name, url: null,
                size_bytes: a.size, mime_type: a.type || null, tag: a.tag || "General",
              })),
            ],
          },
        });
        localStorage.setItem(MIGRATED_FLAG, "1");
        qc.invalidateQueries({ queryKey: ["workspace-items"] });
        qc.invalidateQueries({ queryKey: ["workspace-annotations"] });
        toast.success("Your previous highlights and saves were imported to your profile.");
      } catch {
        // leave flag unset so we retry next mount
      }
    })();
  }, [user, qc, bulkImport]);
}

// ---------- main page ----------
function WorkspacePage() {
  return (
    <RequireAuth>
      <WorkspacePageInner />
    </RequireAuth>
  );
}

function WorkspacePageInner() {
  const [tab, setTab] = useState<"history" | "highlights" | "ledger">("history");
  const [query, setQuery] = useState("");
  const [searchHintDismissed, setSearchHintDismissed] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);



  useEffect(() => {
    try { setSearchHintDismissed(localStorage.getItem(SEARCH_HINT_KEY) === "1"); } catch { /* */ }
  }, []);

  useLegacyMigration();
  const { links, assets, annotations } = useWorkspaceData();

  const dismissSearchHint = () => {
    setSearchHintDismissed(true);
    try { localStorage.setItem(SEARCH_HINT_KEY, "1"); } catch { /* */ }
  };

  const tabs = [
    { id: "history" as const, label: "Interaction History", icon: MessageSquare },
    { id: "highlights" as const, label: "Highlights & Annotations", icon: Highlighter },
    { id: "ledger" as const, label: "Knowledge Ledger", icon: FolderOpen },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-6xl mx-auto px-4 md:px-6 py-10 w-full">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-3">
          Members · Workspace
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-2">
          <h1 className="font-display text-4xl md:text-6xl tracking-tight">
            Your Workspace<span className="text-accent">.</span>
          </h1>
          <button
            onClick={() => setExportOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-foreground text-background font-mono uppercase tracking-widest text-xs hover:bg-accent transition-colors min-h-[44px]"
          >
            <Download className="w-3.5 h-3.5" /> Export to branded PDF
          </button>
        </div>
        <p className="text-foreground/65 mb-6 max-w-2xl">
          Your transcripts, annotations, and saved intel — synced to your profile, accessible on every device.
        </p>

        {/* Workspace-only search bar */}
        <div className="relative mb-8" onClick={!searchHintDismissed ? dismissSearchHint : undefined}>
          <div className="flex items-center gap-2 border-2 border-border focus-within:border-accent bg-background px-3 py-2.5">
            <Search size={16} strokeWidth={2.75} className="text-muted-foreground shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); dismissSearchHint(); }}
              placeholder="Search your saved links, files, highlights, and transcripts…"
              className="w-full bg-transparent focus:outline-none text-sm font-body min-h-[44px]"
              aria-label="Search your Workspace"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Clear" className="text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X size={14} />
              </button>
            )}
          </div>
          <p className="mt-1.5 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Scope · saved Workspace items only — does not query the CSQ corpus.
          </p>
          {!searchHintDismissed && (
            <div className="mt-2 inline-flex items-center gap-2 px-2 py-1 bg-accent text-accent-foreground font-mono text-xs uppercase tracking-[0.25em] animate-pulse">
              <Sparkles className="w-3 h-3" /> New · search across your saved intel
              <button type="button" onClick={(e) => { e.stopPropagation(); dismissSearchHint(); }} className="ml-1 opacity-80 hover:opacity-100" aria-label="Dismiss">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <DailyBriefing links={links} assets={assets} annotations={annotations} />

        <SentimentTrendPanel />

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
                  className={`snap-start min-h-[44px] min-w-[44px] inline-flex items-center gap-2 px-4 py-3 font-mono text-xs uppercase tracking-widest border-b-2 transition-colors ${
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
          {tab === "history" && <HistoryPanel query={query} />}
          {tab === "highlights" && <HighlightsPanel query={query} annotations={annotations} links={links} assets={assets} onExport={() => setExportOpen(true)} />}
          {tab === "ledger" && <LedgerPanel query={query} links={links} assets={assets} />}
        </div>
      </main>
      <SiteFooter />
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}

// ---------- Briefing generator ----------
type Briefing = { today: string; list: string[]; meta: { total: number; fresh: number; stale: number; topTag?: string } };

function generateBriefing(links: SavedLink[], assets: SavedAsset[], annotations: Annotation[]): Briefing {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const all: { tag: string; createdAt: number }[] = [
    ...links.map((l) => ({ tag: l.tag, createdAt: l.createdAt })),
    ...assets.map((a) => ({ tag: a.tag, createdAt: a.createdAt })),
  ];
  const total = all.length;
  if (total === 0 && annotations.length === 0) {
    return {
      today,
      meta: { total: 0, fresh: 0, stale: 0 },
      list: [
        "Your Knowledge Ledger is empty. Drop a URL or file to start building operator memory.",
        "Pinned reading: this week's dispatch covers the 105% → 128% NRR rebuild.",
        "Run your first Q diagnostic to unlock a tailored briefing tomorrow.",
      ],
    };
  }
  const now = Date.now();
  const DAY = 86_400_000;
  const fresh = all.filter((x) => now - x.createdAt < 7 * DAY).length;
  const stale = all.filter((x) => now - x.createdAt > 30 * DAY).length;
  const tagCounts = new Map<string, number>();
  all.forEach((x) => tagCounts.set(x.tag, (tagCounts.get(x.tag) ?? 0) + 1));
  const ranked = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);
  const top = ranked[0];
  const concentration = top && total > 0 ? top[1] / total : 0;
  const recentHighlights = annotations.filter((a) => now - a.createdAt < 14 * DAY);
  const slugs = new Set(annotations.map((a) => a.slug));

  const out: string[] = [];
  out.push(
    `Ledger holds ${total} item${total === 1 ? "" : "s"} across ${ranked.length} theme${ranked.length === 1 ? "" : "s"}` +
      (fresh ? ` — ${fresh} added this week.` : "."),
  );
  if (top && concentration >= 0.5) {
    out.push(`Concentration alert: ${Math.round(concentration * 100)}% of saves cluster under "${top[0]}". Broaden the next pull to avoid a single-narrative blind spot.`);
  } else if (top) {
    out.push(`Dominant theme this cycle: "${top[0]}" (${top[1]} item${top[1] === 1 ? "" : "s"})${ranked[1] ? `, trailed by "${ranked[1][0]}".` : "."}`);
  }
  if (recentHighlights.length > 0) {
    out.push(`You marked ${recentHighlights.length} highlight${recentHighlights.length === 1 ? "" : "s"} across ${slugs.size} dispatch${slugs.size === 1 ? "" : "es"} recently — worth synthesizing into one playbook note.`);
  }
  if (stale >= 3) {
    out.push(`${stale} item${stale === 1 ? " is" : "s are"} over 30 days old. Triage or archive before your next QBR block.`);
  }
  if (out.length < 4) {
    out.push("Open one saved link and turn it into a 3-sentence brief — that is today's compounding action.");
  }
  return { today, meta: { total, fresh, stale, topTag: top?.[0] }, list: out.slice(0, 5) };
}

// ---------- Daily Briefing ----------
function DailyBriefing({ links, assets, annotations }: { links: SavedLink[]; assets: SavedAsset[]; annotations: Annotation[] }) {
  const briefing = useMemo(() => generateBriefing(links, assets, annotations), [links, assets, annotations]);

  return (
    <section className="mt-8 border-2 border-accent bg-accent/5 p-6 md:p-8">
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-accent mb-2 font-semibold">
        <Sparkles className="w-3 h-3" />
        Daily Operational Briefing · {briefing.today}
      </div>
      <h2 className="font-display text-2xl md:text-3xl mb-4 tracking-tight">
        What to focus on today.
      </h2>
      <ul className="space-y-2.5">
        {briefing.list.map((line, i) => (
          <li key={i} className="flex gap-3 text-sm md:text-base text-foreground/85">
            <span aria-hidden className="mt-1.5 inline-block w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      {briefing.meta.total > 0 && (
        <div className="mt-5 flex flex-wrap gap-4 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground border-t border-accent/30 pt-4">
          <span>{briefing.meta.total} saved</span>
          <span>· {briefing.meta.fresh} fresh (7d)</span>
          <span>· {briefing.meta.stale} stale (30d+)</span>
          {briefing.meta.topTag && <span>· top theme: <span className="text-accent">{briefing.meta.topTag}</span></span>}
        </div>
      )}
    </section>
  );
}

// ---------- Unified PDF export (lazy-loads jsPDF) ----------
async function exportWorkspacePDF({ links, assets, annotations }: { links: SavedLink[]; assets: SavedAsset[]; annotations: Annotation[] }) {
  if (links.length === 0 && assets.length === 0 && annotations.length === 0) {
    toast.error("Workspace is empty — add a link, file, or highlight first.");
    return;
  }
  let jsPDFCtor: typeof import("jspdf").jsPDF;
  try {
    const mod = await import("jspdf");
    jsPDFCtor = mod.jsPDF ?? (mod as unknown as { default: typeof import("jspdf").jsPDF }).default;
  } catch (e) {
    console.error(e);
    toast.error("Could not load PDF engine. Check your connection and retry.");
    return;
  }
  const briefing = generateBriefing(links, assets, annotations);
  const doc = new jsPDFCtor({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 56;
  let y = 0;

  const drawHeader = () => {
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
  };
  const drawFooter = () => {
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text("thecsquarterly.com · Operator-grade Customer Success", M, H - 30);
    doc.text(`Page ${doc.getNumberOfPages()}`, W - M, H - 30, { align: "right" });
  };
  const ensureRoom = (need: number) => {
    if (y > H - 80 - need) {
      drawFooter();
      doc.addPage();
      drawHeader();
      y = 100;
    }
  };
  const sectionTitle = (label: string, eyebrow: string) => {
    ensureRoom(60);
    doc.setFont("courier", "bold");
    doc.setFontSize(9);
    doc.setTextColor(208, 106, 76);
    doc.text(eyebrow.toUpperCase(), M, y);
    y += 16;
    doc.setFont("times", "bold");
    doc.setFontSize(20);
    doc.setTextColor(20, 20, 20);
    doc.text(label, M, y);
    y += 12;
    doc.setDrawColor(208, 106, 76);
    doc.setLineWidth(1);
    doc.line(M, y, W - M, y);
    y += 20;
  };

  drawHeader();
  y = 110;
  doc.setTextColor(20, 20, 20);
  doc.setFont("times", "bold");
  doc.setFontSize(28);
  doc.text("Your margin.", M, y);
  y += 22;
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`${briefing.today.toUpperCase()} · ${links.length} LINKS · ${assets.length} ASSETS · ${annotations.length} ANNOTATIONS`, M, y);
  y += 28;

  sectionTitle("Daily Operational Briefing", "Section 01 · Briefing");
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  briefing.list.forEach((line) => {
    const wrapped = doc.splitTextToSize(`•  ${line}`, W - 2 * M);
    ensureRoom(wrapped.length * 14 + 6);
    doc.text(wrapped, M, y);
    y += wrapped.length * 14 + 6;
  });
  y += 10;

  if (links.length > 0) {
    sectionTitle("Saved Links", `Section 02 · ${links.length} items`);
    links.forEach((l) => {
      ensureRoom(40);
      doc.setFont("courier", "bold");
      doc.setFontSize(8);
      doc.setTextColor(208, 106, 76);
      doc.text(`${l.tag.toUpperCase()} · ${new Date(l.createdAt).toLocaleDateString()}`, M, y);
      y += 12;
      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      const t = doc.splitTextToSize(l.title, W - 2 * M);
      doc.text(t, M, y);
      y += t.length * 13;
      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);
      const u = doc.splitTextToSize(l.url, W - 2 * M);
      doc.text(u, M, y);
      y += u.length * 11 + 10;
    });
  }

  if (assets.length > 0) {
    sectionTitle("Saved Assets", `Section 03 · ${assets.length} items`);
    assets.forEach((a) => {
      ensureRoom(28);
      doc.setFont("courier", "bold");
      doc.setFontSize(8);
      doc.setTextColor(208, 106, 76);
      doc.text(`${a.tag.toUpperCase()} · ${(a.size / 1024).toFixed(1)} KB`, M, y);
      y += 12;
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      const n = doc.splitTextToSize(a.name, W - 2 * M);
      doc.text(n, M, y);
      y += n.length * 13 + 8;
    });
  }

  if (annotations.length > 0) {
    sectionTitle("Highlights & Annotations", `Section 04 · ${annotations.length} marks`);
    annotations.forEach((a) => {
      ensureRoom(50);
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
        ensureRoom(note.length * 13 + 8);
        doc.text(note, M, y);
        y += note.length * 13;
      }
      y += 10;
      doc.setDrawColor(230, 225, 215);
      doc.line(M, y - 4, W - M, y - 4);
      y += 8;
    });
  }

  drawFooter();
  doc.save(`csq-workspace-${new Date().toISOString().slice(0, 10)}.pdf`);
  toast.success("Workspace exported.");
}

// ---------- A. History ----------
function HistoryPanel({ query = "" }: { query?: string }) {
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
  const q = query.trim().toLowerCase();
  const enriched = (runs.data ?? []).map((r) => ({ run: r, ...resolveRun(r.node_id) }));
  const items = enriched.filter(({ run, heading, breadcrumb }) =>
    !q ||
    heading.toLowerCase().includes(q) ||
    breadcrumb.toLowerCase().includes(q) ||
    JSON.stringify(run.context).toLowerCase().includes(q),
  );
  if (items.length === 0) {
    return (
      <div className="border border-dashed border-border p-10 text-center">
        <p className="font-mono uppercase tracking-widest text-xs text-muted-foreground mb-2">No transcripts yet</p>
        <p className="text-foreground/70 mb-4">Run a diagnostic with Lumi to see it land here.</p>
        <Link to="/agent/framework" className="inline-block px-5 py-3 bg-foreground text-background font-mono uppercase tracking-widest text-xs">
          Open Lumi canvas →
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border border border-border">
      {items.map(({ run: r, heading, breadcrumb }) => {
        const isOpen = !!open[r.id];
        const ctxLine = pickContextLine(r.context);
        const accountName = typeof r.context?.account_name === "string" ? (r.context.account_name as string) : null;
        return (
          <li key={r.id}>
            <button
              onClick={() => setOpen((s) => ({ ...s, [r.id]: !s[r.id] }))}
              className="w-full text-left flex items-center gap-3 p-4 hover:bg-muted/30 min-h-[44px]"
            >
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <div className="flex-1 min-w-0">
                <div className="font-display text-base md:text-lg leading-tight truncate">
                  {heading}
                </div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">
                  {new Date(r.created_at).toLocaleString()}
                  {accountName ? <> · {accountName}</> : null}
                </div>
              </div>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 pl-11 space-y-3">
                {breadcrumb && (
                  <div>
                    <div className="font-mono uppercase tracking-widest text-[10px] text-muted-foreground mb-1">Path</div>
                    <div className="text-sm text-foreground/85">{breadcrumb}</div>
                  </div>
                )}
                {ctxLine && (
                  <div>
                    <div className="font-mono uppercase tracking-widest text-[10px] text-muted-foreground mb-1">Context</div>
                    <p className="text-sm text-foreground/80">{ctxLine}</p>
                  </div>
                )}
                <Link
                  to="/agent/response/$runId"
                  params={{ runId: r.id }}
                  className="inline-block mt-1 px-4 py-2 bg-foreground text-background font-mono uppercase tracking-widest text-[11px] hover:opacity-90"
                >
                  See full run →
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
function HighlightsPanel({
  query = "",
  annotations,
  links,
  assets,
  onExport,
}: { query?: string; annotations: Annotation[]; links: SavedLink[]; assets: SavedAsset[]; onExport: () => void }) {
  const qc = useQueryClient();
  const remove = useServerFn(deleteAnnotation);
  const q = query.trim().toLowerCase();
  const items = q
    ? annotations.filter((a) => a.text.toLowerCase().includes(q) || (a.note ?? "").toLowerCase().includes(q) || a.slug.toLowerCase().includes(q))
    : annotations;

  const onDelete = async (id: string) => {
    try {
      await remove({ data: { id } });
      qc.invalidateQueries({ queryKey: ["workspace-annotations"] });
    } catch (e) {
      toast.error("Could not remove highlight.");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <p className="font-mono uppercase tracking-widest text-xs text-muted-foreground">
          {items.length} entries across the site
        </p>
        <button
          onClick={onExport}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-foreground text-background font-mono uppercase tracking-widest text-xs hover:bg-accent transition-colors min-h-[44px]"
        >
          <Download className="w-3.5 h-3.5" /> Export to branded PDF
        </button>
      </div>

      {items.length === 0 ? (
        <div className="border border-dashed border-border p-10 text-center">
          <p className="text-foreground/70">Highlight any passage on a dispatch — it lands here, on every device you sign in from.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border border border-border">
          {items.map((a) => (
            <li key={a.id} className="p-4 flex gap-3">
              <span className={`mt-1.5 inline-block w-1.5 h-1.5 rounded-full shrink-0 ${a.kind === "highlight" ? "bg-secondary-accent" : "bg-accent"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 font-mono uppercase tracking-widest text-xs text-muted-foreground mb-1">
                  <span>{a.kind}</span>
                  <Link
                    to="/insights/$slug"
                    params={{ slug: a.slug }}
                    className="text-accent hover:underline truncate max-w-[50%]"
                  >
                    {a.slug}
                  </Link>
                  <span className="ml-auto opacity-60">{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm italic text-foreground/80 break-words">&ldquo;{a.text}&rdquo;</p>
                {a.note && <p className="mt-1.5 text-sm break-words">{a.note}</p>}
              </div>
              <button
                onClick={() => onDelete(a.id)}
                aria-label="Remove"
                className="text-muted-foreground hover:text-accent min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------- C. Ledger ----------
function LedgerPanel({
  query = "",
  links,
  assets,
}: { query?: string; links: SavedLink[]; assets: SavedAsset[] }) {
  const qc = useQueryClient();
  const create = useServerFn(createWorkspaceItem);
  const remove = useServerFn(deleteWorkspaceItem);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [drag, setDrag] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(HINT_KEY) === "1";
      if (!seen && links.length === 0 && assets.length === 0) setShowHint(true);
    } catch { /* */ }
  }, [links.length, assets.length]);

  const dismissHint = () => {
    setShowHint(false);
    try { localStorage.setItem(HINT_KEY, "1"); } catch { /* */ }
  };

  const addLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    const t = title.trim() || url.trim();
    const tag = autoTag(`${t} ${url}`);
    try {
      await create({ data: { kind: "link", title: t, url: url.trim(), tag, size_bytes: null, mime_type: null } });
      qc.invalidateQueries({ queryKey: ["workspace-items"] });
      setUrl(""); setTitle("");
      toast.success(`Saved under "${tag}"`);
      dismissHint();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save link.");
    }
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    let ok = 0;
    for (const f of Array.from(files)) {
      try {
        await create({
          data: {
            kind: "asset", title: f.name, url: null,
            size_bytes: f.size, mime_type: f.type || "file",
            tag: autoTag(f.name),
          },
        });
        ok++;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not save file.");
      }
    }
    if (ok) {
      qc.invalidateQueries({ queryKey: ["workspace-items"] });
      toast.success(`Added ${ok} asset${ok === 1 ? "" : "s"}`);
      dismissHint();
    }
  };

  const removeOne = async (id: string) => {
    try {
      await remove({ data: { id } });
      qc.invalidateQueries({ queryKey: ["workspace-items"] });
    } catch {
      toast.error("Could not remove item.");
    }
  };

  const tagGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fLinks = q ? links.filter((l) => l.title.toLowerCase().includes(q) || l.url.toLowerCase().includes(q) || l.tag.toLowerCase().includes(q)) : links;
    const fAssets = q ? assets.filter((a) => a.name.toLowerCase().includes(q) || a.tag.toLowerCase().includes(q)) : assets;
    const map = new Map<string, { links: SavedLink[]; assets: SavedAsset[] }>();
    fLinks.forEach((l) => {
      if (!map.has(l.tag)) map.set(l.tag, { links: [], assets: [] });
      map.get(l.tag)!.links.push(l);
    });
    fAssets.forEach((a) => {
      if (!map.has(a.tag)) map.set(a.tag, { links: [], assets: [] });
      map.get(a.tag)!.assets.push(a);
    });
    return [...map.entries()].sort((a, b) =>
      (b[1].links.length + b[1].assets.length) - (a[1].links.length + a[1].assets.length),
    );
  }, [links, assets, query]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <form onSubmit={addLink} className="border border-border p-4">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">
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
            className="mt-3 w-full min-h-[44px] py-3 bg-foreground text-background font-mono uppercase tracking-widest text-xs hover:bg-accent transition-colors"
          >
            Save to ledger
          </button>
        </form>

        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); void onFiles(e.dataTransfer.files); }}
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
            onChange={(e) => void onFiles(e.target.files)}
          />
          <Upload className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
          <div className="font-mono uppercase tracking-widest text-xs text-muted-foreground">
            Drop files or tap to upload
          </div>
          {showHint && (
            <div className="mt-3 inline-flex items-center gap-2 px-2 py-1 bg-accent text-accent-foreground font-mono uppercase tracking-widest text-xs">
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
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">
          <Tag className="w-3.5 h-3.5" /> Auto-organized
        </div>
        {tagGroups.length === 0 ? (
          <p className="text-foreground/60 text-sm">Nothing saved yet. Add a link or file to start.</p>
        ) : (
          <div className="space-y-4">
            {tagGroups.map(([tag, group]) => (
              <details key={tag} open className="border border-border">
                <summary className="cursor-pointer p-3 flex items-center justify-between font-mono text-xs uppercase tracking-widest min-h-[44px]">
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
                      <button onClick={() => removeOne(l.id)} aria-label="Remove" className="text-muted-foreground hover:text-accent min-h-[44px] min-w-[44px] flex items-center justify-center">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                  {group.assets.map((a) => (
                    <li key={a.id} className="p-3 flex items-start gap-3 text-sm">
                      <FolderOpen className="w-3.5 h-3.5 mt-1 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{a.name}</div>
                        <div className="font-mono uppercase tracking-widest text-xs text-muted-foreground">
                          {(a.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                      <button onClick={() => removeOne(a.id)} aria-label="Remove" className="text-muted-foreground hover:text-accent min-h-[44px] min-w-[44px] flex items-center justify-center">
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
