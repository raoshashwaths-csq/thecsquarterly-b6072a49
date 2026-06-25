import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getTree, type TreeId } from "@/lib/q-trees";
import { ExternalLink } from "lucide-react";
import type { CSAccountEvent } from "@/lib/csfactors.functions";

type Vector = {
  kind: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tint: "accent" | "secondary" | "emerald" | "destructive" | "neutral";
};

const TINT_CLASS: Record<Vector["tint"], string> = {
  accent: "text-accent border-accent/40 bg-accent/10",
  secondary: "text-secondary-accent border-secondary-accent/40 bg-secondary-accent/10",
  emerald: "text-emerald-500 border-emerald-500/40 bg-emerald-500/10",
  destructive: "text-destructive border-destructive/40 bg-destructive/10",
  neutral: "text-foreground/70 border-border bg-muted/40",
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
      {children}
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 py-1.5 border-b border-border/60 last:border-0">
      <Eyebrow>{label}</Eyebrow>
      <div className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{value}</div>
    </div>
  );
}

type Payload = Record<string, unknown> & {
  title?: string;
  details?: string;
  label?: string;
  run_id?: string;
  node_id?: string;
  stakeholder?: string | null;
  severity?: string;
  arr_delta?: number;
  renewal_date?: string;
  from?: string;
  to?: string;
  owner?: string;
  due_date?: string;
  closed_at?: string;
  field?: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
};

function extractTreeId(nodeId: string | undefined): TreeId | undefined {
  if (!nodeId) return undefined;
  const m = nodeId.match(/^(T\d+)/);
  return (m?.[1] as TreeId | undefined) ?? undefined;
}

