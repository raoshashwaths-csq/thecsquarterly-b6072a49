import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { canonicalUrl } from "@/lib/canonical-url";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getMap, completeMilestone, updateMapShare, type MapMilestone, type MapPhase } from "@/lib/maps.functions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Check, Sparkles, Mail, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/csfactors/maps/$id")({
  head: ({ params }) => ({ meta: [{ title: `MAP ${params.id} — CSFactors` }] }),
  component: MapDetail,
});

function daysBetween(a: string | null, b: Date) {
  if (!a) return 0;
  return Math.max(0, Math.round((b.getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24)));
}

function MapDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const getFn = useServerFn(getMap);
  const completeFn = useServerFn(completeMilestone);
  const shareFn = useServerFn(updateMapShare);

  const { data, refetch } = useQuery({ queryKey: ["map", id], queryFn: () => getFn({ data: { id } }) });

  const [completing, setCompleting] = useState<MapMilestone | null>(null);
  const [note, setNote] = useState("");

  if (!data) {
    return <div className="min-h-screen bg-background p-10 font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">Loading…</div>;
  }

  const { map, phases, milestones, comments } = data;
  const elapsed = daysBetween(map.contract_start_date, new Date());
  const benchmark = map.benchmark_ttv_days ?? 0;
  const pct = benchmark > 0 ? Math.min(100, (elapsed / benchmark) * 100) : 0;
  const ttvState: "ontrack" | "warn" | "over" =
    benchmark > 0 && elapsed > benchmark ? "over" : benchmark > 0 && elapsed >= benchmark * 0.9 ? "warn" : "ontrack";

  const totalDone = milestones.filter((m) => m.status === "completed").length;
  const pendingImpact = milestones.filter((m) => m.status !== "completed").reduce((a, m) => a + (m.health_score_impact ?? 0), 0);
  const blocked = milestones.filter((m) => m.status === "blocked").length;
  const completePhase = completing ? phases.find((p) => p.id === completing.phase_id) : null;

  const shareUrl = canonicalUrl(`/m/${map.share_token}`);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Link to="/csfactors/maps" className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground hover:text-accent inline-flex items-center gap-1 mb-6">
          <ArrowLeft className="h-3 w-3" /> All MAPs
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          {/* Board */}
          <div>
            <h1 className="font-display text-2xl md:text-3xl tracking-tight">{map.account_name}</h1>
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent mt-1">{map.title}</div>

            {/* TTV bar */}
            <div className="mt-6 mb-8">
              <div className="h-1.5 bg-border w-full">
                <div className={cn("h-full transition-all", ttvState === "over" ? "bg-destructive" : ttvState === "warn" ? "bg-secondary-accent" : "bg-accent")} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between mt-2 font-mono text-[10px] uppercase tracking-[0.22em]">
                <span className="text-accent">Day {elapsed}</span>
                <div className="flex gap-1.5">
                  {phases.map((p) => (
                    <span key={p.id} className="w-1.5 h-1.5 rounded-full border border-border" style={{ background: p.color }} />
                  ))}
                </div>
                <span className={ttvState === "over" ? "text-destructive" : ttvState === "warn" ? "text-secondary-accent" : "text-emerald-600 dark:text-emerald-400"}>
                  Benchmark: Day {benchmark || "—"}
                </span>
              </div>
            </div>

            {/* Phase columns */}
            <div className="flex gap-3 overflow-x-auto pb-4">
              {phases.map((phase) => (
                <PhaseColumn
                  key={phase.id}
                  phase={phase}
                  milestones={milestones.filter((m) => m.phase_id === phase.id)}
                  contractStart={map.contract_start_date}
                  onComplete={(m) => { setCompleting(m); setNote(""); }}
                />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-20 self-start">
            <Section title="Map Details">
              <Row k="Account" v={map.account_name ?? "—"} />
              <Row k="Created" v={new Date(map.created_at).toLocaleDateString()} />
              <Row k="Contract start" v={map.contract_start_date ?? "—"} />
              <Row k="Target value" v={map.target_value_date ?? "—"} />
              <Row k="Progress" v={`${totalDone}/${milestones.length} milestones`} />
              <Row k="Health impact remaining" v={`+${pendingImpact} pts`} />
              {map.actual_ttv_days && <Row k="Actual TTV" v={`${map.actual_ttv_days} days`} />}
            </Section>

            <Section title="Customer Access">
              <label className="flex items-center gap-2 cursor-pointer font-mono text-[10px] uppercase tracking-[0.22em]">
                <input
                  type="checkbox"
                  checked={map.share_enabled}
                  onChange={async (e) => { await shareFn({ data: { id: map.id, share_enabled: e.target.checked } }); refetch(); }}
                />
                Enable customer access
              </label>
              {map.share_enabled && (
                <div className="mt-3 space-y-2">
                  <div className="font-mono text-[9px] text-foreground/80 break-all border border-border p-2 bg-muted/30">{shareUrl}</div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigator.clipboard.writeText(shareUrl)}
                      className="rounded-none bg-accent text-accent-foreground hover:bg-accent/90 font-mono uppercase tracking-[0.22em] text-[10px] flex-1"
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                    {map.customer_email && (
                      <Button
                        asChild
                        variant="ghost"
                        className="rounded-none font-mono uppercase tracking-[0.22em] text-[10px] border border-border"
                      >
                        <a href={`mailto:${map.customer_email}?subject=${encodeURIComponent(`Your Action Plan — ${map.title}`)}&body=${encodeURIComponent(shareUrl)}`}>
                          <Mail className="h-3 w-3 mr-1" /> Email
                        </a>
                      </Button>
                    )}
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.22em]">
                    {map.last_customer_view ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Last viewed {new Date(map.last_customer_view).toLocaleDateString()}</span>
                    ) : (
                      <span className="text-muted-foreground">Not yet viewed</span>
                    )}
                  </div>
                </div>
              )}
            </Section>

            <Section title="Ask Lumi About This MAP">
              <Button asChild className="rounded-none bg-accent text-accent-foreground hover:bg-accent/90 font-mono uppercase tracking-[0.22em] text-[10px] w-full">
                <Link to="/csfactors">
                  <Sparkles className="h-3 w-3 mr-1" /> Get Lumi Guidance
                </Link>
              </Button>
              {blocked > 0 && (
                <div className="mt-3 p-2 bg-secondary-accent/10 border border-secondary-accent/40 font-mono text-[9px] uppercase tracking-[0.22em] text-secondary-accent">
                  ◆ Lumi: {blocked} blocked milestone{blocked > 1 ? "s" : ""} detected.
                </div>
              )}
            </Section>

            <Section title="Activity">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {milestones.filter((m) => m.completed_at).slice(0, 8).map((m) => (
                  <div key={m.id} className="text-xs">
                    <div className="font-mono text-[9px] text-muted-foreground">{new Date(m.completed_at!).toLocaleDateString()}</div>
                    <div className="font-serif text-[12px] text-foreground/80">✓ {m.title}</div>
                  </div>
                ))}
                {comments.slice(0, 4).map((c) => (
                  <div key={c.id} className="text-xs">
                    <div className="font-mono text-[9px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()} · {c.author_type}</div>
                    <div className="font-serif text-[12px] text-foreground/80">{c.content}</div>
                  </div>
                ))}
                {milestones.every((m) => !m.completed_at) && comments.length === 0 && (
                  <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">No activity yet</div>
                )}
              </div>
            </Section>
          </aside>
        </div>
      </div>

      <Dialog open={!!completing} onOpenChange={(o) => !o && setCompleting(null)}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">{completing?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Completion note (optional)</div>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="rounded-none" rows={4} />
            {completing && completing.health_score_impact > 0 && (
              <div className="p-3 border border-accent/40 bg-accent/5 font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
                Completing this milestone will add +{completing.health_score_impact} points to {map.account_name}'s health score.
              </div>
            )}
            {completing && completePhase?.is_value_milestone && (
              <div className="p-3 border border-emerald-500/40 bg-emerald-500/5 font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400">
                🎯 This is a value milestone. Completing the final value milestone stops the TTV clock at Day {elapsed} (benchmark {benchmark}).
              </div>
            )}
            <div className="flex justify-end">
              <Button
                onClick={async () => {
                  if (!completing) return;
                  await completeFn({ data: { milestone_id: completing.id, note: note || undefined } });
                  setCompleting(null);
                  refetch();
                }}
                className="rounded-none bg-accent text-accent-foreground hover:bg-accent/90 font-mono uppercase tracking-[0.22em] text-xs"
              >
                <Check className="h-4 w-4 mr-2" /> Mark complete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border bg-card p-4">
      <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-accent mb-3">{title}</div>
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2 py-1 text-xs">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{k}</span>
      <span className="font-serif text-[12px] text-foreground/90 text-right">{v}</span>
    </div>
  );
}

