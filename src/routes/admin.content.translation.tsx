import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Download, Plus, MoreHorizontal, AlertTriangle } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useAuth } from "@/hooks/useAuth";
import { getMe } from "@/lib/auth.functions";
import {
  listGlossary, upsertGlossaryTerm, deleteGlossaryTerm, markGlossaryConfirmed,
} from "@/lib/translation-glossary.functions";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/admin/content/translation")({
  head: () => ({ meta: [{ title: "Translation Glossary · Admin" }, { name: "robots", content: "noindex" }] }),
  component: TranslationGlossaryAdmin,
});

const LANGS = ["ar", "id", "vi", "th"] as const;
type Lang = (typeof LANGS)[number];

type Row = {
  id: string;
  term: string;
  protection_type: "never_translate" | "fixed_translation";
  category: "brand" | "metric" | "feature_name" | "role" | "jargon" | null;
  fixed_translations: Record<string, string> | null;
  notes: string | null;
  pending_review: boolean;
};

type CategoryFilter = "all" | "brand" | "metric" | "feature_name" | "role" | "jargon";
type ProtFilter = "all" | "never_translate" | "fixed_translation";
type StatusFilter = "all" | "pending" | "confirmed";

function TranslationGlossaryAdmin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const fetchMe = useServerFn(getMe);
  const fetchList = useServerFn(listGlossary);
  const upsertFn = useServerFn(upsertGlossaryTerm);
  const deleteFn = useServerFn(deleteGlossaryTerm);
  const confirmFn = useServerFn(markGlossaryConfirmed);
  const qc = useQueryClient();

  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe(), enabled: !!user });
  const glossary = useQuery({
    queryKey: ["translation-glossary"],
    queryFn: () => fetchList(),
    enabled: !!me.data?.isAdmin,
  });

  const [catFilter, setCatFilter] = useState<CategoryFilter>("all");
  const [protFilter, setProtFilter] = useState<ProtFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editing, setEditing] = useState<Partial<Row> | null>(null);

  if (!loading && !user) {
    navigate({ to: "/login" });
    return null;
  }
  if (me.data && !me.data.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center px-6 py-20 text-center">
          <div>
            <div className="font-mono uppercase tracking-widest text-xs text-accent mb-3">Restricted</div>
            <h1 className="font-display text-4xl mb-4">Editorial access only.</h1>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const rows: Row[] = (glossary.data ?? []) as Row[];

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (catFilter !== "all" && r.category !== catFilter) return false;
      if (protFilter !== "all" && r.protection_type !== protFilter) return false;
      if (statusFilter === "pending" && !r.pending_review) return false;
      if (statusFilter === "confirmed" && r.pending_review) return false;
      return true;
    });
  }, [rows, catFilter, protFilter, statusFilter]);

  const total = rows.length;
  const neverCount = rows.filter((r) => r.protection_type === "never_translate").length;
  const fixedCount = rows.filter((r) => r.protection_type === "fixed_translation").length;
  const pendingCount = rows.filter((r) => r.pending_review).length;

  const onSave = async (draft: Partial<Row>) => {
    try {
      await upsertFn({
        data: {
          id: draft.id,
          term: draft.term ?? "",
          protection_type: (draft.protection_type ?? "never_translate") as "never_translate" | "fixed_translation",
          category: draft.category ?? null,
          fixed_translations: (draft.fixed_translations ?? {}) as Record<string, string>,
          notes: draft.notes ?? null,
          pending_review: draft.pending_review ?? false,
        },
      });
      toast.success("Term saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["translation-glossary"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this term?")) return;
    try {
      await deleteFn({ data: { id } });
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["translation-glossary"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const onConfirm = async (id: string) => {
    try {
      await confirmFn({ data: { id } });
      qc.invalidateQueries({ queryKey: ["translation-glossary"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const onExport = () => {
    const pending = rows.filter((r) => r.pending_review);
    const date = new Date().toISOString().slice(0, 10);
    const lines: string[] = [];
    lines.push(`CS QUARTERLY TRANSLATION REVIEW — ${date}`);
    lines.push("");
    lines.push("INSTRUCTIONS: Please provide the most natural business-register translation for each term below. These terms appear constantly in B2B SaaS customer success content. Do not translate literally — translate for meaning and professional register.");
    lines.push("");
    for (const r of pending) {
      lines.push(`TERM: ${r.term}`);
      lines.push(`CONTEXT: ${r.notes ?? ""}`);
      lines.push("ARABIC TRANSLATION: ");
      lines.push("BAHASA INDONESIA TRANSLATION: ");
      lines.push("VIETNAMESE TRANSLATION: ");
      lines.push("THAI TRANSLATION: ");
      lines.push("");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `csq-translation-review-${date}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-[1400px] mx-auto px-6 py-10 w-full">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-accent mb-6"
        >
          <ArrowLeft size={14} /> Admin
        </Link>

        <div className="mb-6 flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1 className="font-display text-4xl font-bold mb-2">TRANSLATION GLOSSARY</h1>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              PROTECTED TERMS AND FIXED TRANSLATIONS — SEEDS THE CLAUDE TRANSLATION SYSTEM
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onExport}
              disabled={pendingCount === 0}
              className="inline-flex items-center gap-2 px-3 py-2 border border-border text-xs font-mono uppercase tracking-widest hover:border-accent hover:text-accent transition-colors disabled:opacity-40"
            >
              <Download size={14} /> Export for reviewer →
            </button>
            <button
              onClick={() => setEditing({ protection_type: "never_translate", fixed_translations: {} })}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground text-xs font-mono uppercase tracking-widest hover:bg-accent/90"
            >
              <Plus size={14} /> Add term
            </button>
          </div>
        </div>

        {/* Metric strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border mb-6">
          <MetricBox label="Total terms" value={total} />
          <MetricBox label="Never translate" value={neverCount} />
          <MetricBox label="Fixed translations" value={fixedCount} />
          <MetricBox label="Pending review" value={pendingCount} danger={pendingCount > 0} />
        </div>

        {/* Pending alert */}
        {pendingCount > 0 && (
          <div className="mb-6 border-l-[3px] border-destructive bg-destructive/5 px-5 py-4">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-destructive flex items-center gap-2 mb-2">
              <AlertTriangle size={14} /> {pendingCount} terms pending native speaker review
            </div>
            <p className="text-sm text-foreground/75 leading-relaxed max-w-3xl">
              These terms are marked <code className="font-mono text-xs">[PENDING NATIVE REVIEW]</code> in the fixed_translations field. Before running any article translations, confirm these with a native-speaker reviewer for each target language. The Champion, Health Score, Renewal, Escalation, Multi-threading, and Churn terms are highest priority.
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <FilterGroup
            options={[
              ["all", "All"],
              ["brand", "Brand"],
              ["metric", "Metric"],
              ["feature_name", "Feature"],
              ["role", "Role"],
              ["jargon", "Jargon"],
            ]}
            value={catFilter}
            onChange={(v) => setCatFilter(v as CategoryFilter)}
          />
          <FilterGroup
            options={[
              ["all", "All"],
              ["never_translate", "Never translate"],
              ["fixed_translation", "Fixed translation"],
            ]}
            value={protFilter}
            onChange={(v) => setProtFilter(v as ProtFilter)}
          />
          <FilterGroup
            options={[
              ["all", "All"],
              ["pending", "Pending review"],
              ["confirmed", "Confirmed"],
            ]}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as StatusFilter)}
          />
        </div>

        {/* Table */}
        <div className="border border-border overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <th className="px-4 py-3">Term</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Protection</th>
                {LANGS.map((l) => (
                  <th key={l} className="px-3 py-3 text-center">{l.toUpperCase()}</th>
                ))}
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {glossary.isLoading && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground font-mono text-xs uppercase tracking-widest">Loading…</td></tr>
              )}
              {!glossary.isLoading && filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground font-mono text-xs">No terms.</td></tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20">
                  <td className={`px-4 py-3 font-mono text-[13px] ${r.protection_type === "never_translate" ? "font-bold" : ""}`}>
                    {r.term}
                  </td>
                  <td className="px-3 py-3">
                    {r.category ? (
                      <span className="inline-block px-2 py-1 border border-border bg-muted/40 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {r.category.replace("_", " ")}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-3">
                    {r.protection_type === "never_translate" ? (
                      <span className="inline-block px-2 py-1 border border-accent/40 bg-accent/10 text-accent font-mono text-[10px] uppercase tracking-widest">
                        Never translate
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 border border-secondary-accent/40 bg-secondary-accent/10 text-secondary-accent font-mono text-[10px] uppercase tracking-widest">
                        Fixed translation
                      </span>
                    )}
                  </td>
                  {LANGS.map((l) => (
                    <td key={l} className="px-3 py-3 text-center font-mono text-[11px]">
                      <LangCell row={r} lang={l} />
                    </td>
                  ))}
                  <td className="px-3 py-3 font-mono text-[10px] uppercase tracking-widest">
                    {r.pending_review ? (
                      <span className="text-destructive">◉ Pending</span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">✓ Confirmed</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-1 hover:text-accent">
                        <MoreHorizontal size={16} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditing(r)}>Edit</DropdownMenuItem>
                        {r.pending_review && (
                          <DropdownMenuItem onClick={() => onConfirm(r.id)}>Mark confirmed</DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive" onClick={() => onDelete(r.id)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <SiteFooter />

      <EditModal
        draft={editing}
        onClose={() => setEditing(null)}
        onSave={onSave}
      />
    </div>
  );
}

function MetricBox({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="bg-card px-5 py-4">
      <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground mb-2">{label}</div>
      <div className={`font-display text-3xl font-bold ${danger ? "text-destructive" : "text-accent"}`}>{value}</div>
    </div>
  );
}

function FilterGroup<T extends string>({ options, value, onChange }: {
  options: [T, string][]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-px bg-border border border-border">
      {options.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
            value === v
              ? "bg-accent text-accent-foreground"
              : "bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function LangCell({ row, lang }: { row: Row; lang: Lang }) {
  if (row.protection_type === "never_translate") {
    return <span className="text-muted-foreground/50">—</span>;
  }
  const val = row.fixed_translations?.[lang] ?? "";
  if (!val || val === "[PENDING NATIVE REVIEW]") {
    return <span className="text-destructive">Pending</span>;
  }
  if (val === row.term) {
    return <span className="text-emerald-600 dark:text-emerald-400">{val}</span>;
  }
  return <span className="text-foreground">{val}</span>;
}

function EditModal({ draft, onClose, onSave }: {
  draft: Partial<Row> | null;
  onClose: () => void;
  onSave: (d: Partial<Row>) => void;
}) {
  const [local, setLocal] = useState<Partial<Row> | null>(null);

  // Sync when draft changes
  if (draft && local?.id !== draft.id) {
    setLocal({
      ...draft,
      fixed_translations: draft.fixed_translations ?? {},
      protection_type: draft.protection_type ?? "never_translate",
    });
  }

  if (!draft || !local) {
    return (
      <Dialog open={!!draft} onOpenChange={(o) => { if (!o) { onClose(); setLocal(null); } }}>
        <DialogContent />
      </Dialog>
    );
  }

  const isFixed = local.protection_type === "fixed_translation";
  const updateLang = (l: Lang, v: string) =>
    setLocal({ ...local, fixed_translations: { ...(local.fixed_translations ?? {}), [l]: v } });

  return (
    <Dialog open onOpenChange={(o) => { if (!o) { onClose(); setLocal(null); } }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {local.id ? "Edit glossary term" : "Add glossary term"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Term *">
            <input
              className="w-full bg-card border border-border px-3 py-2 font-mono text-sm"
              value={local.term ?? ""}
              onChange={(e) => setLocal({ ...local, term: e.target.value })}
            />
          </Field>

          <Field label="Category *">
            <select
              className="w-full bg-card border border-border px-3 py-2 font-mono text-sm"
              value={local.category ?? ""}
              onChange={(e) => setLocal({ ...local, category: (e.target.value || null) as Row["category"] })}
            >
              <option value="">—</option>
              <option value="brand">brand</option>
              <option value="metric">metric</option>
              <option value="feature_name">feature_name</option>
              <option value="role">role</option>
              <option value="jargon">jargon</option>
            </select>
          </Field>

          <Field label="Protection type *">
            <div className="grid grid-cols-2 gap-2">
              {(["never_translate", "fixed_translation"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setLocal({ ...local, protection_type: p })}
                  className={`px-3 py-3 border font-mono text-[11px] uppercase tracking-widest transition-colors ${
                    local.protection_type === p
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-card border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.replace("_", " ")}
                </button>
              ))}
            </div>
          </Field>

          {isFixed && (
            <div className="grid grid-cols-2 gap-3">
              {LANGS.map((l) => (
                <Field key={l} label={`${l.toUpperCase()} translation`}>
                  <input
                    className="w-full bg-card border border-border px-3 py-2 font-mono text-sm"
                    placeholder="[PENDING NATIVE REVIEW]"
                    value={local.fixed_translations?.[l] ?? ""}
                    onChange={(e) => updateLang(l, e.target.value)}
                  />
                </Field>
              ))}
            </div>
          )}

          <Field label="Notes">
            <textarea
              className="w-full bg-card border border-border px-3 py-2 text-sm min-h-[80px]"
              placeholder="Internal notes for translators..."
              value={local.notes ?? ""}
              onChange={(e) => setLocal({ ...local, notes: e.target.value })}
            />
          </Field>

          <label className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={!!local.pending_review}
              onChange={(e) => setLocal({ ...local, pending_review: e.target.checked })}
            />
            Flag for native speaker review
          </label>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={() => { onClose(); setLocal(null); }}
            className="px-4 py-2 border border-border font-mono text-[11px] uppercase tracking-widest hover:text-accent"
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(local); setLocal(null); }}
            className="px-4 py-2 bg-accent text-accent-foreground font-mono text-[11px] uppercase tracking-widest hover:bg-accent/90"
          >
            Save term →
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent mb-2">{label}</div>
      {children}
    </div>
  );
}
