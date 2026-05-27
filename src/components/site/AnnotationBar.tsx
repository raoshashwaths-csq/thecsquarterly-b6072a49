import { useEffect, useRef, useState } from "react";
import { Highlighter, MessageSquare, X } from "lucide-react";

type Annotation = {
  id: string;
  slug: string;
  kind: "highlight" | "note";
  text: string;
  note?: string;
  createdAt: number;
};

const KEY = (slug: string) => `csq.annotations.${slug}`;

export function loadAnnotations(slug: string): Annotation[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY(slug)) || "[]");
  } catch {
    return [];
  }
}

function saveAnnotations(slug: string, list: Annotation[]) {
  localStorage.setItem(KEY(slug), JSON.stringify(list));
}

export function AnnotationBar({ slug }: { slug: string }) {
  const [sel, setSel] = useState<{ text: string; x: number; y: number } | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [items, setItems] = useState<Annotation[]>([]);
  const pendingRef = useRef<string>("");

  useEffect(() => {
    setItems(loadAnnotations(slug));
  }, [slug]);

  useEffect(() => {
    const onUp = () => {
      const s = window.getSelection();
      const text = s?.toString().trim();
      if (!text || text.length < 3) {
        setSel(null);
        return;
      }
      const range = s!.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSel({
        text,
        x: rect.left + rect.width / 2 + window.scrollX,
        y: rect.top + window.scrollY - 12,
      });
    };
    document.addEventListener("mouseup", onUp);
    return () => document.removeEventListener("mouseup", onUp);
  }, []);

  const persist = (next: Annotation[]) => {
    setItems(next);
    saveAnnotations(slug, next);
  };

  const addHighlight = () => {
    if (!sel) return;
    persist([
      ...items,
      { id: crypto.randomUUID(), slug, kind: "highlight", text: sel.text, createdAt: Date.now() },
    ]);
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
    persist([
      ...items,
      {
        id: crypto.randomUUID(),
        slug,
        kind: "note",
        text: pendingRef.current,
        note: noteText.trim(),
        createdAt: Date.now(),
      },
    ]);
    setNoteText("");
    setNoteOpen(false);
  };

  const remove = (id: string) => persist(items.filter((a) => a.id !== id));

  return (
    <>
      {sel && (
        <div
          className="fixed z-50 -translate-x-1/2 -translate-y-full flex items-center gap-1 rounded-md border border-border bg-background shadow-lg px-1 py-1"
          style={{ left: sel.x, top: sel.y }}
        >
          <button
            onClick={addHighlight}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono uppercase tracking-wider hover:bg-accent/10 rounded"
          >
            <Highlighter className="w-3.5 h-3.5" /> Highlight
          </button>
          <button
            onClick={openNote}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono uppercase tracking-wider hover:bg-accent/10 rounded"
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
                className="text-xs font-mono uppercase tracking-wider px-3 py-2 text-muted-foreground"
              >
                Cancel
              </button>
              <button
                onClick={saveNote}
                className="text-xs font-mono uppercase tracking-wider px-3 py-2 bg-accent text-accent-foreground rounded"
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
            Your margin
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
                  onClick={() => remove(a.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-accent"
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
