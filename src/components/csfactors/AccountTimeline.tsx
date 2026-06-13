import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Calendar, Phone, PresentationIcon, Crown, AlertTriangle, TrendingUp,
  Handshake, FileText, Users, Sparkles, Trash2, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  listAccountEvents, logAccountEvent, deleteAccountEvent,
  type CSAccountEvent,
} from "@/lib/csfactors.functions";

type Vector = {
  kind: string;
  label: string;
  icon: typeof Calendar;
  tint: "accent" | "secondary" | "emerald" | "destructive" | "neutral";
};

const VECTORS: Vector[] = [
  { kind: "meeting.new",        label: "New meeting",        icon: Calendar,         tint: "accent" },
  { kind: "cadence.mom",        label: "Cadence call MoM",   icon: Phone,            tint: "secondary" },
  { kind: "qbr",                label: "QBR",                icon: PresentationIcon, tint: "accent" },
  { kind: "leadership.connect", label: "Leadership connect", icon: Crown,            tint: "secondary" },
  { kind: "exec.sync",          label: "Exec sync",          icon: Users,            tint: "neutral" },
  { kind: "escalation",         label: "Escalation",         icon: AlertTriangle,    tint: "destructive" },
  { kind: "expansion.signal",   label: "Expansion signal",   icon: TrendingUp,       tint: "emerald" },
  { kind: "renewal.note",       label: "Renewal note",       icon: Handshake,        tint: "accent" },
  { kind: "champion.change",    label: "Champion change",    icon: Sparkles,         tint: "secondary" },
  { kind: "note",               label: "Note",               icon: FileText,         tint: "neutral" },
];

const TINT_CLASS: Record<Vector["tint"], string> = {
  accent: "text-accent border-accent/40 bg-accent/10",
  secondary: "text-secondary-accent border-secondary-accent/40 bg-secondary-accent/10",
  emerald: "text-emerald-500 border-emerald-500/40 bg-emerald-500/10",
  destructive: "text-destructive border-destructive/40 bg-destructive/10",
  neutral: "text-foreground/70 border-border bg-muted/40",
};

const KIND_INDEX: Record<string, Vector> = Object.fromEntries(VECTORS.map((v) => [v.kind, v]));

function describe(kind: string): { vector: Vector; label: string } {
  if (KIND_INDEX[kind]) return { vector: KIND_INDEX[kind], label: KIND_INDEX[kind].label };
  // Legacy/system events fall back to neutral.
  return {
    vector: { kind, label: kind, icon: FileText, tint: "neutral" },
    label: kind.replace(/[._]/g, " "),
  };
}

export function AccountTimeline({ accountId }: { accountId: string }) {
  const qc = useQueryClient();
  const list = useServerFn(listAccountEvents);
  const log = useServerFn(logAccountEvent);
  const del = useServerFn(deleteAccountEvent);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["cs-events", accountId],
    queryFn: () => list({ data: { account_id: accountId } }),
  });

  const [selected, setSelected] = useState<Vector | null>(null);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [when, setWhen] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!selected) return toast.error("Pick an event type first");
    if (!title.trim()) return toast.error("Add a short title");
    setSaving(true);
    try {
      await log({
        data: {
          account_id: accountId,
          kind: selected.kind,
          payload: {
            title: title.trim(),
            details: details.trim() || undefined,
            label: selected.label,
          },
          occurred_at: new Date(when).toISOString(),
        },
      });
      setTitle(""); setDetails(""); setSelected(null);
      setWhen(new Date().toISOString().slice(0, 10));
      await qc.invalidateQueries({ queryKey: ["cs-events", accountId] });
      toast.success(`${selected.label} logged`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to log event");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this timeline entry?")) return;
    try {
      await del({ data: { id } });
      await qc.invalidateQueries({ queryKey: ["cs-events", accountId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-5">
      {/* Vector chips */}
      <div>
        <div className="font-mono uppercase tracking-[0.22em] text-[10px] text-muted-foreground mb-2">
          What happened?
        </div>
        <div className="flex flex-wrap gap-2">
          {VECTORS.map((v) => {
            const Icon = v.icon;
            const active = selected?.kind === v.kind;
            return (
              <button
                key={v.kind}
                type="button"
                onClick={() => setSelected(active ? null : v)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1.5 border text-xs font-mono uppercase tracking-[0.14em] transition-colors",
                  TINT_CLASS[v.tint],
                  active ? "ring-2 ring-offset-1 ring-offset-card ring-foreground/40" : "hover:opacity-80",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {v.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Entry form */}
      {selected && (
        <div className="border border-border bg-background p-3 space-y-3 animate-fade-up">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-3">
            <div className="space-y-1.5">
              <Label className="font-mono uppercase tracking-widest text-xs">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`e.g. ${selected.label} with CFO`}
                className="h-9 text-sm"
                maxLength={140}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono uppercase tracking-widest text-xs">Date</Label>
              <Input type="date" value={when} onChange={(e) => setWhen(e.target.value)} className="h-9 text-sm font-mono" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="font-mono uppercase tracking-widest text-xs">Notes (optional)</Label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="MoM, decisions, follow-ups…"
              className="text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setSelected(null); setTitle(""); setDetails(""); }}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={saving}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              {saving ? "Logging…" : "Log event"}
            </Button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div>
        <div className="font-mono uppercase tracking-[0.22em] text-[10px] text-muted-foreground mb-3">
          Milestones · {events.length}
        </div>
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading timeline…</p>
        ) : events.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No events yet. Pick a vector above to log the first milestone.
          </p>
        ) : (
          <ol className="relative border-l border-border ml-2 space-y-4">
            {events.map((e) => <TimelineItem key={e.id} event={e} onDelete={remove} />)}
          </ol>
        )}
      </div>
    </div>
  );
}

function TimelineItem({ event, onDelete }: { event: CSAccountEvent; onDelete: (id: string) => void }) {
  const { vector, label } = describe(event.kind);
  const Icon = vector.icon;
  const payload = (event.payload ?? {}) as { title?: string; details?: string; label?: string };
  const title = payload.title || payload.label || label;
  const isManual = !!KIND_INDEX[event.kind];

  return (
    <li className="ml-4">
      <span
        className={cn(
          "absolute -left-[9px] mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full border",
          TINT_CLASS[vector.tint],
        )}
      >
        <Icon className="h-2.5 w-2.5" />
      </span>
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono uppercase tracking-[0.18em] text-[10px] text-muted-foreground">
            {label}
          </div>
          <div className="text-sm text-foreground/90 break-words">{title}</div>
          {payload.details && (
            <p className="text-xs text-foreground/70 mt-1 whitespace-pre-wrap leading-relaxed">
              {payload.details}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <time className="font-mono text-[10px] text-muted-foreground tabular-nums">
            {new Date(event.occurred_at).toLocaleDateString(undefined, {
              month: "short", day: "2-digit", year: "2-digit",
            })}
          </time>
          {isManual && (
            <button
              type="button"
              onClick={() => onDelete(event.id)}
              className="p-1 text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Delete event"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
