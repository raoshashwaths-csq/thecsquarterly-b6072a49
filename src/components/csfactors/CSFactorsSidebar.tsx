import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CSFLogo } from "./CSFLogo";
import { TOP_LINKS, STANDALONE_LINKS, WORKSPACE_ICON } from "./csfactorsNav";

const COLLAPSE_KEY = "csf.sidebar.collapsed";

export function CSFactorsSidebar({ onOpenWorkspace }: { onOpenWorkspace: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const hash = useRouterState({ select: (r) => r.location.hash });

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch { /* */ }
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0"); } catch { /* */ }
      return next;
    });
  }

  const isActiveTop = (to: string, h?: string) => {
    if (h) return pathname === to && (`#${hash}` === h || hash === h.slice(1));
    return pathname === to || pathname.startsWith(to + "/");
  };
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  return (
    <aside
      className={cn(
        "shrink-0 border-r border-border bg-card sticky top-0 h-screen transition-[width] duration-300 hidden md:block",
        collapsed ? "w-16" : "w-72",
      )}
    >
      <div className="h-full flex flex-col">
        <div className="px-3 py-5 border-b border-border flex items-center justify-between gap-2">
          <Link to="/csfactors" className="min-w-0 flex items-center" aria-label="CSFactors home">
            <CSFLogo size={collapsed ? "md" : "lg"} showWordmark={!collapsed} />
          </Link>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          <div className="px-2 space-y-0.5">
            {TOP_LINKS.map((item) => {
              const Icon = item.icon;
              const active = isActiveTop(item.to, item.hash);
              const emphasized = item.to === "/csfactors/360" && !item.hash;
              return (
                <a
                  key={item.label}
                  href={`${item.to}${item.hash ?? ""}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm border-l-2 transition-colors hover:bg-muted/60",
                    active ? "border-accent text-foreground bg-muted/40" : "border-transparent text-foreground/70",
                    emphasized && !active && "text-foreground",
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", emphasized && "text-accent")} />
                  {!collapsed && (
                    <span className={cn(
                      "font-mono uppercase tracking-wider text-xs",
                      emphasized && "font-semibold",
                    )}>
                      {item.label}
                    </span>
                  )}
                </a>
              );
            })}
          </div>

          <div className="mt-4 px-2" data-tour="standalone-modules">
            {!collapsed && (
              <div className="px-3 pb-1 font-mono uppercase tracking-[0.22em] text-xs font-semibold text-foreground/50">
                Modules
              </div>
            )}
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={onOpenWorkspace}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm border-l-2 border-transparent text-foreground/70 hover:bg-muted/60 hover:text-foreground transition-colors text-left",
                )}
                title={collapsed ? "Workspace" : undefined}
              >
                <WORKSPACE_ICON className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="text-[12px]">Workspace</span>}
              </button>
              {STANDALONE_LINKS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm border-l-2 transition-colors hover:bg-muted/60",
                      active ? "border-accent text-foreground bg-muted/40" : "border-transparent text-foreground/70",
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="text-[12px] leading-tight">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="p-3 border-t border-border">
          <Link
            to="/"
            className="block font-mono uppercase tracking-widest text-xs text-muted-foreground hover:text-accent text-center"
          >
            {collapsed ? "←" : "← The CS Quarterly"}
          </Link>
        </div>
      </div>
    </aside>
  );
}

