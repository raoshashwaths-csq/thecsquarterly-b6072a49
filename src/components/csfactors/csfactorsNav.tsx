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
  { to: "/csfactors/maps", label: "MAP Engine", icon: MapIcon },
  { to: "/csfactors", hash: "#renewals", label: "Renewals", icon: UsersIcon },
  { to: "/csfactors/360", label: "360 Dashboard", icon: LayoutDashboard },
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
