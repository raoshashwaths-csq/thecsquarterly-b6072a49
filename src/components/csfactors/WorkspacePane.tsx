import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, ExternalLink, FileText, Highlighter, Link as LinkIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { listAnnotations, listWorkspaceItems } from "@/lib/workspace.functions";
import { Link } from "@tanstack/react-router";

export function WorkspacePane({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [q, setQ] = useState("");
  const fetchAnnotations = useServerFn(listAnnotations);
  const fetchItems = useServerFn(listWorkspaceItems);

  const annotations = useQuery({
    queryKey: ["workspace-annotations"],
    queryFn: () => fetchAnnotations(),
    enabled: open,
  });
  const items = useQuery({
    queryKey: ["workspace-items"],
    queryFn: () => fetchItems(),
    enabled: open,
  });

  const needle = q.trim().toLowerCase();
  const matches = (s: string | null | undefined) => !needle || (s ?? "").toLowerCase().includes(needle);

  const notes = useMemo(
    () => (annotations.data?.annotations ?? []).filter((a) => a.kind === "note" && (matches(a.text) || matches(a.note))),
    [annotations.data, needle],
  );
  const highlights = useMemo(
    () => (annotations.data?.annotations ?? []).filter((a) => a.kind === "highlight" && (matches(a.text) || matches(a.note))),
    [annotations.data, needle],
  );
  const urls = useMemo(
    () => (items.data?.items ?? []).filter((i) => i.kind === "link" && (matches(i.title) || matches(i.url))),
    [items.data, needle],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-background border-l border-border">
        <SheetHeader className="px-5 py-4 border-b border-border">
          <SheetTitle className="font-display text-lg tracking-tight">Workspace</SheetTitle>
          <SheetDescription className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Notes · Highlights · Links
          </SheetDescription>
          <div className="relative pt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/4 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search your workspace…"
              className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border focus:border-accent outline-none"
            />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          <Section icon={<FileText className="h-3 w-3" />} label={`Notes (${notes.length})`}>
            {notes.length === 0 ? <Empty /> : notes.slice(0, 50).map((n) => (
              <div key={n.id} className="border-b border-border/60 pb-3">
                <div className="text-sm leading-snug">{n.text}</div>
                {n.note ? <div className="text-xs text-muted-foreground mt-1">{n.note}</div> : null}
                <div className="font-mono uppercase tracking-widest text-xs text-muted-foreground/70 mt-1">
                  /{n.slug}
                </div>
              </div>
            ))}
          </Section>

          <Section icon={<Highlighter className="h-3 w-3" />} label={`Highlights (${highlights.length})`}>
            {highlights.length === 0 ? <Empty /> : highlights.slice(0, 50).map((h) => (
              <div key={h.id} className="border-b border-border/60 pb-3">
                <div className="text-sm leading-snug italic">"{h.text}"</div>
                <div className="font-mono uppercase tracking-widest text-xs text-muted-foreground/70 mt-1">
                  /{h.slug}
                </div>
              </div>
            ))}
          </Section>

          <Section icon={<LinkIcon className="h-3 w-3" />} label={`Links (${urls.length})`}>
            {urls.length === 0 ? <Empty /> : urls.slice(0, 100).map((u) => (
              <a
                key={u.id}
                href={u.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start justify-between gap-2 border-b border-border/60 pb-3 hover:text-accent"
              >
                <div className="min-w-0">
                  <div className="text-sm truncate">{u.title}</div>
                  {u.url ? <div className="font-mono text-xs text-muted-foreground truncate">{u.url}</div> : null}
                </div>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-60 group-hover:opacity-100" />
              </a>
            ))}
          </Section>
        </div>

        <div className="border-t border-border px-5 py-3">
          <Link
            to="/account/workspace"
            className="font-mono text-xs uppercase tracking-[0.22em] text-foreground/70 hover:text-accent"
            onClick={() => onOpenChange(false)}
          >
            Open full workspace →
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.22em] text-accent font-semibold mb-3">
        {icon} {label}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Empty() {
  return <p className="text-xs text-muted-foreground italic">Nothing here yet.</p>;
}
