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
          <span className="font-display text-2xl tracking-tight">The CS Quarterly</span>
          <span className="hidden sm:inline-block h-[6px] w-[6px] rounded-full bg-secondary-accent translate-y-[-2px] group-hover:bg-accent transition-colors" />
        </Link>
        <div className="flex items-center gap-5 font-mono text-[11px] uppercase tracking-widest">
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
            to="/subscribe"
            className="px-4 py-2 border border-foreground hover:bg-foreground hover:text-background transition-all duration-300"
          >
            Subscribe
          </Link>
        </div>
      </nav>
      <RetentionLedger />
    </header>
  );
}
