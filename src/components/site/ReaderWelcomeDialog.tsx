import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { QMark } from "@/components/site/QMark";

const FEATURES: { title: string; body: string }[] = [
  { title: "Full Lumi runs", body: "Read any shared Lumi run end-to-end — diagnosis, playbook, executable." },
  { title: "The Vanguard briefing", body: "Tuesday dispatch delivered to your inbox, free." },
  { title: "Codex library", body: "Browse the operator codex — frameworks, definitions, escalation patterns." },
  { title: "Free diagnostic score", body: "Run the AI Readiness diagnostic and download a branded score sheet." },
  { title: "Retention Ledger ticker", body: "Live NRR / payback signals from the field, refreshed weekly." },
];

export function ReaderWelcomeDialog({
  open,
  onClose,
  firstName,
}: {
  open: boolean;
  onClose: () => void;
  firstName?: string;
}) {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (!open) return;
    setOpacity(1);
    const fade = window.setTimeout(() => setOpacity(0), 5500);
    const close = window.setTimeout(() => onClose(), 7500);
    return () => { window.clearTimeout(fade); window.clearTimeout(close); };
  }, [open, onClose]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="max-w-lg transition-opacity duration-[2000ms]"
        style={{ opacity }}
        onClick={onClose}
      >
        <div className="space-y-4 text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
            <QMark periodClassName="text-foreground" /> Reader access unlocked
          </div>
          <h2 className="font-display text-3xl tracking-tight">
            Welcome{firstName ? `, ${firstName}` : ""}<span className="text-accent">.</span>
          </h2>
          <p className="text-sm text-foreground/75">
            You can now read the rest of this Lumi run — and the rest of the operator stack below.
          </p>
          <ul className="text-left space-y-2 pt-2">
            {FEATURES.map((f) => (
              <li key={f.title} className="border-l-2 border-accent pl-3">
                <div className="font-display text-sm">{f.title}</div>
                <div className="text-xs text-foreground/65">{f.body}</div>
              </li>
            ))}
          </ul>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/50 pt-2">
            Tap anywhere to continue reading
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
