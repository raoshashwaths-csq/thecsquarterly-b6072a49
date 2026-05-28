import { useState, useMemo } from "react";
import { Cpu, ChevronRight, BarChart3 } from "lucide-react";

export default function AiReadinessDiagnostic() {
  const [infraScore, setInfraScore] = useState(70);
  const [dataScore, setDataScore] = useState(65);
  const [secScore, setSecScore] = useState(85);

  const rAi = useMemo(() => Math.pow(infraScore * dataScore * secScore, 1 / 3), [infraScore, dataScore, secScore]);

  const pillars = [
    { title: "1. Infrastructure Pillars", items: ["ERP Architecture Mapping", "CRM Engine Adaptability", "Ingestion Endpoint Performance"], value: infraScore, set: setInfraScore },
    { title: "2. Data Cleanliness Pools", items: ["Schema Match Indexing", "Field Density Sufficiency", "Record Age & Chronology"], value: dataScore, set: setDataScore },
    { title: "3. Governance & Security", items: ["Server Node Localization", "Data Isolation Safeguards", "Multi-Tenant Verification"], value: secScore, set: setSecScore },
  ];

  const months = [
    { title: "Month 1: Structural Audit", desc: "Identify and correct missing data fields or discrepancies inside disconnected legacy tracking structures." },
    { title: "Month 2: Sync Streamlining", desc: "Deploy automation scripts to unify database objects and secure consistent real-time operational integration." },
    { title: "Month 3: Test Validation", desc: "Execute isolated test runs across standalone nodes to confirm system throughput without performance drag." },
  ];

  return (
    <div className="w-full border border-border bg-card rounded-lg p-6 not-prose">
      <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
        <Cpu className="h-6 w-6 text-foreground/70" />
        <h2 className="text-xl font-display font-semibold">CS AI Readiness Evaluation Engine</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {pillars.map((p) => (
          <div key={p.title} className="space-y-4 bg-muted/40 p-4 border border-border rounded-lg">
            <div className="text-sm font-display font-semibold">{p.title}</div>
            <div className="space-y-2 text-xs text-foreground/65">
              {p.items.map((i) => <div key={i}>• {i}</div>)}
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-muted-foreground">Score</span>
              <span className="font-bold">{p.value}</span>
            </div>
            <input type="range" min="0" max="100" value={p.value} onChange={(e) => p.set(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
          </div>
        ))}
      </div>
      <div className="p-6 bg-foreground text-background rounded-lg flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
        <div>
          <h3 className="text-lg font-display font-semibold">Geometric Ingestion Score (R_AI)</h3>
          <p className="text-xs opacity-60 mt-1">Calculated geometric baseline across core capability matrix parameters.</p>
        </div>
        <div className="text-5xl font-display font-semibold md:border-l border-background/20 md:pl-6">
          {rAi.toFixed(1)}
        </div>
      </div>
      <div className="border border-border rounded-lg p-5">
        <h4 className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3 flex items-center gap-1">
          <BarChart3 className="h-3.5 w-3.5" /> 90-Day Remediation Playbook
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {months.map((m) => (
            <div key={m.title} className="p-3 border border-border rounded bg-muted/40">
              <div className="font-display font-semibold mb-1 flex items-center gap-1">
                <ChevronRight className="h-3 w-3" /> {m.title}
              </div>
              <p className="text-foreground/70">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
