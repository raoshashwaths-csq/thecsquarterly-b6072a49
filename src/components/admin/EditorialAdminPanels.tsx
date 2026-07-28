import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, RefreshCw } from "lucide-react";
import {
  listHomepageHeadlinesAdmin,
  upsertHomepageHeadline,
  listComicStripsAdmin,
  upsertComicStrip,
  deleteComicStrip,
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
                panels: [{ type: "illustration", bubbles: [] }],
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
  const [row, setRow] = useState<ComicStripAdminRow>(
    strip ?? {
      id: "",
      slug: "",
      title: "",
      tag: "",
      hoverText: "",
      sortOrder: 1,
      panels: [{ type: "illustration", bubbles: [] }],
      isPublished: true,
      updatedAt: "",
    },
  );

  function updatePanel(i: number, patch: Partial<StripPanel>) {
    setRow({ ...row, panels: row.panels.map((p, j) => (i === j ? { ...p, ...patch } : p)) });
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-background border border-border max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-auto">
        <div className="font-mono text-xs uppercase tracking-[0.25em] text-secondary-accent">
          {row.id ? "Edit strip" : "New strip"}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            className={inputCls}
            value={row.slug}
            onChange={(e) => setRow({ ...row, slug: e.target.value })}
            placeholder="slug (e.g. single-thread)"
          />
          <input
            className={inputCls}
            type="number"
            value={row.sortOrder}
            onChange={(e) => setRow({ ...row, sortOrder: Number(e.target.value) })}
            placeholder="sort order"
          />
        </div>
        <input
          className={inputCls}
          value={row.title}
          onChange={(e) => setRow({ ...row, title: e.target.value })}
          placeholder="Title"
        />
        <input
          className={inputCls}
          value={row.tag}
          onChange={(e) => setRow({ ...row, tag: e.target.value })}
          placeholder="TAG (uppercase)"
        />
        <textarea
          className={inputCls + " min-h-[60px]"}
          value={row.hoverText}
          onChange={(e) => setRow({ ...row, hoverText: e.target.value })}
          placeholder="Hover text / description"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={row.isPublished}
            onChange={(e) => setRow({ ...row, isPublished: e.target.checked })}
          />
          Published
        </label>

        <div className="border-t border-border pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-mono text-xs uppercase tracking-[0.25em]">Panels ({row.panels.length})</div>
            <button
              className="text-xs border border-border px-2 py-1 hover:bg-muted"
              onClick={() =>
                setRow({ ...row, panels: [...row.panels, { type: "illustration", bubbles: [] }] })
              }
              disabled={row.panels.length >= 6}
            >
              + panel
            </button>
          </div>
          {row.panels.map((p, i) => (
            <div key={i} className="border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Panel {i + 1}
                </div>
                <div className="flex gap-2">
                  <select
                    className="border border-border bg-background text-xs px-2 py-1"
                    value={p.type}
                    onChange={(e) => updatePanel(i, { type: e.target.value as StripPanel["type"] })}
                  >
                    <option value="illustration">illustration</option>
                    <option value="dialogue">dialogue</option>
                    <option value="single">single</option>
                  </select>
                  <button
                    className="border border-destructive text-destructive px-2 py-1 text-xs"
                    onClick={() => setRow({ ...row, panels: row.panels.filter((_, j) => j !== i) })}
                    disabled={row.panels.length <= 1}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <input
                className={inputCls}
                value={p.imageAlt ?? ""}
                onChange={(e) => updatePanel(i, { imageAlt: e.target.value })}
                placeholder="Image alt / description"
              />
              <textarea
                className={inputCls}
                value={p.stageDirection ?? ""}
                onChange={(e) => updatePanel(i, { stageDirection: e.target.value })}
                placeholder="Stage direction (optional)"
              />
              <div className="space-y-2">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Bubbles
                </div>
                {(p.bubbles ?? []).map((b, bi) => (
                  <div key={bi} className="flex gap-2">
                    <select
                      className="border border-border bg-background text-xs px-2"
                      value={b.character}
                      onChange={(e) => {
                        const bubbles = [...(p.bubbles ?? [])];
                        bubbles[bi] = { ...b, character: e.target.value as any };
                        updatePanel(i, { bubbles });
                      }}
                    >
                      <option value="FELIX">FELIX</option>
                      <option value="NORA">NORA</option>
                      <option value="BRENDAN">BRENDAN</option>
                    </select>
                    <input
                      className={inputCls}
                      value={b.text}
                      onChange={(e) => {
                        const bubbles = [...(p.bubbles ?? [])];
                        bubbles[bi] = { ...b, text: e.target.value };
                        updatePanel(i, { bubbles });
                      }}
                    />
                    <select
                      className="border border-border bg-background text-xs px-2"
                      value={b.position}
                      onChange={(e) => {
                        const bubbles = [...(p.bubbles ?? [])];
                        bubbles[bi] = { ...b, position: e.target.value as any };
                        updatePanel(i, { bubbles });
                      }}
                    >
                      <option value="top">top</option>
                      <option value="bottom">bottom</option>
                    </select>
                    <button
                      className="border border-border px-2"
                      onClick={() => {
                        const bubbles = (p.bubbles ?? []).filter((_, j) => j !== bi);
                        updatePanel(i, { bubbles });
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  className="text-xs border border-border px-2 py-1 hover:bg-muted"
                  onClick={() =>
                    updatePanel(i, {
                      bubbles: [
                        ...(p.bubbles ?? []),
                        { character: "FELIX", text: "", position: "top" },
                      ],
                    })
                  }
                >
                  + bubble
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button className="border border-border px-3 py-2 text-xs" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="border border-accent bg-accent text-accent-foreground px-3 py-2 text-xs"
            onClick={() => onSave(row)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
