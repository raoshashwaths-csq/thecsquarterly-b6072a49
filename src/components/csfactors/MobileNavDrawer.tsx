import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LumiMark } from "@/components/site/LumiMark";
import { cn } from "@/lib/utils";
import { NAV_GROUPS, STANDALONE_LINKS, WORKSPACE_ICON } from "./csfactorsNav";

export function MobileNavDrawer({ onOpenWorkspace }: { onOpenWorkspace: () => void }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  function close() { setOpen(false); }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open navigation"
          className="md:hidden inline-flex items-center justify-center h-10 w-10 border border-border hover:border-accent hover:text-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72 bg-card border-r border-border flex flex-col">
        <SheetHeader className="px-4 py-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2 font-display text-base tracking-tight">
            <LumiMark variant="emblem" size={22} /> CSFactors
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto py-3">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.id} className={cn("px-2", gi > 0 && "mt-4")}>
              <div className="px-3 pb-1 font-mono uppercase tracking-[0.22em] text-xs font-semibold text-foreground/50">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.links.map((item) => {
                  const Icon = item.icon;
                  const linkProps = item.hash
                    ? { to: item.to as "/csfactors", hash: item.hash }
                    : { to: item.to };
                  return (
                    <Link
                      key={`${item.to}${item.hash ?? ""}`}
                      {...(linkProps as { to: string })}
                      onClick={close}
                      className="flex items-center gap-3 px-3 py-3 text-sm border-l-2 border-transparent text-foreground/80 hover:bg-muted/60"
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", item.emphasized && "text-accent")} />
                      <span className={cn(
                        "font-mono uppercase tracking-wider text-xs",
                        item.emphasized && "font-semibold",
                      )}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-4 px-2">
            <div className="px-3 pb-1 font-mono uppercase tracking-[0.22em] text-xs font-semibold text-foreground/50">
              Modules
            </div>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => { close(); onOpenWorkspace(); }}
                className="w-full flex items-center gap-3 px-3 py-3 text-sm border-l-2 border-transparent text-foreground/80 hover:bg-muted/60 text-left"
              >
                <WORKSPACE_ICON className="h-4 w-4 shrink-0" />
                <span className="text-[13px]">Workspace</span>
              </button>
              {STANDALONE_LINKS.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={close}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 text-sm border-l-2",
                      active ? "border-accent text-foreground bg-muted/40" : "border-transparent text-foreground/80 hover:bg-muted/60",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-[13px]">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="px-4 py-3 border-t border-border">
          <Link
            to="/"
            onClick={close}
            className="block font-mono uppercase tracking-widest text-xs text-muted-foreground hover:text-accent"
          >
            ← The CS Quarterly
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
