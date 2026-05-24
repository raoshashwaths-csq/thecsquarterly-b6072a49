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
        <Link to="/" className="flex items-end gap-[2px] group mr-8 leading-none">
          <span className="font-display tracking-tight leading-none text-2xl">The CS Quarterly</span>
          <span aria-hidden className="inline-block h-[7px] w-[7px] rounded-full bg-secondary-accent group-hover:bg-accent transition-colors mb-[2px]" />
        </Link>
        <div className="flex items-center gap-4 font-mono text-[10px] font-semibold uppercase tracking-widest">
          {sections.map((item, i) => (
            <div key={item.to} className="hidden md:flex items-center gap-4">
              {i > 0 && (
                <span aria-hidden className="h-3 w-px bg-border/90" />
              )}
              <Link
                to={item.to}
                className="hover:text-accent transition-colors"
                activeProps={{ className: "text-accent" }}
              >
                {item.label}
              </Link>
            </div>
          ))}
          <span aria-hidden className="hidden md:inline-block h-3 w-px bg-border/90" />
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
