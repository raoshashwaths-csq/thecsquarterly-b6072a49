// CTA create drawer — slide-in from right. Used by all "NEW CTA +" buttons.
import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CTA_CONFIG, PRIORITY_CONFIG, CTA_TONE_CLASS } from "./CtaConfig";
import { createCta, type CtaPriority, type CtaType } from "@/lib/ctas.functions";
import { listAccounts } from "@/lib/csfactors.functions";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAccountId?: string | null;
  defaultAccountName?: string | null;
  onCreated?: () => void;
};

const DUE_QUICK: { label: string; hours: number }[] = [
  { label: "TODAY", hours: 6 },
  { label: "TOMORROW", hours: 24 },
  { label: "+3 DAYS", hours: 72 },
  { label: "+1 WEEK", hours: 168 },
];

export function CtaCreateDrawer({
  open,
  onOpenChange,
  defaultAccountId,
  defaultAccountName,
  onCreated,
}: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const create = useServerFn(createCta);
  const fetchAccounts = useServerFn(listAccounts);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<CtaType>("task");
  const [priority, setPriority] = useState<CtaPriority>("medium");
  const [accountId, setAccountId] = useState<string | null>(defaultAccountId ?? null);
  const [accountName, setAccountName] = useState<string | null>(defaultAccountName ?? null);
  const [portfolioWide, setPortfolioWide] = useState(false);
  const [assignSelf, setAssignSelf] = useState(true);
  const [dueDate, setDueDate] = useState<string>("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setType("task");
      setPriority("medium");
      setAccountId(defaultAccountId ?? null);
      setAccountName(defaultAccountName ?? null);
      setPortfolioWide(!defaultAccountId);
      setAssignSelf(true);
      setDueDate("");
      setDescription("");
    }
  }, [open, defaultAccountId, defaultAccountName]);

  const accountsQ = useQuery({
    queryKey: ["cs-accounts", "for-cta-picker"],
    queryFn: () => fetchAccounts(),
    enabled: open && !defaultAccountId,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      return create({
        data: {
          title,
          description: description || null,
          cta_type: type,
          priority,
          account_id: portfolioWide ? null : accountId,
          account_name: portfolioWide ? null : accountName,
          assigned_to: assignSelf ? user?.id ?? null : null,
          assigned_to_name: assignSelf ? user?.email ?? null : null,
          due_date: dueDate || null,
          source: "manual",
        },
      });
    },
    onSuccess: () => {
      toast.success("Action raised");
      qc.invalidateQueries({ queryKey: ["ctas"] });
      qc.invalidateQueries({ queryKey: ["cta-metrics"] });
      onOpenChange(false);
      onCreated?.();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to raise action"),
  });

  function submitDisabled() {
    if (!title.trim()) return true;
    if (mutation.isPending) return true;
    return false;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[420px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-mono uppercase tracking-[0.25em] text-sm">
            New action
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div>
            <Label htmlFor="cta-title" className="font-mono uppercase tracking-wider text-[10px]">
              Title *
            </Label>
            <Input
              id="cta-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to happen?"
              className="mt-1"
              autoFocus
            />
          </div>

          <div>
            <div className="font-mono uppercase tracking-wider text-[10px] text-foreground/70 mb-2">
              Type *
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(CTA_CONFIG) as CtaType[]).map((t) => {
                const meta = CTA_CONFIG[t];
                const active = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "border px-2 py-2 text-center transition-colors",
                      active
                        ? "border-accent bg-accent/10"
                        : "border-border hover:bg-muted/60",
                    )}
                  >
                    <div className={cn("text-lg", CTA_TONE_CLASS[meta.tone])}>{meta.icon}</div>
                    <div className="font-mono uppercase tracking-wider text-[9px] mt-1">
                      {meta.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="font-mono uppercase tracking-wider text-[10px] text-foreground/70 mb-2">
              Priority *
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(PRIORITY_CONFIG) as CtaPriority[]).map((p) => {
                const meta = PRIORITY_CONFIG[p];
                const active = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      "border px-2 py-2 text-center font-mono uppercase tracking-wider text-[10px] transition-colors",
                      active ? "border-accent bg-accent/10" : "border-border hover:bg-muted/60",
                      meta.toneClass,
                    )}
                  >
                    ● {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-mono uppercase tracking-wider text-[10px] text-foreground/70">
                Account
              </div>
              <label className="text-[11px] text-foreground/70 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={portfolioWide}
                  onChange={(e) => setPortfolioWide(e.target.checked)}
                />
                Portfolio-wide
              </label>
            </div>
            {!portfolioWide ? (
              <select
                className="w-full border border-border bg-background px-3 py-2 text-sm"
                value={accountId ?? ""}
                onChange={(e) => {
                  const id = e.target.value || null;
                  setAccountId(id);
                  const opt = accountsQ.data?.find((a) => a.id === id);
                  setAccountName(opt?.name ?? null);
                }}
                disabled={!!defaultAccountId}
              >
                <option value="">Select an account…</option>
                {accountsQ.data?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          <div>
            <label className="text-[11px] text-foreground/70 flex items-center gap-2">
              <input
                type="checkbox"
                checked={assignSelf}
                onChange={(e) => setAssignSelf(e.target.checked)}
              />
              Assign to me
            </label>
          </div>

          <div>
            <Label htmlFor="cta-due" className="font-mono uppercase tracking-wider text-[10px]">
              Due
            </Label>
            <Input
              id="cta-due"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1"
            />
            <div className="flex gap-1 mt-2 flex-wrap">
              {DUE_QUICK.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() =>
                    setDueDate(
                      new Date(Date.now() + q.hours * 3600_000)
                        .toISOString()
                        .slice(0, 16),
                    )
                  }
                  className="border border-border px-2 py-1 font-mono uppercase tracking-wider text-[10px] hover:bg-muted/60"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="cta-desc" className="font-mono uppercase tracking-wider text-[10px]">
              Description
            </Label>
            <Textarea
              id="cta-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="pt-2 flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={submitDisabled()}
              className="bg-[color:var(--secondary-accent)] text-background hover:opacity-90"
            >
              {mutation.isPending ? "Raising…" : "Raise action →"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
