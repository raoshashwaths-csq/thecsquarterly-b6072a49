import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  LayoutDashboard, Activity, Briefcase, FileEdit, Users2,
  Search, ArrowLeft, Pin, Star, Eye, EyeOff, ExternalLink,
  CheckCircle2, XCircle, MoreHorizontal, Send, Calendar, RefreshCw,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { getMe } from "@/lib/auth.functions";
import { QMark } from "@/components/site/QMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard as KitMetricCard } from "@/components/dashboard/MetricCard";
import {
  getControlPanelOverview, getAgentObservability, getQRunTranscript,
  listJobListings, moderateJobListing, updateJobFlags, seedSampleJobs,
  listEmailTemplates, sendTestBroadcast, schedulePost,
  listMasterUsers, manageUser,
} from "@/lib/control-panel.functions";
import { TIER_LABEL, ALL_DESIGNATIONS, PAID_DESIGNATIONS, isPaid } from "@/lib/admin-tiers";
import {
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";


export const Route = createFileRoute("/admin/control-panel")({
  head: () => ({
    meta: [
      { title: "Control Panel · The CS Quarterly" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ControlPanelPage,
});

type TabKey = "overview" | "diagnostics" | "jobs" | "publishing" | "users";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }>; hint: string }[] = [
  { key: "overview",    label: "Overview",     icon: LayoutDashboard, hint: "Business telemetry" },
  { key: "diagnostics", label: "Diagnostics",  icon: Activity,        hint: "Q. agent observability" },
  { key: "jobs",        label: "Job Marketplace", icon: Briefcase,    hint: "Moderation & inventory" },
  { key: "publishing",  label: "Publishing",   icon: FileEdit,        hint: "Articles & email" },
  { key: "users",       label: "Users",        icon: Users2,          hint: "Subscriber base" },
];

// ────────────────────────────────────────────────────────────────────
// Shell
// ────────────────────────────────────────────────────────────────────

function ControlPanelPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState<TabKey>("overview");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    getMe().then((me) => setIsAdmin(!!me?.isAdmin)).catch(() => setIsAdmin(false));
  }, [user]);

  if (loading || isAdmin === null) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">Authenticating…</div>;
  }
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-3">
          <h1 className="font-display text-3xl">Restricted</h1>
          <p className="text-muted-foreground">The Control Panel is admin-only.</p>
          <Link to="/" className="text-accent underline-offset-4 hover:underline">Return home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        {/* Sticky sidebar (20%) */}
        <aside className="sticky top-0 self-start h-screen w-[20%] min-w-[220px] max-w-[280px] border-r border-border bg-card/30">
          <div className="px-5 py-5 border-b border-border">
            <Link to="/admin" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Admin home
            </Link>
            <div className="mt-3 flex items-center gap-2">
              <QMark className="h-7 w-auto" />
              <div>
                <div className="font-display text-lg leading-none">Control Panel</div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-1">Command Center</div>
              </div>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = active === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActive(t.key)}
                  className={[
                    "w-full text-left rounded-md px-3 py-2 transition-colors flex items-start gap-2.5",
                    isActive
                      ? "bg-accent/10 text-foreground border border-accent/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm leading-tight">{t.label}</div>
                    <div className="text-[10px] uppercase tracking-[0.2em] mt-0.5 opacity-70">{t.hint}</div>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="p-3 mt-2 border-t border-border">
            <Link to="/admin" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <ExternalLink className="h-3 w-3" /> Switch to classic admin
            </Link>
          </div>
        </aside>

        {/* Workspace (80%) */}
        <main className="flex-1 min-w-0">
          <div className="px-6 lg:px-8 py-6">
            {active === "overview" && <OverviewTab />}
            {active === "diagnostics" && <DiagnosticsTab />}
            {active === "jobs" && <JobsTab />}
            {active === "publishing" && <PublishingTab />}
            {active === "users" && <UsersTab />}
          </div>
        </main>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Shared bits
// ────────────────────────────────────────────────────────────────────

function TabHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between border-b border-border pb-4 mb-5">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent font-semibold mb-1">Workspace</div>
        <h1 className="font-display text-3xl tracking-tight leading-none">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

// Local adapter that forwards to the shared dashboard MetricCard so every
// admin tile inherits the kit's accent bar + typography automatically.
function MetricCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <KitMetricCard
      eyebrow={label}
      value={value}
      accent={accent ? "accent" : "neutral"}
      footer={sub ? <span className="text-[11px] text-muted-foreground">{sub}</span> : undefined}
    />
  );
}


