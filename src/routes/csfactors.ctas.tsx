// CSFactors Action Centre — Surface C. Full /csfactors/ctas route.
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CSFactorsSidebar } from "@/components/csfactors/CSFactorsSidebar";
import { WorkspacePane } from "@/components/csfactors/WorkspacePane";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { CtaCreateDrawer } from "@/components/csfactors/ctas/CtaCreateDrawer";
import { CtaDetailDrawer } from "@/components/csfactors/ctas/CtaDetailDrawer";
import { CtaRow } from "@/components/csfactors/ctas/CtaRow";
import {
  CTA_CONFIG,
  PRIORITY_CONFIG,
  CTA_TONE_CLASS,
  dueDateTone,
} from "@/components/csfactors/ctas/CtaConfig";
import {
  listCtas,
  ctaMetrics,
  updateCta,
  type Cta,
  type CtaStatus,
} from "@/lib/ctas.functions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/csfactors/ctas")({
  head: () => ({
    meta: [
      { title: "Action Centre — CSFactors" },
      {
        name: "description",
        content:
          "Track and assign CTAs across your portfolio in CSFactors. Native action management for customer success teams.",
      },
    ],
  }),
  component: CtasPage,
});

const COLS: { id: CtaStatus; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "dismissed", label: "Dismissed" },
];

function CtasPage() {
  const fetch = useServerFn(listCtas);
  const fetchMetrics = useServerFn(ctaMetrics);
  const update = useServerFn(updateCta);
  const qc = useQueryClient();

  const [view, setView] = useState<"list" | "board">("list");
  const [statusFilter, setStatusFilter] = useState<CtaStatus | "all">("open");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const metricsQ = useQuery({
    queryKey: ["cta-metrics"],
    queryFn: () => fetchMetrics(),
    staleTime: 30_000,
  });

  const ctasQ = useQuery({
    queryKey: ["ctas", "all"],
    queryFn: () => fetch({ data: { limit: 500 } }),
    staleTime: 20_000,
  });
  const all: Cta[] = ctasQ.data?.ctas ?? [];

  const filtered = useMemo(
    () =>
      statusFilter === "all" ? all : all.filter((c) => c.status === statusFilter),
    [all, statusFilter],
  );

  const moveStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CtaStatus }) =>
      update({ data: { id, patch: { status } } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ctas"] });
      qc.invalidateQueries({ queryKey: ["cta-metrics"] });
      toast.success("Status updated");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed"),
  });

  function onDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData("text/cta", id);
  }
  function onDropTo(e: React.DragEvent, status: CtaStatus) {
    const id = e.dataTransfer.getData("text/cta");
    if (id) moveStatus.mutate({ id, status });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <CSFactorsSidebar onOpenWorkspace={() => setWorkspaceOpen(true)} />
      <main className="flex-1 min-w-0">
        <header className="px-4 md:px-8 pt-8 pb-6 border-b border-border">
          <div className="font-mono uppercase tracking-[0.3em] text-xs text-secondary-accent font-semibold mb-2">
            CSFactors
          </div>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <h1 className="font-display text-3xl md:text-4xl tracking-tight">Action Centre</h1>
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-[color:var(--secondary-accent)] text-background hover:opacity-90 font-mono uppercase tracking-wider text-[11px]"
            >
              New CTA +
            </Button>
          </div>
        </header>

        <div className="px-4 md:px-8 py-6 space-y-6">
          {/* Metric strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Open" value={metricsQ.data?.open ?? "—"} />
            <MetricCard
              label="Overdue"
              value={metricsQ.data?.overdue ?? "—"}
              tone={metricsQ.data?.overdue ? "danger" : undefined}
            />
            <MetricCard label="Due today" value={metricsQ.data?.dueToday ?? "—"} />
            <MetricCard
              label="Completed this week"
              value={metricsQ.data?.completedThisWeek ?? "—"}
            />
          </div>

          {/* View toggle + filters */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView("list")}
                className={cn(
                  "border px-3 py-1.5 font-mono uppercase tracking-wider text-[10px]",
                  view === "list" ? "border-accent bg-accent/10" : "border-border",
                )}
              >
                List view
              </button>
              <button
                onClick={() => setView("board")}
                className={cn(
                  "border px-3 py-1.5 font-mono uppercase tracking-wider text-[10px]",
                  view === "board" ? "border-accent bg-accent/10" : "border-border",
                )}
              >
                Board view
              </button>
            </div>
            {view === "list" ? (
              <div className="flex items-center gap-1 flex-wrap">
                {(["all", "open", "in_progress", "completed", "dismissed"] as const).map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={cn(
                        "border px-2.5 py-1 font-mono uppercase tracking-wider text-[10px]",
                        statusFilter === s
                          ? "border-accent bg-accent/10"
                          : "border-border hover:bg-muted/60",
                      )}
                    >
                      {s.replace("_", " ")}
                    </button>
                  ),
                )}
              </div>
            ) : null}
          </div>

          {/* List or Board */}
          {view === "list" ? (
            <div className="border border-border bg-card">
              {ctasQ.isLoading ? (
                <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
              ) : filtered.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No actions in this view.
                </div>
              ) : (
                <div className="divide-y divide-border px-3">
                  {filtered.map((c) => (
                    <CtaRow key={c.id} cta={c} onClick={() => setDetailId(c.id)} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {COLS.map((col) => {
                const items = all.filter((c) => c.status === col.id);
                return (
                  <div
                    key={col.id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDropTo(e, col.id)}
                    className="border border-border bg-card min-h-[280px]"
                  >
                    <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                      <span className="font-mono uppercase tracking-wider text-[10px]">
                        {col.label}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {items.length}
                      </span>
                    </div>
                    <div className="p-2 space-y-2">
                      {items.map((c) => {
                        const meta = CTA_CONFIG[c.cta_type];
                        const prio = PRIORITY_CONFIG[c.priority];
                        return (
                          <button
                            key={c.id}
                            draggable
                            onDragStart={(e) => onDragStart(e, c.id)}
                            onClick={() => setDetailId(c.id)}
                            className="w-full text-left border-l-[3px] bg-background border border-border p-2 hover:bg-muted/40 transition-colors"
                            style={{ borderLeftColor: "currentColor" }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={cn(
                                  "font-mono uppercase tracking-wider text-[9px]",
                                  CTA_TONE_CLASS[meta.tone],
                                )}
                              >
                                {meta.icon} {meta.label}
                              </span>
                              <span className={cn("text-[10px]", prio.toneClass)}>●</span>
                            </div>
                            <div className="text-[13px] line-clamp-2">{c.title}</div>
                            <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                              <span className="truncate">{c.account_name ?? "PORTFOLIO"}</span>
                              <span
                                className={cn(
                                  dueDateTone(c.due_date) === "overdue" && "text-destructive",
                                )}
                              >
                                {c.due_date
                                  ? new Date(c.due_date).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : "—"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <CtaCreateDrawer open={createOpen} onOpenChange={setCreateOpen} />
      <CtaDetailDrawer
        id={detailId}
        open={!!detailId}
        onOpenChange={(v) => !v && setDetailId(null)}
      />
      <WorkspacePane open={workspaceOpen} onOpenChange={setWorkspaceOpen} />
    </div>
  );
}
