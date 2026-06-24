import {
  Activity,
  LayoutGrid,
  Users as UsersIcon,
  LayoutDashboard,
  BarChart3,
  Calculator,
  Gauge,
  FolderOpen,
  Users2,
  BookUser,
  Map as MapIcon,
  Inbox,
  TrendingUp,
  Filter,
  Radar,
  Trophy,
  Compass,
} from "lucide-react";

export type NavLink = {
  to: string;
  hash?: string;
  label: string;
  icon: typeof Activity;
  external?: boolean;
  emphasized?: boolean;
};

export type NavGroup = {
  id: string;
  label: string;
  links: NavLink[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "command",
    label: "Command",
    links: [
      { to: "/csfactors", label: "Pulse", icon: Activity },
      { to: "/csfactors/ctas", label: "Action Centre", icon: Inbox },
      { to: "/csfactors", hash: "accounts", label: "Accounts", icon: LayoutGrid },
      { to: "/csfactors", hash: "renewals", label: "Renewals", icon: UsersIcon },
    ],
  },
  {
    id: "planning",
    label: "Planning",
    links: [
      { to: "/csfactors/maps", label: "MAP Engine", icon: MapIcon },
    ],
  },
  {
    id: "analytics",
    label: "Analytics Lenses",
    links: [
      { to: "/csfactors/360", label: "360 Dashboard", icon: LayoutDashboard, emphasized: true },
      { to: "/account/executive/analytics", label: "Portfolio Command", icon: Compass },
      { to: "/account/analytics/nrr-waterfall", label: "NRR Waterfall", icon: TrendingUp },
      { to: "/account/analytics/retention-funnel", label: "Retention Funnel", icon: Filter },
      { to: "/account/analytics/stakeholder-radar", label: "Stakeholder Radar", icon: Radar },
      { to: "/account/analytics/team-leaderboard", label: "Team Leaderboard", icon: Trophy },
    ],
  },
];

/** @deprecated kept for any legacy import; prefer NAV_GROUPS. */
export const TOP_LINKS: NavLink[] = NAV_GROUPS.flatMap((g) => g.links);

export const STANDALONE_LINKS: NavLink[] = [
  { to: "/diagnostics/ai-readiness", label: "AI Readiness Diagnostic", icon: Gauge },
  { to: "/calculator", label: "ROI Calculator", icon: Calculator },
  { to: "/benchmarks", label: "NRR Benchmarks", icon: BarChart3 },
  { to: "/directory", label: "Operator Directory", icon: BookUser },
  { to: "/teams", label: "Teams", icon: Users2 },
];

export const WORKSPACE_ICON = FolderOpen;