function LumiRunBody({ payload }: { payload: Payload }) {
  const treeId = extractTreeId(payload.node_id);
  const tree = treeId ? getTree(treeId) : undefined;
  return (
    <div className="space-y-1">
      {tree && (
        <>
          <FieldRow label="Tree" value={tree.title} />
          <FieldRow label="Category" value={tree.eyebrow.replace(/^T\d+\s*·\s*/, "")} />
          <FieldRow label="Context" value={tree.blurb} />
        </>
      )}
      <FieldRow label="Stakeholder" value={payload.stakeholder || "—"} />
      {payload.run_id && (
        <div className="pt-3">
          <Link
            to="/agent/response/$runId"
            params={{ runId: payload.run_id }}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-accent border-b border-accent/40 hover:border-accent pb-0.5"
          >
            Open Lumi run <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

function GenericMeetingBody({ payload }: { payload: Payload }) {
  return (
    <div className="space-y-1">
      <FieldRow label="Notes" value={payload.details} />
      <FieldRow label="Stakeholder" value={payload.stakeholder ?? undefined} />
    </div>
  );
}

function EscalationBody({ payload }: { payload: Payload }) {
  return (
    <div className="space-y-1">
      <FieldRow label="Severity" value={payload.severity} />
      <FieldRow label="Details" value={payload.details} />
    </div>
  );
}

function ExpansionBody({ payload }: { payload: Payload }) {
  return (
    <div className="space-y-1">
      <FieldRow
        label="ARR delta"
        value={typeof payload.arr_delta === "number" ? `$${payload.arr_delta.toLocaleString()}` : undefined}
      />
      <FieldRow label="Details" value={payload.details} />
    </div>
  );
}

function RenewalBody({ payload }: { payload: Payload }) {
  return (
    <div className="space-y-1">
      <FieldRow label="Renewal date" value={payload.renewal_date} />
      <FieldRow label="Notes" value={payload.details} />
    </div>
  );
}

function ChampionChangeBody({ payload }: { payload: Payload }) {
  return (
    <div className="space-y-1">
      <FieldRow label="From" value={payload.from} />
      <FieldRow label="To" value={payload.to} />
      <FieldRow label="Notes" value={payload.details} />
    </div>
  );
}

function CtaBody({ payload, completed }: { payload: Payload; completed: boolean }) {
  return (
    <div className="space-y-1">
      <FieldRow label="Owner" value={payload.owner} />
      <FieldRow label={completed ? "Closed" : "Due"} value={completed ? payload.closed_at : payload.due_date} />
      <FieldRow label="Details" value={payload.details} />
      <div className="pt-3">
        <Link
          to="/csfactors/ctas"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-accent border-b border-accent/40 hover:border-accent pb-0.5"
        >
          Open CTAs <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

function NoteBody({ payload }: { payload: Payload }) {
  return <FieldRow label="Note" value={payload.details} />;
}

function FieldEditBody({ payload }: { payload: Payload }) {
  return (
    <div className="space-y-1">
      <FieldRow label="Field" value={payload.field} />
      <FieldRow label="Before" value={String(payload.before ?? "—")} />
      <FieldRow label="After" value={String(payload.after ?? "—")} />
    </div>
  );
}

function QbrOverrideBody({ payload }: { payload: Payload }) {
  return (
    <div className="space-y-1">
      <FieldRow label="Before" value={String(payload.before ?? "—")} />
      <FieldRow label="After" value={String(payload.after ?? "—")} />
      <FieldRow label="Reason" value={payload.reason} />
    </div>
  );
}

function FallbackBody({ payload }: { payload: Payload }) {
  const keys = Object.keys(payload).filter((k) => !["title", "label"].includes(k));
  if (!keys.length) return <p className="text-sm text-muted-foreground italic">No further details.</p>;
  return (
    <details className="text-xs">
      <summary className="font-mono uppercase tracking-[0.22em] text-[10px] text-muted-foreground cursor-pointer">
        Raw payload
      </summary>
      <pre className="mt-2 p-3 bg-muted/40 border border-border overflow-x-auto text-[11px] leading-relaxed">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </details>
  );
}

function renderBody(kind: string, payload: Payload): React.ReactNode {
  switch (kind) {
    case "lumi.run.tagged": return <LumiRunBody payload={payload} />;
    case "meeting.new":
    case "cadence.mom":
    case "qbr":
    case "leadership.connect":
    case "exec.sync":
      return <GenericMeetingBody payload={payload} />;
    case "escalation": return <EscalationBody payload={payload} />;
    case "expansion.signal": return <ExpansionBody payload={payload} />;
    case "renewal.note": return <RenewalBody payload={payload} />;
    case "champion.change": return <ChampionChangeBody payload={payload} />;
    case "cta.raised": return <CtaBody payload={payload} completed={false} />;
    case "cta.completed": return <CtaBody payload={payload} completed={true} />;
    case "note": return <NoteBody payload={payload} />;
    case "field.edit": return <FieldEditBody payload={payload} />;
    case "qbr.override": return <QbrOverrideBody payload={payload} />;
    default: return <FallbackBody payload={payload} />;
  }
}

export function TimelineEventDialog({
  event,
  vector,
  label,
  open,
  onOpenChange,
}: {
  event: CSAccountEvent | null;
  vector: Vector | null;
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!event || !vector) return null;
  const payload = (event.payload ?? {}) as Payload;
  const Icon = vector.icon;

  // Derive heading. lumi.run.tagged → tree title; otherwise payload title or label.
  let heading = payload.title || payload.label || label;
  if (event.kind === "lumi.run.tagged") {
    const tree = getTree(extractTreeId(payload.node_id) as TreeId);
    if (tree) {
      heading = tree.title;
      if (payload.stakeholder) heading = `${heading} · ${payload.stakeholder}`;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={cn(
                "inline-flex h-6 w-6 items-center justify-center rounded-full border",
                TINT_CLASS[vector.tint],
              )}
            >
              <Icon className="h-3 w-3" />
            </span>
            <Eyebrow>{label}</Eyebrow>
            <span className="ml-auto font-mono text-[10px] text-muted-foreground tabular-nums">
              {formatWhen(event.occurred_at)}
            </span>
          </div>
          <DialogTitle className="font-display text-xl leading-tight break-words">
            {heading}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Timeline event details
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2">{renderBody(event.kind, payload)}</div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
