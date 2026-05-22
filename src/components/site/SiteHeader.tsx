import { Link } from "@tanstack/react-router";

const nav = [
  { to: "/insights", label: "Insights" },
  { to: "/ai-readiness", label: "Readiness Survey" },
  { to: "/about", label: "About" },
] as const;

export function SiteHeader() {
  return (
    <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-display text-2xl italic tracking-tight">
          The CS Quarterly
        </Link>
        <div className="flex items-center gap-8 font-mono text-[11px] uppercase tracking-widest">
          {nav.map((item) => (
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
