import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";


const sections = [
  { to: "/vanguard", label: "Vanguard" },
  { to: "/retention-protocol", label: "Retention" },
  { to: "/outcome-forum", label: "Outcome" },
  { to: "/codex", label: "Codex" },
  { to: "/ai-readiness", label: "Diagnostic" },
  { to: "/pricing", label: "Pricing" },
] as const;

export function SiteHeader() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-baseline gap-2 group">
          <span className="font-display text-2xl tracking-tight leading-none">The CS Quarterly</span>
          <span aria-hidden className="hidden sm:inline-block h-2 w-2 rounded-full bg-secondary-accent -translate-y-[0.65em] group-hover:bg-accent transition-colors" />
        </Link>
        <div className="flex items-center gap-5 font-mono text-[11px] font-semibold uppercase tracking-widest">
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
          {user ? (
            <>
              <Link to="/account" className="hidden md:inline hover:text-accent">Account</Link>
              <button
                onClick={() => supabase.auth.signOut()}
                className="hidden md:inline hover:text-accent"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login" className="hidden md:inline hover:text-accent">Sign in</Link>
          )}
          <Link
            to="/pricing"
            className="px-4 py-2 border border-foreground font-semibold hover:bg-foreground hover:text-background transition-all duration-300"
          >
            Subscribe
          </Link>
        </div>
      </nav>

    </header>
  );
}
