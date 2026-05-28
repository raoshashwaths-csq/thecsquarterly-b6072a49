import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, LayoutGrid, Users, Bell, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { QMark } from "@/components/site/QMark";

const NAV: { to: string; label: string; icon: typeof Activity; hash?: string }[] = [
  { to: "/csfactors", label: "Pulse", icon: Activity },
  { to: "/csfactors", label: "Accounts", icon: LayoutGrid, hash: "#accounts" },
  { to: "/csfactors", label: "Renewals", icon: Users, hash: "#renewals" },
  { to: "/csfactors", label: "Reminders", icon: Bell, hash: "#reminders" },
];

export function CSFactorsSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const hash = useRouterState({ select: (r) => r.location.hash });

  return (
    <aside
      className={cn(
        "shrink-0 border-r border-border bg-card sticky top-0 h-screen transition-[width] duration-300",
        collapsed ? "w-14" : "w-56",
      )}
    >
      <div className="h-full flex flex-col">
        <div className="px-3 py-5 border-b border-border flex items-center justify-between">
          {!collapsed && (
            <Link to="/csfactors" className="flex items-center gap-2">
              <QMark className="h-6 w-6" />
              <span className="font-display text-sm tracking-tight">CSFactors</span>
            </Link>
          )}
          {collapsed && (
            <Link to="/csfactors" className="mx-auto">
              <QMark className="h-6 w-6" />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
            />
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV.map((item) => {
            const isActive =
              item.to === pathname && (!item.hash || item.hash === `#${hash}` || item.hash.slice(1) === hash);
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={`${item.to}${item.hash ?? ""}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                  "hover:bg-muted/60 border-l-2",
                  isActive
                    ? "border-accent text-foreground bg-muted/40"
                    : "border-transparent text-foreground/70",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="font-mono uppercase tracking-wider text-[11px]">{item.label}</span>}
              </a>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <Link
            to="/"
            className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-accent text-center"
          >
            {collapsed ? "←" : "← The CS Quarterly"}
          </Link>
        </div>
      </div>
    </aside>
  );
}
