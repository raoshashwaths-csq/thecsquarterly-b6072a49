import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

const SECTIONS = [
  { label: "The CS Vanguard", path: "/vanguard" },
  { label: "The Retention Protocol", path: "/retention-protocol" },
  { label: "The Outcome Forum", path: "/outcome-forum" },
  { label: "The CS Codex", path: "/codex" },
] as const;

const RESOURCES = [
  { label: "AI Readiness Diagnostic", path: "/ai-readiness" },
  { label: "ROI Calculator", path: "/calculator" },
  { label: "NRR Benchmarks", path: "/benchmarks" },
  { label: "Operator Directory", path: "/directory" },
  { label: "Teams", path: "/teams" },
  { label: "Reading Sequencer", path: "/sequencer" },
  { label: "Job Board", path: "/job-board", comingSoon: true },
  { label: "Pricing", path: "/pricing" },
  { label: "Subscribe", path: "/subscribe" },
] as const;

const COMPANY = [
  { label: "Our Mission", path: "/about" },
  { label: "Editorial Standards", path: "/about" },
  { label: "Contact", path: "/subscribe" },
  { label: "Login", path: "/login" },
] as const;

const SOCIAL = [
  { label: "LinkedIn", href: "#" },
  { label: "Twitter / X", href: "#" },
  { label: "RSS", href: "#" },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-foreground text-background relative overflow-hidden">
      {/* Top CTA strip */}
      <div className="border-b border-background/10">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-secondary-accent mb-4">
              The Briefing / Weekly
            </p>
            <h2 className="font-display text-3xl md:text-5xl leading-[1.05] tracking-tight">
              Strategic intelligence for the<br />architects of retention.
            </h2>
          </div>
          <Link
            to="/subscribe"
            className="inline-flex items-center gap-2 px-6 py-3 bg-secondary-accent text-foreground font-mono text-xs uppercase tracking-[0.2em] hover:bg-background hover:text-foreground transition-colors whitespace-nowrap"
          >
            Subscribe Free <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* Link columns */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
          <FooterCol title="Sections" links={SECTIONS} />
          <FooterCol title="Resources" links={RESOURCES} />
          <FooterCol title="Company" links={COMPANY} />
          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.25em] text-background/40 mb-6">
              Social
            </h4>
            <ul className="space-y-3">
              {SOCIAL.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="group inline-flex items-center gap-1.5 font-body text-sm text-background/70 hover:text-background transition-colors"
                  >
                    {l.label}
                    <ArrowUpRight size={12} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Giant wordmark */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 pb-8">
        <Link to="/" className="block group" aria-label="The CS Quarterly home">
          <div className="font-display font-medium tracking-[-0.04em] leading-[0.85] text-background/95 select-none whitespace-nowrap [font-size:clamp(3rem,11.5vw,10.5rem)]">
            The CS Quarterly<span className="text-secondary-accent">.</span>
          </div>
        </Link>
      </div>

      {/* Meta bar */}
      <div className="border-t border-background/10">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-background/40">
              © {new Date().getFullYear()} The CS Quarterly
            </p>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="font-mono text-xs uppercase tracking-[0.2em] text-background/40 hover:text-background transition-colors">Privacy</a>
            <a href="#" className="font-mono text-xs uppercase tracking-[0.2em] text-background/40 hover:text-background transition-colors">Terms</a>
            <a href="#" className="font-mono text-xs uppercase tracking-[0.2em] text-background/40 hover:text-background transition-colors">Colophon</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<{ label: string; path: string; comingSoon?: boolean }>;
}) {
  return (
    <div>
      <h4 className="font-mono text-xs uppercase tracking-[0.25em] text-background/40 mb-6">
        {title}
      </h4>
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.label}>
            {l.comingSoon ? (
              <span className="inline-flex items-center gap-2 font-body text-sm">
                <span className="text-background/40 blur-[5px] select-none">{l.label}</span>
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-secondary-accent whitespace-nowrap">
                  Stay tuned ✨
                </span>
              </span>
            ) : (
              <Link
                to={l.path}
                className="font-body text-sm text-background/70 hover:text-background transition-colors"
              >
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
