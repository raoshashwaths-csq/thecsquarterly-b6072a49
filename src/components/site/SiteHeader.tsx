import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import { usePersona } from "@/hooks/usePersona";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import { useSmartNav } from "@/hooks/useSmartNav";
import { cn } from "@/lib/utils";
import { Search, LayoutGrid } from "lucide-react";

const sections = [
  { to: "/vanguard", label: "Vanguard" },
  { to: "/retention-protocol", label: "Retention" },
  { to: "/outcome-forum", label: "Outcome" },
  { to: "/codex", label: "Codex" },
  { to: "/ai-readiness", label: "Diagnostic" },
] as const;

export function SiteHeader() {
  const { user } = useAuth();
  const { canUniversalSearch, canWorkspace } = useEntitlements();
  const { isRecruiterOrLead } = usePersona();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";


  const meta = (user?.user_metadata ?? {}) as {
    avatar_url?: string;
    picture?: string;
    display_name?: string;
    full_name?: string;
  };
  const avatarUrl = meta.avatar_url ?? meta.picture ?? null;
  const displayName = meta.display_name ?? meta.full_name ?? user?.email ?? "";
  const initials = (displayName || "·")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  const { scrolled, visible } = useSmartNav();
  return (
    <header
      className={cn(
        "smart-nav",
        scrolled && "smart-nav-frost",
        !visible && "smart-nav-hidden",
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-3 md:gap-8">
        <Link to="/" className="group leading-none shrink-0 min-w-0">
          <span className="font-display tracking-tight leading-none text-lg md:text-2xl whitespace-nowrap block">
            The CS Quarterly<span
              aria-hidden
              className="text-secondary-accent group-hover:text-accent transition-colors font-bold"
            >.</span>
          </span>
        </Link>

        <div className="flex items-center gap-4 md:gap-6 font-mono text-[10px] font-semibold uppercase tracking-widest">
          {isHome && (
            <div className="hidden lg:flex items-center gap-6">
              {sections.map((item, i) => (
                <div key={item.to} className="flex items-center gap-6">
                  {i > 0 && <span aria-hidden className="h-3 w-px bg-border" />}
                  <Link
                    to={item.to}
                    className="hover:text-accent transition-colors"
                    activeProps={{ className: "text-accent" }}
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
              <span aria-hidden className="h-3 w-px bg-border/90" />
            </div>
          )}

          {!isHome && (
            <>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("csq:open-command-palette"))}
                aria-label="Open search"
                title="Search (⌘K)"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-border hover:border-accent hover:text-accent transition-colors min-h-[36px]"
              >
                <Search size={13} strokeWidth={2.75} />
                <span className="hidden md:inline text-[10px] tracking-widest">⌘K</span>
              </button>

              {user && (
                <Link
                  to="/account/workspace"
                  aria-label="Your Workspace"
                  title="Your Workspace"
                  className="inline-flex items-center justify-center gap-1.5 border border-border hover:border-accent hover:text-accent transition-colors min-h-[36px] px-2.5 py-1.5"
                >
                  <LayoutGrid size={13} strokeWidth={2.75} />
                  <span className="hidden md:inline text-[10px] tracking-widest">Workspace</span>
                </Link>
              )}
            </>
          )}

          <LanguageSwitcher />
          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Open account menu"
                className="rounded-full ring-1 ring-border hover:ring-accent transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Avatar className="h-8 w-8">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
                  <AvatarFallback className="bg-foreground text-background font-mono text-[10px] tracking-widest">
                    {initials || "·"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="font-body normal-case tracking-normal">
                  <div className="text-sm font-medium leading-tight truncate">
                    {displayName || "Member"}
                  </div>
                  {user.email && displayName !== user.email && (
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {user.email}
                    </div>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account/workspace" className="font-mono text-[11px] uppercase tracking-widest">
                    Your Workspace
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account" className="font-mono text-[11px] uppercase tracking-widest">
                    Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin" className="font-mono text-[11px] uppercase tracking-widest">
                    Admin
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/calculator" className="font-mono text-[11px] uppercase tracking-widest">
                    ROI Calculator
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/benchmarks" className="font-mono text-[11px] uppercase tracking-widest">
                    Benchmarks
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/directory" className="font-mono text-[11px] uppercase tracking-widest">
                    Directory
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/teams" className="font-mono text-[11px] uppercase tracking-widest">
                    Teams
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/sequencer" className="font-mono text-[11px] uppercase tracking-widest">
                    Sequencer
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/control-panel" className="font-mono text-[11px] uppercase tracking-widest">
                    Control Panel
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    void supabase.auth.signOut();
                  }}
                  className="font-mono text-[11px] uppercase tracking-widest text-foreground"
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/login"
              className="shrink-0 whitespace-nowrap px-2.5 py-1 md:px-3 md:py-1.5 border border-foreground text-[10px] md:text-[11px] font-semibold hover:bg-foreground hover:text-background transition-all duration-300"
            >
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
