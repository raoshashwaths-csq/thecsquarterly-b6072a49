import { useState } from "react";
import { Presentation, Layers, Copy, Check } from "lucide-react";

const slides = [
  { id: 1, title: "01. Executive Summary", desc: "High-level summary of engagement milestones and NRR vector positions." },
  { id: 2, title: "02. Contract & CARR Baseline", desc: "Detailed breakdown of tracking matrices versus Invoiced ARR baselines." },
  { id: 3, title: "03. Realized Outcomes Scorecard", desc: "Hard business metrics comparing your baseline value versus actual performance gains.", template: "### Realized Outcomes vs Business Objectives\n\n- Business Metric Impacted: Processing & Deployment Velocity\n- Baseline Legacy Value: 14 Days configuration window\n- Realized Optimization Value: 2.8 Days total execution time\n- System Status Stage: Mainline Operations Production Live" },
  { id: 4, title: "04. License Consumption", desc: "Analysis of seat density limits and user capacity metrics across business units." },
  { id: 5, title: "05. Implementation Velocity", desc: "Time-to-value pipeline tracking from technical kickoff through production go-live." },
  { id: 6, title: "06. Technical Infrastructure", desc: "Operational performance audits covering database schemas and API latency lines." },
  { id: 7, title: "07. Stakeholder Power Map", desc: "Political mapping quadrants aligning your key champions and potential roadblocks." },
  { id: 8, title: "08. Industry Benchmarking", desc: "Comparing internal account metrics directly against global Retention Ledger trends." },
  { id: 9, title: "09. Churn Forensic Analysis", desc: "Pre-emptive auditing of systemic drop-off signals and mitigation triggers." },
  { id: 10, title: "10. Core ROI Computation", desc: "Financial return formulations showing the direct dollar value delivered by the asset.", template: "### Financial Value Realization Matrix\n\n- Invoiced Net ARR: $125,000\n- Calculated Hard Savings: $480,000 via manual hours optimized\n- Net ROI: (480000 - 125000) / 125000 * 100 = 284%\n- Verification Status: Validated by Finance Core" },
  { id: 11, title: "11. H2 Mutual Success Plan", desc: "Joint strategic timeline aligning upcoming corporate milestones with product execution steps." },
  { id: 12, title: "12. Renewal-Anchor Expansion", desc: "Mapping future expansion paths or modular bundles 180 days out from contract milestones.", template: "### Strategic Extension & Expansion Framework\n\n- Contractual Maturity Anchor: [Contract Renewal Date]\n- Current Footprint Profile: Base Platform Core + Infrastructure Pool\n- Expansion Pathway Vector: Cross-Platform Automation Suite\n- Target Expansion Value Impact: +$35,000 ARR Expansion Pipeline" },
];

export default function QbrDeckTemplatePack() {
  const [active, setActive] = useState(2);
  const [copied, setCopied] = useState(false);
  const current = slides[active];

  const copy = (t: string) => {
    navigator.clipboard.writeText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full border border-border bg-card rounded-lg p-6 not-prose">
      <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
        <Presentation className="h-6 w-6 text-foreground/70" />
        <h2 className="text-xl font-display font-semibold">QBR 12-Slide Strategic Template Pack</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-1 max-h-[450px] overflow-y-auto pr-2 md:border-r border-border">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActive(i)}
              className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                active === i ? "bg-foreground text-background font-medium" : "text-foreground/70 hover:bg-muted"
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
        <div className="md:col-span-2 bg-muted/40 p-6 border border-border rounded-lg flex flex-col justify-between min-h-[350px]">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground font-mono text-[10px] uppercase tracking-[0.25em] mb-2">
              <Layers className="h-3 w-3" /> Slide Preview
            </div>
            <h3 className="text-lg font-display font-semibold mb-2">{current.title}</h3>
            <p className="text-sm text-foreground/70 mb-4">{current.desc}</p>
            {current.template && (
              <pre className="bg-background border border-border rounded p-4 text-xs font-mono text-foreground/85 whitespace-pre-wrap overflow-x-auto">
                {current.template}
              </pre>
            )}
          </div>
          {current.template ? (
            <button
              onClick={() => copy(current.template!)}
              className="mt-4 flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium bg-background border border-border rounded hover:bg-muted text-foreground transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy slide raw text"}
            </button>
          ) : (
            <div className="mt-4 text-xs text-muted-foreground italic bg-background/50 p-2 rounded text-center border border-border">
              This slide is auto-assembled during PDF deck export.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
