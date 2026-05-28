import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronLeft, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { QMark } from "@/components/site/QMark";
import { TOP_LINKS, ANALYTICS_LINKS, STANDALONE_LINKS, WORKSPACE_ICON } from "./csfactorsNav";

const COLLAPSE_KEY = "csf.sidebar.collapsed";
const ANALYTICS_OPEN_KEY = "csf.sidebar.analyticsOpen";

export function CSFactorsSidebar({ onOpenWorkspace }: { onOpenWorkspace: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(true);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const hash = useRouterState({ select: (r) => r.location.hash });

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
      const ao = localStorage.getItem(ANALYTICS_OPEN_KEY);
      if (ao !== null) setAnalyticsOpen(ao === "1");
    } catch { /* */ }
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0"); } catch { /* */ }
      return next;
    });
  }
  function toggleAnalytics() {
    setAnalyticsOpen((o) => {
      const next = !o;
      try { localStorage.setItem(ANALYTICS_OPEN_KEY, next ? "1" : "0"); } catch { /* */ }
      return next;
    });
  }

  const isActiveTop = (to: string, h?: string) =>
    pathname === to && (!h || `#${hash}` === h || hash === h.slice(1));
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  return (
    <aside
      className={cn(
        "shrink-0 border-r border-border bg-card sticky top-0 h-screen transition-[width] duration-300 hidden md:block",
        collapsed ? "w-14" : "w-60",
      )}
    >
      <div className="h-full flex flex-col">
        <div className="px-3 py-5 border-b border-border flex items-center justify-between">
          {!collapsed ? (
            <Link to="/csfactors" className="flex items-center gap-2 min-w-0">
              <QMark className="h-6 w-6 shrink-0" />
              <span className="font-display text-sm tracking-tight truncate">CSFactors</span>
            </Link>
          ) : (
            <Link to="/csfactors" className="mx-auto">
              <QMark className="h-6 w-6" />
            </Link>
          )}
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
          {/* Top */}
          <div className="px-2 space-y-0.5">
            {TOP_LINKS.map((item) => {
              const Icon = item.icon;
              const active = isActiveTop(item.to, item.hash);
              return (
                <a
                  key={item.label}
                  href={`${item.to}${item.hash ?? ""}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm border-l-2 transition-colors hover:bg-muted/60",
                    active ? "border-accent text-foreground bg-muted/40" : "border-transparent text-foreground/70",
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="font-mono uppercase tracking-wider text-[11px]">{item.label}</span>}
                </a>
              );
            })}
          </div>

          {/* Analytics group */}
          <div className="mt-4 px-2">
            <button
              type="button"
              onClick={toggleAnalytics}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-foreground/60 hover:text-foreground",
                collapsed && "justify-center",
              )}
              aria-expanded={analyticsOpen}
              title={collapsed ? "Analytics" : undefined}
            >
              {!collapsed && (
                <>
                  <span className="font-mono uppercase tracking-[0.22em] text-[10px] font-semibold flex-1 text-left">
                    Analytics
                  </span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !analyticsOpen && "-rotate-90")} />
                </>
              )}
              {collapsed && <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {analyticsOpen && (
              <div className="space-y-0.5 mt-1">
                {ANALYTICS_LINKS.map((item) => {
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
                      {!collapsed && (
                        <span className="text-[12px] leading-tight">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Standalone */}
          <div className="mt-4 px-2">
            {!collapsed && (
              <div className="px-3 pb-1 font-mono uppercase tracking-[0.22em] text-[10px] font-semibold text-foreground/50">
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
