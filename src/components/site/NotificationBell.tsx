import { useMemo } from "react";
import { Bell } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getFutureOperatorProfile,
  markAllNotificationsRead,
  markNotificationRead,
  actOnNotification,
} from "@/lib/future-operator.functions";
import { useEntitlements } from "@/hooks/useEntitlements";
import { DESIGNATION_RANK } from "@/lib/entitlements";
import { cn } from "@/lib/utils";

type Notif = {
  id: string;
  type: string;
  message: string;
  subtext: string | null;
  action_label: string | null;
  action_route: string | null;
  delivered_at: string;
  read_at: string | null;
  acted_on_at: string | null;
};

function formatWhen(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const h = diff / 3_600_000;
  if (h < 1) return `${Math.max(1, Math.round(diff / 60_000))}m ago`;
  if (h < 24) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

const TYPE_LABEL: Record<string, string> = {
  "daily-quest": "Daily Quest",
  "drift-signal": "Drift Signal",
  "reflection-prompt": "Reflection",
  "quest-completion-response": "Completion",
  intro: "Future Operator",
};

export function NotificationBell() {
  const { designation, loading } = useEntitlements();
  const eligible = DESIGNATION_RANK[designation] >= DESIGNATION_RANK.practitioner;
  const queryClient = useQueryClient();
  const fetchProfile = useServerFn(getFutureOperatorProfile);
  const markRead = useServerFn(markNotificationRead);
  const markAll = useServerFn(markAllNotificationsRead);
  const acted = useServerFn(actOnNotification);

  const q = useQuery({
    queryKey: ["future-operator", "panel"],
    queryFn: () => fetchProfile(),
    enabled: !loading && eligible,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });

  const notifications: Notif[] = (q.data?.notifications ?? []) as Notif[];
  const unread = useMemo(() => notifications.filter((n) => !n.read_at).length, [notifications]);

  if (loading || !eligible) return null;

  async function onOpen(open: boolean) {
    if (open && unread > 0) {
      // Mark visible unread as read after a short delay handled per-click,
      // but also expose a "Mark all read" button.
    }
    if (!open) {
      await queryClient.invalidateQueries({ queryKey: ["future-operator", "panel"] });
    }
  }

  async function onClickItem(n: Notif) {
    if (!n.read_at) {
      await markRead({ data: { id: n.id } });
    }
    if (n.action_route) {
      await acted({ data: { id: n.id } });
      window.location.assign(n.action_route);
    }
    await queryClient.invalidateQueries({ queryKey: ["future-operator", "panel"] });
  }

  return (
    <Popover onOpenChange={onOpen}>
      <PopoverTrigger
        aria-label="Future Operator notifications"
        className="relative inline-flex items-center justify-center min-h-[36px] px-2 border border-border hover:border-accent hover:text-accent transition-colors"
      >
        <Bell size={14} strokeWidth={2.5} />
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-secondary-accent text-background text-[10px] font-mono font-bold tracking-tight flex items-center justify-center"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[360px] p-0 border-border bg-background"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground">
            Future Operator
          </div>
          <button
            type="button"
            onClick={async () => {
              await markAll();
              await queryClient.invalidateQueries({ queryKey: ["future-operator", "panel"] });
            }}
            className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-accent"
          >
            Mark all read
          </button>
        </div>
        <div className="max-h-[480px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-sm text-muted-foreground">
              No messages yet. Your Future Operator wakes up after onboarding.
            </div>
          ) : (
            <ul>
              {notifications.map((n) => {
                const unreadItem = !n.read_at;
                return (
                  <li
                    key={n.id}
                    className={cn(
                      "border-b border-border/60 last:border-b-0 px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors",
                      unreadItem && "border-l-2 border-l-secondary-accent bg-muted/20",
                    )}
                    onClick={() => onClickItem(n)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        {TYPE_LABEL[n.type] ?? n.type}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {formatWhen(n.delivered_at)}
                      </span>
                    </div>
                    <p className="mt-1.5 font-serif text-[13px] leading-relaxed text-foreground line-clamp-3">
                      {n.message}
                    </p>
                    {n.action_label && n.action_route && (
                      <div className="mt-2">
                        <Link
                          to={n.action_route as never}
                          className="font-mono text-[11px] uppercase tracking-widest text-secondary-accent hover:text-accent"
                          onClick={(e) => {
                            e.stopPropagation();
                            void onClickItem(n);
                          }}
                        >
                          {n.action_label} →
                        </Link>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
