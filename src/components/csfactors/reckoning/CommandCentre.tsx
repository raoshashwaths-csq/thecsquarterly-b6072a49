import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Copy, Link as LinkIcon, AlertTriangle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { MetricCard, MetricGrid } from "@/components/dashboard/MetricCard";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { ProgressGauge } from "@/components/dashboard/ProgressGauge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  listLedgerSummary,
  listRLAccounts,
  listSignals,
  listStakeholdersForAccount,
  createRLAccount,
  ensureValueMetric,
  logWin,
  createSignal,
  createShareLink,
  type RLSignal,
  type RLAccount,
} from "@/lib/reckoning.functions";
import { templatesFor, substitute, type TemplateState } from "@/lib/reckoning-templates";

function compact(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

const SEVERITY_CLASS: Record<string, string> = {
  High: "bg-destructive/15 text-destructive border-destructive/40",
  Medium: "bg-secondary-accent/15 text-secondary-accent border-secondary-accent/40",
  Low: "bg-accent/15 text-accent border-accent/40",
};

const SIGNAL_TYPES = [
  "Stakeholder_Departure",
  "Stakeholder_Promotion",
  "Competitor_Funding",
  "Competitor_Layoff",
  "Renewal_Window",
  "Expansion_Trigger",
  "Default",
];

export function CommandCentre() {
  const qc = useQueryClient();
  const _listLedger = useServerFn(listLedgerSummary);
  const _listAccs = useServerFn(listRLAccounts);
  const _listSignals = useServerFn(listSignals);

  const ledgerQ = useQuery({ queryKey: ["rl-ledger"], queryFn: () => _listLedger() });
  const accountsQ = useQuery({ queryKey: ["rl-accounts"], queryFn: () => _listAccs() });
  const signalsQ = useQuery({ queryKey: ["rl-signals"], queryFn: () => _listSignals() });

  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const selectedSignal = useMemo(
    () => signalsQ.data?.find((s) => s.id === selectedSignalId) ?? signalsQ.data?.[0] ?? null,
    [signalsQ.data, selectedSignalId],
  );

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["rl-ledger"] });
    qc.invalidateQueries({ queryKey: ["rl-accounts"] });
    qc.invalidateQueries({ queryKey: ["rl-signals"] });
  };

  const cumulative = ledgerQ.data?.cumulativeValue ?? 0;
  const velocity = ledgerQ.data?.velocityPct ?? 0;
  const velocityClamped = Math.max(0, Math.min(100, velocity + 50));

  return (
    <section className="mb-10" id="command-centre" data-tour="command-centre">
      <div className="mb-5 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="font-mono uppercase tracking-[0.3em] text-secondary-accent font-semibold mb-2 text-[11px]">
            CS Factors / Command Centre
          </div>
          <h2 className="font-display text-3xl md:text-4xl tracking-tight">
            The Reckoning Ledger.
          </h2>
          <p className="text-sm text-foreground/65 mt-2 max-w-2xl">
            Every minute saved, every dollar protected, every signal that matters — quantified, attributed, and ready to act on.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LogWinDialog accounts={accountsQ.data ?? []} onCreated={invalidateAll} />
          <AddAccountDialog onCreated={invalidateAll} />
        </div>
      </div>

      <MetricGrid cols={2} className="gap-4 md:gap-px mb-6">
        <MetricCard
          eyebrow="Cumulative Value Realized"
          value={ledgerQ.isLoading ? "…" : compact(cumulative)}
          accent="accent"
          trend={ledgerQ.data?.totalEntries ? `${ledgerQ.data.totalEntries} entries logged` : "Log your first win"}
          trendDirection={cumulative > 0 ? "up" : "flat"}
        />
        <MetricCard
          eyebrow="QoQ Value Velocity"
          value={`${velocity >= 0 ? "+" : ""}${velocity}`}
          unit="%"
          accent={velocity >= 0 ? "success" : "danger"}
          footer={
            <ProgressGauge
              value={velocityClamped}
              accent={velocity >= 25 ? "success" : velocity >= 0 ? "secondary" : "danger"}
              sub={`This quarter: ${compact(ledgerQ.data?.currentQuarterValue ?? 0)} · Prior: ${compact(ledgerQ.data?.previousQuarterValue ?? 0)}`}
            />
          }
        />
      </MetricGrid>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-px">
        <div className="lg:col-span-5">
          <SectionCard
            title="Account & Competitor Radar"
            eyebrow="Signals"
            description="Inbound intelligence on stakeholders, competitors, and renewal triggers."
            actions={<AddSignalDialog accounts={accountsQ.data ?? []} onCreated={invalidateAll} />}
            className="h-full"
          >
            <SignalFeed
              signals={signalsQ.data ?? []}
              accounts={accountsQ.data ?? []}
              selectedId={selectedSignal?.id ?? null}
              onSelect={setSelectedSignalId}
              loading={signalsQ.isLoading}
            />
          </SectionCard>
        </div>
        <div className="lg:col-span-7">
          <ActionEngine
            signal={selectedSignal}
            account={
              selectedSignal
                ? accountsQ.data?.find((a) => a.id === selectedSignal.account_id) ?? null
                : null
            }
            calculatedValue={compact(cumulative)}
          />
        </div>
      </div>
    </section>
  );
}

