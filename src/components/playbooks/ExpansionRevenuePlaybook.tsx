import { useState } from "react";
import { TrendingUp, Users, Network, Copy, Check } from "lucide-react";

export default function ExpansionRevenuePlaybook() {
  const [headcount, setHeadcount] = useState("240");
  const [erpSystem, setErpSystem] = useState("SAP S/4HANA");
  const [copied, setCopied] = useState(false);

  const script = `Subject: Operational Capacity Warning for Account Record

Hi Partnership Team,

I am reaching out because your organization's recent growth has triggered an automated capacity check in our system.

Our performance dashboard shows your global team has scaled to ${headcount} active personnel records. This growth path means your current user seat allocation is approaching its technical limit, which could slow down your core integration paths with ${erpSystem}.

To avoid system limits and protect your current setup velocity, I have put together an expansion profile that matches your regional infrastructure configuration. I've attached a board-ready proposal that expands your seat capacity and adds advanced data capabilities for your next contract period. Can we jump on a brief 10-minute strategy call this Tuesday at 2:00 PM to review the deployment options?`;

  const stakeholders = [
    { role: "Economic Buyer (C-Suite)", argument: "Hard-dollar business unit return modeling and macro NRR stabilization." },
    { role: "Operational Champion (Director)", argument: "Efficiency multipliers, systemic capacity scaling, and cross-team execution paths." },
    { role: "Daily Practitioners (CSMs/End Users)", argument: "Interface ergonomics, automated reporting templates, and workflow time optimization." },
  ];

  const motions = [
    { rank: "Rank 1: Seat Headcount Scaling", impact: "CARR Lift Alpha" },
    { rank: "Rank 2: Cross-Platform Module Bundling", impact: "Total Contract Margin Max" },
    { rank: "Rank 3: Premium Node Infrastructure Upgrades", impact: "Dedicated Server Node Footprints" },
    { rank: "Rank 4: Premium Operations Service Tiers", impact: "Managed Execution Services" },
  ];

  return (
    <div className="w-full border border-border bg-card rounded-lg p-6 not-prose">
      <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
        <TrendingUp className="h-6 w-6 text-foreground/70" />
        <h2 className="text-xl font-display font-semibold">The Expansion Revenue Playbook (120%+ NRR)</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-5 border border-border bg-muted/40 rounded-lg">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/80 mb-3 flex items-center gap-1.5">
            <Network className="h-4 w-4" /> Purchasing Stakeholder Hierarchy
          </h3>
          <div className="space-y-3 text-xs">
            {stakeholders.map((s) => (
              <div key={s.role} className="p-2.5 bg-background border border-border rounded">
                <span className="font-display font-semibold text-sm">{s.role}</span>
                <p className="text-muted-foreground mt-0.5">{s.argument}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 border border-border bg-muted/40 rounded-lg">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/80 mb-3 flex items-center gap-1.5">
            <Users className="h-4 w-4" /> Expansion Motion Matrix
          </h3>
          <div className="space-y-2 text-xs">
            {motions.map((m) => (
              <div key={m.rank} className="p-2 bg-background border border-border rounded flex justify-between gap-2">
                <span className="font-medium">{m.rank}</span>
                <span className="text-muted-foreground text-right">{m.impact}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border pt-6">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-4">Trigger-Based Account-Expansion Dispatch Script</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Active Headcount</label>
            <input value={headcount} onChange={(e) => setHeadcount(e.target.value)} className="w-full px-3 py-1.5 border border-border rounded text-sm bg-background" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Active ERP System</label>
            <input value={erpSystem} onChange={(e) => setErpSystem(e.target.value)} className="w-full px-3 py-1.5 border border-border rounded text-sm bg-background" />
          </div>
        </div>
        <div className="relative bg-muted/40 border border-border rounded p-4 text-xs font-mono whitespace-pre-wrap leading-relaxed">
          {script}
          <button
            onClick={() => {
              navigator.clipboard.writeText(script);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-foreground text-background rounded text-[10px] font-sans hover:opacity-90"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy dispatch"}
          </button>
        </div>
      </div>
    </div>
  );
}
