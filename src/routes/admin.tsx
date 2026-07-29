import { createFileRoute, useNavigate, Outlet, useChildMatches, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  LayoutDashboard, FileText, MessageSquare, BookOpen, Users, CreditCard,
  ShoppingBag, BarChart3, Sparkles, Search as SearchIcon, UsersRound, Mail, Link as LinkIcon,
  Download, Upload, ScrollText, Languages, Brain, ThumbsUp, Activity, Building2, ClipboardList, LayoutList,
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
import { HomepageHeadlinesAdmin, ComicStripsAdmin, PlacementReviewPanel } from "@/components/admin/EditorialAdminPanels";
import { TeamsAdmin, BenchmarkSurveyAdmin } from "@/components/admin/EnterpriseAdminPanels";

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
  | "headlines" | "strips" | "placements"
  | "teams" | "benchmark-survey";

type NavItem = { key: SectionKey; label: string; icon: React.ComponentType<{ className?: string }>; soon?: boolean; group: "Editorial" | "Audience" | "Commerce" | "Operations" };

const NAV: NavItem[] = [
  { key: "dashboard", label: "Overview", icon: LayoutDashboard, group: "Editorial" },
  { key: "posts", label: "Articles", icon: FileText, group: "Editorial" },
  { key: "import-articles", label: "Import Articles", icon: Upload, group: "Editorial" },
  { key: "conversations", label: "1:1 Conversations", icon: MessageSquare, soon: true, group: "Editorial" },
  { key: "playbooks", label: "Codex Playbooks", icon: BookOpen, group: "Editorial" },
  { key: "headlines", label: "Homepage Headlines", icon: ScrollText, group: "Editorial" },
  { key: "strips", label: "Felix & Nora Strips", icon: FileText, group: "Editorial" },
  { key: "placements", label: "Strip Placements", icon: LayoutList, group: "Editorial" },
  { key: "subscribers", label: "Newsletter Subscribers", icon: Mail, group: "Audience" },
  { key: "subscriptions", label: "Members", icon: Users, group: "Audience" },
  { key: "teams", label: "Teams & Workspaces", icon: Building2, group: "Audience" },
  { key: "diagnostic", label: "Diagnostic Responses", icon: BarChart3, group: "Audience" },
  { key: "benchmark-survey", label: "Retention Ledger Survey", icon: ClipboardList, group: "Audience" },
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
              {active === "headlines" && <HomepageHeadlinesAdmin />}
              {active === "strips" && <ComicStripsAdmin />}
              {active === "placements" && <PlacementReviewPanel />}
              {active === "teams" && <TeamsAdmin />}
              {active === "benchmark-survey" && <BenchmarkSurveyAdmin />}
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
                checklist={["Style-guide retrieval (memory + past pieces)", "Draft -> review -> revise loop", "Repetition detector for title/subtitle/excerpt", "Push to Articles as a draft"]}
              />}
              {active === "search" && <ComingSoon
                title="Global Search"
                blurb="One search bar over articles, playbooks, conversations, and community threads with semantic + keyword ranking."
                checklist={["pg_trgm + pgvector index on posts/playbooks", "Embeddings job on publish", "Cmd-K palette in admin + site header", "Top-result preview cards"]}
              />}
              {active === "payment-links" && <ComingSoon
                title="Payment Links"
                blurb="Single-click links for Vanguard subscriptions and Codex playbooks. Create, share, and track conversions per link."
                checklist={["Stripe payment-link table (slug -> price_id)", "Per-link conversion metrics", "Embed as buttons in articles", "Promo codes + expiry"]}
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
          { key: "user_email", label: "User" },
          { key: "item_type", label: "Type" },
          { key: "item_title", label: "Item" },
          { key: "amount_cents", label: "Amount", render: (r) => `$${(r.amount_cents / 100).toFixed(2)}` },
          { key: "status", label: "Status" },
          { key: "created_at", label: "Date", render: (r) => fmtDate(r.created_at) },
        ]}
      />
    </div>
  );
}

function DiagnosticList() {
  const fn = useServerFn(listSurveyResponses);
  const q = useQuery({ queryKey: ["admin-diagnostic"], queryFn: () => fn() });
  return (
    <div className="space-y-4">
      <SectionHeader title="Diagnostic Responses" dataset="survey_responses" />
      <DataTable
        rows={q.data ?? []}
        empty="No responses yet."
        cols={[
          { key: "email", label: "Email" },
          { key: "name", label: "Name" },
          { key: "company", label: "Company" },
          { key: "role", label: "Role" },
          { key: "tier", label: "Tier" },
          { key: "score", label: "Score" },
          { key: "created_at", label: "Date", render: (r) => fmtDate(r.created_at) },
        ]}
      />
    </div>
  );
}

