import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export function AnalyticsShell({
  eyebrow,
  title,
  description,
  children,
  actions,
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-10 pt-8 md:pt-12 pb-24 animate-fade-up">
        <Link
          to="/account/analytics"
          className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-accent mb-6"
        >
          <ArrowLeft className="h-3 w-3" />
          All analytics
        </Link>
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-6 mb-8 md:mb-12 pb-6 border-b border-border">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-secondary-accent font-semibold mb-3">
              {eyebrow}
            </div>
            <h1 className="font-display text-3xl md:text-5xl leading-[0.95] tracking-tight text-balance">
              {title}
            </h1>
            <p className="text-foreground/70 mt-3 max-w-2xl text-sm md:text-base">{description}</p>
          </div>
          {actions ? <div className="flex items-center gap-2 flex-wrap">{actions}</div> : null}
        </header>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

export function AnalyticsEmpty({ message }: { message: string }) {
  return (
    <div className="border border-dashed border-border bg-card p-10 text-center">
      <p className="text-sm text-foreground/70 mb-4">{message}</p>
      <Link
        to="/csfactors"
        className="font-mono text-[11px] uppercase tracking-widest border-b border-foreground/40 hover:text-accent hover:border-accent pb-1"
      >
        Add accounts in CSFactors →
      </Link>
    </div>
  );
}
