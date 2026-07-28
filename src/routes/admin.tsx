import { createFileRoute, useNavigate, Outlet, useChildMatches, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  LayoutDashboard, FileText, MessageSquare, BookOpen, Users, CreditCard,
  ShoppingBag, BarChart3, Sparkles, Search as SearchIcon, UsersRound, Mail, Link as LinkIcon,
  Download, Upload, ScrollText, Languages, Brain, ThumbsUp, Activity,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { QMark } from "@/components/site/QMark";
import { useAuth } from "@/hooks/useAuth";
import { getMe } from "@/lib/auth.functions";
import {
  listAllPostsAdmin, listAllPlaybooksAdmin, upsertPost, deletePost,
  upsertPlaybook, deletePlaybook,
} from "@/lib/posts.functions";
import {
  getAdminStats, listSubscribers, listSubscriptions, listPurchases, listSurveyResponses,
  getQAdminStats, listQRunsAdmin, listQEntitlementsAdmin,
} from "@/lib/admin.functions";
import { exportDataset, importArticles, listAuditLog } from "@/lib/admin-ops.functions";
import { backfillEmbeddings } from "@/lib/embeddings.functions";
import { listReactionAggregates } from "@/lib/post-reactions.functions";
import { TREES, getNode, breadcrumbFor } from "@/lib/q-trees";
import { LumiKnowledgeAdmin, LumiFeedbackAdmin, SystemJobsAdmin } from "@/components/admin/LumiAdminPanels";
import { HomepageHeadlinesAdmin, ComicStripsAdmin } from "@/components/admin/EditorialAdminPanels";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · The CS Quarterly" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type SectionKey =
  | "dashboard" | "posts" | "conversations" | "playbooks"
  | "subscribers" | "subscriptions" | "purchases" | "payment-links"
  | "diagnostic" | "community" | "q-agent" | "ai-agent" | "search" | "email"
  | "import-articles" | "audit-log" | "reader-signals"
  | "lumi-knowledge" | "lumi-feedback" | "system-jobs"
  | "headlines" | "strips";

type NavItem = { key: SectionKey; label: string; icon: React.ComponentType<{ className?: string }>; soon?: boolean; group: "Editorial" | "Audience" | "Commerce" | "Operations" };

const NAV: NavItem[] = [
  { key: "dashboard", label: "Overview", icon: LayoutDashboard, group: "Editorial" },
  { key: "posts", label: "Articles", icon: FileText, group: "Editorial" },
  { key: "import-articles", label: "Import Articles", icon: Upload, group: "Editorial" },
  { key: "conversations", label: "1:1 Conversations", icon: MessageSquare, soon: true, group: "Editorial" },
  { key: "playbooks", label: "Codex Playbooks", icon: BookOpen, group: "Editorial" },
  { key: "subscribers", label: "Newsletter Subscribers", icon: Mail, group: "Audience" },
  { key: "subscriptions", label: "Members", icon: Users, group: "Audience" },
  { key: "diagnostic", label: "Diagnostic Responses", icon: BarChart3, group: "Audience" },
  { key: "reader-signals", label: "Reader Signals", icon: BarChart3, group: "Audience" },
  { key: "community", label: "Community", icon: UsersRound, soon: true, group: "Audience" },
  { key: "purchases", label: "Purchases", icon: ShoppingBag, group: "Commerce" },
  { key: "payment-links", label: "Payment Links", icon: LinkIcon, soon: true, group: "Commerce" },
  { key: "q-agent", label: "Q. Operator Agent", icon: Sparkles, group: "Operations" },
  { key: "lumi-knowledge", label: "Lumi Knowledge", icon: Brain, group: "Operations" },
  { key: "lumi-feedback", label: "Lumi Feedback", icon: ThumbsUp, group: "Operations" },
  { key: "system-jobs", label: "System Jobs", icon: Activity, group: "Operations" },
  { key: "audit-log", label: "Audit Log", icon: ScrollText, group: "Operations" },
  { key: "ai-agent", label: "Editorial AI Agent", icon: Sparkles, soon: true, group: "Operations" },
  { key: "search", label: "Global Search", icon: SearchIcon, soon: true, group: "Operations" },
  { key: "email", label: "Editorial Email", icon: CreditCard, soon: true, group: "Operations" },
];

const SECTIONS = ["vanguard", "retention-protocol", "outcome-forum", "codex"] as const;

function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const fetchMe = useServerFn(getMe);
  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe(), enabled: !!user });
  const [active, setActive] = useState<SectionKey>("dashboard");
  const childMatches = useChildMatches();
  if (childMatches.length > 0) return <Outlet />;

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  if (me.data && !me.data.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center px-6 py-20 text-center">
          <div>
            <div className="font-mono uppercase tracking-widest text-xs text-accent mb-3">Restricted</div>
            <h1 className="font-display text-4xl mb-4">Editorial access only.</h1>
            <p className="text-muted-foreground max-w-md">Your account doesn't have admin privileges.</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const groups = useMemo(() => {
    const g: Record<string, NavItem[]> = {};
    NAV.forEach((n) => { (g[n.group] ||= []).push(n); });
    return g;
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-[1500px] mx-auto px-6 py-10 w-full">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-2">Editorial dashboard</div>
            <h1 className="font-display text-5xl">The Newsroom</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              to="/admin/plans"
              className="font-mono text-xs uppercase tracking-[0.25em] border border-accent text-accent px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Plans &amp; SKUs →
            </Link>
            <Link
              to="/admin/payments"
              className="font-mono text-xs uppercase tracking-[0.25em] border border-border px-3 py-2 hover:bg-muted/40 transition-colors"
            >
              Payments Analytics →
            </Link>
            <Link
              to="/admin/control-panel"
              className="font-mono text-xs uppercase tracking-[0.25em] border border-border px-3 py-2 hover:bg-muted/40 transition-colors"
            >
              Open Control Panel →
            </Link>
          </div>
        </div>

        {me.data?.isAdmin && (
          <div className="grid lg:grid-cols-[260px_1fr] gap-10">
            <aside className="lg:sticky lg:top-24 self-start">
              <nav className="space-y-6">
                {Object.entries(groups).map(([group, items]) => (
                  <div key={group}>
                    <div className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2 px-2">{group}</div>
                    <ul className="space-y-px">
                      {items.map((item) => {
                        const Icon = item.icon;
                        const isActive = active === item.key;
                        return (
                          <li key={item.key}>
                            <button
                              onClick={() => setActive(item.key)}
                              className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors border-l-2 ${
                                isActive
                                  ? "border-accent bg-muted/40 text-foreground"
                                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                              }`}
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              <span className="flex-1 truncate">{item.key === "q-agent" ? <><QMark /> Operator Agent</> : item.label}</span>
                              {item.soon && (
                                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground border border-border px-1.5 py-0.5">
                                  Soon
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
                <div>
                  <div className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2 px-2">Content</div>
                  <Link
                    to="/admin/content/translation"
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm border-l-2 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  >
                    <Languages className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">Translation</span>
                  </Link>
                </div>
              </nav>
            </aside>

            <section className="min-w-0">
              {active === "dashboard" && <DashboardSection />}
              {active === "posts" && <PostsAdmin />}
              {active === "playbooks" && <PlaybooksAdmin />}
              {active === "subscribers" && <SubscribersList />}
              {active === "subscriptions" && <SubscriptionsList />}
              {active === "purchases" && <PurchasesList />}
              {active === "diagnostic" && <DiagnosticList />}
              {active === "q-agent" && <QAgentAdmin />}
              {active === "reader-signals" && <ReaderSignalsAdmin />}
              {active === "import-articles" && <ImportArticlesAdmin />}
              {active === "audit-log" && <AuditLogAdmin />}
              {active === "lumi-knowledge" && <LumiKnowledgeAdmin />}
              {active === "lumi-feedback" && <LumiFeedbackAdmin />}
              {active === "system-jobs" && <SystemJobsAdmin />}
              {active === "conversations" && <ComingSoon
                title="1:1 Conversations with Leaders"
                blurb="A long-form interview section. Schedule, draft, and publish recorded conversations with CS leaders alongside transcripts and pull-quotes."
                checklist={["Conversation table (guest, role, company, scheduled_at)", "Transcript + audio file storage", "Publish as its own article type", "Featured-guest carousel on home"]}
              />}
              {active === "community" && <ComingSoon
                title="Community"
                blurb="Unlocks at 1,000 paid members. Threaded discussions, AMAs with the leaders we interview, and a private channel for Vanguard members."
                checklist={["Spaces (general, retention, ai, hiring)", "Threads + replies with reactions", "Moderation queue + reports", "Member directory with company filter"]}
              />}
              {active === "ai-agent" && <ComingSoon
                title="Editorial AI Agent"
                blurb="A co-pilot that drafts the 3-2-1 model articles in your voice, suggests headlines, and flags repetition between title, subtitle and excerpt."
                checklist={["Style-guide retrieval (memory + past pieces)", "Draft → review → revise loop", "Repetition detector for title/subtitle/excerpt", "Push to Articles as a draft"]}
              />}
              {active === "search" && <ComingSoon
                title="Global Search"
                blurb="One search bar over articles, playbooks, conversations, and community threads with semantic + keyword ranking."
                checklist={["pg_trgm + pgvector index on posts/playbooks", "Embeddings job on publish", "Cmd-K palette in admin + site header", "Top-result preview cards"]}
              />}
              {active === "payment-links" && <ComingSoon
                title="Payment Links"
                blurb="Single-click links for Vanguard subscriptions and Codex playbooks. Create, share, and track conversions per link."
                checklist={["Stripe payment-link table (slug → price_id)", "Per-link conversion metrics", "Embed as buttons in articles", "Promo codes + expiry"]}
              />}
              {active === "email" && <ComingSoon
                title="Editorial Email"
                blurb="Send the weekly dispatch from admin@thecsquarterly.com with the same 3-2-1 layout. Auto-build the issue from the latest articles."
                checklist={["Verified sender on thecsquarterly.com", "Auto-compose from new articles", "Segment by tier (free vs Vanguard)", "Open + click tracking"]}
              />}
            </section>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

// ============== Sections ==============

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="border border-border p-5">
      <div className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">{label}</div>
      <div className="font-display text-4xl leading-none">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-2">{hint}</div>}
    </div>
  );
}

function DashboardSection() {
  const fetchStats = useServerFn(getAdminStats);
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: () => fetchStats() });
  const d = stats.data;
  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Published Articles" value={d?.posts ?? "—"} />
        <StatCard label="Codex Playbooks" value={d?.playbooks ?? "—"} />
        <StatCard label="Active Paid Members" value={d?.activeSubscriptions ?? "—"} hint="Practitioner and above" />
        <StatCard label="Newsletter Subscribers" value={d?.subscribers ?? "—"} />
        <StatCard label="Diagnostic Responses" value={d?.surveys ?? "—"} />
        <StatCard label="MRR" value={d ? `$${(d.mrrCents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"} hint={d ? `ARR run-rate $${(d.arrCents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "From active paid subs"} />
      </div>
      <div className="border border-border p-6">
        <div className="font-mono text-xs uppercase tracking-[0.25em] text-accent mb-2">Editorial cadence</div>
        <p className="font-display text-2xl leading-snug max-w-2xl">
          New articles follow the 3-2-1 model: <span className="text-accent">3 facts</span>, <span className="text-accent">2 insights</span>, <span className="text-accent">1 actionable</span>. Title, subtitle and excerpt must each say something different.
        </p>
      </div>
    </div>
  );
}

function ComingSoon({ title, blurb, checklist }: { title: string; blurb: string; checklist: string[] }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-2">Groundwork ready</div>
        <h2 className="font-display text-4xl mb-3">{title}</h2>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">{blurb}</p>
      </div>
      <div className="border border-border p-6">
        <div className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">When you're ready, this becomes</div>
        <ul className="space-y-2">
          {checklist.map((c) => (
            <li key={c} className="flex items-start gap-3 text-sm">
              <span className="text-accent mt-0.5">·</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DataTable<T extends Record<string, any>>({ rows, cols, empty }: {
  rows: T[]; cols: { key: keyof T | string; label: string; render?: (r: T) => React.ReactNode }[]; empty: string;
}) {
  if (!rows.length) return <div className="border border-border p-6 text-sm text-muted-foreground">{empty}</div>;
  return (
    <div className="border border-border overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr>{cols.map((c) => (
            <th key={String(c.key)} className="text-left font-mono uppercase tracking-widest text-xs text-muted-foreground px-4 py-3">
              {c.label}
            </th>
          ))}</tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-muted/20">
              {cols.map((c) => (
                <td key={String(c.key)} className="px-4 py-3 align-top">
                  {c.render ? c.render(r) : String(r[c.key as keyof T] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString() : "—");

type ExportDataset =
  | "posts" | "playbooks" | "subscribers" | "subscriptions" | "purchases"
  | "survey_responses" | "q_runs" | "admin_audit_log" | "profiles" | "user_roles" | "email_send_log";

function ExportButton({ dataset, label = "Export CSV" }: { dataset: ExportDataset; label?: string }) {
  const run = useServerFn(exportDataset);
  const [busy, setBusy] = useState(false);
  const onClick = async () => {
    try {
      setBusy(true);
      const res = await run({ data: { dataset } });
      const blob = new Blob([res.csv || ""], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `csq-${dataset}-${stamp}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${res.count} row${res.count === 1 ? "" : "s"}.`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-2 px-3 py-2 border border-border text-xs font-mono uppercase tracking-widest hover:bg-muted/40 transition-colors disabled:opacity-50"
    >
      <Download className="h-3.5 w-3.5" />
      {busy ? "Exporting…" : label}
    </button>
  );
}

function BackfillEmbeddingsButton() {
  const run = useServerFn(backfillEmbeddings);
  const [busy, setBusy] = useState(false);
  const onClick = async () => {
    if (!confirm("Generate embeddings for all published articles missing one? This may take a minute.")) return;
    try {
      setBusy(true);
      const res = await run({ data: { limit: 200 } });
      toast.success(`Embedded ${res.embedded} of ${res.total}${res.failed ? ` · ${res.failed} failed` : ""}.`);
      if (res.errors?.length) console.warn("Embedding errors:", res.errors);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-2 px-3 py-2 border border-border text-xs font-mono uppercase tracking-widest hover:bg-muted/40 transition-colors disabled:opacity-50"
      title="Generate semantic-search embeddings for all published posts missing one"
    >
      <Sparkles className="h-3.5 w-3.5" />
      {busy ? "Embedding…" : "Embed all"}
    </button>
  );
}

function SectionHeader({ title, dataset }: { title: string; dataset?: ExportDataset }) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <h2 className="font-display text-3xl">{title}</h2>
      {dataset && <ExportButton dataset={dataset} />}
    </div>
  );
}

function SubscribersList() {
  const fn = useServerFn(listSubscribers);
  const q = useQuery({ queryKey: ["admin-subscribers"], queryFn: () => fn() });
  return (
    <div className="space-y-4">
      <SectionHeader title="Newsletter Subscribers" dataset="subscribers" />
      <DataTable
        rows={q.data ?? []}
        empty="No subscribers yet."
        cols={[
          { key: "email", label: "Email" },
          { key: "segment", label: "Segment" },
          { key: "source", label: "Source" },
          { key: "created_at", label: "Joined", render: (r) => fmtDate(r.created_at) },
        ]}
      />
    </div>
  );
}

function SubscriptionsList() {
  const fn = useServerFn(listSubscriptions);
  const q = useQuery({ queryKey: ["admin-subscriptions"], queryFn: () => fn() });
  return (
    <div className="space-y-4">
      <SectionHeader title="Members" dataset="subscriptions" />
      <DataTable
        rows={q.data ?? []}
        empty="No members yet."
        cols={[
          { key: "user_id", label: "User", render: (r) => <code className="text-xs">{String(r.user_id).slice(0, 8)}</code> },
          { key: "tier_label", label: "Tier" },
          { key: "status", label: "Status" },
          { key: "current_period_end", label: "Renews", render: (r) => fmtDate(r.current_period_end) },
          { key: "created_at", label: "Joined", render: (r) => fmtDate(r.created_at) },
        ]}
      />
    </div>
  );
}

function PurchasesList() {
  const fn = useServerFn(listPurchases);
  const q = useQuery({ queryKey: ["admin-purchases"], queryFn: () => fn() });
  return (
    <div className="space-y-4">
      <SectionHeader title="Purchases" dataset="purchases" />
      <DataTable
        rows={q.data ?? []}
        empty="No purchases yet."
        cols={[
          { key: "user_id", label: "User", render: (r) => <code className="text-xs">{String(r.user_id).slice(0, 8)}</code> },
          { key: "item_type", label: "Type" },
          { key: "item_id", label: "Item" },
          { key: "amount_cents", label: "Amount", render: (r) => `$${(r.amount_cents / 100).toFixed(2)}` },
          { key: "status", label: "Status" },
          { key: "created_at", label: "When", render: (r) => fmtDate(r.created_at) },
        ]}
      />
    </div>
  );
}

function DiagnosticList() {
  const fn = useServerFn(listSurveyResponses);
  const q = useQuery({ queryKey: ["admin-surveys"], queryFn: () => fn() });
  return (
    <div className="space-y-4">
      <SectionHeader title="Diagnostic Responses" dataset="survey_responses" />
      <DataTable
        rows={q.data ?? []}
        empty="No diagnostic responses yet."
        cols={[
          { key: "email", label: "Email" },
          { key: "name", label: "Name" },
          { key: "company", label: "Company" },
          { key: "role", label: "Role" },
          { key: "score", label: "Score" },
          { key: "tier", label: "Tier" },
          { key: "created_at", label: "When", render: (r) => fmtDate(r.created_at) },
        ]}
      />
    </div>
  );
}

// ============== Posts & Playbooks (unchanged structure, restyled headings) ==============

function PostsAdmin() {
  const fetchAll = useServerFn(listAllPostsAdmin);
  const save = useServerFn(upsertPost);
  const del = useServerFn(deletePost);
  const list = useQuery({ queryKey: ["admin-posts"], queryFn: () => fetchAll() });
  const [editing, setEditing] = useState<any | null>(null);

  const blank = () => setEditing({
    slug: "", title: "", subtitle: "", excerpt: "", body: "## Heading\n\nWrite here.",
    title_mckinsey: "", body_mckinsey: "",
    title_wodehouse: "", body_wodehouse: "",
    category: "Vanguard", section: "vanguard", author: "The Editors",
    read_minutes: 7, tier: "free", published: true, cover_image_url: "",
    published_at: "",
    series_slug: "", series_title: "", series_part: null, series_total: null, sources: "",
  });

  const submit = async () => {
    try {
      const payload: any = { ...editing };
      if (!payload.id) delete payload.id;
      if (!payload.cover_image_url) delete payload.cover_image_url;
      if (!payload.subtitle) delete payload.subtitle;
      (["title_mckinsey","body_mckinsey","title_wodehouse","body_wodehouse",
        "series_slug","series_title","sources","published_at"] as const).forEach((k) => {
        if (!payload[k] || !String(payload[k]).trim()) payload[k] = null;
      });
      // series_part / series_total: blank → null, else coerce to number
      (["series_part","series_total"] as const).forEach((k) => {
        const v = payload[k];
        if (v === "" || v === null || v === undefined) payload[k] = null;
        else payload[k] = typeof v === "number" ? v : parseInt(String(v), 10) || null;
      });
      await save({ data: payload });
      toast.success("Saved.");
      setEditing(null);
      list.refetch();
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><h2 className="font-display text-3xl">Articles</h2><ExportButton dataset="posts" /><BackfillEmbeddingsButton /></div>
        <button onClick={blank} className="px-4 py-2 bg-foreground text-background font-mono uppercase tracking-widest text-xs hover:bg-foreground/90 transition-colors">+ New article</button>
      </div>
      <div className="border border-border divide-y divide-border max-h-[600px] overflow-auto bg-background">
        {(list.data ?? []).map((p) => (
          <div key={p.id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-display text-lg truncate">{p.title}</div>
              <div className="font-mono uppercase tracking-widest text-xs text-muted-foreground">
                {p.section} · {p.tier} · {p.published ? "live" : "draft"}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setEditing(p)} className="px-3 py-1 border border-border text-xs hover:bg-muted/40 transition-colors">Edit</button>
              <button onClick={async () => { if (confirm("Delete?")) { await del({ data: { id: p.id } }); list.refetch(); } }} className="px-3 py-1 border border-destructive text-destructive text-xs hover:bg-destructive/10 transition-colors">Delete</button>
            </div>
          </div>
        ))}
        {list.data?.length === 0 && <div className="p-6 text-sm text-muted-foreground">No articles yet.</div>}
      </div>

      {editing && <PostEditor editing={editing} setEditing={setEditing} onCancel={() => setEditing(null)} onSubmit={submit} />}
    </section>
  );
}

type Tone = "default" | "analytical" | "witty";

function PostEditor({ editing, setEditing, onCancel, onSubmit }: {
  editing: any; setEditing: (e: any) => void; onCancel: () => void; onSubmit: () => void;
}) {
  const [tone, setTone] = useState<Tone>("default");
  const inputCls = "w-full border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:border-accent transition-colors";
  const selectCls = `${inputCls} appearance-none cursor-pointer`;

  return (
    <div className="fixed inset-0 bg-foreground/70 z-50 flex items-start sm:items-center justify-center p-0 sm:p-6 overflow-y-auto">
      <div className="bg-background border border-border w-full max-w-2xl my-0 sm:my-8 max-h-[100dvh] sm:max-h-[calc(100dvh-4rem)] flex flex-col shadow-2xl">
        {/* Sticky header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-background sticky top-0 z-10">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-1">
              {editing.id ? "Editing" : "New article"}
            </div>
            <div className="font-display text-2xl leading-tight">
              {editing.title || "Untitled"}
            </div>
          </div>
          <button onClick={onCancel} aria-label="Close" className="text-muted-foreground hover:text-foreground text-2xl leading-none px-2">×</button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Tone tabs */}
          <div className="inline-flex border border-border bg-background rounded-sm overflow-hidden text-xs font-mono uppercase tracking-widest">
            {([
              { k: "default", label: "Canonical" },
              { k: "analytical", label: "Analytical" },
              { k: "witty", label: "Witty" },
            ] as { k: Tone; label: string }[]).map((t) => (
              <button
                key={t.k}
                onClick={() => setTone(t.k)}
                className={`px-3 py-1.5 transition-colors ${
                  tone === t.k
                    ? t.k === "witty"
                      ? "bg-secondary-accent text-secondary-accent-foreground"
                      : "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {tone === "default"
              ? "The canonical version. Required."
              : tone === "analytical"
              ? "McKinsey-style structured analysis. Optional — leave blank to skip."
              : "Wodehouse-style witty voice. Optional — leave blank to skip."}
          </p>

          {tone === "default" && (
            <div className="grid gap-3 text-sm">
              <Field label="Slug">
                <input placeholder="lowercase-with-dashes" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Title">
                <input placeholder="Headline" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Subtitle" hint="Distinct from the title.">
                <input value={editing.subtitle ?? ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Excerpt" hint="Distinct from both title and subtitle.">
                <textarea value={editing.excerpt} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} rows={2} className={inputCls} />
              </Field>
              <Field label="Body" hint="Markdown lite (## heading, - bullet). Follow 3 facts, 2 insights, 1 actionable.">
                <textarea value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} rows={14} className={`${inputCls} font-mono text-xs leading-relaxed`} />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Field label="Category">
                  <input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Section">
                  <select value={editing.section} onChange={(e) => setEditing({ ...editing, section: e.target.value })} className={selectCls}>
                    {SECTIONS.map((s) => <option key={s} value={s} className="bg-background text-foreground">{s}</option>)}
                  </select>
                </Field>
                <Field label="Author">
                  <input value={editing.author} onChange={(e) => setEditing({ ...editing, author: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Read minutes">
                  <input type="number" min={1} max={120} value={editing.read_minutes} onChange={(e) => setEditing({ ...editing, read_minutes: parseInt(e.target.value) || 1 })} className={inputCls} />
                </Field>
                <Field label="Tier">
                  <select value={editing.tier} onChange={(e) => setEditing({ ...editing, tier: e.target.value })} className={selectCls}>
                    <option value="free" className="bg-background text-foreground">Free</option>
                    <option value="premium" className="bg-background text-foreground">Premium (Vanguard)</option>
                  </select>
                </Field>
                <Field label="Status">
                  <label className="flex items-center gap-2 border border-border px-3 py-2 cursor-pointer bg-background">
                    <input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} className="accent-accent" />
                    <span className="text-sm">Published</span>
                  </label>
                </Field>
              </div>

              <div className="pt-4 mt-2 border-t border-border space-y-3">
                <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Scheduling & series</div>
                <Field label="Publish at" hint="ISO timestamp. Blank = publish immediately. Future = scheduled release.">
                  <input type="text" placeholder="2026-06-02T12:00:00+00:00" value={editing.published_at ?? ""} onChange={(e) => setEditing({ ...editing, published_at: e.target.value })} className={inputCls} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Series slug" hint="lowercase-with-dashes. Leave blank for standalone dispatch.">
                    <input value={editing.series_slug ?? ""} onChange={(e) => setEditing({ ...editing, series_slug: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Series title">
                    <input value={editing.series_title ?? ""} onChange={(e) => setEditing({ ...editing, series_title: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Part #">
                    <input type="number" min={1} max={99} value={editing.series_part ?? ""} onChange={(e) => setEditing({ ...editing, series_part: e.target.value === "" ? null : parseInt(e.target.value) })} className={inputCls} />
                  </Field>
                  <Field label="Total parts">
                    <input type="number" min={1} max={99} value={editing.series_total ?? ""} onChange={(e) => setEditing({ ...editing, series_total: e.target.value === "" ? null : parseInt(e.target.value) })} className={inputCls} />
                  </Field>
                </div>
                <Field label="Sources" hint="One per line. Rendered as a list at the foot of the article.">
                  <textarea value={editing.sources ?? ""} onChange={(e) => setEditing({ ...editing, sources: e.target.value })} rows={5} className={`${inputCls} font-mono text-xs leading-relaxed`} />
                </Field>
              </div>
            </div>
          )}

          {tone === "analytical" && (
            <div className="grid gap-3 text-sm">
              <Field label="Analytical title" hint="Optional. Leave blank to skip the analytical voice for this piece.">
                <input value={editing.title_mckinsey ?? ""} onChange={(e) => setEditing({ ...editing, title_mckinsey: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Analytical body" hint="Same 3-2-1 structure, McKinsey register.">
                <textarea value={editing.body_mckinsey ?? ""} onChange={(e) => setEditing({ ...editing, body_mckinsey: e.target.value })} rows={20} className={`${inputCls} font-mono text-xs leading-relaxed`} />
              </Field>
            </div>
          )}

          {tone === "witty" && (
            <div className="grid gap-3 text-sm">
              <Field label="Witty title" hint="Optional. Leave blank to skip the witty voice for this piece.">
                <input value={editing.title_wodehouse ?? ""} onChange={(e) => setEditing({ ...editing, title_wodehouse: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Witty body" hint="Same 3-2-1 structure, Wodehouse register.">
                <textarea value={editing.body_wodehouse ?? ""} onChange={(e) => setEditing({ ...editing, body_wodehouse: e.target.value })} rows={20} className={`${inputCls} font-mono text-xs leading-relaxed`} />
              </Field>
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border bg-background sticky bottom-0 z-10">
          <button onClick={onCancel} className="px-4 py-2 border border-border text-sm hover:bg-muted/40 transition-colors">Cancel</button>
          <button onClick={onSubmit} className="px-4 py-2 bg-foreground text-background text-sm font-mono uppercase tracking-widest hover:bg-foreground/90 transition-colors">Save</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground mb-1.5">{label}</div>
      {children}
      {hint && <div className="text-xs text-muted-foreground mt-1.5 leading-snug">{hint}</div>}
    </label>
  );
}


function PlaybooksAdmin() {
  const fetchAll = useServerFn(listAllPlaybooksAdmin);
  const save = useServerFn(upsertPlaybook);
  const del = useServerFn(deletePlaybook);
  const list = useQuery({ queryKey: ["admin-playbooks"], queryFn: () => fetchAll() });
  const [editing, setEditing] = useState<any | null>(null);

  const blank = () => setEditing({
    slug: "", title: "", summary: "", body: "## Section\n\nContent.",
    category: "Framework", price_cents: 4900, pages: 12, included_in_vanguard: true, published: true,
  });

  const submit = async () => {
    try {
      const payload = { ...editing };
      if (!payload.id) delete payload.id;
      await save({ data: payload });
      toast.success("Saved.");
      setEditing(null);
      list.refetch();
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><h2 className="font-display text-3xl">Codex Playbooks</h2><ExportButton dataset="playbooks" /></div>
        <button onClick={blank} className="px-4 py-2 bg-foreground text-background font-mono uppercase tracking-widest text-xs">+ New playbook</button>
      </div>
      <div className="border border-border divide-y divide-border max-h-[600px] overflow-auto">
        {(list.data ?? []).map((p: any) => (
          <div key={p.id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-display text-lg truncate">{p.title}</div>
              <div className="font-mono uppercase tracking-widest text-xs text-muted-foreground">
                {p.category} · ${(p.price_cents / 100).toFixed(0)} · {p.pages}pp
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setEditing(p)} className="px-3 py-1 border border-border text-xs">Edit</button>
              <button onClick={async () => { if (confirm("Delete?")) { await del({ data: { id: p.id } }); list.refetch(); } }} className="px-3 py-1 border border-destructive text-destructive text-xs">Delete</button>
            </div>
          </div>
        ))}
        {list.data?.length === 0 && <div className="p-6 text-sm text-muted-foreground">No playbooks yet.</div>}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-foreground/70 z-50 flex items-start sm:items-center justify-center p-0 sm:p-6 overflow-y-auto">
          <div className="bg-background border border-border w-full max-w-2xl my-0 sm:my-8 max-h-[100dvh] sm:max-h-[calc(100dvh-4rem)] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-background sticky top-0 z-10">
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-1">
                  {editing.id ? "Editing playbook" : "New playbook"}
                </div>
                <div className="font-display text-2xl leading-tight">{editing.title || "Untitled"}</div>
              </div>
              <button onClick={() => setEditing(null)} aria-label="Close" className="text-muted-foreground hover:text-foreground text-2xl leading-none px-2">×</button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="grid gap-3 text-sm">
                <Field label="Slug">
                  <input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} className="w-full border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:border-accent transition-colors" />
                </Field>
                <Field label="Title">
                  <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:border-accent transition-colors" />
                </Field>
                <Field label="Summary">
                  <textarea value={editing.summary} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} rows={2} className="w-full border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:border-accent transition-colors" />
                </Field>
                <Field label="Body" hint="Markdown lite.">
                  <textarea value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} rows={14} className="w-full border border-border bg-background text-foreground px-3 py-2 font-mono text-xs leading-relaxed focus:outline-none focus:border-accent transition-colors" />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <Field label="Category">
                    <input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="w-full border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:border-accent transition-colors" />
                  </Field>
                  <Field label="Price (cents)">
                    <input type="number" value={editing.price_cents} onChange={(e) => setEditing({ ...editing, price_cents: parseInt(e.target.value) || 0 })} className="w-full border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:border-accent transition-colors" />
                  </Field>
                  <Field label="Pages">
                    <input type="number" value={editing.pages} onChange={(e) => setEditing({ ...editing, pages: parseInt(e.target.value) || 0 })} className="w-full border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:border-accent transition-colors" />
                  </Field>
                  <Field label="Vanguard">
                    <label className="flex items-center gap-2 border border-border px-3 py-2 cursor-pointer bg-background">
                      <input type="checkbox" checked={editing.included_in_vanguard} onChange={(e) => setEditing({ ...editing, included_in_vanguard: e.target.checked })} className="accent-accent" />
                      <span className="text-sm">Included in Vanguard</span>
                    </label>
                  </Field>
                  <Field label="Status">
                    <label className="flex items-center gap-2 border border-border px-3 py-2 cursor-pointer bg-background">
                      <input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} className="accent-accent" />
                      <span className="text-sm">Published</span>
                    </label>
                  </Field>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border bg-background sticky bottom-0 z-10">
              <button onClick={() => setEditing(null)} className="px-4 py-2 border border-border text-sm hover:bg-muted/40 transition-colors">Cancel</button>
              <button onClick={submit} className="px-4 py-2 bg-foreground text-background text-sm font-mono uppercase tracking-widest hover:bg-foreground/90 transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}

// ============== Q. — Operator Agent ==============

function QAgentAdmin() {
  const fetchStats = useServerFn(getQAdminStats);
  const fetchRuns = useServerFn(listQRunsAdmin);
  const fetchEnts = useServerFn(listQEntitlementsAdmin);
  const stats = useQuery({ queryKey: ["q-admin-stats"], queryFn: () => fetchStats() });
  const runs = useQuery({ queryKey: ["q-admin-runs"], queryFn: () => fetchRuns() });
  const ents = useQuery({ queryKey: ["q-admin-ents"], queryFn: () => fetchEnts() });
  const s = stats.data;

  const treeRows = TREES.map((t) => ({
    id: t.id,
    title: t.title,
    blurb: t.blurb,
    count: s?.perTree30?.[t.id] ?? 0,
  })).sort((a, b) => b.count - a.count);

  const wittyPct = s && s.total > 0 ? Math.round((s.wittyCount / s.total) * 100) : 0;

  return (
    <div className="space-y-10">
      <div>
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-2">Operator agent</div>
        <h2 className="font-display text-4xl mb-2"><QMark /> Control Room</h2>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          Every canvas run, every voice toggle, every shared response. <QMark /> is gated to admins and active Vanguard subscribers — manage them here.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total runs" value={s?.total ?? "—"} />
        <StatCard label="Last 7 days" value={s?.last7 ?? "—"} />
        <StatCard label="Last 30 days" value={s?.last30 ?? "—"} hint={`${s?.uniqueOperators30 ?? 0} unique operators`} />
        <StatCard label="Witty voice" value={s ? `${wittyPct}%` : "—"} hint="Wodehouse register share" />
        <StatCard label="Shared runs" value={s?.sharedCount ?? "—"} hint="Marked shareable by operators" />
        <StatCard label="Entitled operators" value={ents.data?.length ?? "—"} hint="Admins + active Vanguard" />
      </div>

      <div>
        <div className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">Trees · last 30 days</div>
        <div className="border border-border divide-y divide-border">
          {treeRows.map((t) => {
            const max = Math.max(1, ...treeRows.map((r) => r.count));
            const pct = (t.count / max) * 100;
            return (
              <div key={t.id} className="px-4 py-3 grid grid-cols-[60px_1fr_auto] items-center gap-4">
                <div className="font-mono text-xs text-accent">{t.id}</div>
                <div>
                  <div className="font-display text-base leading-tight">{t.title}</div>
                  <div className="text-xs text-muted-foreground">{t.blurb}</div>
                  <div className="mt-1.5 h-1 bg-muted/50">
                    <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="font-mono text-sm tabular-nums">{t.count}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">Recent runs</div>
        <DataTable
          rows={runs.data ?? []}
          empty="No Q. runs yet."
          cols={[
            { key: "created_at", label: "When", render: (r) => new Date(r.created_at).toLocaleString() },
            { key: "operator_email", label: "Operator" },
            { key: "node_id", label: "Decision", render: (r) => {
              const n = getNode(r.node_id);
              return (
                <div>
                  <div className="text-sm">{n?.label ?? r.node_id}</div>
                  <div className="text-xs font-mono text-muted-foreground">{breadcrumbFor(r.node_id).join(" › ")}</div>
                </div>
              );
            }},
            { key: "witty", label: "Voice", render: (r) => (
              <span className="font-mono uppercase tracking-widest text-xs">
                {r.witty ? "Witty" : "Analytical"}
              </span>
            )},
            { key: "shared", label: "Shared", render: (r) => r.shared ? <span className="text-accent">●</span> : <span className="text-muted-foreground">—</span> },
            { key: "id", label: "Run", render: (r) => (
              <a href={`/agent/response/${r.id}`} className="font-mono uppercase tracking-widest text-xs underline">Open</a>
            )},
          ]}
        />
      </div>

      <div>
        <div className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">Entitled operators</div>
        <DataTable
          rows={ents.data ?? []}
          empty="No entitled operators yet."
          cols={[
            { key: "email", label: "Email" },
            { key: "is_admin", label: "Admin", render: (r) => r.is_admin ? <span className="font-mono uppercase tracking-widest text-xs text-accent">Admin</span> : "—" },
            { key: "has_vanguard", label: "Vanguard", render: (r) => r.has_vanguard ? <span className="font-mono uppercase tracking-widest text-xs">Active</span> : "—" },
            { key: "since", label: "Since", render: (r) => fmtDate(r.since) },
            { key: "renews", label: "Renews", render: (r) => fmtDate(r.renews) },
          ]}
        />
      </div>
    </div>
  );
}


// ============== Import Articles ==============

function ImportArticlesAdmin() {
  const run = useServerFn(importArticles);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"upsert" | "skip-existing">("upsert");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ slug: string; status: string; error?: string }[] | null>(null);

  const parseCsv = (raw: string): Record<string, unknown>[] => {
    const lines: string[][] = [];
    let cur: string[] = [];
    let cell = "";
    let inQ = false;
    for (let i = 0; i < raw.length; i++) {
      const c = raw[i];
      if (inQ) {
        if (c === '"' && raw[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') inQ = false;
        else cell += c;
      } else {
        if (c === '"') inQ = true;
        else if (c === ",") { cur.push(cell); cell = ""; }
        else if (c === "\n" || c === "\r") {
          if (c === "\r" && raw[i + 1] === "\n") i++;
          cur.push(cell); lines.push(cur); cur = []; cell = "";
        } else cell += c;
      }
    }
    if (cell.length || cur.length) { cur.push(cell); lines.push(cur); }
    const nonEmpty = lines.filter((l) => l.some((v) => v.trim() !== ""));
    if (nonEmpty.length < 2) return [];
    const headers = nonEmpty[0].map((h) => h.trim());
    return nonEmpty.slice(1).map((row) => {
      const o: Record<string, unknown> = {};
      headers.forEach((h, i) => { o[h] = row[i] ?? ""; });
      return o;
    });
  };

  const submit = async () => {
    try {
      setBusy(true);
      setResults(null);
      const trimmed = text.trim();
      if (!trimmed) { toast.error("Paste CSV or JSON first."); return; }
      let articles: Record<string, unknown>[];
      if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        const parsed = JSON.parse(trimmed);
        articles = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        articles = parseCsv(trimmed);
      }
      if (!articles.length) { toast.error("No rows detected."); return; }
      const res = await run({ data: { articles, mode } });
      setResults(res.results);
      toast.success(`Imported ${res.ok}, skipped ${res.skipped}, errored ${res.errored}.`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (f: File) => {
    setText(await f.text());
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-2">Bulk import</div>
        <h2 className="font-display text-4xl mb-2">Import Articles</h2>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          Upload a CSV or paste JSON. Required columns: <code>slug, title, excerpt, body</code>.
          Optional: <code>subtitle, category, section, author, read_minutes, tier, published,
          published_at, cover_image_url, title_mckinsey, body_mckinsey, title_wodehouse, body_wodehouse,
          series_slug, series_title, series_part, series_total, sources</code>.
        </p>
      </div>

      <div className="border border-border p-5 space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <label className="inline-flex items-center gap-2 px-3 py-2 border border-border text-xs font-mono uppercase tracking-widest cursor-pointer hover:bg-muted/40">
            <Upload className="h-3.5 w-3.5" /> Choose file
            <input type="file" accept=".csv,.json,text/csv,application/json" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
          </label>
          <div className="inline-flex border border-border text-xs font-mono uppercase tracking-widest">
            {(["upsert", "skip-existing"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-3 py-2 ${mode === m ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                {m === "upsert" ? "Upsert" : "Skip existing"}
              </button>
            ))}
          </div>
          <button onClick={submit} disabled={busy}
            className="ml-auto px-4 py-2 bg-foreground text-background text-xs font-mono uppercase tracking-widest disabled:opacity-50">
            {busy ? "Importing…" : "Import"}
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste CSV (with header row) or a JSON array of article objects…"
          rows={14}
          className="w-full border border-border bg-background text-foreground px-3 py-2 font-mono text-xs leading-relaxed focus:outline-none focus:border-accent"
        />
      </div>

      {results && (
        <div className="border border-border">
          <div className="px-4 py-3 border-b border-border font-mono uppercase tracking-widest text-xs text-muted-foreground">
            Results · {results.length}
          </div>
          <div className="max-h-[400px] overflow-auto divide-y divide-border">
            {results.map((r, i) => (
              <div key={i} className="px-4 py-2 flex items-start gap-3 text-sm">
                <span className={`font-mono uppercase tracking-widest text-xs shrink-0 ${
                  r.status === "ok" ? "text-accent" : r.status === "skipped" ? "text-muted-foreground" : "text-destructive"
                }`}>{r.status}</span>
                <span className="font-mono text-xs">{r.slug}</span>
                {r.error && <span className="text-xs text-destructive">{r.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============== Audit Log ==============

function AuditLogAdmin() {
  const fn = useServerFn(listAuditLog);
  const [filterAction, setFilterAction] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const q = useQuery({
    queryKey: ["admin-audit-log", filterAction, filterEmail],
    queryFn: () => fn({ data: { limit: 200, action: filterAction || undefined, actor_email: filterEmail || undefined } }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-2">Activity</div>
          <h2 className="font-display text-4xl">Audit Log</h2>
        </div>
        <ExportButton dataset="admin_audit_log" />
      </div>
      <div className="flex gap-3 flex-wrap">
        <input
          placeholder="Filter action (e.g. export.csv)"
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-accent w-64"
        />
        <input
          placeholder="Filter actor email"
          value={filterEmail}
          onChange={(e) => setFilterEmail(e.target.value)}
          className="border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-accent w-64"
        />
        <button onClick={() => q.refetch()} className="px-3 py-2 border border-border text-xs font-mono uppercase tracking-widest hover:bg-muted/40">
          Refresh
        </button>
      </div>
      <DataTable
        rows={q.data ?? []}
        empty="No admin actions recorded yet."
        cols={[
          { key: "created_at", label: "When", render: (r) => new Date(r.created_at).toLocaleString() },
          { key: "actor_email", label: "Actor", render: (r) => r.actor_email ?? <code className="text-xs">{String(r.actor_id ?? "").slice(0, 8)}</code> },
          { key: "action", label: "Action", render: (r) => <span className="font-mono text-xs">{r.action}</span> },
          { key: "target_table", label: "Target", render: (r) => r.target_table ? <span className="font-mono text-xs">{r.target_table}{r.target_id ? `/${String(r.target_id).slice(0, 8)}` : ""}</span> : "—" },
          { key: "details", label: "Details", render: (r) => <code className="text-xs text-muted-foreground">{r.details ? JSON.stringify(r.details) : ""}</code> },
          { key: "ip", label: "IP", render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.ip ?? "—"}</span> },
        ]}
      />
    </div>
  );
}

function ReaderSignalsAdmin() {
  const fetchAgg = useServerFn(listReactionAggregates);
  const q = useQuery({
    queryKey: ["admin-reader-signals"],
    queryFn: () => fetchAgg({ data: { sinceDays: 30, limit: 50 } }),
  });
  const rows = q.data?.rows ?? [];
  const threads = q.data?.disagreeThreads ?? [];
  const totals = rows.reduce(
    (acc, r) => ({
      total: acc.total + r.total,
      applied: acc.applied + r.applied,
      language: acc.language + r.language,
      confirmed: acc.confirmed + r.confirmed,
      disagree: acc.disagree + r.disagree,
    }),
    { total: 0, applied: 0, language: 0, confirmed: 0, disagree: 0 },
  );
  const pct = (n: number) => (totals.total ? Math.round((n / totals.total) * 100) : 0);

  return (
    <div className="space-y-8">
      <div>
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-2">Editorial calibration</div>
        <h2 className="font-display text-4xl mb-3">Reader Signals</h2>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          One tap per reader per dispatch. Use disagree-rate to surface theses worth revisiting; the pushback threads below are saved Lumi conversations.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Signals (30d)" value={totals.total} />
        <StatCard label="Applied" value={pct(totals.applied) + "%"} hint={totals.applied + " signals"} />
        <StatCard label="Language" value={pct(totals.language) + "%"} hint={totals.language + " signals"} />
        <StatCard label="Confirmed" value={pct(totals.confirmed) + "%"} hint={totals.confirmed + " signals"} />
        <StatCard label="Disagree" value={pct(totals.disagree) + "%"} hint={totals.disagree + " signals"} />
      </div>

      <div className="border border-border">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Per-dispatch breakdown · last 30 days
          </div>
          <button onClick={() => q.refetch()} className="px-3 py-1 border border-border text-xs font-mono uppercase tracking-widest hover:bg-muted/40">
            Refresh
          </button>
        </div>
        {q.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No signals yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">Dispatch</th>
                <th className="px-3 py-2 font-mono text-xs uppercase tracking-widest text-muted-foreground text-right">Total</th>
                <th className="px-3 py-2 font-mono text-xs uppercase tracking-widest text-muted-foreground text-right">Applied</th>
                <th className="px-3 py-2 font-mono text-xs uppercase tracking-widest text-muted-foreground text-right">Language</th>
                <th className="px-3 py-2 font-mono text-xs uppercase tracking-widest text-muted-foreground text-right">Confirmed</th>
                <th className="px-3 py-2 font-mono text-xs uppercase tracking-widest text-muted-foreground text-right">Disagree</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .slice()
                .sort((a, b) => (b.disagree / Math.max(b.total, 1)) - (a.disagree / Math.max(a.total, 1)))
                .map((r) => {
                  const p = (n: number) => (r.total ? Math.round((n / r.total) * 100) : 0);
                  return (
                    <tr key={r.post_id} className="border-b border-border/60 hover:bg-muted/20">
                      <td className="px-4 py-2">
                        <Link to="/insights/$slug" params={{ slug: r.slug }} className="hover:text-accent underline-offset-2 hover:underline">
                          {r.title}
                        </Link>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{r.section}</div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs">{r.total}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs">{p(r.applied)}%</td>
                      <td className="px-3 py-2 text-right font-mono text-xs">{p(r.language)}%</td>
                      <td className="px-3 py-2 text-right font-mono text-xs">{p(r.confirmed)}%</td>
                      <td className="px-3 py-2 text-right font-mono text-xs">
                        <span className={p(r.disagree) >= 25 ? "text-accent" : ""}>{p(r.disagree)}%</span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </div>

      <div className="border border-border">
        <div className="px-4 py-3 border-b border-border font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Recent pushback threads
        </div>
        {threads.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No disagreement threads yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {threads.map((t) => (
              <li key={t.id} className="px-4 py-3 text-sm flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="truncate">
                    <span className="text-muted-foreground">Pushback on </span>
                    {t.postSlug ? (
                      <Link to="/insights/$slug" params={{ slug: t.postSlug }} className="hover:text-accent underline-offset-2 hover:underline">
                        {t.postTitle || t.title}
                      </Link>
                    ) : (
                      <span>{t.postTitle || t.title}</span>
                    )}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {new Date(t.createdAt).toLocaleString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
