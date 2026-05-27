import { useEffect, useRef, useState } from "react";
import { Highlighter, MessageSquare, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/useAuth";
import {
  listAnnotations,
  createAnnotation,
  deleteAnnotation,
  bulkImportWorkspace,
} from "@/lib/workspace.functions";

type Annotation = {
  id: string;
  slug: string;
  kind: "highlight" | "note";
  text: string;
  note?: string;
  createdAt: number;
};

const KEY = (slug: string) => `csq.annotations.${slug}`;
const MIGRATED_FLAG = "csq.annotations.migrated.v1";

/** Backwards-compatible reader for the PDF exporter — reads localStorage cache.
 *  Authed users hydrate this cache from the DB on workspace mount. */
export function loadAnnotations(slug: string): Annotation[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY(slug)) || "[]");
  } catch {
    return [];
  }
}

function saveLocal(slug: string, list: Annotation[]) {
  try { localStorage.setItem(KEY(slug), JSON.stringify(list)); } catch { /* */ }
}

export function AnnotationBar({ slug }: { slug: string }) {
  const { user } = useAuth();
  const fetchList = useServerFn(listAnnotations);
  const create = useServerFn(createAnnotation);
  const remove = useServerFn(deleteAnnotation);
  const bulkImport = useServerFn(bulkImportWorkspace);

  const [sel, setSel] = useState<{ text: string; x: number; y: number } | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [items, setItems] = useState<Annotation[]>([]);
  const pendingRef = useRef<string>("");

  // Hydrate: anon → localStorage; authed → DB (with one-time import of local).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        setItems(loadAnnotations(slug));
        return;
      }
      try {
        // One-time migration of any local annotations for this slug
        if (typeof window !== "undefined" && !localStorage.getItem(MIGRATED_FLAG)) {
          const local: Annotation[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (!k?.startsWith("csq.annotations.")) continue;
            try {
              const arr = JSON.parse(localStorage.getItem(k) || "[]") as Annotation[];
              if (Array.isArray(arr)) local.push(...arr);
            } catch { /* */ }
          }
          if (local.length) {
            await bulkImport({
              data: {
                annotations: local.slice(0, 500).map((a) => ({
                  slug: a.slug, kind: a.kind, text: a.text, note: a.note ?? null,
                })),
                items: [],
              },
            });
          }
          localStorage.setItem(MIGRATED_FLAG, "1");
        }
        const res = await fetchList({ data: { slug } });
        if (cancelled) return;
        const mapped: Annotation[] = (res.annotations ?? []).map((r) => ({
          id: r.id, slug: r.slug, kind: r.kind as "highlight" | "note",
          text: r.text, note: r.note ?? undefined, createdAt: new Date(r.created_at).getTime(),
        }));
        setItems(mapped);
        saveLocal(slug, mapped); // keep local cache in sync for PDF exporter
      } catch {
        setItems(loadAnnotations(slug));
      }
    })();
    return () => { cancelled = true; };
  }, [slug, user, fetchList, bulkImport]);

  useEffect(() => {
    const onUp = () => {
      const s = window.getSelection();
      const text = s?.toString().trim();
      if (!text || text.length < 3) { setSel(null); return; }
      const range = s!.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSel({
        text,
        x: rect.left + rect.width / 2 + window.scrollX,
        y: rect.top + window.scrollY - 12,
      });
    };
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchend", onUp);
    return () => {
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchend", onUp);
    };
  }, []);

  const persist = (next: Annotation[]) => {
    setItems(next);
    saveLocal(slug, next);
  };

  const addAnnotation = async (kind: "highlight" | "note", text: string, note?: string) => {
    const optimistic: Annotation = {
      id: crypto.randomUUID(), slug, kind, text, note, createdAt: Date.now(),
    };
    persist([...items, optimistic]);
    if (!user) return;
    try {
      const res = await create({ data: { slug, kind, text, note: note ?? null } });
      if (res?.annotation) {
        persist([
          ...items.filter((a) => a.id !== optimistic.id),
          {
            id: res.annotation.id, slug, kind, text,
            note: res.annotation.note ?? undefined,
            createdAt: new Date(res.annotation.created_at).getTime(),
          },
        ]);
      }
    } catch { /* keep optimistic; will reconcile on next hydrate */ }
  };

  const addHighlight = () => {
    if (!sel) return;
    void addAnnotation("highlight", sel.text);
    setSel(null);
    window.getSelection()?.removeAllRanges();
  };

  const openNote = () => {
    if (!sel) return;
    pendingRef.current = sel.text;
    setNoteOpen(true);
    setSel(null);
  };

  const saveNote = () => {
    if (!pendingRef.current || !noteText.trim()) return setNoteOpen(false);
    void addAnnotation("note", pendingRef.current, noteText.trim());
    setNoteText("");
    setNoteOpen(false);
  };

  const removeOne = async (id: string) => {
    persist(items.filter((a) => a.id !== id));
    if (user) {
      try { await remove({ data: { id } }); } catch { /* */ }
    }
  };

  return (
    <>
      {sel && (
        <div
          className="fixed z-50 -translate-x-1/2 -translate-y-full flex items-center gap-1 rounded-md border border-border bg-background shadow-lg px-1 py-1"
          style={{ left: sel.x, top: sel.y }}
        >
          <button
            onClick={addHighlight}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono uppercase tracking-wider hover:bg-accent/10 rounded min-h-[44px]"
          >
            <Highlighter className="w-3.5 h-3.5" /> Highlight
          </button>
          <button
            onClick={openNote}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono uppercase tracking-wider hover:bg-accent/10 rounded min-h-[44px]"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Note
          </button>
        </div>
      )}

      {noteOpen && (
        <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-lg max-w-lg w-full p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
              Private note
            </p>
            <blockquote className="border-l-2 border-accent pl-3 text-sm italic text-muted-foreground mb-4">
              {pendingRef.current}
            </blockquote>
            <textarea
              autoFocus
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              placeholder="Your thinking, only visible to you."
              className="w-full bg-transparent border border-border rounded p-3 text-sm font-body resize-none focus:outline-none focus:border-accent"
            />
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setNoteOpen(false)}
                className="text-xs font-mono uppercase tracking-wider px-3 py-2 text-muted-foreground min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={saveNote}
                className="text-xs font-mono uppercase tracking-wider px-3 py-2 bg-accent text-accent-foreground rounded min-h-[44px]"
              >
                Save note
              </button>
            </div>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <aside className="mt-16 border-t border-border pt-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-6">
            Your margin {user ? "· synced" : "· local only — sign in to sync"}
          </p>
          <ul className="space-y-5">
            {items.map((a) => (
              <li key={a.id} className="group flex gap-3 items-start">
                <span
                  className={`mt-1.5 inline-block w-1.5 h-1.5 rounded-full ${
                    a.kind === "highlight" ? "bg-secondary-accent" : "bg-accent"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm italic text-muted-foreground">&ldquo;{a.text}&rdquo;</p>
                  {a.note && <p className="mt-1 text-sm">{a.note}</p>}
                </div>
                <button
                  onClick={() => removeOne(a.id)}
                  className="md:opacity-0 md:group-hover:opacity-100 text-muted-foreground hover:text-accent min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </>
  );
}
