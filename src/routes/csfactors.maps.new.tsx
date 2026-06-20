import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { listAccounts, type CSAccount } from "@/lib/csfactors.functions";
import { DEFAULT_PHASES, benchmarkTtvFor } from "@/lib/maps-defaults";
import { createMap } from "@/lib/maps.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Plus, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/csfactors/maps/new")({
  head: () => ({ meta: [{ title: "Create MAP — CSFactors" }] }),
  component: NewMap,
});

type PhaseDraft = {
  title: string;
  color: string;
  is_value_milestone: boolean;
  milestones: {
    title: string;
    owner: "csm" | "customer" | "shared";
    due_days_from_start: number;
    health_score_impact: number;
  }[];
};

function NewMap() {
  const router = useRouter();
  const accountsFn = useServerFn(listAccounts);
  const createFn = useServerFn(createMap);
  const { data: accounts = [] } = useQuery({ queryKey: ["new-map-accounts"], queryFn: () => accountsFn() });

  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState("");
  const [accountQuery, setAccountQuery] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<CSAccount | null>(null);
  const [contractStart, setContractStart] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [manualBenchmark, setManualBenchmark] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const benchmark = useMemo(() => {
    if (selectedAccount) return benchmarkTtvFor(selectedAccount.tier, selectedAccount.industry);
    return typeof manualBenchmark === "number" ? manualBenchmark : null;
  }, [selectedAccount, manualBenchmark]);

  const [phases, setPhases] = useState<PhaseDraft[]>(() =>
    DEFAULT_PHASES.map((p) => ({
      title: p.title,
      color: p.color,
      is_value_milestone: p.is_value_milestone,
      milestones: p.default_milestones.map((m) => ({
        title: m.title,
        owner: m.owner,
        due_days_from_start: m.due_days,
        health_score_impact: m.health_score_impact ?? 0,
      })),
    })),
  );

  const filteredAccounts = accounts
    .filter((a) => !accountQuery || a.name.toLowerCase().includes(accountQuery.toLowerCase()))
    .slice(0, 6);

  const canContinue = title.trim().length > 0 && selectedAccount && contractStart;

  async function handleCreate() {
    if (!selectedAccount) return;
    setSaving(true);
    setError(null);
    try {
      const res = await createFn({
        data: {
          title,
          account_id: selectedAccount.id,
          account_name: selectedAccount.name,
          account_tier: selectedAccount.tier,
          account_industry: selectedAccount.industry,
          contract_start_date: contractStart || null,
          target_value_date: targetValue || null,
          customer_email: customerEmail || null,
          benchmark_ttv_days: benchmark,
          phases,
        },
      });
      router.navigate({ to: "/csfactors/maps/$id", params: { id: res.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create MAP");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link to="/csfactors/maps" className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground hover:text-accent inline-flex items-center gap-1 mb-6">
          <ArrowLeft className="h-3 w-3" /> All MAPs
        </Link>
        <h1 className="font-display text-2xl md:text-3xl tracking-tight mb-1">Create Mutual Action Plan</h1>
        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent mb-8">
          Step {step} of 2 — {step === 1 ? "Account & Timeline" : "Milestone Plan"}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <Field label="MAP Title *">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Northbridge Global — Onboarding Q3"
                className="rounded-none"
              />
            </Field>

            <Field label="Account *">
              <Input
                value={selectedAccount ? selectedAccount.name : accountQuery}
                onChange={(e) => { setSelectedAccount(null); setAccountQuery(e.target.value); }}
                placeholder="Search accounts…"
                className="rounded-none"
              />
              {!selectedAccount && accountQuery && filteredAccounts.length > 0 && (
                <div className="border border-border bg-card mt-1">
                  {filteredAccounts.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => { setSelectedAccount(a); setAccountQuery(""); }}
                      className="w-full text-left p-2 hover:bg-muted flex justify-between items-center"
                    >
                      <span className="font-serif text-sm">{a.name}</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                        {a.tier} · ARR ${a.arr.toLocaleString()} · health {a.health}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Contract Start Date *">
                <Input type="date" value={contractStart} onChange={(e) => setContractStart(e.target.value)} className="rounded-none" />
              </Field>
              <Field label="Target Value Date">
                <Input type="date" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className="rounded-none" />
              </Field>
            </div>

            <Field label="Customer Email">
              <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="champion@customer.com" className="rounded-none" />
            </Field>

            {selectedAccount ? (
              <div className="border border-accent/40 bg-accent/5 p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
                  Benchmark TTV for {selectedAccount.tier}{selectedAccount.industry ? ` · ${selectedAccount.industry}` : ""}: {benchmark} days
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground mt-1">
                  Source: The CS Quarterly Retention Ledger
                </div>
              </div>
            ) : (
              <Field label="Benchmark TTV (days)">
                <Input
                  type="number"
                  value={manualBenchmark}
                  onChange={(e) => setManualBenchmark(e.target.value === "" ? "" : Number(e.target.value))}
                  className="rounded-none"
                />
              </Field>
            )}

            <div className="flex justify-end">
              <Button
                disabled={!canContinue}
                onClick={() => setStep(2)}
                className="rounded-none bg-accent text-accent-foreground hover:bg-accent/90 font-mono uppercase tracking-[0.22em] text-xs"
              >
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="border border-accent/30 p-4" style={{ background: "linear-gradient(135deg, hsl(var(--card)), hsl(var(--muted)))" }}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-3 w-3 text-accent" />
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">Lumi</span>
              </div>
              <p className="font-serif text-sm text-foreground/80">
                Based on {selectedAccount?.name}'s tier, industry, and your benchmark TTV of {benchmark} days, Lumi has configured a starting milestone plan. Edit any phase or milestone before saving.
              </p>
            </div>

            <div className="space-y-4">
              {phases.map((phase, pi) => (
                <PhaseBlock
                  key={pi}
                  phase={phase}
                  onChange={(updated) => setPhases((prev) => prev.map((p, i) => (i === pi ? updated : p)))}
                  onDelete={() => setPhases((prev) => prev.filter((_, i) => i !== pi))}
                />
              ))}
              <button
                type="button"
                onClick={() => setPhases((p) => [...p, { title: "NEW PHASE", color: "#C4A45A", is_value_milestone: false, milestones: [] }])}
                className="w-full border border-dashed border-border p-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground hover:text-accent hover:border-accent"
              >
                + Add phase
              </button>
            </div>

            {error && <div className="text-destructive font-mono text-xs">{error}</div>}

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)} className="rounded-none font-mono uppercase tracking-[0.22em] text-xs">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <Button
                disabled={saving}
                onClick={handleCreate}
                className="rounded-none bg-accent text-accent-foreground hover:bg-accent/90 font-mono uppercase tracking-[0.22em] text-xs"
              >
                {saving ? "Creating…" : "Create MAP"} <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">{label}</div>
      {children}
    </div>
  );
}

const OWNER_CYCLE: Array<"csm" | "customer" | "shared"> = ["csm", "customer", "shared"];
const OWNER_CLS: Record<string, string> = {
  csm: "bg-secondary-accent/20 text-secondary-accent border-secondary-accent/40",
  customer: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40",
  shared: "bg-accent/15 text-accent border-accent/40",
};

function PhaseBlock({ phase, onChange, onDelete }: { phase: PhaseDraft; onChange: (p: PhaseDraft) => void; onDelete: () => void }) {
  return (
    <div className="border border-border bg-card" style={{ borderLeft: `4px solid ${phase.color}` }}>
      <div className="flex items-center gap-3 p-3 border-b border-border">
        <input
          value={phase.title}
          onChange={(e) => onChange({ ...phase, title: e.target.value })}
          className="bg-transparent font-mono text-[11px] uppercase tracking-[0.22em] font-semibold flex-1 outline-none"
        />
        {phase.is_value_milestone && (
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-accent border border-accent/40 px-2 py-0.5">
            Value Milestone
          </span>
        )}
        <button
          type="button"
          onClick={() => onChange({
            ...phase,
            milestones: [...phase.milestones, { title: "New milestone", owner: "shared", due_days_from_start: 0, health_score_impact: 0 }],
          })}
          className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground hover:text-accent"
        >
          + Add milestone
        </button>
        <button type="button" onClick={() => { if (confirm("Delete this phase?")) onDelete(); }} className="text-muted-foreground hover:text-destructive">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="divide-y divide-border/60">
        {phase.milestones.map((m, mi) => (
          <div key={mi} className="flex items-center gap-2 p-2">
            <input
              value={m.title}
              onChange={(e) => onChange({ ...phase, milestones: phase.milestones.map((x, i) => i === mi ? { ...x, title: e.target.value } : x) })}
              className="bg-transparent text-sm flex-1 outline-none"
            />
            <button
              type="button"
              onClick={() => {
                const next = OWNER_CYCLE[(OWNER_CYCLE.indexOf(m.owner) + 1) % 3];
                onChange({ ...phase, milestones: phase.milestones.map((x, i) => i === mi ? { ...x, owner: next } : x) });
              }}
              className={cn("font-mono text-[9px] uppercase tracking-[0.22em] border px-2 py-0.5", OWNER_CLS[m.owner])}
            >
              {m.owner}
            </button>
            <input
              type="number"
              value={m.due_days_from_start}
              onChange={(e) => onChange({ ...phase, milestones: phase.milestones.map((x, i) => i === mi ? { ...x, due_days_from_start: Number(e.target.value) } : x) })}
              className="bg-transparent font-mono text-[10px] w-16 border border-border px-1"
              title="Due days from contract start"
            />
            {phase.is_value_milestone && (
              <input
                type="number"
                value={m.health_score_impact}
                onChange={(e) => onChange({ ...phase, milestones: phase.milestones.map((x, i) => i === mi ? { ...x, health_score_impact: Number(e.target.value) } : x) })}
                className="bg-transparent font-mono text-[10px] w-14 border border-accent/40 px-1 text-accent"
                title="Health pts"
              />
            )}
            <button
              type="button"
              onClick={() => onChange({ ...phase, milestones: phase.milestones.filter((_, i) => i !== mi) })}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
