import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Pencil,
  RefreshCw,
  Check,
  X,
  Image as ImageIcon,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  listHomepageHeadlinesAdmin,
  upsertHomepageHeadline,
  listComicStripsAdmin,
  upsertComicStrip,
  deleteComicStrip,
  uploadPanelImage,
  parseStripContext,
  listStripsWithPlacements,
  confirmPlacement,
  deletePlacement,
  updatePlacementNote,
  type ComicStripAdminRow,
} from "@/lib/admin-content.functions";
import type { HeadlineSet } from "@/data/homepageHeadlines";
import type { StripPanel } from "@/data/strips";

const inputCls =
  "w-full border border-border bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:border-accent";
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ───────────── Homepage headlines ───────────── */

export function HomepageHeadlinesAdmin() {
  const qc = useQueryClient();
  const list = useServerFn(listHomepageHeadlinesAdmin);
  const upsert = useServerFn(upsertHomepageHeadline);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "headlines"],
    queryFn: () => list(),
  });
  const [editing, setEditing] = useState<HeadlineSet | null>(null);

  async function save(patch: HeadlineSet) {
    try {
      await upsert({
        data: {
          dayIndex: patch.dayIndex,
          slug: patch.id,
          phrases: patch.phrases as string[],
          line1: patch.line1,
          line2: patch.line2,
          fullText: patch.fullText,
        },
      });
      toast.success(`Saved ${DAY_NAMES[patch.dayIndex]}`);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin", "headlines"] });
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-secondary-accent">
            Editorial · Homepage
          </div>
          <h2 className="font-display text-3xl mt-2">Homepage headlines</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Seven headline sets, one per day (UTC). Morphs on the marketing home.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 border border-border px-3 py-2 text-xs font-mono uppercase tracking-[0.2em] hover:bg-muted"
          onClick={() => refetch()}
        >
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 font-mono uppercase text-[10px] tracking-[0.2em]">
              <tr>
                <th className="text-left px-3 py-2 w-16">Day</th>
                <th className="text-left px-3 py-2">Full text</th>
                <th className="text-left px-3 py-2 w-24">Phrases</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((h) => (
                <tr key={h.dayIndex} className="border-t border-border align-top">
                  <td className="px-3 py-3 font-mono text-xs">{DAY_NAMES[h.dayIndex]}</td>
                  <td className="px-3 py-3">{h.fullText}</td>
                  <td className="px-3 py-3 font-mono text-xs">{h.phrases.length}</td>
                  <td className="px-3 py-3 text-right">
                    <button
                      className="inline-flex items-center gap-1 border border-border px-2 py-1 text-xs hover:bg-muted"
                      onClick={() => setEditing(h)}
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && <HeadlineEditor headline={editing} onCancel={() => setEditing(null)} onSave={save} />}
    </section>
  );
}

function HeadlineEditor({
  headline,
  onCancel,
  onSave,
}: {
  headline: HeadlineSet;
  onCancel: () => void;
  onSave: (h: HeadlineSet) => void;
}) {
  const [phrases, setPhrases] = useState<string[]>([...headline.phrases]);
  const [line1, setLine1] = useState(headline.line1);
  const [line2, setLine2] = useState(headline.line2);
  const [fullText, setFullText] = useState(headline.fullText);
  const [slug, setSlug] = useState(headline.id);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-background border border-border max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-auto">
        <div className="font-mono text-xs uppercase tracking-[0.25em] text-secondary-accent">
          Edit · {DAY_NAMES[headline.dayIndex]}
        </div>
        <input className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug" />
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Phrases</div>
          {phrases.map((p, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={inputCls}
                value={p}
                onChange={(e) => {
                  const next = [...phrases];
                  next[i] = e.target.value;
                  setPhrases(next);
                }}
              />
              <button
                className="border border-border px-2 hover:bg-muted"
                onClick={() => setPhrases(phrases.filter((_, j) => j !== i))}
                disabled={phrases.length <= 2}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            className="text-xs font-mono uppercase tracking-[0.2em] border border-border px-2 py-1 hover:bg-muted"
            onClick={() => setPhrases([...phrases, ""])}
            disabled={phrases.length >= 6}
          >
            + phrase
          </button>
        </div>
        <input className={inputCls} value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="line1" />
        <input className={inputCls} value={line2} onChange={(e) => setLine2(e.target.value)} placeholder="line2" />
        <textarea
          className={inputCls + " min-h-[80px]"}
          value={fullText}
          onChange={(e) => setFullText(e.target.value)}
          placeholder="full text"
        />
        <div className="flex justify-end gap-2 pt-2">
          <button className="border border-border px-3 py-2 text-xs" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="border border-accent bg-accent text-accent-foreground px-3 py-2 text-xs"
            onClick={() =>
              onSave({
                ...headline,
                id: slug,
                phrases: phrases as HeadlineSet["phrases"],
                line1,
                line2,
                fullText,
              })
            }
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
/* ─── Helpers ───────────── */

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ───────────── Comic strips ───────────── */

export function ComicStripsAdmin() {
  const qc = useQueryClient();
  const list = useServerFn(listComicStripsAdmin);
  const upsert = useServerFn(upsertComicStrip);
  const del = useServerFn(deleteComicStrip);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "strips"],
    queryFn: () => list(),
  });
  const [editing, setEditing] = useState<ComicStripAdminRow | "new" | null>(null);

  async function save(row: ComicStripAdminRow) {
    try {
      await upsert({
        data: {
          id: row.id || undefined,
          slug: row.slug,
          title: row.title,
          tag: row.tag,
          hoverText: row.hoverText,
          sortOrder: row.sortOrder,
          isPublished: row.isPublished,
          panels: row.panels,
        },
      });
      toast.success("Saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin", "strips"] });
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this strip?")) return;
    try {
      await del({ data: { id } });
      toast.success("Deleted");
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-secondary-accent">
            Editorial · Comics
          </div>
          <h2 className="font-display text-3xl mt-2">Felix &amp; Nora strips</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Live on <code>/strip</code>. Sort order controls display sequence.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex items-center gap-2 border border-border px-3 py-2 text-xs font-mono uppercase tracking-[0.2em] hover:bg-muted"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
          <button
            className="inline-flex items-center gap-2 border border-accent bg-accent text-accent-foreground px-3 py-2 text-xs font-mono uppercase tracking-[0.2em]"
            onClick={() =>
              setEditing({
                id: "",
                slug: "",
                title: "",
                tag: "",
                hoverText: "",
                sortOrder: (data?.length ?? 0) + 1,
                panels: [{ type: "illustration", imageUrl: "", imageAlt: "" }],
                isPublished: true,
                updatedAt: "",
              })
            }
          >
            <Plus className="h-3 w-3" /> New strip
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 font-mono uppercase text-[10px] tracking-[0.2em]">
              <tr>
                <th className="text-left px-3 py-2 w-16">Order</th>
                <th className="text-left px-3 py-2">Title</th>
                <th className="text-left px-3 py-2">Tag</th>
                <th className="text-left px-3 py-2 w-20">Panels</th>
                <th className="text-left px-3 py-2 w-24">Status</th>
                <th className="w-40"></th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-3 py-3 font-mono">{s.sortOrder}</td>
                  <td className="px-3 py-3">{s.title}</td>
                  <td className="px-3 py-3 font-mono text-xs uppercase tracking-[0.15em]">{s.tag}</td>
                  <td className="px-3 py-3 font-mono text-xs">{s.panels.length}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-block text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 border ${
                        s.isPublished ? "border-emerald-500 text-emerald-500" : "border-border text-muted-foreground"
                      }`}
                    >
                      {s.isPublished ? "Live" : "Draft"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right space-x-2">
                    <button
                      className="inline-flex items-center gap-1 border border-border px-2 py-1 text-xs hover:bg-muted"
                      onClick={() => setEditing(s)}
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                    <button
                      className="inline-flex items-center gap-1 border border-destructive text-destructive px-2 py-1 text-xs hover:bg-destructive/10"
                      onClick={() => remove(s.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {!data?.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No strips yet. Create one to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <StripEditor
          strip={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}
    </section>
  );
}

function StripEditor({
  strip,
  onCancel,
  onSave,
}: {
  strip: ComicStripAdminRow | null;
  onCancel: () => void;
  onSave: (row: ComicStripAdminRow) => void;
}) {
  const upload = useServerFn(uploadPanelImage);
  const parseCtx = useServerFn(parseStripContext);
  const [row, setRow] = useState<ComicStripAdminRow>(
    strip ?? {
      id: "",
      slug: "",
      title: "",
      tag: "",
      hoverText: "",
      sortOrder: 1,
      panels: [{ type: "illustration", imageUrl: "", imageAlt: "" }],
      isPublished: true,
      updatedAt: "",
    },
  );
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function updatePanel(i: number, patch: Partial<StripPanel>) {
    setRow({
      ...row,
      panels: row.panels.map((p, j) => (i === j ? { ...p, ...patch } : p)),
    });
  }

  async function handleFileUpload(file: File, panelIndex: number) {
    try {
      toast.loading("Uploading…");
      const base64 = await fileToBase64(file);
      const { publicUrl } = await upload({
        data: { fileBase64: base64, fileName: file.name, contentType: file.type },
      });
      updatePanel(panelIndex, { imageUrl: publicUrl });
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    }
  }

  /**
   * Analyzes uploaded panel images with AI to generate improved alt texts
   * and placement suggestions. Requires the strip to be saved first (has UUID).
   */
  async function handleAiUpload(panelIndex: number) {
    // Must have a saved strip (UUID) to analyze
    if (!row.id) {
      toast.error("Save the strip first before analyzing with AI");
      return;
    }
    // Must have at least one panel image uploaded
    const panel = row.panels[panelIndex];
    if (!panel.imageUrl) {
      toast.error("Upload a panel image first");
      return;
    }
    try {
      toast.loading("Analyzing panels with AI…");
      const result = await parseCtx({
        data: {
          stripId: row.id,
          panels: row.panels.map((p) => ({
            imageUrl: p.imageUrl,
            imageAlt: p.imageAlt ?? "",
          })),
        },
      });
      if (result && typeof result === "object") {
        // Update alt texts from AI analysis
        if (
          "altTexts" in result &&
          Array.isArray((result as { altTexts: string[] }).altTexts)
        ) {
          (result as { altTexts: string[] }).altTexts.forEach((alt, i) => {
            if (alt && row.panels[i]) updatePanel(i, { imageAlt: alt });
          });
        }
        toast.success("Analysis complete — alt texts updated");
      } else {
        toast.error("No analysis returned from AI");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI analysis failed");
    }
  }

  function addPanel() {
    setRow({
      ...row,
      panels: [
        ...row.panels,
        { type: "illustration", imageUrl: "", imageAlt: "" },
      ],
    });
  }

  function removePanel(i: number) {
    if (row.panels.length <= 1) return;
    setRow({ ...row, panels: row.panels.filter((_, j) => j !== i) });
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-background border border-border max-w-5xl w-full p-6 max-h-[90vh] overflow-auto space-y-4">
        <div className="font-mono text-xs uppercase tracking-[0.25em] text-secondary-accent">
          {row.id ? "Edit strip" : "New strip"}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column — fields */}
          <div className="space-y-3">
            <input
              className={inputCls}
              value={row.slug}
              onChange={(e) => setRow({ ...row, slug: e.target.value })}
              placeholder="slug (e.g. single-thread)"
            />
            <input
              className={inputCls}
              value={row.title}
              onChange={(e) => setRow({ ...row, title: e.target.value })}
              placeholder="Title"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                className={inputCls}
                type="number"
                value={row.sortOrder}
                onChange={(e) =>
                  setRow({ ...row, sortOrder: Number(e.target.value) })
                }
                placeholder="Sort order"
              />
              <input
                className={inputCls}
                value={row.tag}
                onChange={(e) => setRow({ ...row, tag: e.target.value })}
                placeholder="TAG (uppercase)"
              />
            </div>
            <textarea
              className={inputCls + " min-h-[60px]"}
              value={row.hoverText}
              onChange={(e) =>
                setRow({ ...row, hoverText: e.target.value })
              }
              placeholder="Hover text / description"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={row.isPublished}
                onChange={(e) =>
                  setRow({ ...row, isPublished: e.target.checked })
                }
              />
              Published
            </label>
          </div>

          {/* Right column — panels */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-mono text-xs uppercase tracking-[0.25em]">
                Panels ({row.panels.length})
              </div>
              <button
                className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-[0.2em] border border-border px-2 py-1 hover:bg-muted"
                onClick={addPanel}
                disabled={row.panels.length >= 6}
              >
                <Plus className="h-3 w-3" /> Add panel
              </button>
            </div>

            {row.panels.map((p, i) => (
              <div key={i} className="border border-border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Panel {i + 1}
                  </span>
                  <button
                    className="inline-flex items-center gap-1 border border-destructive text-destructive px-2 py-1 text-[10px] font-mono uppercase tracking-[0.15em] hover:bg-destructive/10"
                    onClick={() => removePanel(i)}
                    disabled={row.panels.length <= 1}
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>

                {/* Image preview */}
                <div className="aspect-[4/3] border border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.imageAlt || ""}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                  )}
                </div>

                {/* Alt text */}
                <textarea
                  className={inputCls + " min-h-[50px]"}
                  value={p.imageAlt ?? ""}
                  onChange={(e) =>
                    updatePanel(i, { imageAlt: e.target.value })
                  }
                  placeholder="Image alt text"
                />

                {/* Upload buttons */}
                <div className="flex gap-2">
                  <button
                    className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-[0.15em] border border-border px-2 py-1 hover:bg-muted flex-1 justify-center"
                    onClick={() => fileInputRefs.current[i]?.click()}
                  >
                    <Upload className="h-3 w-3" /> Upload
                  </button>
                  <input
                    type="file"
                    ref={(el) => {
                      fileInputRefs.current[i] = el;
                    }}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, i);
                      e.target.value = "";
                    }}
                  />
                  <button
                    className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-[0.15em] border border-border px-2 py-1 hover:bg-muted flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => handleAiUpload(i)}
                    disabled={!row.id || !p.imageUrl}
                    title={
                      !row.id
                        ? "Save the strip first"
                        : !p.imageUrl
                        ? "Upload an image first"
                        : "Analyze panel with AI for alt text and placement suggestions"
                    }
                  >
                    <Sparkles className="h-3 w-3" /> Analyze with AI
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <button
            className="border border-border px-3 py-2 text-xs font-mono uppercase tracking-[0.2em] hover:bg-muted"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="border border-accent bg-accent text-accent-foreground px-3 py-2 text-xs font-mono uppercase tracking-[0.2em]"
            onClick={() => onSave(row)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
/* ───────────── Placement Review ───────────── */

export function PlacementReviewPanel() {
  const qc = useQueryClient();
  const list = useServerFn(listStripsWithPlacements);
  const confirmPl = useServerFn(confirmPlacement);
  const rejectPl = useServerFn(deletePlacement);
  const updateNote = useServerFn(updatePlacementNote);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "placements"],
    queryFn: () => list(),
  });

  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  async function handleConfirm(id: string) {
    try {
      await confirmPl({ data: { id } });
      toast.success("Placement confirmed");
      qc.invalidateQueries({ queryKey: ["admin", "placements"] });
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Confirm failed");
    }
  }

  async function handleReject(id: string) {
    if (!confirm("Delete this placement?")) return;
    try {
      await rejectPl({ data: { id } });
      toast.success("Placement removed");
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Remove failed");
    }
  }

  async function handleSaveNote(id: string) {
    try {
      await updateNote({ data: { id, note: noteDraft } });
      toast.success("Note saved");
      setEditingNote(null);
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  /* Flatten strips + placements into table rows */
  const rows = (data ?? []).flatMap((s) =>
    s.placements.map((p) => ({
      ...p,
      stripTitle: s.title,
      stripTag: s.tag,
    })),
  );

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-secondary-accent">
            Editorial · Placements
          </div>
          <h2 className="font-display text-3xl mt-2">Strip placements</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review AI-suggested and manual strip placements across the site.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 border border-border px-3 py-2 text-xs font-mono uppercase tracking-[0.2em] hover:bg-muted"
          onClick={() => refetch()}
        >
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : !rows.length ? (
        <div className="border border-border p-6 text-center text-sm text-muted-foreground">
          No placements yet.
        </div>
      ) : (
        <div className="border border-border overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 font-mono uppercase text-[10px] tracking-[0.2em]">
              <tr>
                <th className="text-left px-3 py-2">Strip</th>
                <th className="text-left px-3 py-2">Target</th>
                <th className="text-left px-3 py-2">Position</th>
                <th className="text-left px-3 py-2">Source</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Note</th>
                <th className="w-48"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="px-3 py-3">
                    <div className="font-medium">{r.stripTitle}</div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                      {r.stripTag}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-mono text-xs">{r.target_type}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.target_slug}
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">
                    {r.placement}
                  </td>
                  <td className="px-3 py-3">
                    {r.ai_suggested ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/30">
                        AI · {Math.round((r.confidence ?? 0) * 100)}%
                      </span>
                    ) : (
                      <span className="inline-block text-[10px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 border border-border text-muted-foreground">
                        Manual
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {r.confirmed ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                        <Check className="h-3 w-3" /> Confirmed
                      </span>
                    ) : (
                      <span className="inline-block text-[10px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 border border-border text-muted-foreground">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {editingNote === r.id ? (
                      <div className="space-y-1">
                        <textarea
                          className={inputCls + " min-h-[50px] text-xs"}
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder="Admin note…"
                        />
                        <div className="flex gap-1">
                          <button
                            className="text-[10px] font-mono uppercase tracking-[0.15em] border border-border px-2 py-0.5 hover:bg-muted"
                            onClick={() => setEditingNote(null)}
                          >
                            Cancel
                          </button>
                          <button
                            className="text-[10px] font-mono uppercase tracking-[0.15em] border border-accent bg-accent text-accent-foreground px-2 py-0.5"
                            onClick={() => handleSaveNote(r.id)}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="text-xs text-muted-foreground cursor-pointer hover:text-foreground"
                        onClick={() => {
                          setEditingNote(r.id);
                          setNoteDraft(r.admin_note ?? "");
                        }}
                      >
                        {r.admin_note || (
                          <span className="italic text-muted-foreground/50">
                            Add note…
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      {!r.confirmed && (
                        <button
                          className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.15em] border border-emerald-500 text-emerald-500 px-2 py-1 hover:bg-emerald-500/10"
                          onClick={() => handleConfirm(r.id)}
                        >
                          <Check className="h-3 w-3" /> Confirm
                        </button>
                      )}
                      <button
                        className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.15em] border border-destructive text-destructive px-2 py-1 hover:bg-destructive/10"
                        onClick={() => handleReject(r.id)}
                      >
                        <X className="h-3 w-3" /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