function ImportArticlesAdmin() {
  const run = useServerFn(importArticles);
  const [busy, setBusy] = useState(false);
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const mode = formData.get("mode") as "upsert" | "skip";
    const files = formData.getAll("files") as File[];
    if (!files.length) { toast.error("Choose at least one file."); return; }
    setBusy(true);
    try {
      const rows = [] as any[];
      for (const file of files) {
        const text = await file.text();
        const parsed = JSON.parse(text);
        rows.push(...(Array.isArray(parsed) ? parsed : [parsed]));
      }
      const res = await run({ data: { rows, mode } });
      toast.success(`Imported ${res.imported} / ${res.total}.`);
      form.reset();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-6">
      <SectionHeader title="Import Articles" />
      <div className="border border-border p-6">
        <div className="text-sm text-muted-foreground mb-6">
          Upload JSON files containing articles. Each file should be an array of objects with:
          <code className="text-xs ml-1">slug, title, subtitle, excerpt, body, category, author, read_minutes, is_premium, section, tier, published</code>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block">Mode</label>
            <select name="mode" className="border border-border px-3 py-2 bg-transparent text-sm">
              <option value="upsert">Upsert (insert or update)</option>
              <option value="skip">Skip existing</option>
            </select>
          </div>
          <div>
            <label className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block">Files</label>
            <input type="file" name="files" accept=".json" multiple className="text-sm" />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 border border-border text-xs font-mono uppercase tracking-widest hover:bg-muted/40 transition-colors disabled:opacity-50"
          >
            {busy ? "Importing…" : "Import"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AuditLogAdmin() {
  const fn = useServerFn(listAuditLog);
  const q = useQuery({ queryKey: ["admin-audit-log"], queryFn: () => fn({ data: { limit: 100 } }) });
  return (
    <div className="space-y-4">
      <SectionHeader title="Audit Log" dataset="admin_audit_log" />
      <DataTable
        rows={q.data ?? []}
        empty="No audit entries yet."
        cols={[
          { key: "action", label: "Action" },
          { key: "actor_email", label: "Actor" },
          { key: "target_table", label: "Table" },
          { key: "details", label: "Details", render: (r) => <code className="text-xs">{JSON.stringify(r.details ?? {}).slice(0, 120)}</code> },
          { key: "created_at", label: "Date", render: (r) => fmtDate(r.created_at) },
        ]}
      />
    </div>
  );
}

function ReaderSignalsAdmin() {
  const fetchStats = useServerFn(getAdminStats);
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: () => fetchStats() });
  const d = stats.data;
  const fn = useServerFn(listReactionAggregates);
  const reactions = useQuery({ queryKey: ["admin-reactions"], queryFn: () => fn(), enabled: !!d?.posts });

  return (
    <div className="space-y-6">
      <SectionHeader title="Reader Signals" />
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Total Reactions" value={d?.totalReactions ?? "—"} />
        <StatCard label="Avg Reactions / Post" value={d?.avgReactionsPerPost ?? "—"} />
        <StatCard label="Top Reactor" value={d?.topReactorEmail ?? "—"} hint={`${d?.topReactorCount ?? 0} reactions`} />
      </div>
      {reactions.data && reactions.data.length > 0 && (
        <DataTable
          rows={reactions.data}
          empty="No reactions yet."
          cols={[
            { key: "emoji", label: "Emoji" },
            { key: "post_title", label: "Post" },
            { key: "count", label: "Count" },
            { key: "user_emails", label: "Users", render: (r) => (r.user_emails ?? []).slice(0, 3).join(", ") },
          ]}
        />
      )}
    </div>
  );
}

// Q-Agent Admin
function QAgentAdmin() {
  const [selectedTree, setSelectedTree] = useState<string>("");
  const fetchStats = useServerFn(getQAdminStats);
  const stats = useQuery({ queryKey: ["q-admin-stats"], queryFn: () => fetchStats() });
  const listEntitlements = useServerFn(listQEntitlementsAdmin);
  const entitlements = useQuery({
    queryKey: ["q-entitlements"],
    queryFn: () => listEntitlements(),
  });
  const listRuns = useServerFn(listQRunsAdmin);
  const [runFilters, setRunFilters] = useState({ treeId: "", nodeId: "", limit: 50 });
  const runs = useQuery({
    queryKey: ["q-runs", runFilters],
    queryFn: () => listRuns({ data: runFilters }),
  });

  const selectedTreeData = TREES.find((t) => t.id === selectedTree);
  const selectedNode = selectedTreeData && selectedTree ? getNode(selectedTree, selectedTree) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl"><QMark /> Operator Agent</h2>
      </div>
      {stats.data && (
        <div className="grid sm:grid-cols-4 gap-4">
          <StatCard label="Total Runs" value={stats.data.totalRuns ?? "—"} />
          <StatCard label="Unique Users" value={stats.data.uniqueUsers ?? "—"} />
          <StatCard label="Avg Turns" value={stats.data.avgTurns ?? "—"} />
          <StatCard label="Completion Rate" value={stats.data.completionRate ? `${(stats.data.completionRate * 100).toFixed(1)}%` : "—"} />
        </div>
      )}
      <div className="border border-border p-6">
        <div className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">Decision Trees</div>
        <div className="space-y-2">
          {TREES.map((tree) => (
            <button
              key={tree.id}
              onClick={() => setSelectedTree(tree.id === selectedTree ? "" : tree.id)}
              className={`w-full text-left px-4 py-3 border transition-colors ${
                selectedTree === tree.id ? "border-accent bg-muted/40" : "border-border hover:bg-muted/30"
              }`}
            >
              <div className="font-display text-lg">{tree.name}</div>
              <div className="text-xs text-muted-foreground">{tree.id} · {Object.keys(tree.nodes).length} nodes</div>
            </button>
          ))}
        </div>
        {selectedNode && (
          <div className="mt-4 p-4 border border-accent/30 bg-accent/5">
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-accent mb-2">Selected Node</div>
            <div className="font-display text-xl">{selectedNode.question}</div>
            <div className="text-xs text-muted-foreground mt-1">{selectedTree} → {selectedTree}</div>
          </div>
        )}
      </div>
      {entitlements.data && entitlements.data.length > 0 && (
        <div className="space-y-4">
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">Entitlements</div>
          <DataTable
            rows={entitlements.data}
            empty="No entitlements."
            cols={[
              { key: "user_id", label: "User" },
              { key: "tree_id", label: "Tree" },
              { key: "node_id", label: "Node" },
              { key: "unlocked", label: "Unlocked" },
              { key: "created_at", label: "Date", render: (r) => fmtDate(r.created_at) },
            ]}
          />
        </div>
      )}
    </div>
  );
}

