import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { RefreshCw, Plus, Trash2, Pencil } from "lucide-react";
import {
  listLumiKnowledge, getLumiKnowledgeCounts,
  createLumiKnowledge, updateLumiKnowledge, deleteLumiKnowledge,
  getLumiFeedbackRollup, listLumiFeedback,
  getTranslationQueueStatus, getScheduledJobHealth,
} from "@/lib/admin-lumi.functions";
import { TREES } from "@/lib/q-trees";

const CONTENT_TYPES = [
  "principle", "data_point", "framework", "case_study", "heuristic",
  "article_insight", "benchmark_data", "external_intelligence", "interaction_pattern",
];
const LANGUAGES = ["en", "ar", "id", "th", "tl", "vi"];

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="border border-border p-5">
      <div className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">{label}</div>
      <div className="font-display text-4xl leading-none">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-2">{hint}</div>}
    </div>
  );
}

const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleString() : "—");
const inputCls = "w-full border border-border bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent";

// ─── 1a + 1c. Lumi Knowledge ─────────────────────────────────────────

type KnowledgeRow = {
  id: string;
  content: string;
  content_type: string;
  language: string;
  tree_relevance: string[];
  topic_tags: string[];
  source_title: string | null;
  source_type: string;
  is_active: boolean;
  confidence_level: string | null;
  created_at: string;
};

