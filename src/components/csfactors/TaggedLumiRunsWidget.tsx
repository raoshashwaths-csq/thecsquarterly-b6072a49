import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Compass, Users, Filter } from "lucide-react";
import { listMyTaggedLumiRuns } from "@/lib/q-agent.functions";
import {
  TREES,
  CATEGORY_COLOR,
  getNode,
  getTree,
  type TreeCategory,
  type TreeId,
} from "@/lib/q-trees";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  nodeId: string;
  accountId: string | null;
  accountName: string | null;
  stakeholder: string | null;
  taggedAt: string | null;
  createdAt: string;
};

type Enriched = Row & {
  treeId: TreeId | null;
  treeTitle: string;
  treeCategory: TreeCategory | null;
};

const CATEGORY_ORDER: TreeCategory[] = ["core", "ops", "shared", "leadership"];

function enrich(r: Row): Enriched {
  const node = getNode(r.nodeId);
  const tree = node ? getTree(node.treeId) : undefined;
  return {
    ...r,
    treeId: node?.treeId ?? null,
    treeTitle: tree?.title ?? "Ad-hoc Lumi chat",
    treeCategory: tree?.category ?? null,
  };
}

// The CSFactors widget that summarizes the operator's tagged Lumi runs by
// stakeholder and tree, with tier-style quick filters for each tree category.
export function TaggedLumiRunsWidget() {
  const listFn = useServerFn(listMyTaggedLumiRuns);
  const { data, isLoading } = useQuery({
    queryKey: ["tagged-lumi-runs"],
    queryFn: () => listFn(),
  });

  const [categoryFilter, setCategoryFilter] = useState<TreeCategory | "all">("all");
  const [treeFilter, setTreeFilter] = useState<TreeId | "all">("all");
  const [stakeholderFilter, setStakeholderFilter] = useState<string>("all");

  const all = useMemo<Enriched[]>(
    () => (data?.runs ?? []).map(enrich),
    [data?.runs],
  );

  const filtered = useMemo(() => {
    return all.filter((r) => {
      if (categoryFilter !== "all" && r.treeCategory !== categoryFilter) return false;
      if (treeFilter !== "all" && r.treeId !== treeFilter) return false;
      if (stakeholderFilter !== "all" && (r.stakeholder ?? "Unassigned") !== stakeholderFilter) return false;
      return true;
    });
  }, [all, categoryFilter, treeFilter, stakeholderFilter]);

  // Group rollups for the body.
  const byStakeholder = useMemo(() => {
    const m = new Map<string, Enriched[]>();
    for (const r of filtered) {
      const k = r.stakeholder?.trim() || "Unassigned";
      const arr = m.get(k) ?? [];
      arr.push(r);
      m.set(k, arr);
    }
    return Array.from(m.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  const byTree = useMemo(() => {
    const m = new Map<string, { tree: Enriched; count: number }>();
    for (const r of filtered) {
      const k = r.treeId ?? "OTHER";
      const cur = m.get(k);
      if (cur) cur.count += 1;
      else m.set(k, { tree: r, count: 1 });
    }
    return Array.from(m.values()).sort((a, b) => b.count - a.count);
  }, [filtered]);

  const stakeholderOptions = useMemo(() => {
    const s = new Set<string>();
    for (const r of all) s.add(r.stakeholder?.trim() || "Unassigned");
    return Array.from(s).sort();
  }, [all]);

  const treesInCategory = useMemo(() => {
    if (categoryFilter === "all") return TREES;
    return TREES.filter((t) => t.category === categoryFilter);
  }, [categoryFilter]);

  return (
    <section
      data-testid="tagged-lumi-runs-widget"
      className="border border-border bg-card p-5 md:p-6"
    >
      <header className="flex flex-wrap items-center gap-3 mb-4">
        <Compass className="h-4 w-4 text-secondary-accent" />
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-secondary-accent">
            Tagged Lumi runs
          </div>
          <h3 className="font-display text-xl tracking-tight">
            Your reasoning, indexed by stakeholder & tree
          </h3>
        </div>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/60">
          {filtered.length} of {all.length} run{all.length === 1 ? "" : "s"}
        </span>
      </header>

      {/* Category tier filters */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Filter className="h-3 w-3 text-foreground/50" />
        <FilterChip
          active={categoryFilter === "all"}
          onClick={() => {
            setCategoryFilter("all");
            setTreeFilter("all");
          }}
          label="All tiers"
        />
        {CATEGORY_ORDER.map((cat) => (
          <FilterChip
            key={cat}
            active={categoryFilter === cat}
            onClick={() => {
              setCategoryFilter(cat);
              setTreeFilter("all");
            }}
            label={CATEGORY_COLOR[cat].label}
            dotColor={CATEGORY_COLOR[cat].hex}
          />
        ))}
      </div>

      {/* Tree filters (limited to current tier) */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/50">
          Tree
        </span>
        <FilterChip
          active={treeFilter === "all"}
          onClick={() => setTreeFilter("all")}
          label="Any"
        />
        {treesInCategory.map((t) => (
          <FilterChip
            key={t.id}
            active={treeFilter === t.id}
            onClick={() => setTreeFilter(t.id)}
            label={`${t.id} · ${t.title}`}
            dotColor={CATEGORY_COLOR[t.category].hex}
          />
        ))}
      </div>

      {/* Stakeholder filter */}
      {stakeholderOptions.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/50">
            Stakeholder
          </span>
          <FilterChip
            active={stakeholderFilter === "all"}
            onClick={() => setStakeholderFilter("all")}
            label="Any"
          />
          {stakeholderOptions.map((s) => (
            <FilterChip
              key={s}
              active={stakeholderFilter === s}
              onClick={() => setStakeholderFilter(s)}
              label={s}
            />
          ))}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-foreground/60 py-4">Loading your tagged runs…</p>
      ) : all.length === 0 ? (
        <div className="border border-dashed border-border p-6 text-center">
          <p className="text-sm text-foreground/70 mb-3">
            No tagged Lumi runs yet. Run Lumi from the operator canvas and tag the result to one of your accounts.
          </p>
          <Link
            to="/agent/framework"
            className="font-mono text-[11px] uppercase tracking-[0.22em] border border-border px-4 py-2 inline-block hover:border-foreground"
          >
            Open Lumi canvas →
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-foreground/60 py-4">
          No runs match the current filters. Loosen a filter to see results.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {/* By stakeholder */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-3.5 w-3.5 text-secondary-accent" />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/60">
                By stakeholder
              </span>
            </div>
            <ul className="divide-y divide-border border border-border">
              {byStakeholder.map(([name, runs]) => (
                <li key={name} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{name}</div>
                    <div className="text-xs text-foreground/60 truncate">
                      {Array.from(new Set(runs.map((r) => r.accountName).filter(Boolean))).slice(0, 3).join(" · ") || "—"}
                    </div>
                  </div>
                  <span className="font-mono text-[11px] tabular-nums text-accent">
                    {runs.length}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* By tree */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Compass className="h-3.5 w-3.5 text-secondary-accent" />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/60">
                By tree
              </span>
            </div>
            <ul className="divide-y divide-border border border-border">
              {byTree.map(({ tree, count }) => (
                <li key={tree.treeId ?? tree.id} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-2">
                    {tree.treeCategory && (
                      <span
                        className="inline-block h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLOR[tree.treeCategory].hex }}
                        aria-hidden="true"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {tree.treeId ? `${tree.treeId} · ${tree.treeTitle}` : tree.treeTitle}
                      </div>
                      <div className="text-xs text-foreground/60 truncate">
                        {tree.treeCategory ? CATEGORY_COLOR[tree.treeCategory].label : "Unclassified"}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] tabular-nums text-accent">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  dotColor,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  dotColor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] border transition-colors",
        active
          ? "border-accent text-accent bg-accent/10"
          : "border-border text-foreground/70 hover:border-foreground hover:text-foreground",
      )}
    >
      {dotColor && (
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: dotColor }}
          aria-hidden="true"
        />
      )}
      {label}
    </button>
  );
}
