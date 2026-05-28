import {
  Activity,
  LayoutGrid,
  Users as UsersIcon,
  TrendingUp,
  Shield,
  Heart,
  Flame,
  BarChart3,
  Calculator,
  Gauge,
  FolderOpen,
  Users2,
  BookUser,
} from "lucide-react";

export type NavLink = {
  to: string;
  hash?: string;
  label: string;
  icon: typeof Activity;
  external?: boolean;
};

export const TOP_LINKS: NavLink[] = [
  { to: "/csfactors", label: "Pulse", icon: Activity },
  { to: "/csfactors", hash: "#accounts", label: "Accounts", icon: LayoutGrid },
  { to: "/csfactors", hash: "#renewals", label: "Renewals", icon: UsersIcon },
];

export const ANALYTICS_LINKS: NavLink[] = [
  { to: "/account/analytics", label: "Executive Portfolio", icon: TrendingUp },
  { to: "/account/analytics/nrr-waterfall", label: "Retention Analysis", icon: Shield },
  { to: "/account/analytics/stakeholder-radar", label: "Account Health Matrix", icon: Heart },
  { to: "/account/analytics/retention-funnel", label: "Churn Risk & Expansion", icon: Flame },
];

// Workspace handled separately (opens a Sheet)
export const STANDALONE_LINKS: NavLink[] = [
  { to: "/ai-readiness", label: "AI Readiness Diagnostic", icon: Gauge },
  { to: "/calculator", label: "ROI Calculator", icon: Calculator },
  { to: "/benchmarks", label: "NRR Benchmarks", icon: BarChart3 },
  { to: "/directory", label: "Operator Directory", icon: BookUser },
  { to: "/teams", label: "Teams", icon: Users2 },
];

export const WORKSPACE_ICON = FolderOpen;
