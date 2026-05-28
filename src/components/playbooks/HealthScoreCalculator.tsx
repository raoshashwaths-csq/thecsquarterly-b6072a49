import { useState, useMemo } from "react";
import { AlertTriangle, CheckCircle, Calculator } from "lucide-react";

export default function HealthScoreCalculator() {
  const [productUsage, setProductUsage] = useState(75);
  const [implProgress, setImplProgress] = useState(60);
  const [csmSentiment, setCsmSentiment] = useState(70);
  const [commercialExp, setCommercialExp] = useState(80);

  const hComp = useMemo(
    () => productUsage * 0.25 + implProgress * 0.25 + csmSentiment * 0.3 + commercialExp * 0.2,
    [productUsage, implProgress, csmSentiment, commercialExp]
  );

  const status =
    hComp < 55
      ? { label: "High Risk: Pre-emptive Alert", cls: "text-destructive border-destructive/40 bg-destructive/10", Icon: AlertTriangle }
      : hComp < 75
      ? { label: "Medium Risk: Needs Remediation", cls: "text-secondary-accent border-secondary-accent/40 bg-secondary-accent/10", Icon: AlertTriangle }
      : { label: "Healthy / Acceleration Ready", cls: "text-emerald-600 dark:text-emerald-400 border-emerald-500/40 bg-emerald-500/10", Icon: CheckCircle };

  const Slider = ({ label, value, set }: { label: string; value: number; set: (n: number) => void }) => (
    <div>
      <div className="flex justify-between mb-2">
        <label className="text-sm font-medium text-foreground/80">{label}</label>
        <span className="text-sm font-bold text-foreground">{value}%</span>
      </div>
      <input type="range" min="0" max="100" value={value} onChange={(e) => set(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
    </div>
  );

  return (
    <div className="w-full border border-border bg-card rounded-lg p-6 not-prose">
      <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
        <Calculator className="h-6 w-6 text-foreground/70" />
        <h2 className="text-xl font-display font-semibold">CS Health Score Calculator</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Slider label="Product Usage Intensity (w1: 25%)" value={productUsage} set={setProductUsage} />
          <Slider label="Implementation Progress (w2: 25%)" value={implProgress} set={setImplProgress} />
          <Slider label="CSM Sentiment & NPS (w3: 30%)" value={csmSentiment} set={setCsmSentiment} />
          <Slider label="Commercial & Legal Exposure (w4: 20%)" value={commercialExp} set={setCommercialExp} />
        </div>
        <div className="flex flex-col justify-between p-6 bg-muted/40 border border-border rounded-lg gap-4">
          <div className="text-center py-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Composite Health Index</span>
            <div className="text-6xl font-display font-semibold mt-2">{hComp.toFixed(1)}</div>
          </div>
          <div className={`flex items-center gap-3 p-4 border rounded ${status.cls}`}>
            <status.Icon className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-semibold">{status.label}</span>
          </div>
          <div className="font-mono text-[10px] text-muted-foreground bg-background/60 p-3 rounded border border-border">
            <strong>Formula:</strong> H_comp = 0.25P + 0.25T + 0.30S + 0.20C
          </div>
        </div>
      </div>
    </div>
  );
}
