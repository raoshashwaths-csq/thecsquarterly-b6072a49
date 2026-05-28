import { useState } from "react";
import { ShieldAlert, AlertCircle, Check, Copy } from "lucide-react";

const rows = [
  { code: "ERR-01", trigger: "Implementation Stagnation > 14 Days", path: "Escalate ticket routing arrays immediately.", tone: "text-destructive" },
  { code: "ERR-02", trigger: "Executive Champion Departure", path: "Activate executive alignment bridges.", tone: "text-secondary-accent" },
  { code: "ERR-03", trigger: "CSM Sentiment Drops to Critical", path: "Schedule executive turnaround triage intervention.", tone: "text-destructive" },
  { code: "ERR-04", trigger: "CARR vs Invoiced Balance Mismatch", path: "Execute comprehensive contract terms audit.", tone: "text-foreground/70" },
];

export default function ChurnEarlyWarningSystem() {
  const [sponsorName, setSponsorName] = useState("Alexander Vance");
  const [renewalDate, setRenewalDate] = useState("October 31, 2026");
  const [copied, setCopied] = useState(false);

  const emailBody = `Subject: Uncomfortable question regarding our partnership framework at Account Space

Dear ${sponsorName},

Given that we are now exactly 60 days out from your contractual renewal marker on ${renewalDate}, I am going to be completely direct with you.

Looking at our internal performance analytics—specifically our implementation metrics and our core integration path—it likely feels like our platform has fallen short of the operational value metrics we promised during your evaluation phase. You probably feel that your team's internal feedback hasn't been addressed quickly enough, and that keeping this partnership active next year is a misuse of your operating budget.

If you have already decided to terminate our contract, please let me know so we can coordinate a clean offboarding data dump. If not, can we schedule an aggressive 15-minute engineering alignment call this Thursday with our leadership team to reset our deployment strategy?`;

  return (
    <div className="w-full border border-border bg-card rounded-lg p-6 not-prose">
      <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
        <ShieldAlert className="h-6 w-6 text-foreground/70" />
        <h2 className="text-xl font-display font-semibold">Churn Early Warning System (CEWS)</h2>
      </div>
      <div className="border border-border rounded-lg overflow-hidden mb-6">
        <table className="w-full text-left border-collapse text-xs md:text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <th className="p-3">Risk Code</th>
              <th className="p-3">Trigger Parameter</th>
              <th className="p-3">Remediation Path</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.code}>
                <td className="p-3 font-mono font-bold text-foreground">{r.code}</td>
                <td className="p-3 text-foreground/80">{r.trigger}</td>
                <td className={`p-3 font-medium ${r.tone}`}>{r.path}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-muted/40 p-5 border border-border rounded-lg">
        <div className="flex items-center gap-2 mb-4 font-mono text-xs uppercase tracking-[0.25em] text-foreground/80">
          <AlertCircle className="h-4 w-4" /> Accusation Audit Intervention Script
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Executive Sponsor Name</label>
            <input value={sponsorName} onChange={(e) => setSponsorName(e.target.value)} className="w-full px-3 py-1.5 border border-border rounded text-sm bg-background" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Maturity Date Anchor</label>
            <input value={renewalDate} onChange={(e) => setRenewalDate(e.target.value)} className="w-full px-3 py-1.5 border border-border rounded text-sm bg-background" />
          </div>
        </div>
        <div className="relative bg-background border border-border rounded p-4 text-xs font-mono whitespace-pre-wrap leading-relaxed">
          {emailBody}
          <button
            onClick={() => {
              navigator.clipboard.writeText(emailBody);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-foreground text-background rounded text-xs font-sans hover:opacity-90 transition-opacity"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy email"}
          </button>
        </div>
      </div>
    </div>
  );
}
