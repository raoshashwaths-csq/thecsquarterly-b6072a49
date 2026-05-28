import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { FileText, BookOpen, Sparkles, Bookmark, Highlighter } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { globalSearch, searchUserWorkspace, type SearchHit } from "@/lib/discovery.functions";
import { useAuth } from "@/hooks/useAuth";

function useDebounced<T>(value: T, ms = 180) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const debouncedQ = useDebounced(q, 180);
  const navigate = useNavigate();
  const search = useServerFn(globalSearch);
  const searchWs = useServerFn(searchUserWorkspace);
  const { user } = useAuth();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== "undefined" && /mac/i.test(navigator.platform);
      const meta = isMac ? e.metaKey : e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("csq:open-command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("csq:open-command-palette", onOpen);
    };
  }, [open]);

  const { data, isFetching } = useQuery({
    queryKey: ["global-search", debouncedQ],
    queryFn: () => search({ data: { q: debouncedQ } }),
    enabled: debouncedQ.trim().length > 0,
    staleTime: 30_000,
  });

  const { data: wsData } = useQuery({
    queryKey: ["workspace-search", debouncedQ, user?.id ?? null],
    queryFn: () => searchWs({ data: { q: debouncedQ } }),
    enabled: !!user && debouncedQ.trim().length > 0,
    staleTime: 30_000,
  });

  const hits: SearchHit[] = [...(wsData?.hits ?? []), ...(data?.hits ?? [])];
  const articles = hits.filter((h) => h.kind === "article");
  const playbooks = hits.filter((h) => h.kind === "playbook");
  const trees = hits.filter((h) => h.kind === "qtree");
  const workspace = hits.filter((h) => h.kind === "workspace");
  const annotations = hits.filter((h) => h.kind === "annotation");

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    if (href.startsWith("http")) {
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      navigate({ to: href });
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        value={q}
        onValueChange={setQ}
        placeholder={user ? "Search articles, playbooks, your Workspace…" : "Search articles, playbooks, Q operator trees…"}
      />
      <CommandList className="max-h-[60vh]">
        {debouncedQ.trim().length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-2">
              Command palette
            </div>
            <p className="font-display text-2xl mb-1">What are you looking for?</p>
            <p className="text-sm text-muted-foreground">
              Press <kbd className="font-mono text-xs border border-border px-1.5 py-0.5">⌘K</kbd> any time. Try
              <span className="italic"> "escalation"</span> or <span className="italic">"NRR"</span>.
            </p>
          </div>
        ) : isFetching && hits.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">Searching…</div>
        ) : hits.length === 0 ? (
          <CommandEmpty>No matches for "{debouncedQ}".</CommandEmpty>
        ) : (
          <>
            {workspace.length > 0 && (
              <CommandGroup heading="Your Workspace">
                {workspace.map((h) => (
                  <HitItem key={h.id} hit={h} icon={Bookmark} onSelect={() => go(h.href)} />
                ))}
              </CommandGroup>
            )}
            {annotations.length > 0 && (
              <CommandGroup heading="Your Highlights">
                {annotations.map((h) => (
                  <HitItem key={h.id} hit={h} icon={Highlighter} onSelect={() => go(h.href)} />
                ))}
              </CommandGroup>
            )}
            {articles.length > 0 && (
              <CommandGroup heading="Articles">
                {articles.map((h) => (
                  <HitItem key={h.id} hit={h} icon={FileText} onSelect={() => go(h.href)} />
                ))}
              </CommandGroup>
            )}
            {playbooks.length > 0 && (
              <CommandGroup heading="Codex Playbooks">
                {playbooks.map((h) => (
                  <HitItem key={h.id} hit={h} icon={BookOpen} onSelect={() => go(h.href)} />
                ))}
              </CommandGroup>
            )}
            {trees.length > 0 && (
              <CommandGroup heading="Q. Operator Trees">
                {trees.map((h) => (
                  <HitItem key={h.id} hit={h} icon={Sparkles} onSelect={() => go(h.href)} />
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

function HitItem({
  hit,
  icon: Icon,
  onSelect,
}: {
  hit: SearchHit;
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
}) {
  return (
    <CommandItem onSelect={onSelect} value={`${hit.title} ${hit.excerpt}`} className="flex items-start gap-3">
      <Icon className="h-4 w-4 mt-1 text-accent shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-display text-base truncate">{hit.title}</span>
          {hit.readMinutes !== undefined && (
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground shrink-0">
              {hit.readMinutes} {hit.kind === "playbook" ? "pp" : "min"}
            </span>
          )}
        </div>
        {hit.excerpt && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{hit.excerpt}</p>
        )}
      </div>
    </CommandItem>
  );
}
