import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
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

const sections = [
  { to: "/vanguard", label: "Vanguard" },
  { to: "/retention-protocol", label: "Retention" },
  { to: "/outcome-forum", label: "Outcome" },
  { to: "/codex", label: "Codex" },
  { to: "/ai-readiness", label: "Diagnostic" },
] as const;

export function SiteHeader() {
  const { user } = useAuth();
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

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-3 md:gap-8">
        <Link to="/" className="group leading-none shrink min-w-0">
          <span className="font-display tracking-tight leading-none text-lg md:text-2xl whitespace-nowrap truncate block">
            The CS Quarterly<span
              aria-hidden
              className="text-secondary-accent group-hover:text-accent transition-colors font-bold"
            >.</span>
          </span>
        </Link>

        <div className="flex items-center gap-6 font-mono text-[10px] font-semibold uppercase tracking-widest">
          <div className="hidden md:flex items-center gap-6">
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
          </div>

          <span aria-hidden className="hidden md:inline-block h-3 w-px bg-border/90" />

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
                  <Link to="/account" className="font-mono text-[11px] uppercase tracking-widest">
                    Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin" className="font-mono text-[11px] uppercase tracking-widest">
                    Admin
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
