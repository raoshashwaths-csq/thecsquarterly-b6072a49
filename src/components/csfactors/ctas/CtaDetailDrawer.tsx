// CTA detail drawer + Quick Complete modal.
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CTA_CONFIG, PRIORITY_CONFIG, CTA_TONE_CLASS, CTA_STATUS_LABEL, dueDateTone, initials } from "./CtaConfig";
import {
  getCta,
  updateCta,
  completeCta,
  dismissCta,
  type Cta,
  type CtaOutcome,
  type CtaStatus,
} from "@/lib/ctas.functions";

const OUTCOMES: { id: CtaOutcome; label: string }[] = [
  { id: "resolved", label: "RESOLVED" },
  { id: "escalated", label: "ESCALATED" },
  { id: "deferred", label: "DEFERRED" },
  { id: "no_action_needed", label: "NO ACTION NEEDED" },
];

export function CtaDetailDrawer({
  id,
  open,
  onOpenChange,
}: {
  id: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const fetchCta = useServerFn(getCta);
  const update = useServerFn(updateCta);
  const dismiss = useServerFn(dismissCta);

  const [quickComplete, setQuickComplete] = useState(false);

  const ctaQ = useQuery({
    queryKey: ["cta", id],
    enabled: !!id && open,
    queryFn: () => fetchCta({ data: { id: id! } }),
  });
  const cta: Cta | null = ctaQ.data?.cta ?? null;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["ctas"] });
    qc.invalidateQueries({ queryKey: ["cta", id] });
    qc.invalidateQueries({ queryKey: ["cta-metrics"] });
  };

  const setStatus = useMutation({
    mutationFn: async (status: CtaStatus) => update({ data: { id: id!, patch: { status } } }),
    onSuccess: () => {
      toast.success("Status updated");
      invalidate();
    },
  });

  const dismissM = useMutation({
    mutationFn: async () => dismiss({ data: { id: id! } }),
    onSuccess: () => {
      toast.success("Action dismissed");
      invalidate();
      onOpenChange(false);
    },
  });

  return (
    <>
      <Sheet open={open && !!id} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-[420px] overflow-y-auto">
          {cta ? (
            <>
              <SheetHeader>
                <SheetTitle className="font-mono uppercase tracking-[0.2em] text-xs flex items-center gap-2">
                  <span className={CTA_TONE_CLASS[CTA_CONFIG[cta.cta_type].tone]}>
                    {CTA_CONFIG[cta.cta_type].icon}
                  </span>
                  {CTA_CONFIG[cta.cta_type].label}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                <h3 className="font-display text-xl tracking-tight">{cta.title}</h3>

                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <Field
                    label="Account"
                    value={cta.account_name ?? (cta.team_wide ? "PORTFOLIO-WIDE" : "—")}
                  />
                  <Field label="Status" value={CTA_STATUS_LABEL[cta.status] ?? cta.status} />
                  <Field
                    label="Priority"
                    value={PRIORITY_CONFIG[cta.priority].label}
                    valueClass={PRIORITY_CONFIG[cta.priority].toneClass}
                  />
                  <Field
                    label="Due"
                    value={cta.due_date ? new Date(cta.due_date).toLocaleString() : "No due date"}
                    valueClass={
                      dueDateTone(cta.due_date) === "overdue"
                        ? "text-destructive"
                        : dueDateTone(cta.due_date) === "today"
                          ? "text-[color:var(--secondary-accent)]"
                          : ""
                    }
                  />
                  <Field label="Source" value={cta.source.toUpperCase()} />
                  <Field
                    label="Assignee"
                    value={cta.assigned_to_name ?? (cta.assigned_to ? initials(cta.assigned_to_name) : "Unassigned")}
                  />
                </div>

                {cta.description ? (
                  <div>
                    <div className="font-mono uppercase tracking-wider text-[10px] text-foreground/60 mb-1">
                      Description
                    </div>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                      {cta.description}
                    </p>
                  </div>
                ) : null}

                {cta.completion_note ? (
                  <div className="border border-border p-3">
                    <div className="font-mono uppercase tracking-wider text-[10px] text-foreground/60 mb-1">
                      Completion note · {cta.outcome ?? ""}
                    </div>
                    <p className="text-sm">{cta.completion_note}</p>
                  </div>
                ) : null}

                <div className="pt-3 border-t border-border flex flex-wrap gap-2">
                  {cta.status === "open" || cta.status === "in_progress" ? (
                    <>
                      <Button
                        size="sm"
                        className="bg-[color:var(--secondary-accent)] text-background hover:opacity-90"
                        onClick={() => setQuickComplete(true)}
                      >
                        Mark as complete →
                      </Button>
                      {cta.status === "open" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setStatus.mutate("in_progress")}
                        >
                          In progress
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => dismissM.mutate()}
                      >
                        Dismiss
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setStatus.mutate("open")}>
                      Reopen
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
          )}
        </SheetContent>
      </Sheet>

      <QuickCompleteModal
        id={id}
        open={quickComplete}
        onOpenChange={setQuickComplete}
        onCompleted={() => {
          invalidate();
          onOpenChange(false);
        }}
      />
    </>
  );
}

function Field({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <div className="font-mono uppercase tracking-wider text-[9px] text-foreground/55">
        {label}
      </div>
      <div className={cn("mt-0.5", valueClass)}>{value}</div>
    </div>
  );
}

export function QuickCompleteModal({
  id,
  open,
  onOpenChange,
  onCompleted,
}: {
  id: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCompleted?: () => void;
}) {
  const complete = useServerFn(completeCta);
  const [outcome, setOutcome] = useState<CtaOutcome>("resolved");
  const [note, setNote] = useState("");

  const m = useMutation({
    mutationFn: async () => complete({ data: { id: id!, outcome, note: note || null } }),
    onSuccess: () => {
      toast.success("Action completed");
      onOpenChange(false);
      setNote("");
      onCompleted?.();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed"),
  });

  return (
    <Dialog open={open && !!id} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase tracking-[0.2em] text-sm">
            Complete action
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <div className="font-mono uppercase tracking-wider text-[10px] text-foreground/70 mb-2">
              Outcome
            </div>
            <div className="grid grid-cols-2 gap-2">
              {OUTCOMES.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setOutcome(o.id)}
                  className={cn(
                    "border px-3 py-2 font-mono uppercase tracking-wider text-[10px] transition-colors",
                    outcome === o.id
                      ? "border-accent bg-accent/10"
                      : "border-border hover:bg-muted/60",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="font-mono uppercase tracking-wider text-[10px] text-foreground/70 mb-2">
              Note (optional)
            </div>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => m.mutate()}
              disabled={m.isPending}
              className="bg-[color:var(--secondary-accent)] text-background hover:opacity-90"
            >
              {m.isPending ? "Saving…" : "Complete →"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
