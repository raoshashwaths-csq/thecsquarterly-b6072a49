import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/csfactors")({
  head: () => ({
    meta: [
      { title: "CSFactors — CS Quarterly Executive Pulse" },
      {
        name: "description",
        content:
          "Executive dashboard for current-quarter revenue protection and QBR tracking. Gainsight depth meets Totango agility.",
      },
      { property: "og:title", content: "CSFactors — Executive Pulse" },
      {
        property: "og:description",
        content: "Cross-platform CS executive dashboard for revenue protection and QBR tracking.",
      },
    ],
    links: [{ rel: "canonical", href: "/csfactors" }],
  }),
  component: CSFactorsPage,
});

type QBRStatus = "Completed" | "Scheduled" | "Overdue";
type Tier = "Enterprise" | "Mid-Market" | "SMB";

type Account = {
  id: string;
  name: string;
  tier: Tier;
  arr: number;
  health: number;
  qbr: QBRStatus;
  renewal: string;
};

const INITIAL: Account[] = [
  { id: "1", name: "Acme Corp",         tier: "Enterprise", arr: 120_000, health: 84, qbr: "Completed", renewal: "Q3-2026" },
  { id: "2", name: "Stark Industries",  tier: "Enterprise", arr: 450_000, health: 42, qbr: "Overdue",   renewal: "Q2-2026" },
  { id: "3", name: "Wayne Enterprises", tier: "Mid-Market", arr:  85_000, health: 68, qbr: "Scheduled", renewal: "Q2-2026" },
];

function formatCompact(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function formatFull(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}

function healthClasses(score: number) {
  if (score >= 75) return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40";
  if (score >= 50) return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40";
  return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40";
}

function qbrTextClasses(status: QBRStatus) {
  switch (status) {
    case "Completed": return "text-emerald-600 dark:text-emerald-400";
    case "Scheduled": return "text-amber-600 dark:text-amber-400";
    case "Overdue":   return "text-rose-600 dark:text-rose-400 underline underline-offset-4 decoration-rose-500/70";
  }
}

function CSFactorsPage() {
  const [accounts, setAccounts] = useState<Account[]>(INITIAL);

  const totalARR = useMemo(() => accounts.reduce((s, a) => s + a.arr, 0), [accounts]);
  const atRisk   = useMemo(() => accounts.filter(a => a.health < 50).reduce((s, a) => s + a.arr, 0), [accounts]);
  const compliance = useMemo(() => {
    if (!accounts.length) return 0;
    const done = accounts.filter(a => a.qbr === "Completed").length;
    return Math.round((done / accounts.length) * 100);
  }, [accounts]);

  function updateQBR(id: string, next: QBRStatus) {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, qbr: next } : a));
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="max-w-7xl w-full mx-auto px-6 pt-16 pb-24 animate-fade-up">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-12">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent font-semibold mb-4">
              CSFactors / Executive Console
            </div>
            <h1 className="font-display text-4xl md:text-6xl leading-[0.95] tracking-tight mb-4">
              CS Quarterly <span className="italic text-accent">Executive Pulse</span>
            </h1>
            <p className="max-w-2xl text-foreground/70 text-pretty">
              Cross-platform integration of Gainsight depth and Totango playbook agility.
            </p>
          </div>

          <div className="inline-flex items-center gap-3 self-start bg-accent text-accent-foreground px-5 py-3 border border-accent shadow-sm">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] opacity-80">Current Target</span>
            <span className="font-mono text-xs font-semibold tracking-wide">Q2-2026 Renewal Window</span>
          </div>
        </header>

        {/* Metric Pillars */}
        <section className="grid md:grid-cols-3 gap-px bg-border border border-border mb-12">
          {/* Card 1 */}
          <div className="bg-card p-7">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-4">
              Total Portfolio ARR
            </div>
            <div className="font-display text-5xl tracking-tight mb-3">
              {formatCompact(totalARR)}
            </div>
            <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              ↑ 12% vs previous quarter
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-card p-7 border-l-4 border-l-rose-600 relative">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-4">
              ARR At Immediate Risk
            </div>
            <div className="font-display text-5xl tracking-tight mb-3 text-rose-600 dark:text-rose-400">
              {formatCompact(atRisk)}
            </div>
            <div className="text-sm text-foreground/65">
              Accounts with health below 50
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-card p-7">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-4">
              QBR Compliance Rate
            </div>
            <div className="font-display text-5xl tracking-tight mb-4">
              {compliance}<span className="text-2xl text-muted-foreground">%</span>
            </div>
            <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
              <div
                className="h-full bg-accent transition-all duration-700 ease-out rounded-full"
                style={{ width: `${compliance}%` }}
              />
            </div>
          </div>
        </section>

        {/* Portfolio Grid */}
        <section className="border border-border bg-card">
          <div className="flex items-end justify-between px-6 pt-6 pb-4 border-b border-border">
            <div>
              <h2 className="font-display text-2xl tracking-tight">Portfolio & Execution Grid</h2>
              <p className="text-sm text-foreground/60 mt-1">
                Live override. Changes recalculate the pulse layer above instantly.
              </p>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {accounts.length} accounts in window
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  <th className="px-6 py-4 font-semibold">Account</th>
                  <th className="px-4 py-4 font-semibold">ARR (USD)</th>
                  <th className="px-4 py-4 font-semibold">Renewal Frame</th>
                  <th className="px-4 py-4 font-semibold text-center">Health Index</th>
                  <th className="px-4 py-4 font-semibold">QBR Alignment</th>
                  <th className="px-6 py-4 font-semibold text-right">Instant Playbook Override</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-display text-lg font-semibold leading-tight">{a.name}</div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                        {a.tier}
                      </div>
                    </td>
                    <td className="px-4 py-5 font-mono tabular-nums">
                      {formatFull(a.arr)}
                    </td>
                    <td className="px-4 py-5">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-foreground/80 font-mono text-[11px] tracking-wide border border-border">
                        {a.renewal}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-center">
                      <span className={`inline-flex min-w-14 justify-center items-center px-3 py-1.5 rounded-md border font-mono text-xs font-semibold tabular-nums transition-colors ${healthClasses(a.health)}`}>
                        {a.health}
                        <span className="opacity-50 ml-0.5">/100</span>
                      </span>
                    </td>
                    <td className={`px-4 py-5 font-mono text-xs font-semibold uppercase tracking-widest transition-colors ${qbrTextClasses(a.qbr)}`}>
                      {a.qbr}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end">
                        <Select
                          value={a.qbr}
                          onValueChange={(v) => updateQBR(a.id, v as QBRStatus)}
                        >
                          <SelectTrigger className="w-[200px] h-10 bg-background">
                            <SelectValue placeholder="Override…" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Completed">Mark Completed</SelectItem>
                            <SelectItem value="Scheduled">Mark Scheduled</SelectItem>
                            <SelectItem value="Overdue">Flag Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="font-mono text-[11px] uppercase tracking-widest border-b border-foreground/40 hover:text-accent hover:border-accent pb-1"
          >
            ← Return to The CS Quarterly
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
