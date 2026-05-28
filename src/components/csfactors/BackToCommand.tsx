import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function BackToCommand({ label = "Back to CSFactors" }: { label?: string }) {
  return (
    <Link
      to="/csfactors"
      className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-accent border-b border-transparent hover:border-accent pb-0.5 mb-6"
    >
      <ArrowLeft className="h-3 w-3" />
      {label}
    </Link>
  );
}
