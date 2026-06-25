import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { listMaps, archiveMap, type MapRecord } from "@/lib/maps.functions";
import { listAccounts } from "@/lib/csfactors.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/csfactors/maps/")({
  head: () => ({
    meta: [
      { title: "Mutual Action Plans — CSFactors" },
      { name: "description", content: "Live, shareable onboarding & success plans tied to account health." },
    ],
  }),
  component: MapsIndex,
});

type Filter = "all" | "active" | "draft" | "completed" | "archived";

function daysBetween(a: string | null, b: Date) {
  if (!a) return 0;
  return Math.max(0, Math.round((b.getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24)));
}

function MapsIndex() {
  const router = useRouter();
  const listFn = useServerFn(listMaps);
  const archiveFn = useServerFn(archiveMap);
  const accountsFn = useServerFn(listAccounts);

  const { data: maps = [], refetch } = useQuery({ queryKey: ["maps"], queryFn: () => listFn() });
  const { data: accounts = [] } = useQuery({ queryKey: ["maps-accounts"], queryFn: () => accountsFn() });

  const [status, setStatus] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [riskOnly, setRiskOnly] = useState(false);

  const now = new Date();

  const enriched = useMemo(() => {
    return maps.map((m) => {
      const elapsed = daysBetween(m.contract_start_date, now);
      const bench = m.benchmark_ttv_days ?? 0;
      let ttvState: "ontrack" | "warn" | "over" = "ontrack";
      if (bench > 0) {
        if (elapsed > bench) ttvState = "over";
        else if (elapsed >= bench * 0.9) ttvState = "warn";
      }
      return { ...m, elapsed, ttvState };
    });
  }, [maps]);

  const filtered = enriched.filter((m) => {
    if (status !== "all" && m.status !== status) return false;
    if (search && !(m.title.toLowerCase().includes(search.toLowerCase()) || (m.account_name ?? "").toLowerCase().includes(search.toLowerCase()))) return false;
    if (riskOnly && m.ttvState === "ontrack") return false;
    return true;
  });

  const activeCount = maps.filter((m) => m.status === "active").length;
  const onTrack = enriched.filter((m) => m.ttvState === "ontrack" && m.status === "active").length;
  const atRisk = enriched.filter((m) => m.ttvState !== "ontrack" && m.status === "active").length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight">Mutual Action Plans</h1>
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mt-2">
              {now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
          <Button asChild className="rounded-none bg-accent text-accent-foreground hover:bg-accent/90 font-mono uppercase tracking-[0.22em] text-xs">
            <Link to="/csfactors/maps/new">
              <Plus className="h-4 w-4 mr-2" />
              New MAP
            </Link>
          </Button>
        </div>

        {/* Metric strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border mb-8">
          <Metric label="Active MAPs" value={activeCount} accent="gold" />
          <Metric label="On Track" value={onTrack} accent="success" />
          <Metric label="At Risk" value={atRisk} accent="danger" />
          <Metric label="Total" value={maps.length} accent="secondary" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex border border-border">
            {(["all", "active", "draft", "completed", "archived"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  "px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] border-r border-border last:border-r-0",
                  status === s ? "bg-accent text-accent-foreground" : "text-foreground/70 hover:bg-muted/40",
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <Input
            placeholder="Search account or title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs rounded-none"
          />
          <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] cursor-pointer">
            <input type="checkbox" checked={riskOnly} onChange={(e) => setRiskOnly(e.target.checked)} />
            At risk only
          </label>
        </div>

        {/* Table */}
        <div className="border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                <th className="text-left p-3">Account</th>
                <th className="text-left p-3">MAP Title</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Progress</th>
                <th className="text-left p-3">TTV Clock</th>
                <th className="text-left p-3">Customer Access</th>
                <th className="text-left p-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    {maps.length === 0 ? "No MAPs yet. Create your first one." : "No matches."}
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <MapRow key={m.id} map={m} accounts={accounts.length} archive={async () => { await archiveFn({ data: { id: m.id } }); refetch(); }} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: number; accent: "gold" | "success" | "danger" | "secondary" }) {
  const rail = {
    gold: "bg-accent",
    success: "bg-emerald-500",
    danger: "bg-destructive",
    secondary: "bg-secondary-accent",
  }[accent];
  return (
    <div className="relative bg-card p-5">
      <span aria-hidden className={cn("absolute inset-x-0 top-0 h-[2px]", rail)} />
      <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-3">{label}</div>
      <div className="font-display text-4xl tracking-tight">{value}</div>
    </div>
  );
}

function MapRow({ map, archive }: { map: MapRecord & { elapsed: number; ttvState: "ontrack" | "warn" | "over" }; accounts: number; archive: () => Promise<void> }) {
  const [menu, setMenu] = useState(false);
  const ttvText =
    map.ttvState === "over"
      ? `${map.elapsed - (map.benchmark_ttv_days ?? 0)} days over`
      : `Day ${map.elapsed} of ${map.benchmark_ttv_days ?? "—"}`;
  const ttvColor =
    map.ttvState === "over" ? "text-destructive" : map.ttvState === "warn" ? "text-secondary-accent" : "text-emerald-600 dark:text-emerald-400";

  const shareUrl = canonicalUrl(`/m/${map.share_token}`);

  return (
    <tr className="border-b border-border/60 hover:bg-muted/30">
      <td className="p-3">
        <Link to="/csfactors/maps/$id" params={{ id: map.id }} className="font-mono text-[11px] text-foreground hover:text-accent">
          {map.account_name ?? "—"}
        </Link>
      </td>
      <td className="p-3">
        <Link to="/csfactors/maps/$id" params={{ id: map.id }} className="font-serif text-[13px] hover:underline">
          {map.title}
        </Link>
      </td>
      <td className="p-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] border border-border px-2 py-0.5">{map.status}</span>
      </td>
      <td className="p-3">
        <div className="h-1 bg-border w-32">
          <div className="h-full bg-accent" style={{ width: `${Math.min(100, (map.elapsed / Math.max(1, map.benchmark_ttv_days ?? 1)) * 100)}%` }} />
        </div>
      </td>
      <td className={cn("p-3 font-mono text-[10px] uppercase tracking-[0.22em]", ttvColor)}>{ttvText}</td>
      <td className="p-3 font-mono text-[10px] uppercase tracking-[0.22em]">
        {map.share_enabled ? (
          map.last_customer_view ? (
            <span className="text-emerald-600 dark:text-emerald-400">◉ Active</span>
          ) : (
            <span className="text-secondary-accent">● Link sent</span>
          )
        ) : (
          <span className="text-muted-foreground">— Not shared</span>
        )}
      </td>
      <td className="p-3 relative">
        <button type="button" onClick={() => setMenu((v) => !v)} className="p-1 hover:bg-muted">
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menu && (
          <div className="absolute right-2 top-10 z-10 bg-popover border border-border shadow-lg min-w-[180px]">
            <Link
              to="/csfactors/maps/$id"
              params={{ id: map.id }}
              className="block px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] hover:bg-muted"
            >
              Open MAP
            </Link>
            <button
              type="button"
              onClick={async () => { await navigator.clipboard.writeText(shareUrl); setMenu(false); }}
              className="w-full text-left px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] hover:bg-muted"
            >
              Copy share link
            </button>
            <button
              type="button"
              onClick={async () => { if (confirm("Archive this MAP?")) { await archive(); setMenu(false); } }}
              className="w-full text-left px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] hover:bg-muted text-destructive"
            >
              Archive
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
