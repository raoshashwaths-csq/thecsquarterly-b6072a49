import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

export type PaywallProps = {
  oneOffLabel: string;
  oneOffPriceCents: number;
  onBuyOneOff?: () => void;
  buyDisabled?: boolean;
  subtitle?: string;
  variant?: "inline" | "card";
};

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

export function Paywall({
  oneOffLabel,
  oneOffPriceCents,
  onBuyOneOff,
  buyDisabled,
  subtitle,
  variant = "inline",
}: PaywallProps) {
  return (
    <div
      className={
        variant === "card"
          ? "bg-foreground text-background p-8 md:p-10 border border-foreground"
          : "bg-foreground text-background p-8 md:p-10 my-12"
      }
    >
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-secondary-accent mb-4">
        <Lock size={12} />
        <span>Premium · Locked</span>
      </div>
      <h3 className="font-display text-2xl md:text-3xl mb-3 leading-tight">{oneOffLabel}</h3>
      {subtitle && <p className="text-background/70 text-sm mb-6 max-w-prose">{subtitle}</p>}
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <button
          type="button"
          onClick={onBuyOneOff}
          disabled={buyDisabled}
          className="border border-background/40 hover:bg-background hover:text-foreground transition-all py-4 px-6 text-left disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="font-mono uppercase tracking-widest text-xs opacity-60 mb-1">A la carte</div>
          <div className="font-display text-2xl">{formatPrice(oneOffPriceCents)} <span className="text-sm opacity-60">one-time</span></div>
          <div className="text-xs opacity-70 mt-1">Unlock this asset only.</div>
        </button>
        <Link
          to="/pricing"
          className="bg-secondary-accent text-secondary-accent-foreground py-4 px-6 hover:opacity-90 transition-all"
        >
          <div className="font-mono uppercase tracking-widest text-xs mb-1">Vanguard, from $29</div>
          <div className="font-display text-2xl">Unlock everything</div>
          <div className="text-xs mt-1 opacity-90">
            Full archive + universal search from Vanguard. Your Workspace + local saved-intel search from Pro upwards.
          </div>
        </Link>
      </div>
    </div>
  );
}

export function BlurredTeaser({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="select-none pointer-events-none blur-md opacity-70">{children}</div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
    </div>
  );
}
