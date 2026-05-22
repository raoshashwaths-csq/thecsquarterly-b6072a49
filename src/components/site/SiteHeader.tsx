import { Link } from "@tanstack/react-router";

const sections = [
  { to: "/vanguard", label: "Vanguard" },
  { to: "/retention-protocol", label: "Retention" },
  { to: "/outcome-forum", label: "Outcome" },
  { to: "/codex", label: "Codex" },
  { to: "/ai-readiness", label: "Diagnostic" },
] as const;

export function SiteHeader() {
  return (
    <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-baseline gap-2 group">
          <span className="font-display text-2xl tracking-tight">The CS Quarterly</span>
          <span className="hidden sm:inline-block h-[6px] w-[6px] rounded-full bg-secondary-accent translate-y-[-2px] group-hover:bg-accent transition-colors" />
        </Link>
        <div className="flex items-center gap-6 font-mono text-[11px] uppercase tracking-widest">
          {sections.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="hidden md:inline hover:text-accent transition-colors"
              activeProps={{ className: "hidden md:inline text-accent" }}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/subscribe"
            className="px-4 py-2 border border-foreground hover:bg-foreground hover:text-background transition-all duration-300"
          >
            Subscribe
          </Link>
        </div>
      </div>
    </nav>
  );
}