function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-8 h-9 text-sm"
      />
    </div>
  );
}

function fmtUsd(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
function fmtNum(n: number) { return n.toLocaleString(); }
function fmtDateShort(s: string) { return new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
function fmtDateTime(s: string) { return new Date(s).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }

// ────────────────────────────────────────────────────────────────────
// 1. OVERVIEW
// ────────────────────────────────────────────────────────────────────

function OverviewTab() {
  const fn = useServerFn(getControlPanelOverview);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["cp-overview"],
    queryFn: () => fn(),
    staleTime: 60_000,
  });
  const [search, setSearch] = useState("");

  const filteredRegs = useMemo(() => {
    if (!data?.latestRegistrations) return [];
    const q = search.toLowerCase().trim();
    if (!q) return data.latestRegistrations;
    return data.latestRegistrations.filter((r) =>
      r.email.toLowerCase().includes(q) || r.display_name.toLowerCase().includes(q) || r.tier.toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <div>
      <TabHeader
        title="Overview"
        subtitle="Top-of-funnel telemetry and audience movement across the last 30 days."
        action={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={["h-3.5 w-3.5 mr-1.5", isFetching ? "animate-spin" : ""].join(" ")} />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {isLoading ? (
          [...Array(5)].map((_, i) => <Skeleton key={i} className="h-[100px]" />)
        ) : (
          <>
            <MetricCard accent label="Total MRR" value={fmtUsd(data?.mrrCents ?? 0)} sub="Active paid subs × tier price" />
            <MetricCard label="ARR run-rate" value={fmtUsd(data?.arrCents ?? 0)} sub="MRR × 12" />
            <MetricCard label="Active Paid Subscribers" value={fmtNum(data?.paidSubscribers ?? 0)} sub="Practitioner and above" />
            <MetricCard label="Active Job Listings" value={fmtNum(data?.activeJobs ?? 0)} sub="Live on storefront" />
            <MetricCard label="Agent Sessions MTD" value={fmtNum(data?.agentSessionsMTD ?? 0)} sub="Month-to-date Q. runs" />
          </>
        )}
      </div>

      {data?.tierBreakdown && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {data.tierBreakdown.map((t) => (
            <Badge key={t.designation} variant="outline" className="text-[10px] tabular-nums">
              {TIER_LABEL[t.designation] ?? t.designation} · <span className="ml-1 font-mono">{t.count}</span>
            </Badge>
          ))}
        </div>
      )}

      <div className="rounded-md border border-border bg-card p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display text-lg leading-none">Sessions vs Registrations</h3>
            <p className="text-[11px] text-muted-foreground mt-1">Rolling 30-day window</p>
          </div>
          <Badge variant="outline" className="text-[10px] uppercase tracking-[0.2em]">Live</Badge>
        </div>
        <div className="h-[260px]">
          {isLoading || !data ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.series} margin={{ top: 8, right: 20, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                <XAxis dataKey="date" tickFormatter={fmtDateShort} stroke="var(--muted-foreground)" fontSize={10} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} />
                <RTooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", fontSize: 12 }}
                  labelFormatter={(l) => fmtDateShort(String(l))}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="sessions" name="Q. sessions" stroke="var(--accent)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="registrations" name="Registrations" stroke="var(--foreground)" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-md border border-border bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-display text-lg leading-none">Latest User Registrations</h3>
            <p className="text-[11px] text-muted-foreground mt-1">Most recent 25 sign-ups</p>
          </div>
          <div className="w-64"><SearchInput value={search} onChange={setSearch} placeholder="Search email or tier…" /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <th className="text-left font-normal py-2 px-3">Date</th>
                <th className="text-left font-normal py-2 px-3">Email</th>
                <th className="text-left font-normal py-2 px-3">Method</th>
                <th className="text-left font-normal py-2 px-3">Tier</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    <td colSpan={4} className="p-3"><Skeleton className="h-4 w-full" /></td>
                  </tr>
                ))
              ) : filteredRegs.length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground text-xs">No registrations match.</td></tr>
              ) : (
                filteredRegs.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                    <td className="py-2 px-3 text-muted-foreground tabular-nums">{fmtDateTime(r.created_at)}</td>
                    <td className="py-2 px-3">{r.email}</td>
                    <td className="py-2 px-3">
                      <Badge variant="outline" className="text-[10px]">{r.method}</Badge>
                    </td>
                    <td className="py-2 px-3">
                      <Badge variant={r.tier === "free" ? "secondary" : "default"} className="text-[10px] capitalize">{r.tier}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// 2. DIAGNOSTICS
// ────────────────────────────────────────────────────────────────────

function DiagnosticsTab() {
  const fn = useServerFn(getAgentObservability);
  const txFn = useServerFn(getQRunTranscript);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["cp-agent-obs"],
    queryFn: () => fn(),
    staleTime: 60_000,
  });
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<null | { id: string; loading: boolean; input?: string; output?: string }>(null);

  const filtered = useMemo(() => {
    if (!data?.executionLogs) return [];
    const q = search.toLowerCase().trim();
    if (!q) return data.executionLogs;
    return data.executionLogs.filter((r) =>
      r.operator_email.toLowerCase().includes(q) || r.node_id.toLowerCase().includes(q),
    );
  }, [data, search]);

  const openTranscript = async (id: string) => {
    setOpen({ id, loading: true });
    try {
      const tx = await txFn({ data: { runId: id } });
      setOpen({ id, loading: false, input: tx.input_json, output: tx.output_json });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load transcript");
      setOpen(null);
    }
  };

  return (
    <div>
      <TabHeader
        title="Diagnostics"
        subtitle="Observability ledger for Q. operator agent loops."
        action={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={["h-3.5 w-3.5 mr-1.5", isFetching ? "animate-spin" : ""].join(" ")} />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {isLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-[100px]" />)
        ) : (
          <>
            <MetricCard accent label="Total Token Burn" value={fmtNum(data?.totalTokenBurn ?? 0)} sub={`≈ $${(data?.costUsd ?? 0).toFixed(2)} compute`} />
            <MetricCard label="Avg Response Latency" value={`${fmtNum(data?.avgLatencyMs ?? 0)} ms`} sub="Across last 500 runs" />
            <MetricCard label="Compute Profit Margin" value={`${data?.profitMarginPct ?? 0}%`} sub={`Rev ≈ $${(data?.revenueUsd ?? 0).toFixed(2)}`} />
            <MetricCard label="Total Runs (all-time)" value={fmtNum(data?.totalRuns ?? 0)} sub="Lifetime agent invocations" />
          </>
        )}
      </div>

      <div className="rounded-md border border-border bg-card p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display text-lg leading-none">Path Frequency Heatmap</h3>
            <p className="text-[11px] text-muted-foreground mt-1">Interaction tree usage (last 30 days)</p>
          </div>
        </div>
        <div className="h-[220px]">
          {isLoading || !data ? <Skeleton className="h-full w-full" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.treeFrequency} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                <XAxis dataKey="tree" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} />
                <RTooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", fontSize: 12 }} />
                <Bar dataKey="count" fill="var(--accent)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-md border border-border bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-display text-lg leading-none">Execution Logs</h3>
            <p className="text-[11px] text-muted-foreground mt-1">Last 100 runs · click View Transcript for scrubbed payload</p>
          </div>
          <div className="w-64"><SearchInput value={search} onChange={setSearch} placeholder="Search operator or node…" /></div>
        </div>
        <div className="overflow-x-auto max-h-[520px]">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 sticky top-0">
              <tr className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <th className="text-left font-normal py-2 px-3">When</th>
                <th className="text-left font-normal py-2 px-3">Operator</th>
                <th className="text-left font-normal py-2 px-3">Node</th>
                <th className="text-left font-normal py-2 px-3">Latency</th>
                <th className="text-left font-normal py-2 px-3">Sentiment</th>
                <th className="text-right font-normal py-2 px-3">Transcript</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-t border-border"><td colSpan={6} className="p-3"><Skeleton className="h-4 w-full" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground text-xs">No runs match.</td></tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                    <td className="py-2 px-3 text-muted-foreground tabular-nums">{fmtDateTime(r.created_at)}</td>
                    <td className="py-2 px-3 truncate max-w-[220px]">{r.operator_email}</td>
                    <td className="py-2 px-3 font-mono text-[11px]">{r.node_id}</td>
                    <td className="py-2 px-3 tabular-nums">{r.latency_ms} ms</td>
                    <td className="py-2 px-3">
                      <Badge variant={r.sentiment === "up" ? "default" : "secondary"} className="text-[10px]">
                        {r.sentiment === "up" ? "↑ up" : "—"}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openTranscript(r.id)}>View Transcript</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Run Transcript</DialogTitle>
            <DialogDescription>Scrubbed prompt exchange · structural data only</DialogDescription>
          </DialogHeader>
          {open?.loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-auto">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1.5">Input context</div>
                <pre className="bg-muted/50 border border-border rounded-md p-3 text-xs font-mono overflow-auto">{open?.input}</pre>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1.5">Output zones</div>
                <pre className="bg-muted/50 border border-border rounded-md p-3 text-xs font-mono overflow-auto">{open?.output}</pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// 3. JOBS
// ────────────────────────────────────────────────────────────────────

const JOB_TIERS = [299, 499, 799, 1500, 6000];

function JobsTab() {
  const listFn = useServerFn(listJobListings);
  const modFn = useServerFn(moderateJobListing);
  const flagFn = useServerFn(updateJobFlags);
  const seedFn = useServerFn(seedSampleJobs);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["cp-jobs"],
    queryFn: () => listFn(),
    staleTime: 30_000,
  });
  const [pendingSearch, setPendingSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const pending = useMemo(() => (data ?? []).filter((j) => j.status === "pending"), [data]);
  const active = useMemo(() => (data ?? []).filter((j) => j.status === "active"), [data]);

  const filterPending = useMemo(() => {
    const q = pendingSearch.toLowerCase().trim();
    return q ? pending.filter((j) => j.employer_name.toLowerCase().includes(q) || j.job_title.toLowerCase().includes(q)) : pending;
  }, [pending, pendingSearch]);
  const filterActive = useMemo(() => {
    const q = activeSearch.toLowerCase().trim();
    return q ? active.filter((j) => j.employer_name.toLowerCase().includes(q) || j.job_title.toLowerCase().includes(q)) : active;
  }, [active, activeSearch]);

  const moderate = async (id: string, action: "approve" | "reject" | "delete") => {
    try {
      await modFn({ data: { id, action } });
      toast.success(`Listing ${action}d`);
      await qc.invalidateQueries({ queryKey: ["cp-jobs"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  };
  const flag = async (id: string, patch: { pinned?: boolean; featured?: boolean; status?: "pending" | "active" | "rejected" }) => {
    try {
      await flagFn({ data: { id, ...patch } });
      await qc.invalidateQueries({ queryKey: ["cp-jobs"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  return (
    <div>
      <TabHeader
        title="Job Marketplace"
        subtitle="Moderate inbound postings on the left, manage live inventory on the right."
        action={
          (data?.length ?? 0) === 0 ? (
            <Button size="sm" variant="outline" onClick={async () => { await seedFn(); await qc.invalidateQueries({ queryKey: ["cp-jobs"] }); toast.success("Sample jobs seeded"); }}>
              Seed sample jobs
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Left: pending */}
        <div className="rounded-md border border-border bg-card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h3 className="font-display text-lg leading-none">Pending Approval</h3>
              <p className="text-[11px] text-muted-foreground mt-1">{pending.length} inbound posting{pending.length === 1 ? "" : "s"}</p>
            </div>
            <div className="w-48"><SearchInput value={pendingSearch} onChange={setPendingSearch} placeholder="Search…" /></div>
          </div>
          <div className="max-h-[600px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 sticky top-0">
                <tr className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  <th className="text-left font-normal py-2 px-3">Employer</th>
                  <th className="text-left font-normal py-2 px-3">Title</th>
                  <th className="text-left font-normal py-2 px-3">Tier</th>
                  <th className="text-right font-normal py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? <tr><td colSpan={4} className="p-3"><Skeleton className="h-4 w-full" /></td></tr> :
                  filterPending.length === 0 ? (
                    <tr><td colSpan={4} className="p-6 text-center text-muted-foreground text-xs">No pending listings.</td></tr>
                  ) : filterPending.map((j) => (
                  <tr key={j.id} className="border-t border-border hover:bg-muted/20">
                    <td className="py-2 px-3 font-medium">{j.employer_name}</td>
                    <td className="py-2 px-3">{j.job_title}</td>
                    <td className="py-2 px-3"><Badge variant="outline" className="tabular-nums">${j.package_tier}</Badge></td>
                    <td className="py-2 px-3 text-right space-x-1">
                      <Button size="sm" className="h-7 text-xs" onClick={() => moderate(j.id, "approve")}>
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => moderate(j.id, "reject")}>
                        <XCircle className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: active inventory */}
        <div className="rounded-md border border-border bg-card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h3 className="font-display text-lg leading-none">Live Inventory</h3>
              <p className="text-[11px] text-muted-foreground mt-1">{active.length} active listing{active.length === 1 ? "" : "s"}</p>
            </div>
            <div className="w-48"><SearchInput value={activeSearch} onChange={setActiveSearch} placeholder="Search…" /></div>
          </div>
          <div className="max-h-[600px] overflow-auto divide-y divide-border">
            {isLoading ? <div className="p-3"><Skeleton className="h-4 w-full" /></div> :
              filterActive.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-xs">No active listings.</div>
              ) : filterActive.map((j) => (
              <div key={j.id} className="p-3 hover:bg-muted/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{j.job_title}</div>
                    <div className="text-xs text-muted-foreground truncate">{j.employer_name} · <span className="tabular-nums">${j.package_tier}</span></div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Clicks</div>
                    <div className="font-mono text-sm tabular-nums">{j.click_count}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 pt-2 border-t border-border/50">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <Switch checked={j.pinned} onCheckedChange={(v) => flag(j.id, { pinned: v })} />
                    <Pin className="h-3 w-3" /> Pin
                  </label>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <Switch checked={j.featured} onCheckedChange={(v) => flag(j.id, { featured: v })} />
                    <Star className="h-3 w-3" /> Feature
                  </label>
                  <Button size="sm" variant="ghost" className="ml-auto h-7 text-xs" onClick={() => flag(j.id, { status: "rejected" })}>
                    <EyeOff className="h-3 w-3 mr-1" /> Take down
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-border bg-card p-3 text-[11px] text-muted-foreground">
        Listing package tiers: {JOB_TIERS.map((t) => `$${t}`).join(" · ")}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// 4. PUBLISHING (content + email)
// ────────────────────────────────────────────────────────────────────

const TIER_OPTIONS = ["Free", "Vanguard Individual", "Vanguard Pro", "Enterprise Team"];

function PublishingTab() {
  return (
    <div>
      <TabHeader title="Publishing" subtitle="Compose new dispatches and orchestrate transactional mail loops." />
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3"><ArticleComposer /></div>
        <div className="xl:col-span-2"><MailerCenter /></div>
      </div>
    </div>
  );
}

function ArticleComposer() {
  const fn = useServerFn(schedulePost);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [section, setSection] = useState<"vanguard" | "retention-protocol" | "outcome-forum" | "codex">("vanguard");
  const [tiers, setTiers] = useState<string[]>(["Free"]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [busy, setBusy] = useState(false);

  const toggleTier = (t: string) => setTiers((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const submit = async () => {
    if (!slug || !title || !excerpt || !body) {
      toast.error("Slug, title, excerpt and body are required");
      return;
    }
    setBusy(true);
    try {
      await fn({
        data: {
          slug, title, subtitle: subtitle || undefined, excerpt, body, section,
          tier: tiers.includes("Free") && tiers.length === 1 ? "free" : "premium",
          tiers_allowed: tiers,
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        },
      });
      toast.success(scheduledAt ? "Scheduled" : "Published");
      setSlug(""); setTitle(""); setSubtitle(""); setExcerpt(""); setBody(""); setScheduledAt("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-md border border-border bg-card">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg leading-none">Article Composer</h3>
          <p className="text-[11px] text-muted-foreground mt-1">Markdown body · tier-gated publish</p>
        </div>
        <Badge variant="outline" className="text-[10px]">Drafts not auto-saved</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4">
        <div className="md:col-span-2 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug-here" className="h-9 text-sm font-mono" />
            <Select value={section} onValueChange={(v) => setSection(v as typeof section)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="vanguard">Vanguard</SelectItem>
                <SelectItem value="retention-protocol">Retention Protocol</SelectItem>
                <SelectItem value="outcome-forum">Outcome Forum</SelectItem>
                <SelectItem value="codex">Codex</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="h-10 text-base font-display" />
          <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtitle (optional)" className="h-9 text-sm" />
          <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Excerpt — say something different from the title." rows={2} className="text-sm" />
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="# Body in markdown…" rows={16} className="text-sm font-mono" />
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Tier gating</div>
            <div className="space-y-1.5">
              {TIER_OPTIONS.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={tiers.includes(t)} onCheckedChange={() => toggleTier(t)} />
                  <span>{t}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2 flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> Schedule
            </div>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="h-9 text-sm"
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">Leave blank to publish immediately.</p>
          </div>

          <Button onClick={submit} disabled={busy} className="w-full">
            {busy ? "Working…" : scheduledAt ? "Schedule Post" : "Publish Now"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MailerCenter() {
  const listFn = useServerFn(listEmailTemplates);
  const sendFn = useServerFn(sendTestBroadcast);
  const { data, isLoading } = useQuery({ queryKey: ["cp-templates"], queryFn: () => listFn(), staleTime: 5 * 60_000 });
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [bodyDraft, setBodyDraft] = useState<Record<string, string>>({});
  const [recipient, setRecipient] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!activeKey && data?.[0]) setActiveKey(data[0].key);
  }, [data, activeKey]);

  const current = data?.find((t) => t.key === activeKey) ?? null;

  const sendTest = async () => {
    if (!current || !recipient) { toast.error("Recipient required"); return; }
    setSending(true);
    try {
      await sendFn({ data: { templateKey: current.key, recipient } });
      toast.success("Test broadcast enqueued");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-md border border-border bg-card">
      <div className="p-4 border-b border-border">
        <h3 className="font-display text-lg leading-none">Mailer Center</h3>
        <p className="text-[11px] text-muted-foreground mt-1">Transactional loops · rewrite body & broadcast test</p>
      </div>

      <div className="divide-y divide-border">
        {isLoading ? <Skeleton className="h-12 m-3" /> : data?.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveKey(t.key)}
            className={[
              "w-full text-left p-3 hover:bg-muted/30 transition-colors",
              activeKey === t.key ? "bg-accent/5 border-l-2 border-accent" : "border-l-2 border-transparent",
            ].join(" ")}
          >
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">{t.displayName}</div>
              <Badge variant="outline" className="text-[10px]">{t.cadence}</Badge>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{t.subject}</div>
          </button>
        ))}
      </div>

      {current && (
        <div className="p-4 border-t border-border space-y-3 bg-muted/10">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1.5">Subject</div>
            <Input defaultValue={current.subject} className="h-9 text-sm" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1.5">Body override</div>
            <Textarea
              rows={5}
              placeholder="Body copy (uses default template if blank)…"
              value={bodyDraft[current.key] ?? ""}
              onChange={(e) => setBodyDraft((p) => ({ ...p, [current.key]: e.target.value }))}
              className="text-sm font-mono"
            />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1.5">Test recipient</div>
            <Input
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="you@example.com"
              className="h-9 text-sm"
            />
          </div>
          <Button onClick={sendTest} disabled={sending} className="w-full">
            <Send className="h-3.5 w-3.5 mr-1.5" />
            {sending ? "Sending…" : "Send Test Broadcast Email"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// 5. USERS
// ────────────────────────────────────────────────────────────────────

function UsersTab() {
  const listFn = useServerFn(listMasterUsers);
  const mgrFn = useServerFn(manageUser);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["cp-users"],
    queryFn: () => listFn(),
    staleTime: 60_000,
  });
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase().trim();
    return data.filter((u) => {
      if (tierFilter !== "all" && u.tier !== tierFilter) return false;
      if (!q) return true;
      return u.email.toLowerCase().includes(q) || u.display_name.toLowerCase().includes(q);
    });
  }, [data, search, tierFilter]);

  const act = async (user_id: string, action: "grant-vanguard" | "revoke-vanguard" | "grant-admin" | "revoke-admin" | "revoke-sessions") => {
    try {
      await mgrFn({ data: { user_id, action } });
      toast.success("Updated");
      await qc.invalidateQueries({ queryKey: ["cp-users"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div>
      <TabHeader
        title="Users"
        subtitle="Subscriber base · seat usage · admin overrides."
      />

      <div className="rounded-md border border-border bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border gap-3">
          <div className="flex-1 max-w-md"><SearchInput value={search} onChange={setSearch} placeholder="Search name, email…" /></div>
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="h-9 w-44 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tiers</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="vanguard">Vanguard</SelectItem>
              <SelectItem value="vanguard-pro">Vanguard Pro</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-[11px] text-muted-foreground tabular-nums">{filtered.length} users</div>
        </div>

        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 sticky top-0">
              <tr className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <th className="text-left font-normal py-2 px-3">Name</th>
                <th className="text-left font-normal py-2 px-3">Email</th>
                <th className="text-left font-normal py-2 px-3">Tier</th>
                <th className="text-left font-normal py-2 px-3">Affiliation</th>
                <th className="text-left font-normal py-2 px-3">Sessions</th>
                <th className="text-right font-normal py-2 px-3">Manage</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-t border-border"><td colSpan={6} className="p-3"><Skeleton className="h-4 w-full" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground text-xs">No users match.</td></tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="border-t border-border hover:bg-muted/20">
                    <td className="py-2 px-3 font-medium">
                      {u.display_name || "—"}
                      {u.is_admin && <Badge variant="default" className="ml-2 text-[9px]">admin</Badge>}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">{u.email}</td>
                    <td className="py-2 px-3">
                      <Badge variant={u.tier === "free" ? "secondary" : "default"} className="text-[10px] capitalize">{u.tier}</Badge>
                    </td>
                    <td className="py-2 px-3 text-muted-foreground text-xs">{u.tier === "enterprise" ? "Enterprise Team" : "—"}</td>
                    <td className="py-2 px-3 font-mono tabular-nums text-xs">{u.sessions_used} / {u.seat_cap}</td>
                    <td className="py-2 px-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          {u.tier === "vanguard" || u.tier === "vanguard-pro" || u.tier === "enterprise" ? (
                            <DropdownMenuItem onClick={() => act(u.id, "revoke-vanguard")}>Revoke Vanguard</DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => act(u.id, "grant-vanguard")}>Grant Vanguard (1y)</DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {u.is_admin ? (
                            <DropdownMenuItem onClick={() => act(u.id, "revoke-admin")}>Revoke admin role</DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => act(u.id, "grant-admin")}>Grant admin role</DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => act(u.id, "revoke-sessions")} className="text-destructive">
                            Revoke session tokens
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