const OWNER_BORDER: Record<string, string> = {
  csm: "border-l-secondary-accent",
  customer: "border-l-emerald-500",
  shared: "border-l-accent",
};
const STATUS_ICON: Record<MapMilestone["status"], { sym: string; cls: string }> = {
  not_started: { sym: "○", cls: "text-muted-foreground" },
  in_progress: { sym: "◑", cls: "text-accent" },
  completed: { sym: "●", cls: "text-emerald-600 dark:text-emerald-400" },
  blocked: { sym: "⚠", cls: "text-destructive" },
};

function PhaseColumn({ phase, milestones, contractStart, onComplete }: {
  phase: MapPhase;
  milestones: MapMilestone[];
  contractStart: string | null;
  onComplete: (m: MapMilestone) => void;
}) {
  const done = milestones.filter((m) => m.status === "completed").length;
  return (
    <div className="w-[230px] flex-shrink-0">
      <div className="pb-2 border-b-2" style={{ borderColor: phase.color }}>
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] font-semibold">
          {phase.is_value_milestone && <span className="text-accent">★ </span>}
          {phase.title}
        </div>
        <div className="font-mono text-[9px] text-muted-foreground mt-0.5">{done}/{milestones.length} done</div>
      </div>
      <div className="mt-2 space-y-2">
        {milestones.map((m) => {
          const dueDate = contractStart && m.due_days_from_start != null
            ? new Date(new Date(contractStart).getTime() + m.due_days_from_start * 86400000)
            : null;
          const today = new Date(); today.setHours(0,0,0,0);
          const overdue = dueDate && dueDate < today && m.status !== "completed";
          const status = STATUS_ICON[m.status];
          return (
            <div key={m.id} className={cn("bg-card border-l-[3px] border border-border p-3 group", OWNER_BORDER[m.owner])}>
              <div className="flex justify-between items-start gap-2">
                <div className="font-mono text-[11px] flex-1">{m.title}</div>
                <span className={cn("text-base leading-none", status.cls)}>{status.sym}</span>
              </div>
              <div className="flex justify-between items-center mt-2 font-mono text-[8px] uppercase tracking-[0.22em]">
                <span className={cn(
                  "px-1.5 py-0.5 border",
                  m.owner === "csm" && "bg-secondary-accent/15 text-secondary-accent border-secondary-accent/30",
                  m.owner === "customer" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
                  m.owner === "shared" && "bg-accent/15 text-accent border-accent/30",
                )}>{m.owner}</span>
                {dueDate && (
                  <span className={overdue ? "text-destructive" : "text-muted-foreground"}>
                    {dueDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
              {m.health_score_impact > 0 && (
                <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-accent mt-1">+{m.health_score_impact} health pts</div>
              )}
              {m.status !== "completed" && (
                <button
                  type="button"
                  onClick={() => onComplete(m)}
                  className="mt-2 w-full font-mono text-[9px] uppercase tracking-[0.22em] bg-accent text-accent-foreground hover:bg-accent/90 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✓ Complete
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