export function LumiKnowledgeAdmin() {
  const qc = useQueryClient();
  const listFn = useServerFn(listLumiKnowledge);
  const countsFn = useServerFn(getLumiKnowledgeCounts);
  const queueFn = useServerFn(getTranslationQueueStatus);
  const createFn = useServerFn(createLumiKnowledge);
  const updateFn = useServerFn(updateLumiKnowledge);
  const deleteFn = useServerFn(deleteLumiKnowledge);

  const [contentType, setContentType] = useState("");
  const [tree, setTree] = useState("");
  const [language, setLanguage] = useState("");
  const [editing, setEditing] = useState<KnowledgeRow | "new" | null>(null);

  const counts = useQuery({ queryKey: ["admin-lumi-counts"], queryFn: () => countsFn() });
  const queue = useQuery({ queryKey: ["admin-lumi-queue"], queryFn: () => queueFn() });
  const list = useQuery({
    queryKey: ["admin-lumi-knowledge", contentType, tree, language],
    queryFn: () => listFn({ data: { contentType: contentType || undefined, tree: tree || undefined, language: language || undefined, limit: 100, offset: 0 } }),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-lumi-counts"] });
    qc.invalidateQueries({ queryKey: ["admin-lumi-knowledge"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-2">Portfolio-wide brain</div>
          <h2 className="font-display text-4xl">Lumi Knowledge Base</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Every record here gets injected into Lumi's operator prompts. Ingested from published articles + benchmarks; manual records also allowed.
          </p>
        </div>
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background font-mono uppercase tracking-widest text-xs hover:bg-foreground/90"
        >
          <Plus className="h-3.5 w-3.5" /> Add record
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total records" value={counts.data?.total ?? "—"} hint={counts.data ? `${counts.data.active} active` : undefined} />
        <StatCard label="Languages" value={Object.keys(counts.data?.byLang ?? {}).length || 0} />
        <StatCard label="Content types" value={Object.keys(counts.data?.byType ?? {}).length || 0} />
        <StatCard label="Translation queue" value={queue.data?.total ?? 0} hint="pending + completed" />
      </div>

      <div className="border border-border p-4 flex gap-3 flex-wrap items-center">
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Filter</span>
        <select value={contentType} onChange={(e) => setContentType(e.target.value)} className={`${inputCls} w-auto`}>
          <option value="">All types</option>
          {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={tree} onChange={(e) => setTree(e.target.value)} className={`${inputCls} w-auto`}>
          <option value="">All trees</option>
          {TREES.map((t) => <option key={t.id} value={t.id}>{t.id} · {t.title}</option>)}
        </select>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className={`${inputCls} w-auto`}>
          <option value="">All languages</option>
          {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <button onClick={() => list.refetch()} className="ml-auto inline-flex items-center gap-2 px-3 py-2 border border-border text-xs font-mono uppercase tracking-widest hover:bg-muted/40">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Translation queue matrix */}
      {queue.data && Object.keys(queue.data.matrix).length > 0 && (
        <div className="border border-border p-4">
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">Translation queue</div>
          <table className="text-sm">
            <thead><tr><th className="text-left pr-6 font-mono text-xs uppercase text-muted-foreground">Language</th><th className="pr-6 font-mono text-xs uppercase text-muted-foreground">Pending</th><th className="pr-6 font-mono text-xs uppercase text-muted-foreground">Processing</th><th className="pr-6 font-mono text-xs uppercase text-muted-foreground">Done</th><th className="pr-6 font-mono text-xs uppercase text-muted-foreground">Error</th></tr></thead>
            <tbody>
              {Object.entries(queue.data.matrix).map(([lang, s]) => (
                <tr key={lang}><td className="pr-6 py-1 font-mono">{lang}</td><td className="pr-6">{s.pending ?? 0}</td><td className="pr-6">{s.processing ?? 0}</td><td className="pr-6">{s.done ?? 0}</td><td className="pr-6 text-destructive">{s.error ?? 0}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border border-border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              {["Content", "Type", "Trees", "Lang", "Source", "Created", ""].map((h) => (
                <th key={h} className="text-left font-mono uppercase tracking-widest text-xs text-muted-foreground px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(list.data ?? []).map((r) => (
              <tr key={r.id} className="hover:bg-muted/20">
                <td className="px-4 py-3 max-w-md">
                  <div className="line-clamp-2 text-sm">{r.content}</div>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{r.content_type}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(r.tree_relevance ?? []).map((t) => (
                      <span key={t} className="border border-border px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-widest">{t}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{r.language}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[160px]">{r.source_title ?? r.source_type}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => setEditing(r as KnowledgeRow)} className="p-1.5 border border-border hover:bg-muted/40" aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                    <button
                      onClick={async () => {
                        if (!confirm("Delete this knowledge record?")) return;
                        try { await deleteFn({ data: { id: r.id } }); toast.success("Deleted."); invalidate(); }
                        catch (e) { toast.error((e as Error).message); }
                      }}
                      className="p-1.5 border border-destructive text-destructive hover:bg-destructive/10"
                      aria-label="Delete"
                    ><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {list.data && list.data.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                {counts.data?.total === 0 ? "0 records — the knowledge base is empty. Add manual records or wait for the article ingestion pipeline to populate it." : "No records match your filters."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <KnowledgeEditor
          value={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            try {
              if (editing === "new") await createFn({ data: patch as any });
              else await updateFn({ data: { id: (editing as KnowledgeRow).id, patch: patch as any } });
              toast.success("Saved.");
              setEditing(null);
              invalidate();
            } catch (e) { toast.error((e as Error).message); }
          }}
        />
      )}
    </div>
  );
}

function KnowledgeEditor({ value, onClose, onSave }: {
  value: KnowledgeRow | null;
  onClose: () => void;
  onSave: (patch: Partial<KnowledgeRow>) => Promise<void>;
}) {
  const [content, setContent] = useState(value?.content ?? "");
  const [contentType, setContentType] = useState(value?.content_type ?? "principle");
  const [language, setLanguage] = useState(value?.language ?? "en");
  const [treesSel, setTreesSel] = useState<string[]>(value?.tree_relevance ?? []);
  const [tagsRaw, setTagsRaw] = useState((value?.topic_tags ?? []).join(", "));
  const [confidence, setConfidence] = useState(value?.confidence_level ?? "");
  const [sourceTitle, setSourceTitle] = useState(value?.source_title ?? "");
  const [saving, setSaving] = useState(false);

  const toggleTree = (id: string) =>
    setTreesSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="fixed inset-0 bg-foreground/70 z-50 flex items-start sm:items-center justify-center p-0 sm:p-6 overflow-y-auto">
      <div className="bg-background border border-border w-full max-w-2xl my-0 sm:my-8 max-h-[100dvh] sm:max-h-[calc(100dvh-4rem)] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border sticky top-0 bg-background z-10">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent">{value ? "Editing" : "New record"}</div>
            <div className="font-display text-2xl">Lumi knowledge</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-2xl leading-none px-2 text-muted-foreground hover:text-foreground">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Content</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} className={`${inputCls} mt-1`} placeholder="1–3 concrete, self-contained sentences." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Type</label>
              <select value={contentType} onChange={(e) => setContentType(e.target.value)} className={`${inputCls} mt-1`}>
                {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className={`${inputCls} mt-1`}>
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Confidence</label>
              <select value={confidence} onChange={(e) => setConfidence(e.target.value)} className={`${inputCls} mt-1`}>
                <option value="">—</option><option value="high">high</option><option value="medium">medium</option><option value="low">low</option>
              </select>
            </div>
          </div>
          <div>
            <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Trees</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {TREES.map((t) => {
                const on = treesSel.includes(t.id);
                return (
                  <button key={t.id} type="button" onClick={() => toggleTree(t.id)} className={`px-2 py-1 border text-[11px] font-mono uppercase tracking-widest ${on ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:text-foreground"}`}>
                    {t.id}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Topic tags</label>
            <input value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder="stakeholder, escalation, board" className={`${inputCls} mt-1`} />
          </div>
          <div>
            <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Source title (optional)</label>
            <input value={sourceTitle} onChange={(e) => setSourceTitle(e.target.value)} className={`${inputCls} mt-1`} />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border sticky bottom-0 bg-background z-10">
          <button onClick={onClose} className="px-4 py-2 border border-border font-mono uppercase tracking-widest text-xs">Cancel</button>
          <button
            disabled={saving || content.trim().length < 10}
            onClick={async () => {
              setSaving(true);
              const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
              await onSave({
                content: content.trim(),
                content_type: contentType,
                language,
                tree_relevance: treesSel,
                topic_tags: tags,
                confidence_level: (confidence || null) as any,
                source_title: sourceTitle || null,
              } as any);
              setSaving(false);
            }}
            className="px-4 py-2 bg-foreground text-background font-mono uppercase tracking-widest text-xs disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 1b. Lumi Feedback ───────────────────────────────────────────────

export function LumiFeedbackAdmin() {
  const rollupFn = useServerFn(getLumiFeedbackRollup);
  const listFn = useServerFn(listLumiFeedback);
  const [negOnly, setNegOnly] = useState(false);

  const rollup = useQuery({ queryKey: ["admin-lumi-rollup"], queryFn: () => rollupFn() });
  const list = useQuery({
    queryKey: ["admin-lumi-feedback", negOnly],
    queryFn: () => listFn({ data: { negativeOnly: negOnly, limit: 100 } }),
  });

  const byTree = useMemo(() => {
    const entries = Object.entries(rollup.data?.byTree ?? {}).sort(
      (a, b) => (b[1].up + b[1].down) - (a[1].up + a[1].down),
    );
    return entries;
  }, [rollup.data]);

  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-2">Model calibration</div>
        <h2 className="font-display text-4xl">Lumi Feedback</h2>
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        <StatCard label="Total ratings" value={rollup.data?.total ?? 0} />
        <StatCard label="Positive" value={`${rollup.data?.pctPositive ?? 0}%`} hint={`${rollup.data?.up ?? 0} 👍`} />
        <StatCard label="Negative" value={`${(rollup.data ? 100 - rollup.data.pctPositive : 0)}%`} hint={`${rollup.data?.down ?? 0} 👎`} />
        <StatCard label="Trees rated" value={byTree.length} />
      </div>

      {byTree.length > 0 && (
        <div className="border border-border p-4">
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">By tree</div>
          <div className="space-y-2">
            {byTree.map(([tree, s]) => {
              const total = s.up + s.down;
              const pct = total ? Math.round((s.up / total) * 100) : 0;
              return (
                <div key={tree} className="flex items-center gap-3 text-sm">
                  <div className="w-16 font-mono text-xs">{tree}</div>
                  <div className="flex-1 h-2 bg-muted overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-24 text-right font-mono text-xs text-muted-foreground">{pct}% · {total}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={negOnly} onChange={(e) => setNegOnly(e.target.checked)} className="accent-accent" />
          Show negatives only
        </label>
        <button onClick={() => { list.refetch(); rollup.refetch(); }} className="ml-auto inline-flex items-center gap-2 px-3 py-2 border border-border text-xs font-mono uppercase tracking-widest hover:bg-muted/40">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      <div className="border border-border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>{["Rating", "Tree", "Prompt", "Note", "Run", "When"].map((h) => (
              <th key={h} className="text-left font-mono uppercase tracking-widest text-xs text-muted-foreground px-4 py-3">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(list.data ?? []).map((r) => (
              <tr key={r.id} className="hover:bg-muted/20">
                <td className="px-4 py-3">
                  <span className={r.rating === "up" ? "text-accent" : "text-destructive"}>{r.rating === "up" ? "👍" : "👎"}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{r.tree_id ?? "—"}</td>
                <td className="px-4 py-3 max-w-sm text-xs text-muted-foreground line-clamp-2">{r.prompt_snippet || "—"}</td>
                <td className="px-4 py-3 text-xs max-w-xs line-clamp-2">{r.note ?? "—"}</td>
                <td className="px-4 py-3">
                  {r.run_id ? (
                    <Link to="/q/response/$runId" params={{ runId: r.run_id }} className="font-mono text-xs text-accent hover:underline">
                      open →
                    </Link>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(r.created_at)}</td>
              </tr>
            ))}
            {list.data && list.data.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">No feedback recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 1d. System jobs ────────────────────────────────────────────────

export function SystemJobsAdmin() {
  const fn = useServerFn(getScheduledJobHealth);
  const q = useQuery({ queryKey: ["admin-system-jobs"], queryFn: () => fn(), refetchInterval: 30_000 });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-2">Operational health</div>
          <h2 className="font-display text-4xl">System Jobs</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">Read-only view of scheduled pg_cron jobs and their most recent run.</p>
        </div>
        <button onClick={() => q.refetch()} className="inline-flex items-center gap-2 px-3 py-2 border border-border text-xs font-mono uppercase tracking-widest hover:bg-muted/40">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      <div className="border border-border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>{["Job", "Schedule", "Active", "Last run", "Status", "Message"].map((h) => (
              <th key={h} className="text-left font-mono uppercase tracking-widest text-xs text-muted-foreground px-4 py-3">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(q.data ?? []).map((j) => {
              const status = j.last_status ?? "—";
              const isFail = status === "failed";
              const isOK = status === "succeeded";
              return (
                <tr key={j.jobname} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs">{j.jobname}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{j.schedule}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block h-2 w-2 rounded-full ${j.active ? "bg-accent" : "bg-muted-foreground"}`} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(j.last_start)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 border ${isFail ? "border-destructive text-destructive" : isOK ? "border-accent text-accent" : "border-border text-muted-foreground"}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-md truncate" title={j.last_message ?? ""}>{j.last_message ?? "—"}</td>
                </tr>
              );
            })}
            {q.data && q.data.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">No scheduled jobs registered.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
