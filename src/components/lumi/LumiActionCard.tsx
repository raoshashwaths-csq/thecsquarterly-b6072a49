import {
  Brain,
  MessageCircleHeart,
  Network,
  Clock,
  Target,
  Forward,
  ChartScatter,
  GitPullRequest,
  Ear,
  Route,
  CalendarCheck,
  ChartBar,
  Microscope,
  Stars,
  ArrowLeftRight,
  Play,
  SlidersHorizontal,
  Wrench,
  Users,
  Milestone,
  Activity,
  TrendingUp,
  Lightbulb,
  DatabaseZap,
  Scale,
  Receipt,
  UsersRound,
  BookOpen,
  RefreshCw,
  FileText,
  Lock,
  type LucideIcon,
} from "lucide-react";
import type { LumiAction, LumiIconName } from "@/config/lumiPageActions";

const ICONS: Record<LumiIconName, LucideIcon> = {
  brain: Brain,
  messageCircleHeart: MessageCircleHeart,
  sitemap: Network,
  clock: Clock,
  target: Target,
  mailForward: Forward,
  chartDots: ChartScatter,
  gitPullRequest: GitPullRequest,
  ear: Ear,
  route: Route,
  calendarCheck: CalendarCheck,
  chartBar: ChartBar,
  microscope: Microscope,
  stars: Stars,
  arrowsDiff: ArrowLeftRight,
  playerPlay: Play,
  adjustments: SlidersHorizontal,
  tool: Wrench,
  users: Users,
  road: Milestone,
  progress: Activity,
  trendingUp: TrendingUp,
  bulb: Lightbulb,
  databasePlus: DatabaseZap,
  scale: Scale,
  receipt: Receipt,
  usersGroup: UsersRound,
  book: BookOpen,
  refresh: RefreshCw,
  fileText: FileText,
};

export function LumiActionCard({
  action,
  isLocked,
  onClick,
}: {
  action: LumiAction;
  isLocked: boolean;
  onClick: () => void;
}) {
  const Icon = ICONS[action.icon] ?? Stars;
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKey}
      aria-disabled={isLocked || undefined}
      aria-label={
        isLocked ? `${action.label} — Vanguard required` : action.label
      }
      className="relative group cursor-pointer rounded-md border border-border/60 bg-secondary/30 px-3.5 py-3 text-left transition-colors hover:border-secondary-accent focus:border-secondary-accent focus:outline-none"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-[18px] w-[18px] text-secondary-accent shrink-0" />
        <div className="font-serif text-[13px] font-medium text-foreground leading-tight">
          {action.label}
        </div>
      </div>
      <p className="mt-1.5 font-serif text-[12px] leading-[1.5] text-foreground/70">
        {action.description}
      </p>
      {action.isNew && (
        <div className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/55">
          New
        </div>
      )}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/60 backdrop-blur-[1px]">
          <Lock className="h-4 w-4 text-secondary-accent" />
        </div>
      )}
    </div>
  );
}
