import { useState } from "react";
import { Calendar, UserCheck, Milestone, FileText, Copy, Check } from "lucide-react";

export default function OnboardingPlaybook() {
  const [clientName, setClientName] = useState("Acme Corporation");
  const [uccCode, setUccCode] = useState("UCC-9482");
  const [csmName, setCsmName] = useState("Shashwath Rao");
  const [copied, setCopied] = useState(false);

  const script = `Subject: Technical Implementation Sign-Off & Operational Handover — ${clientName} (${uccCode})

Executive Summary:
As of today, the implementation framework has successfully completed Phase 3 testing parameters. System architecture is active on Server Node: Production-Cluster-Alpha inside the primary regional data cluster.

Key Value Accomplished:
- Legacy Infrastructure Migration: 100% Data Parity Achieved.
- Final Functional Implementation Progress Vector: 100%.

Operational ownership is now officially transitioned to your designated Account Management team led by ${csmName}.`;

  const phases = [
    { range: "Days 1-30", muted: true, Icon: UserCheck, title: "Phase 1: Foundation", desc: "Complete data migrations, structure validation mappings, and configure backend API connections." },
    { range: "Days 31-60", muted: false, Icon: Milestone, title: "Phase 2: First-Value", desc: "Validate live system pipelines, verify user data sync scripts, and cross the 40% active adoption threshold." },
    { range: "Days 61-90", muted: true, Icon: FileText, title: "Phase 3: Handover", desc: "Secure executive sign-off, verify realized ROI baselines, and bridge accounts to account management loops." },
  ];

  return (
    <div className="w-full border border-border bg-card rounded-lg p-6 not-prose">
      <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
        <Calendar className="h-6 w-6 text-foreground/70" />
        <h2 className="text-xl font-display font-semibold">The 90-Day High-Touch Onboarding Playbook</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {phases.map((p) => (
          <div key={p.title} className="p-4 bg-muted/40 border border-border rounded-lg relative">
            <div className={`absolute top-3 right-3 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${p.muted ? "bg-muted text-foreground/70" : "bg-foreground text-background"}`}>
              {p.range}
            </div>
            <p.Icon className="h-5 w-5 text-foreground/70 mb-2" />
            <h4 className="font-display font-semibold text-sm mb-1">{p.title}</h4>
            <p className="text-xs text-foreground/65">{p.desc}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-border pt-6">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-4">Automated Handover Communication Suite</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input value={clientName} onChange={(e) => setClientName(e.target.value)} className="px-3 py-2 border border-border rounded text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
          <input value={uccCode} onChange={(e) => setUccCode(e.target.value)} className="px-3 py-2 border border-border rounded text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
          <input value={csmName} onChange={(e) => setCsmName(e.target.value)} className="px-3 py-2 border border-border rounded text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div className="relative bg-foreground text-background p-4 rounded font-mono text-xs whitespace-pre-wrap leading-relaxed">
          {script}
          <button
            onClick={() => {
              navigator.clipboard.writeText(script);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="absolute top-3 right-3 p-1.5 bg-background/15 hover:bg-background/25 rounded transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
