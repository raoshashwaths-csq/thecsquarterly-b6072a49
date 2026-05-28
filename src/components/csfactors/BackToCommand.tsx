import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function BackToCommand({ label = "Back to CSFactors" }: { label?: string }) {
  return (
    <Link
      to="/csfactors"
      className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.22em] text-foreground bg-card border border-border px-3 py-2 hover:border-accent hover:text-accent transition-colors mb-6"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}
