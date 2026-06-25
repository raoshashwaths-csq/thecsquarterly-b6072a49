import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
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
import { Search, LayoutGrid, Compass } from "lucide-react";

export function SiteHeader() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { canUniversalSearch, canWorkspace } = useEntitlements();
  const { isRecruiterOrLead } = usePersona();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";

  const sections = [
    { to: "/vanguard", label: t("nav.vanguard") },
    { to: "/retention-protocol", label: t("nav.retention") },
    { to: "/outcome-forum", label: t("nav.outcome") },
    { to: "/codex", label: t("nav.codex") },
    { to: "/diagnostics", label: t("nav.diagnostic") },
  ] as const;

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
      <nav className="max-w-7xl mx-auto px-4 md:px-6 h-16 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:items-center sm:justify-between sm:gap-3 md:gap-8">
        <Link to="/" className="group leading-none min-w-0 sm:shrink-0">
          <span className="font-display font-semibold tracking-tight leading-none text-base sm:text-xl md:text-[1.75rem] truncate sm:whitespace-nowrap block text-foreground drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]">
            The CS Quarterly<span
              aria-hidden
              className="text-secondary-accent group-hover:text-accent transition-colors font-bold"
            >.</span>
          </span>
        </Link>

        <div className="shrink-0 flex items-center gap-2 sm:gap-4 md:gap-6 font-mono text-xs font-semibold uppercase tracking-widest">

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
              {canUniversalSearch && (
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event("csq:open-command-palette"))}
                  aria-label="Open search"
                  title="Universal search (⌘K)"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-border hover:border-accent hover:text-accent transition-colors min-h-[36px]"
                >
                  <Search size={13} strokeWidth={2.75} />
                  <span className="hidden md:inline text-xs tracking-widest">⌘K</span>
                </button>
              )}

              {user && (
                <Link
                  to="/agent/framework"
                  aria-label="Decision Canvas"
                  title="Decision Canvas"
                  className="inline-flex items-center justify-center gap-1.5 border border-border hover:border-accent hover:text-accent transition-colors min-h-[36px] px-2.5 py-1.5"
                >
                  <Compass size={13} strokeWidth={2.75} />
                  <span className="hidden md:inline text-xs tracking-widest">{t("nav.canvas")}</span>
                </Link>
              )}

              {user && canWorkspace && (
                <Link
                  to="/account/workspace"
                  aria-label={t("menu.yourWorkspace")}
                  title={t("menu.yourWorkspace")}
                  className="inline-flex items-center justify-center gap-1.5 border border-border hover:border-accent hover:text-accent transition-colors min-h-[36px] px-2.5 py-1.5"
                >
                  <LayoutGrid size={13} strokeWidth={2.75} />
                  <span className="hidden md:inline text-xs tracking-widest">{t("nav.workspace")}</span>

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
                  <AvatarFallback className="bg-foreground text-background font-mono text-xs tracking-widest">
                    {initials || "·"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="font-body normal-case tracking-normal">

                  <div className="text-sm font-medium leading-tight truncate">
                    {displayName || t("menu.member")}
                  </div>
                  {user.email && displayName !== user.email && (
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {user.email}
                    </div>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account/workspace" className="font-mono text-xs uppercase tracking-widest">
                    {t("menu.yourWorkspace")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account" className="font-mono text-xs uppercase tracking-widest">
                    {t("menu.account")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin" className="font-mono text-xs uppercase tracking-widest">
                    {t("menu.admin")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/calculator" className="font-mono text-xs uppercase tracking-widest">
                    {t("menu.roiCalculator")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/benchmarks" className="font-mono text-xs uppercase tracking-widest">
                    {t("menu.benchmarks")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/directory" className="font-mono text-xs uppercase tracking-widest">
                    {t("menu.directory")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/teams" className="font-mono text-xs uppercase tracking-widest">
                    {t("menu.teams")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/sequencer" className="font-mono text-xs uppercase tracking-widest">
                    {t("menu.sequencer")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/control-panel" className="font-mono text-xs uppercase tracking-widest">
                    {t("menu.controlPanel")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    void supabase.auth.signOut();
                  }}
                  className="font-mono text-xs uppercase tracking-widest text-foreground"
                >
                  {t("menu.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/login"
              className="shrink-0 whitespace-nowrap px-2.5 py-1 md:px-3 md:py-1.5 border border-foreground text-xs md:text-xs font-semibold hover:bg-foreground hover:text-background transition-all duration-300"
            >
              {t("nav.login")}
            </Link>


          )}
        </div>
      </nav>
    </header>
  );
}