// ---------------- Signal Feed ----------------
function SignalFeed({
  signals, accounts, selectedId, onSelect, loading,
}: {
  signals: RLSignal[];
  accounts: RLAccount[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}) {
  if (loading) return <p className="text-sm text-muted-foreground py-6">Loading signals…</p>;
  if (!signals.length) {
    return (
      <div className="py-10 text-center text-sm text-foreground/65">
        <AlertTriangle className="h-5 w-5 mx-auto mb-3 text-secondary-accent" />
        No signals yet. Log one to start feeding the engine.
      </div>
    );
  }
  const accMap = new Map(accounts.map((a) => [a.id, a.name]));
  return (
    <div className="max-h-[420px] overflow-y-auto -mx-1">
      <ul className="divide-y divide-border">
        {signals.map((s) => {
          const selected = s.id === selectedId;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                className={cn(
                  "w-full text-left px-3 py-3 hover:bg-muted/40 transition-colors flex gap-3 items-start",
                  selected && "bg-accent/5 border-l-2 border-l-accent",
                )}
              >
                <span
                  className={cn(
                    "shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] border px-1.5 py-0.5",
                    SEVERITY_CLASS[s.severity] ?? SEVERITY_CLASS.Medium,
                  )}
                >
                  {s.severity}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-display text-sm tracking-tight truncate">
                      {accMap.get(s.account_id) ?? "Unknown account"}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground shrink-0">
                      {s.signal_type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/70 mt-1 line-clamp-2">{s.description}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------- Action Engine ----------------
function ActionEngine({
  signal, account, calculatedValue,
}: {
  signal: RLSignal | null;
  account: RLAccount | null;
  calculatedValue: string;
}) {
  const _shareLink = useServerFn(createShareLink);
  const _stakeholders = useServerFn(listStakeholdersForAccount);
  const [state, setState] = useState<TemplateState>("A");

  const stakeholdersQ = useQuery({
    queryKey: ["rl-stakeholders", signal?.account_id ?? null],
    queryFn: () => _stakeholders({ data: { accountId: signal!.account_id } }),
    enabled: !!signal?.account_id,
  });

  const shareMut = useMutation({
    mutationFn: async (accountId: string) => _shareLink({ data: { accountId } }),
  });

  const templates = useMemo(() => signal ? templatesFor(signal.signal_type) : null, [signal]);
  const chosen = templates ? (state === "A" ? templates.A : templates.B) : null;

  const stakeholderFirst = stakeholdersQ.data?.[0]?.first_name ?? null;
  const body = chosen
    ? substitute(chosen.body, {
        accountName: account?.name,
        stakeholderFirstName: stakeholderFirst,
        calculatedValue,
        signalDescription: signal?.description,
        magicLinkUrl: shareMut.data?.url ?? null,
      })
    : "";

  function copy() {
    if (!body) return;
    navigator.clipboard.writeText(body);
    toast.success("Copied to clipboard");
  }

  async function share() {
    if (!signal) return;
    const res = await shareMut.mutateAsync(signal.account_id);
    navigator.clipboard.writeText(res.url);
    toast.message("Share link copied", {
      description: "Mock 7-day signed payload — endpoint stubbed.",
    });
  }

  return (
    <section className="border border-border bg-card h-full flex flex-col">
      <header className="px-4 md:px-6 pt-5 md:pt-6 pb-4 border-b border-border flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent font-semibold mb-2">
            The Action Engine
          </div>
          <h3 className="font-display text-xl md:text-2xl tracking-tight">
            {signal ? "Drafting your move." : "Select a signal."}
          </h3>
          {signal ? (
            <p className="text-xs text-foreground/60 mt-1">
              {account?.name ?? "Account"} · {signal.signal_type.replace(/_/g, " ")}
            </p>
          ) : null}
        </div>
        {signal ? (
          <div className="inline-flex border border-border">
            <button
              type="button"
              onClick={() => setState("A")}
              className={cn(
                "font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-1.5",
                state === "A" ? "bg-accent text-accent-foreground" : "hover:bg-muted",
              )}
            >
              State A · Defensive
            </button>
            <button
              type="button"
              onClick={() => setState("B")}
              className={cn(
                "font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 border-l border-border",
                state === "B" ? "bg-accent text-accent-foreground" : "hover:bg-muted",
              )}
            >
              State B · Offensive
            </button>
          </div>
        ) : null}
      </header>

      <div className="p-4 md:p-6 flex-1 flex flex-col gap-4">
        {!signal ? (
          <div className="py-16 text-center text-sm text-foreground/60">
            <Sparkles className="h-5 w-5 mx-auto mb-3 text-accent" />
            Pick a signal from the radar to draft a State A or State B response.
          </div>
        ) : (
          <>
            {chosen ? (
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {chosen.label}
              </div>
            ) : null}
            <Textarea
              value={body}
              onChange={() => { /* render-only */ }}
              readOnly
              className="font-mono text-xs bg-background border-border min-h-[280px] resize-none whitespace-pre-wrap"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="default" size="sm" onClick={copy} className="gap-1.5">
                <Copy className="h-3.5 w-3.5" /> Copy to Clipboard
              </Button>
              <Button variant="outline" size="sm" onClick={share} className="gap-1.5" disabled={shareMut.isPending}>
                <LinkIcon className="h-3.5 w-3.5" /> {shareMut.isPending ? "Generating…" : "Share Link"}
              </Button>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-secondary-accent border border-secondary-accent/40 px-1.5 py-0.5">
                MOCK
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// ---------------- Dialogs ----------------
function AddAccountDialog({ onCreated }: { onCreated: () => void }) {
  const _create = useServerFn(createRLAccount);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      await _create({
        data: {
          name: String(fd.get("name") ?? "").trim(),
          contractValue: Number(fd.get("contract") ?? 0) || 0,
        },
      });
      toast.success("Account added");
      onCreated();
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to add account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 font-mono uppercase tracking-[0.18em] text-[11px]">
          <Plus className="h-3.5 w-3.5" /> Account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Ledger Account</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Account name</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="contract">Contract value (USD)</Label>
            <Input id="contract" name="contract" type="number" min={0} defaultValue={0} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Add account"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LogWinDialog({ accounts, onCreated }: { accounts: RLAccount[]; onCreated: () => void }) {
  const _ensure = useServerFn(ensureValueMetric);
  const _log = useServerFn(logWin);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [accountId, setAccountId] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!accountId) return toast.error("Pick an account first");
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const metric = String(fd.get("metric") ?? "").trim() || "Hours Saved";
    const multiplier = Number(fd.get("multiplier") ?? 0) || 0;
    const qty = Number(fd.get("qty") ?? 0) || 0;
    const overrideRaw = String(fd.get("override") ?? "").trim();
    const override = overrideRaw === "" ? null : Number(overrideRaw);
    try {
      await _ensure({ data: { metricName: metric, hourlyMultiplier: multiplier } });
      await _log({
        data: {
          accountId,
          metricType: metric,
          quantityLogged: qty,
          financialValueOverride: override,
        },
      });
      toast.success("Win logged");
      onCreated();
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to log win");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 font-mono uppercase tracking-[0.18em] text-[11px]">
          <Plus className="h-3.5 w-3.5" /> Log a Win
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Log a Win</DialogTitle></DialogHeader>
        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add a Ledger Account first.</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger><SelectValue placeholder="Pick an account" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="metric">Metric name</Label>
                <Input id="metric" name="metric" defaultValue="Hours Saved" required />
              </div>
              <div>
                <Label htmlFor="multiplier">Hourly $ multiplier</Label>
                <Input id="multiplier" name="multiplier" type="number" min={0} defaultValue={150} />
              </div>
              <div>
                <Label htmlFor="qty">Quantity (hours / units)</Label>
                <Input id="qty" name="qty" type="number" min={0} defaultValue={0} required />
              </div>
              <div>
                <Label htmlFor="override">$ override (optional)</Label>
                <Input id="override" name="override" type="number" min={0} placeholder="Direct revenue" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Log win"}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AddSignalDialog({ accounts, onCreated }: { accounts: RLAccount[]; onCreated: () => void }) {
  const _create = useServerFn(createSignal);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [signalType, setSignalType] = useState("Default");
  const [severity, setSeverity] = useState<"High" | "Medium" | "Low">("Medium");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!accountId) return toast.error("Pick an account first");
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      await _create({
        data: {
          accountId,
          signalType,
          severity,
          description: String(fd.get("description") ?? "").trim(),
        },
      });
      toast.success("Signal logged");
      onCreated();
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 font-mono uppercase tracking-[0.18em] text-[11px]">
          <Plus className="h-3.5 w-3.5" /> Signal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Log Intelligence Signal</DialogTitle></DialogHeader>
        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add a Ledger Account first.</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger><SelectValue placeholder="Pick an account" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Signal type</Label>
                <Select value={signalType} onValueChange={setSignalType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SIGNAL_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Severity</Label>
                <Select value={severity} onValueChange={(v) => setSeverity(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" required rows={3} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Log signal"}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