// Posts Admin
function PostsAdmin() {
  const listFn = useServerFn(listAllPostsAdmin);
  const { data: posts, isLoading, refetch } = useQuery({ queryKey: ["admin-posts"], queryFn: () => listFn() });
  const upsertFn = useServerFn(upsertPost);
  const deleteFn = useServerFn(deletePost);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading articles…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader title="Articles" dataset="posts" />
        <button
          onClick={() => { setEditing("new"); setForm({}); }}
          className="px-3 py-2 border border-accent text-accent text-xs font-mono uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          New Article
        </button>
      </div>
      {editing === "new" && (
        <PostForm
          form={form}
          setForm={setForm}
          onSave={async () => {
            await upsertFn({ data: form });
            toast.success("Article saved.");
            setEditing(null);
            refetch();
          }}
          onCancel={() => setEditing(null)}
        />
      )}
      <DataTable
        rows={posts ?? []}
        empty="No articles yet."
        cols={[
          { key: "title", label: "Title", render: (r) => <span className="font-display">{r.title}</span> },
          { key: "slug", label: "Slug", render: (r) => <code className="text-xs">{r.slug}</code> },
          { key: "category", label: "Category" },
          { key: "is_premium", label: "Premium", render: (r) => r.is_premium ? "Yes" : "No" },
          { key: "published", label: "Published", render: (r) => r.published ? "Yes" : "No" },
          { key: "actions", label: "", render: (r) => (
            <div className="flex gap-2">
              <button
                onClick={() => { setEditing(r.id); setForm(r); }}
                className="text-xs font-mono uppercase tracking-widest text-accent hover:underline"
              >
                Edit
              </button>
              <button
                onClick={async () => { if (confirm("Delete this article?")) { await deleteFn({ data: { id: r.id } }); toast.success("Deleted."); refetch(); } }}
                className="text-xs font-mono uppercase tracking-widest text-destructive hover:underline"
              >
                Delete
              </button>
            </div>
          )},
        ]}
      />
      {editing && editing !== "new" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border p-6 max-w-2xl w-full max-h-[90vh] overflow-auto">
            <PostForm
              form={form}
              setForm={setForm}
              onSave={async () => {
                await upsertFn({ data: form });
                toast.success("Article updated.");
                setEditing(null);
                refetch();
              }}
              onCancel={() => setEditing(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PostForm({ form, setForm, onSave, onCancel }: {
  form: Record<string, any>;
  setForm: (f: Record<string, any>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const fields = [
    { key: "slug", label: "Slug" },
    { key: "title", label: "Title" },
    { key: "subtitle", label: "Subtitle" },
    { key: "excerpt", label: "Excerpt" },
    { key: "body", label: "Body", textarea: true },
    { key: "category", label: "Category" },
    { key: "author", label: "Author" },
    { key: "read_minutes", label: "Read Minutes", type: "number" },
  ];
  return (
    <div className="border border-border p-6 space-y-4">
      <div className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">
        {form.id ? "Edit Article" : "New Article"}
      </div>
      {fields.map((f) => (
        <div key={f.key}>
          <label className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1 block">{f.label}</label>
          {f.textarea ? (
            <textarea
              value={form[f.key] ?? ""}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className="w-full border border-border px-3 py-2 bg-transparent text-sm min-h-[200px]"
            />
          ) : (
            <input
              type={f.type ?? "text"}
              value={form[f.key] ?? ""}
              onChange={(e) => setForm({ ...form, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value })}
              className="w-full border border-border px-3 py-2 bg-transparent text-sm"
            />
          )}
        </div>
      ))}
      <div className="flex gap-2">
        <button onClick={onSave} className="px-4 py-2 border border-accent text-accent text-xs font-mono uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-colors">
          Save
        </button>
        <button onClick={onCancel} className="px-4 py-2 border border-border text-xs font-mono uppercase tracking-widest hover:bg-muted/40 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

// Playbooks Admin
function PlaybooksAdmin() {
  const listFn = useServerFn(listAllPlaybooksAdmin);
  const { data: playbooks, isLoading, refetch } = useQuery({ queryKey: ["admin-playbooks"], queryFn: () => listFn() });
  const upsertFn = useServerFn(upsertPlaybook);
  const deleteFn = useServerFn(deletePlaybook);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading playbooks…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader title="Codex Playbooks" dataset="playbooks" />
        <button
          onClick={() => { setEditing("new"); setForm({}); }}
          className="px-3 py-2 border border-accent text-accent text-xs font-mono uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          New Playbook
        </button>
      </div>
      {editing === "new" && (
        <PlaybookForm
          form={form}
          setForm={setForm}
          onSave={async () => {
            await upsertFn({ data: form });
            toast.success("Playbook saved.");
            setEditing(null);
            refetch();
          }}
          onCancel={() => setEditing(null)}
        />
      )}
      <DataTable
        rows={playbooks ?? []}
        empty="No playbooks yet."
        cols={[
          { key: "title", label: "Title", render: (r) => <span className="font-display">{r.title}</span> },
          { key: "slug", label: "Slug", render: (r) => <code className="text-xs">{r.slug}</code> },
          { key: "category", label: "Category" },
          { key: "price_cents", label: "Price", render: (r) => `$${(r.price_cents / 100).toFixed(2)}` },
          { key: "published", label: "Published", render: (r) => r.published ? "Yes" : "No" },
          { key: "actions", label: "", render: (r) => (
            <div className="flex gap-2">
              <button
                onClick={() => { setEditing(r.id); setForm(r); }}
                className="text-xs font-mono uppercase tracking-widest text-accent hover:underline"
              >
                Edit
              </button>
              <button
                onClick={async () => { if (confirm("Delete this playbook?")) { await deleteFn({ data: { id: r.id } }); toast.success("Deleted."); refetch(); } }}
                className="text-xs font-mono uppercase tracking-widest text-destructive hover:underline"
              >
                Delete
              </button>
            </div>
          )},
        ]}
      />
    </div>
  );
}

function PlaybookForm({ form, setForm, onSave, onCancel }: {
  form: Record<string, any>;
  setForm: (f: Record<string, any>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const fields = [
    { key: "slug", label: "Slug" },
    { key: "title", label: "Title" },
    { key: "summary", label: "Summary" },
    { key: "body", label: "Body", textarea: true },
    { key: "category", label: "Category" },
    { key: "price_cents", label: "Price (cents)", type: "number" },
    { key: "pages", label: "Pages", type: "number" },
  ];
  return (
    <div className="border border-border p-6 space-y-4">
      <div className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">
        {form.id ? "Edit Playbook" : "New Playbook"}
      </div>
      {fields.map((f) => (
        <div key={f.key}>
          <label className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1 block">{f.label}</label>
          {f.textarea ? (
            <textarea
              value={form[f.key] ?? ""}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className="w-full border border-border px-3 py-2 bg-transparent text-sm min-h-[200px]"
            />
          ) : (
            <input
              type={f.type ?? "text"}
              value={form[f.key] ?? ""}
              onChange={(e) => setForm({ ...form, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value })}
              className="w-full border border-border px-3 py-2 bg-transparent text-sm"
            />
          )}
        </div>
      ))}
      <div className="flex gap-2">
        <button onClick={onSave} className="px-4 py-2 border border-accent text-accent text-xs font-mono uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-colors">
          Save
        </button>
        <button onClick={onCancel} className="px-4 py-2 border border-border text-xs font-mono uppercase tracking-widest hover:bg-muted/40 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}
