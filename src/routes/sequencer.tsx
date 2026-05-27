import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { GripVertical, Save, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Reveal } from "@/components/site/Reveal";
import { listMySequences, saveSequence } from "@/lib/enterprise.functions";
import { listPosts } from "@/lib/posts.functions";

export const Route = createFileRoute("/sequencer")({
  head: () => ({
    meta: [
      { title: "Reading Sequencer, The CS Quarterly" },
      {
        name: "description",
        content: "Drag essays into the order your team should read them. Save as a sequence.",
      },
      { property: "og:title", content: "Reading Sequencer" },
      {
        property: "og:description",
        content: "Curate ordered reading paths through The CS Quarterly archive.",
      },
    ],
    links: [{ rel: "canonical", href: "/sequencer" }],
  }),
  component: SequencerPage,
});

type Item = { slug: string; title: string };

function SequencerPage() {
  const fetchSeqs = useServerFn(listMySequences);
  const fetchPosts = useServerFn(listPosts);
  const save = useServerFn(saveSequence);
  const qc = useQueryClient();

  const { data: posts } = useQuery({ queryKey: ["posts"], queryFn: () => fetchPosts() });
  const { data: seqs } = useQuery({ queryKey: ["mySequences"], queryFn: () => fetchSeqs() });

  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const mut = useMutation({
    mutationFn: () => save({ data: { name: name || "Untitled sequence", items } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mySequences"] });
    },
  });

  const add = (p: any) => {
    if (items.find((i) => i.slug === p.slug)) return;
    setItems([...items, { slug: p.slug, title: p.title }]);
  };

  const remove = (slug: string) => setItems(items.filter((i) => i.slug !== slug));

  const onDragStart = (i: number) => setDragIndex(i);
  const onDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === i) return;
    const next = [...items];
    const [m] = next.splice(dragIndex, 1);
    next.splice(i, 0, m);
    setDragIndex(i);
    setItems(next);
  };
  const onDragEnd = () => setDragIndex(null);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-6 py-16 max-w-6xl">
        <Reveal>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-6">
            Sequencer
          </p>
          <h1 className="font-display text-5xl md:text-6xl tracking-tight leading-[0.95]">
            Build a reading path.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            Drag essays into order. Hand the sequence to a new hire, an executive sponsor, or your
            team during onboarding.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-10 mt-12">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-4">
              Archive
            </p>
            <ul className="space-y-1 max-h-[520px] overflow-y-auto border border-border rounded">
              {(posts ?? []).map((p: any) => (
                <li key={p.slug}>
                  <button
                    onClick={() => add(p)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent/10 border-b border-border last:border-0"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mr-2">
                      {p.category}
                    </span>
                    {p.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sequence name"
                className="flex-1 bg-transparent border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
              />
              <button
                onClick={() => mut.mutate()}
                disabled={mut.isPending || items.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono uppercase tracking-wider bg-foreground text-background rounded disabled:opacity-40"
              >
                <Save className="w-3.5 h-3.5" /> Save
              </button>
            </div>

            <ol className="space-y-2 min-h-[200px]">
              {items.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  Click essays on the left to add them, then drag to reorder.
                </p>
              )}
              {items.map((it, i) => (
                <li
                  key={it.slug}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragOver={(e) => onDragOver(e, i)}
                  onDragEnd={onDragEnd}
                  className="flex items-center gap-3 border border-border rounded px-3 py-2 bg-background cursor-move hover:border-accent"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono text-[10px] text-secondary-accent w-6">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-sm truncate">{it.title}</span>
                  <button onClick={() => remove(it.slug)} className="text-muted-foreground hover:text-accent">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ol>

            {seqs && seqs.length > 0 && (
              <div className="mt-10">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
                  Saved
                </p>
                <ul className="space-y-1">
                  {seqs.map((s: any) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between border-b border-border py-2 text-sm"
                    >
                      <span>{s.name}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {(s.items as any[]).length} essays
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
