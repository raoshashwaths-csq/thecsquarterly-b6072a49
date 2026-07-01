import { createFileRoute } from "@tanstack/react-router";
import { LumiRouteLoader } from "@/components/site/LumiRouteLoader";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, ChevronRight, Activity, Cpu, AlertTriangle, ShieldCheck, TrendingUp, Layers, Calculator, ScrollText, FileWarning, Sparkles, Download, FileText, Table as TableIcon } from "lucide-react";
import { useCountUp } from "@/components/benchmarks/useCountUp";
import { ACV_BANDS, BENCHMARK_MATRIX, HURDLE_RATES, VARIABLE_GLOSSARY, COGS_ITEMS, OPEX_ITEMS, CHECKLIST, AI_CALLOUTS, AI_GM_DRIVERS, MARGIN_GOVERNORS, type AcvBand } from "@/components/benchmarks/data";
import { CHECKLIST_STORAGE_KEY, exportBenchmarkMatrixCsv, exportChecklistCsv, exportFullReportPdf } from "@/components/benchmarks/exports";
import { useAuth } from "@/hooks/useAuth";
import { firstNameFromUser } from "@/lib/brand-pdf";

export const Route = createFileRoute("/benchmarks")({
  pendingComponent: LumiRouteLoader,
  head: () => ({
    meta: [
      { title: "2026 State of the Industry Report — The CS Quarterly" },
      { name: "description", content: "Institutional benchmark registry, post-sale financial math, GAAP allocation, and the AI deflation paradox. Q2 2026 edition." },
      { property: "og:title", content: "2026 State of the Industry Report — The CS Quarterly" },
      { property: "og:description", content: "NRR compression, expansion dependency, AI gross margin reset. 2,900+ SaaS companies analyzed." },
    ],
    links: [{ rel: "canonical", href: "/benchmarks" }],
  }),
  component: BenchmarksPage,
});

const CHAPTERS = [
  { id: "executive-summary", label: "Executive Summary", icon: ScrollText },
  { id: "chapter-1", label: "Ch 1 · Retention Compression", icon: Activity },
  { id: "chapter-2", label: "Ch 2 · Benchmark Registry", icon: Layers },
  { id: "chapter-3", label: "Ch 3 · Financial Math Engine", icon: Calculator },
  { id: "chapter-4", label: "Ch 4 · GAAP Balance Sheet", icon: ShieldCheck },
  { id: "chapter-5", label: "Ch 5 · FP&A Audit Deck", icon: FileWarning },
  { id: "chapter-6", label: "Ch 6 · AI Deflation Paradox", icon: Cpu },
  { id: "references", label: "References & Methodology", icon: TrendingUp },
];

function BenchmarksPage() {
  const [active, setActive] = useState("executive-summary");
  const { user } = useAuth();
  const firstName = firstNameFromUser(user);

  // Persisted checklist audit state (shared across the page so exports can read it)
  const [audited, setAudited] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (raw) setAudited(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(audited)); } catch { /* ignore */ }
  }, [audited]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    CHAPTERS.forEach((c) => {
      const el = document.getElementById(c.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1 relative">
        {/* ambient grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-accent) 1px, transparent 1px), linear-gradient(90deg, var(--color-accent) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse at top, black 30%, transparent 75%)",
          }}
        />
        <div className="relative grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-0">
          <BenchmarkSidebar active={active} />
          <div className="min-w-0">
            <Hero firstName={firstName} audited={audited} />
            <div className="max-w-5xl mx-auto px-6 lg:px-10 pb-24 space-y-24">
              <ExecutiveSummary />
              <Chapter1 />
              <Chapter2 />
              <Chapter3 />
              <Chapter4 />
              <Chapter5 audited={audited} setAudited={setAudited} />
              <Chapter6 />
              <References />
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

/* ───────────────────────── SIDEBAR ───────────────────────── */

function BenchmarkSidebar({ active }: { active: string }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside
      className={`hidden lg:block sticky top-16 self-start h-[calc(100vh-4rem)] border-r border-border bg-card/95 transition-all ${
        collapsed ? "w-[68px]" : "w-[260px]"
      }`}
    >
      <div className="p-4 flex items-center justify-between border-b border-border">
        {!collapsed && (
          <div>
            <div className="font-mono text-[10px] tracking-[0.3em] text-accent uppercase">Q2 2026 Edition</div>
            <div className="font-display text-sm mt-1 text-foreground">State of the Industry</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="text-muted-foreground hover:text-accent transition-colors p-1 cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <ChevronRight className={`h-4 w-4 transition-transform ${collapsed ? "" : "rotate-180"}`} />
        </button>
      </div>
      <nav className="p-2 space-y-0.5 overflow-y-auto h-[calc(100%-72px)]">
        {CHAPTERS.map((c) => {
          const Icon = c.icon;
          const isActive = active === c.id;
          return (
            <a
              key={c.id}
              href={`#${c.id}`}
              className={`flex items-center gap-3 px-3 py-2.5 text-xs font-mono uppercase tracking-[0.14em] border-l-2 transition-all ${
                isActive
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && <span className="truncate">{c.label}</span>}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}

/* ───────────────────────── HERO ───────────────────────── */

function Hero({ firstName, audited }: { firstName: string; audited: Record<string, boolean> }) {
  return (
    <section className="relative border-b border-border px-6 lg:px-10 pt-14 pb-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-accent border border-accent/40 px-2 py-0.5">
            Q2 2026 · Institutional Research
          </span>
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground/80">
            N = 2,900+ SaaS companies
          </span>
          <div className="ml-auto">
            <ExportBar firstName={firstName} audited={audited} />
          </div>
        </div>
        <h1 className="font-display text-4xl md:text-6xl tracking-tight leading-[1.02] text-balance animate-fade-up">
          The Churn Compression &amp; Post-Sale Financial Architecture.
        </h1>
        <p className="mt-4 max-w-3xl text-base md:text-lg text-muted-foreground leading-relaxed">
          Customer Success has structurally inverted from retention insurance to primary engine of
          capital-efficient growth. Six forces reshape post-sale economics across NRR compression,
          expansion dependency, GAAP allocation, and the AI gross-margin reset.
        </p>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border">
          <KpiCard label="Median Net Revenue Retention" value={101} suffix="%" direction="down" detail="Compressed from 2021–22 peaks. Top quartile holds >120%." tone="accent" />
          <KpiCard label="Median Gross Revenue Retention" value={84} suffix="%" direction="down" detail="SMB-anchored floor. Enterprise band 91–94%." tone="destructive" />
          <KpiCard label="Expansion ARR Dependency" value={40} suffix="%+" direction="up" detail="At >$50M ARR, expansion exceeds 50% of net-new ARR." tone="secondary" />
        </div>
      </div>
    </section>
  );
}

function ExportBar({ firstName, audited }: { firstName: string; audited: Record<string, boolean> }) {
  const [open, setOpen] = useState(false);
  const btn =
    "inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.22em] border border-border hover:border-accent hover:text-accent transition-colors cursor-pointer";
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.22em] border border-accent/50 text-accent hover:bg-accent/10 transition-colors cursor-pointer"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Download className="h-3.5 w-3.5" />
        Export Report
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-64 bg-card border border-border shadow-lg z-20 animate-fade-in"
          onMouseLeave={() => setOpen(false)}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => { exportBenchmarkMatrixCsv(); setOpen(false); }}
            className={`${btn} w-full justify-start border-0 border-b border-border py-3`}
          >
            <TableIcon className="h-3.5 w-3.5" /> Benchmark matrix (CSV)
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => { exportChecklistCsv(audited); setOpen(false); }}
            className={`${btn} w-full justify-start border-0 border-b border-border py-3`}
          >
            <TableIcon className="h-3.5 w-3.5" /> Audit checklist progress (CSV)
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => { exportFullReportPdf(firstName, audited); setOpen(false); }}
            className={`${btn} w-full justify-start border-0 py-3`}
          >
            <FileText className="h-3.5 w-3.5" /> Full report (branded PDF)
          </button>
        </div>
      )}
    </div>
  );
}


function KpiCard({
  label,
  value,
  suffix,
  direction,
  detail,
  accent,
}: {
  label: string;
  value: number;
  suffix: string;
  direction: "up" | "down";
  detail: string;
  accent: string;
}) {
  const display = useCountUp(value);
  const Arrow = direction === "up" ? ArrowUp : ArrowDown;
  return (
    <div className="relative bg-card/80 p-6 group overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />
      <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground/80 mb-5">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-5xl md:text-6xl font-light tabular-nums tracking-tight" style={{ color: accent }}>
          {display}
        </span>
        <span className="font-mono text-2xl text-muted-foreground">{suffix}</span>
        <Arrow className="h-5 w-5 ml-1" style={{ color: accent }} />
      </div>
      <div className="mt-5 pt-4 border-t border-border text-xs text-muted-foreground/80 leading-relaxed">{detail}</div>
    </div>
  );
}

/* ───────────────────────── SHARED ───────────────────────── */

function ChapterShell({
  id,
  eyebrow,
  title,
  intro,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent mb-3">{eyebrow}</div>
      <h2 className="font-display text-3xl md:text-4xl tracking-tight text-foreground leading-tight">{title}</h2>
      {intro && <p className="mt-4 text-muted-foreground leading-relaxed max-w-3xl">{intro}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Callout({ tone = "accent", children }: { tone?: "accent" | "warn" | "danger"; children: React.ReactNode }) {
  const color = tone === "danger" ? "#EF4444" : tone === "warn" ? "#F59E0B" : "#38BDF8";
  return (
    <div
      className="my-6 p-5 bg-card border-l-2 text-sm leading-relaxed text-foreground/85"
      style={{ borderColor: color }}
    >
      {children}
    </div>
  );
}

/* ───────────────────────── EXEC SUMMARY ───────────────────────── */

function ExecutiveSummary() {
  const forces = [
    "The divergence of voluntary versus involuntary churn drivers",
    "Substitution of expansion within a deteriorating base for net-new logo growth",
    "Performance bifurcation between bootstrapped and venture-backed operators",
    "The GAAP accounting battlefield governing how CS costs flow through the P&L",
    "Software gross margin compression from AI inference costs",
    "Emergence of in-house substitution churn from internal AI builds",
  ];
  return (
    <ChapterShell
      id="executive-summary"
      eyebrow="00 · Executive Summary"
      title="A structural inversion in post-sale economics."
      intro="Aggregate data from 2,900+ private and public SaaS companies reveals six structural forces reshaping the post-sale function. Operators who treat them as a single system will allocate capital correctly while others fight the scoreboard."
    >
      <div className="grid md:grid-cols-2 gap-px bg-border border border-border">
        {forces.map((f, i) => (
          <div key={i} className="bg-card/80 p-5 flex gap-4">
            <span className="font-mono text-xs text-accent tabular-nums shrink-0">0{i + 1}</span>
            <p className="text-sm text-foreground/85 leading-relaxed">{f}</p>
          </div>
        ))}
      </div>
    </ChapterShell>
  );
}

/* ───────────────────────── CHAPTER 1 ───────────────────────── */

function Chapter1() {
  return (
    <ChapterShell
      id="chapter-1"
      eyebrow="01 · The Macro Forensics"
      title="Retention compression conceals a widening distribution."
      intro="Median NRR sits at 101–106%. Top quartile sustains >120%; bottom decile has slipped below 100% — installed bases eroding structurally."
    >
      <h3 className="font-display text-xl text-foreground mt-2">1.1 · The 2026 Churn Realities</h3>
      <p className="mt-3 text-muted-foreground text-sm leading-relaxed max-w-3xl">
        Median B2B SaaS annual churn: <span className="text-accent font-mono">3.5%</span> — split{" "}
        <span className="text-foreground font-mono">2.6%</span> voluntary and{" "}
        <span className="text-foreground font-mono">0.8%</span> involuntary. Each demands a different intervention.
      </p>
      <div className="mt-5 grid md:grid-cols-3 gap-px bg-border border border-border">
        {[
          { t: "Vendor consolidation", b: "Procurement teams cutting 323 tools → 150–200 core platforms." },
          { t: "Seat rationalization", b: "CIOs de-provisioning inactive licenses; converting full-seat to limited deployments." },
          { t: "'Good enough' substitution", b: "AI-enabled workflows collapsing switching costs for peripheral software." },
        ].map((f) => (
          <div key={f.t} className="bg-card p-5">
            <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-secondary-accent mb-3">Voluntary Force</div>
            <div className="font-display text-base text-foreground">{f.t}</div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{f.b}</p>
          </div>
        ))}
      </div>
      <Callout tone="warn">
        <strong className="text-foreground">Critical Insight:</strong> Voluntary churn is a product-market-fit signal.
        Involuntary churn is an operational failure. Never aggregate the two for board reporting. 43% of SaaS companies still
        lack automated dunning sequences beyond a single reminder — 30–50 bps of recoverable NRR.
      </Callout>

      <h3 className="font-display text-xl text-foreground mt-10">1.2 · The Expansion Dependency</h3>
      <p className="mt-3 text-muted-foreground text-sm leading-relaxed max-w-3xl">
        Expansion ARR = 40% of total Net New ARR at the median, &gt;50% above $50M ARR. The ROI gap:
      </p>
      <div className="mt-5 grid grid-cols-2 gap-px bg-border border border-border">
        <div className="bg-card p-6">
          <div className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground/80 uppercase">Expand existing</div>
          <div className="mt-2 font-mono text-4xl text-secondary-accent">20:1</div>
          <div className="mt-2 text-xs text-muted-foreground">$1K → $1.5K MRR · ~$500 in success effort</div>
        </div>
        <div className="bg-card p-6">
          <div className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground/80 uppercase">Acquire net-new</div>
          <div className="mt-2 font-mono text-4xl text-destructive">2:1</div>
          <div className="mt-2 text-xs text-muted-foreground">Same incremental MRR · 10x the acquisition cost</div>
        </div>
      </div>
      <Callout>
        <strong className="text-foreground">The trap:</strong> 105% NRR with 85% GRR is a churn problem papered over by upsell.
        105% NRR with 95% GRR is genuine stickiness. Disaggregate NRR by acquisition cohort and watch the slope.
      </Callout>

      <h3 className="font-display text-xl text-foreground mt-10">1.3 · Profile Splitting</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm border border-border">
          <thead className="bg-card">
            <tr className="text-left font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/80">
              <th className="p-3 font-normal">Metric</th>
              <th className="p-3 font-normal">Bootstrapped</th>
              <th className="p-3 font-normal">VC-Backed</th>
              <th className="p-3 font-normal">Δ</th>
            </tr>
          </thead>
          <tbody className="font-mono text-sm">
            {[
              ["Median revenue growth", "15%", "25%", "-10pp"],
              ["Within 2pp of breakeven", "83%", "52%", "+31pp"],
              ["Median NRR", "103%", "106%", "-3pp"],
            ].map(([m, b, v, d]) => (
              <tr key={m} className="border-t border-border">
                <td className="p-3 text-foreground/85 font-sans">{m}</td>
                <td className="p-3 tabular-nums text-secondary-accent">{b}</td>
                <td className="p-3 tabular-nums text-foreground">{v}</td>
                <td className="p-3 tabular-nums text-accent">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Callout>
        <strong className="text-foreground">Pricing architecture matters more than the label.</strong> Consumption-priced SaaS
        achieves 115–130% NRR vs 95–105% for flat-rate seats. Snowflake (126%), Datadog (low-120s), MongoDB (121%) are structural
        outputs of pricing alignment, not anomalies. Pure seat-based models in 2026 leave 10–20 points of NRR on the table.
      </Callout>
    </ChapterShell>
  );
}

/* ───────────────────────── CHAPTER 2 ───────────────────────── */

function Chapter2() {
  const [band, setBand] = useState<AcvBand | "all">("all");
  const [filter, setFilter] = useState("");

  const rows = useMemo(() => {
    const metrics: { key: keyof (typeof BENCHMARK_MATRIX)["smb"]; label: string }[] = [
      { key: "medianGrr", label: "Median GRR" },
      { key: "worldClassGrr", label: "World-Class GRR (75th pct)" },
      { key: "medianNrr", label: "Median NRR" },
      { key: "worldClassNrr", label: "World-Class NRR (75th pct)" },
      { key: "cacPayback", label: "Blended CAC Payback" },
      { key: "csSpend", label: "CS Spend (% of ARR)" },
      { key: "deliveryModel", label: "Delivery Model" },
      { key: "arrPerCsm", label: "ARR-to-CSM Ratio" },
      { key: "logoChurn", label: "Annual Logo Churn" },
      { key: "timeToValue", label: "Time-to-Value" },
    ];
    return metrics.filter((m) => m.label.toLowerCase().includes(filter.toLowerCase()));
  }, [filter]);

  const visibleBands = band === "all" ? ACV_BANDS : ACV_BANDS.filter((b) => b.id === band);

  return (
    <ChapterShell
      id="chapter-2"
      eyebrow="02 · Benchmark Registry"
      title="Operator-validated benchmarks by ACV band."
      intro="Sources: Optifai 2026 (N=939), SaaS Capital 2026 (N=1,000+), ChartMogul (N=2,100), ScaleXP 2025, Bessemer State of the Cloud."
    >
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
        <div className="flex gap-1 p-1 bg-card border border-border w-fit">
          <button
            onClick={() => setBand("all")}
            className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors cursor-pointer ${
              band === "all" ? "bg-accent/20 text-accent" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Bands
          </button>
          {ACV_BANDS.map((b) => (
            <button
              key={b.id}
              onClick={() => setBand(b.id)}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors cursor-pointer ${
                band === b.id ? "bg-accent/20 text-accent" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter metrics…"
          className="bg-card border border-border px-3 py-1.5 text-xs text-foreground font-mono placeholder:text-muted-foreground/60 focus:outline-none focus:border-accent md:w-60"
        />
      </div>

      <div className="overflow-x-auto border border-border">
        <table className="w-full text-sm">
          <thead className="bg-card">
            <tr className="text-left font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/80">
              <th className="p-3 font-normal sticky left-0 bg-card z-10 min-w-[200px]">Metric</th>
              {visibleBands.map((b) => (
                <th key={b.id} className="p-3 font-normal">
                  <div className="text-accent">{b.label}</div>
                  <div className="text-muted-foreground/60 text-[9px] mt-0.5 normal-case tracking-normal">{b.range}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((m, i) => (
              <tr key={m.key} className={`border-t border-border ${i % 2 ? "bg-card/40" : ""}`}>
                <td className="p-3 text-foreground/85 text-sm sticky left-0 bg-background z-10">{m.label}</td>
                {visibleBands.map((b) => {
                  const v = BENCHMARK_MATRIX[b.id][m.key];
                  const isNumeric = /%|\$|mo|days/.test(v);
                  return (
                    <td
                      key={b.id}
                      className={`p-3 text-sm ${isNumeric ? "font-mono tabular-nums text-foreground" : "text-muted-foreground"}`}
                    >
                      {v}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout tone="warn">
        <strong className="text-foreground">Caution on benchmark misapplication:</strong> 100% NRR is solid performance for an
        SMB-focused product and a warning sign for an enterprise platform. Compare within ACV band, split by cohort, and track
        slope — never the point-in-time level.
      </Callout>
    </ChapterShell>
  );
}

/* ───────────────────────── CHAPTER 3 ───────────────────────── */

function Chapter3() {
  const [tab, setTab] = useState<"payback" | "irr">("payback");
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <ChapterShell
      id="chapter-3"
      eyebrow="03 · Financial Math Engine"
      title="The new CS P&L speaks corporate finance."
      intro="CFOs apply payback, IRR, and NPV with explicit hurdle rates. The algebraic framework below is the language required at the capital allocation table."
    >
      <div className="flex border-b border-border mb-6">
        {[
          { id: "payback", label: "Tab A · CS-CAC Payback" },
          { id: "irr", label: "Tab B · IRR & Capital Allocation" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as "payback" | "irr")}
            className={`px-5 py-3 text-xs font-mono uppercase tracking-[0.22em] border-b-2 -mb-px transition-colors cursor-pointer ${
              tab === t.id
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground/80 hover:text-foreground/85"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "payback" ? (
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div>
            <EquationBlock label="Equation 1 — CS-CAC Payback Period">
              <span className="text-muted-foreground/80">Payback = </span>
              <HoverVar name="Fully Loaded CS Spend" onHover={setHovered} />
              <span className="text-muted-foreground/80"> / (</span>
              <HoverVar name="MRR per Account" onHover={setHovered} />
              <span className="text-muted-foreground/80"> × </span>
              <HoverVar name="Subscription Gross Margin %" onHover={setHovered} />
              <span className="text-muted-foreground/80">)</span>
            </EquationBlock>

            <div className="mt-6 p-5 bg-card border border-border">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/80 mb-4">
                Worked Example · $60K ACV Mid-Market Account
              </div>
              <table className="w-full text-sm">
                <tbody className="font-mono">
                  {[
                    ["Fully loaded CS spend / account", "($155,000 + $72,000) / 40 = $5,675/yr", "$473/mo"],
                    ["Monthly GM contribution", "$5,000 × 0.78", "$3,900/mo"],
                    ["CS-CAC Payback Period", "$473 / $3,900", "0.12 months"],
                  ].map(([k, calc, v]) => (
                    <tr key={k} className="border-t border-border first:border-t-0">
                      <td className="py-2 text-muted-foreground text-xs">{k}</td>
                      <td className="py-2 text-muted-foreground/80 text-xs">{calc}</td>
                      <td className="py-2 text-right text-accent tabular-nums">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-muted-foreground/80 leading-relaxed">
              Pooled CSM leverage in mid-market drives the short payback. Strategic enterprise (dedicated team) extends to
              3–6 months — still inside any institutional hurdle.
            </p>
          </div>
          <VariableInspector name={hovered} />
        </div>
      ) : (
        <div className="space-y-6">
          <EquationBlock label="Equation 3 — Net Present Value">
            <div className="space-y-2">
              <div>
                <span className="text-muted-foreground/80">NPV = </span>
                <span className="text-secondary-accent">Σ</span>
                <span className="text-muted-foreground/80"> ( CF</span>
                <sub className="text-muted-foreground/80">t</sub>
                <span className="text-muted-foreground/80"> / (1 + r)</span>
                <sup className="text-muted-foreground/80">t</sup>
                <span className="text-muted-foreground/80"> ) − CF</span>
                <sub className="text-muted-foreground/80">0</sub>
              </div>
              <div className="text-[10px] text-muted-foreground/60 font-sans tracking-wide">
                CF<sub>t</sub> = net cash flow · CF<sub>0</sub> = initial investment · r = WACC + risk premium (15–20% typical) · T = 3–5 yr horizon
              </div>
            </div>
          </EquationBlock>

          <EquationBlock label="Equation 4 — Internal Rate of Return">
            <span className="text-muted-foreground/80">0 = </span>
            <span className="text-secondary-accent">Σ</span>
            <span className="text-muted-foreground/80"> ( CF</span>
            <sub className="text-muted-foreground/80">t</sub>
            <span className="text-muted-foreground/80"> / (1 + IRR)</span>
            <sup className="text-muted-foreground/80">t</sup>
            <span className="text-muted-foreground/80"> )</span>
          </EquationBlock>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/80 mb-3">
              Institutional Hurdle Rates — IRR range: 25–35%
            </div>
            <div className="grid md:grid-cols-2 gap-px bg-border border border-border">
              {HURDLE_RATES.map((h) => {
                const isPremium = h.rate.includes("25") || h.rate.includes("30") || h.rate.includes("35");
                return (
                  <div key={h.type} className="bg-card p-5">
                    <div className="flex items-baseline justify-between gap-3 mb-2">
                      <div className="font-display text-sm text-foreground">{h.type}</div>
                      <div
                        className="font-mono text-lg tabular-nums shrink-0"
                        style={{ color: isPremium ? "#38BDF8" : "#06B6D4" }}
                      >
                        {h.rate}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground/80 leading-relaxed">{h.rationale}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
            {[
              { title: "Base Case", body: "Target improvement achieved. Must clear hurdle rate.", tone: "#38BDF8" },
              { title: "Conservative", body: "50% of target. If this clears hurdle, investment is robust.", tone: "#06B6D4" },
              { title: "Optimistic", body: "150% of target. If ONLY this clears hurdle — reject or redesign.", tone: "#EF4444" },
            ].map((s) => (
              <div key={s.title} className="bg-card p-5">
                <div
                  className="font-mono text-[10px] uppercase tracking-[0.3em] mb-2"
                  style={{ color: s.tone }}
                >
                  {s.title}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChapterShell>
  );
}

function EquationBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-4">{label}</div>
      <div className="font-mono text-lg md:text-xl leading-relaxed text-foreground">{children}</div>
    </div>
  );
}

function HoverVar({ name, onHover }: { name: string; onHover: (n: string | null) => void }) {
  return (
    <button
      onMouseEnter={() => onHover(name)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(name)}
      onBlur={() => onHover(null)}
      className="text-accent underline decoration-dotted underline-offset-4 hover:text-accent/80 transition-colors cursor-help font-mono"
    >
      {name}
    </button>
  );
}

function VariableInspector({ name }: { name: string | null }) {
  const data = name ? VARIABLE_GLOSSARY[name] : null;
  return (
    <aside className="bg-card border border-border p-5 h-fit sticky top-24">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/80 mb-3">Variable Inspector</div>
      {!data ? (
        <div className="text-xs text-muted-foreground/60 leading-relaxed italic">
          Hover over any variable in the equation to expose its CFO-audit inclusions and exclusions.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="font-display text-sm text-foreground">{name}</div>
          {data.magnitude && (
            <div className="text-[11px] font-mono text-secondary-accent border-l-2 border-secondary-accent pl-3">{data.magnitude}</div>
          )}
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-accent mb-2">Included</div>
            <ul className="space-y-1.5">
              {data.included.map((x) => (
                <li key={x} className="text-xs text-foreground/85 flex gap-2">
                  <Check className="h-3 w-3 text-accent shrink-0 mt-0.5" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-destructive mb-2">Excluded</div>
            <ul className="space-y-1.5">
              {data.excluded.map((x) => (
                <li key={x} className="text-xs text-muted-foreground flex gap-2">
                  <span className="text-destructive shrink-0">×</span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </aside>
  );
}

/* ───────────────────────── CHAPTER 4 ───────────────────────── */

function Chapter4() {
  // Gauge: 80% line, compressed to 65–70% for AI products
  const compressedFloor = 65;
  const traditional = 80;
  return (
    <ChapterShell
      id="chapter-4"
      eyebrow="04 · GAAP Balance Sheet"
      title="COGS vs OpEx: where post-sale costs land determines valuation."
      intro="Misclassifying $500K from OpEx to COGS compresses gross margin by 200–300 bps — material EV destruction at 8–10x revenue multiples."
    >
      <div className="grid lg:grid-cols-2 gap-px bg-border border border-border">
        {/* COGS */}
        <div className="bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-destructive">COGS Panel</div>
              <div className="font-display text-xl text-foreground mt-1">Above the gross margin line</div>
            </div>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>

          <div className="space-y-2 mb-6">
            {COGS_ITEMS.map((c) => (
              <div key={c.role} className="border-l-2 border-destructive/50 pl-3 py-1">
                <div className="text-sm text-foreground">{c.role}</div>
                <div className="text-[11px] text-muted-foreground/80">{c.note}</div>
              </div>
            ))}
          </div>

          {/* Gauge */}
          <div className="pt-5 border-t border-border">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/80 mb-3">
              AI Gross Margin Penalty
            </div>
            <div className="relative h-2 bg-border mb-2">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#EF4444] via-[#F59E0B] to-[#06B6D4]"
                style={{ width: `${traditional}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 h-4 w-px bg-foreground"
                style={{ left: `${compressedFloor}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 h-4 w-px bg-accent"
                style={{ left: `${traditional}%` }}
              />
            </div>
            <div className="flex justify-between font-mono text-[10px] text-muted-foreground/80">
              <span className="text-destructive">LLM-native 52%</span>
              <span className="text-foreground/85">AI-augmented 65–70%</span>
              <span className="text-accent">Traditional 80%</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {AI_GM_DRIVERS.slice(0, 3).map((d) => (
              <div key={d.driver} className="bg-background p-3 border border-border">
                <div className="text-[10px] text-muted-foreground/80 leading-tight">{d.driver}</div>
                <div className="font-mono text-base text-destructive mt-1 tabular-nums">{d.pct}</div>
                <div className="text-[9px] text-muted-foreground/60">floor {d.floor}</div>
              </div>
            ))}
          </div>
        </div>

        {/* OpEx */}
        <div className="bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent">OpEx · S&M Panel</div>
              <div className="font-display text-xl text-foreground mt-1">Below the gross margin line</div>
            </div>
            <TrendingUp className="h-5 w-5 text-secondary-accent" />
          </div>

          <div className="space-y-2 mb-6">
            {OPEX_ITEMS.map((c) => (
              <div key={c.role} className="border-l-2 border-secondary-accent/50 pl-3 py-1">
                <div className="text-sm text-foreground">{c.role}</div>
                <div className="text-[11px] text-muted-foreground/80">{c.note}</div>
              </div>
            ))}
          </div>

          <div className="pt-5 border-t border-border bg-background/40 -mx-6 -mb-6 px-6 pb-6 mt-auto">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-secondary-accent mb-3">
              The Allocation Test
            </div>
            <p className="text-xs text-foreground/85 leading-relaxed italic">
              "If this person stopped performing this activity tomorrow, would the customer still receive the subscription
              service they contracted for?"
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="bg-secondary-accent/10 border border-secondary-accent/30 p-2">
                <span className="text-secondary-accent">YES →</span> <span className="text-foreground/85">OpEx</span>
              </div>
              <div className="bg-destructive/10 border border-destructive/30 p-2">
                <span className="text-destructive">NO →</span> <span className="text-foreground/85">COGS</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Callout tone="warn">
        <strong className="text-foreground">Hybrid role test:</strong> A CSM splitting 60% proactive / 40% troubleshooting must
        have their burdened salary split 60% OpEx / 40% COGS. Most companies default to a single bucket; QoE analysts restate
        gross margin 300–500 bps below management presentation during diligence.
      </Callout>
    </ChapterShell>
  );
}

/* ───────────────────────── CHAPTER 5 ───────────────────────── */

function Chapter5() {
  const [audited, setAudited] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState<string | null>(null);
  const completedCount = Object.values(audited).filter(Boolean).length;
  const pct = (completedCount / CHECKLIST.length) * 100;

  return (
    <ChapterShell
      id="chapter-5"
      eyebrow="05 · FP&A Auditor Deck"
      title="The 5-point validation checklist."
      intro="Boardroom-ready metrics are constructed by operators with incentives to flatter performance. This is the forensic catch list."
    >
      <div className="mb-6 p-4 bg-card border border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/80">Audit Progress</div>
          <div className="font-mono text-sm text-accent tabular-nums">
            {completedCount} / {CHECKLIST.length}
          </div>
        </div>
        <div className="h-1 bg-border overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#06B6D4] to-[#38BDF8] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {CHECKLIST.map((item, i) => {
          const checked = !!audited[item.id];
          const isOpen = open === item.id;
          return (
            <div
              key={item.id}
              className={`bg-card border transition-all duration-300 ${
                checked ? "border-accent/60 shadow-[0_0_0_1px_var(--color-accent)]" : "border-border"
              }`}
            >
              <button
                onClick={() => setOpen(isOpen ? null : item.id)}
                className="w-full p-4 flex items-center gap-4 text-left cursor-pointer"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAudited((s) => ({ ...s, [item.id]: !s[item.id] }));
                  }}
                  className={`h-5 w-5 border-2 grid place-content-center transition-all shrink-0 cursor-pointer ${
                    checked
                      ? "bg-accent border-accent"
                      : "border-muted-foreground/40 hover:border-accent"
                  }`}
                  aria-label="Mark audited"
                >
                  {checked && <Check className="h-3 w-3 text-accent-foreground" strokeWidth={3} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-muted-foreground/60 tabular-nums">0{i + 1}</span>
                    <span className="font-display text-base text-foreground">{item.title}</span>
                  </div>
                </div>
                <ChevronRight
                  className={`h-4 w-4 text-muted-foreground/80 transition-transform ${isOpen ? "rotate-90" : ""}`}
                />
              </button>
              <div
                className="grid transition-[grid-template-rows] duration-300 ease-out"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <div className="p-5 pt-2 border-t border-border space-y-4 text-sm">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-destructive mb-1.5">
                        Error Pattern
                      </div>
                      <p className="text-foreground/85 leading-relaxed">{item.error}</p>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent mb-1.5">
                        Detection Method · Forensic Catch
                      </div>
                      <p className="text-foreground/85 leading-relaxed">{item.detection}</p>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent mb-1.5">
                        Correction Protocol
                      </div>
                      <p className="text-foreground/85 leading-relaxed">{item.correction}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Callout tone="warn">
        <strong className="text-foreground">The meta-rule:</strong> If a retention metric improves by &gt;5 points
        quarter-over-quarter without a commensurate operational initiative, assume measurement artifact until proven otherwise.
        Real retention improvement is hard, slow, and expensive. Statistical improvement is easy, fast, and free.
      </Callout>
    </ChapterShell>
  );
}

/* ───────────────────────── CHAPTER 6 ───────────────────────── */

function Chapter6() {
  return (
    <ChapterShell
      id="chapter-6"
      eyebrow="06 · The AI Deflation Paradox"
      title="Five mutations restructuring post-sale economics."
      intro="Generative AI, LLM application layers, and autonomous agents are dismantling the assumptions of recurring revenue, seat pricing, and 80% gross margins."
    >
      <div className="grid md:grid-cols-2 gap-px bg-border border border-border">
        {AI_CALLOUTS.map((c) => {
          const accent =
            c.tone === "danger" ? "#EF4444" : c.tone === "warn" ? "#F59E0B" : c.tone === "expansion" ? "#06B6D4" : "#38BDF8";
          return (
            <div key={c.id} className="bg-card p-6 relative overflow-hidden group">
              <div
                aria-hidden
                className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20"
                style={{ background: accent }}
              />
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-3.5 w-3.5" style={{ color: accent }} />
                <span
                  className="font-mono text-[9px] uppercase tracking-[0.3em] px-2 py-0.5 border"
                  style={{ color: accent, borderColor: `${accent}55` }}
                >
                  Mutation
                </span>
              </div>
              <div className="font-display text-lg text-foreground">{c.title}</div>
              <div className="mt-5 flex items-baseline gap-3">
                <span className="font-mono text-4xl tabular-nums" style={{ color: accent }}>
                  {c.metric}
                </span>
              </div>
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/80 mt-1">
                {c.metricLabel}
              </div>
              <p className="mt-4 text-xs text-muted-foreground leading-relaxed">{c.body}</p>
            </div>
          );
        })}
      </div>

      <h3 className="font-display text-xl text-foreground mt-12 mb-4">CS Activities as Gross Margin Governors</h3>
      <div className="overflow-x-auto border border-border">
        <table className="w-full text-sm">
          <thead className="bg-card">
            <tr className="text-left font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/80">
              <th className="p-3 font-normal">CS Activity</th>
              <th className="p-3 font-normal">Margin Mechanism</th>
              <th className="p-3 font-normal text-right">Bps Recovery</th>
            </tr>
          </thead>
          <tbody>
            {MARGIN_GOVERNORS.map((g, i) => (
              <tr key={g.activity} className={`border-t border-border ${i % 2 ? "bg-card/40" : ""}`}>
                <td className="p-3 text-foreground">{g.activity}</td>
                <td className="p-3 text-muted-foreground/80 text-xs">{g.mech}</td>
                <td className="p-3 text-right font-mono text-secondary-accent tabular-nums">{g.recovery}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="font-display text-xl text-foreground mt-12 mb-4">Five-Step Pricing Architecture · 115%+ World-Class NRR</h3>
      <ol className="space-y-2">
        {[
          { t: "Base Seat Preservation", b: "Maintain core subscription pricing — GRR defense prerequisite." },
          { t: "AI Add-On as Separate SKU", b: "Distinct line item; consumption- or per-task-priced. Metered expansion mechanism." },
          { t: "Tiered Capability Progression", b: "Basic → Professional → Enterprise AI. Each tier upgrade = expansion event." },
          { t: "Usage-Based Overages", b: "Generous bounded limits per tier. Predictable overage pricing captures power-user revenue." },
          { t: "Annual Commitment Incentives", b: "15–20% discount for annual AI commits. Improves predictability; reduces churn." },
        ].map((s, i) => (
          <li key={s.t} className="flex gap-4 p-4 bg-card border border-border">
            <div className="font-mono text-2xl text-accent tabular-nums leading-none w-10 shrink-0">0{i + 1}</div>
            <div>
              <div className="font-display text-sm text-foreground">{s.t}</div>
              <div className="text-xs text-muted-foreground/80 mt-1 leading-relaxed">{s.b}</div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 p-6 bg-gradient-to-br from-card to-background border border-secondary-accent/30">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-4">
          Worked Example · NRR manufactured via AI SKU stack
        </div>
        <table className="w-full text-sm font-mono">
          <tbody>
            {[
              ["Base: 100 seats × $100/mo × 12", "$120,000 ACV"],
              ["AI Copilot add-on: 100 × $25 × 12", "+$30,000"],
              ["Tier upgrade: 30 seats × $15 × 12", "+$13,500"],
              ["Total Contract Value", "$163,500"],
              ["Expansion via AI SKUs", "+36.3%"],
            ].map(([k, v]) => (
              <tr key={k} className="border-t border-border first:border-t-0">
                <td className="py-2 text-muted-foreground text-xs">{k}</td>
                <td className="py-2 text-right text-foreground tabular-nums">{v}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-secondary-accent/40">
              <td className="py-3 text-secondary-accent uppercase text-[10px] tracking-[0.2em]">NRR Contribution (at 95% GRR)</td>
              <td className="py-3 text-right text-secondary-accent text-2xl tabular-nums">131%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout tone="warn">
        <strong className="text-foreground">The imperative:</strong> SaaS companies commanding premium valuations through 2027
        will be those that transitioned from seat-based monoliths to multi-layer pricing with AI-powered consumption tiers.
        The window for proactive adaptation is narrowing. The window for reactive catch-up may already be closed.
      </Callout>
    </ChapterShell>
  );
}

/* ───────────────────────── REFERENCES ───────────────────────── */

const REFERENCES = [
  ["ScaleOn", "NRR: Why the Median Is a Trap", "Jun 2026"],
  ["SubJolt", "NRR by Segment, Stage & Valuation", "Jun 2026"],
  ["EverHelp", "2026 SaaS Retention Benchmarks", "May 2026"],
  ["Kayako", "Complete Guide to NRR in 2026", "May 2026"],
  ["Optifai", "B2B SaaS NRR — 939 Companies by ACV Band", "2026"],
  ["SaaS Capital", "2026 Benchmarking — Bootstrapped SaaS", "Apr 2026"],
  ["SaaS Mag", "Why NRR Is the Defining SaaS Metric of 2026", "Apr 2026"],
  ["Vitally/Kayako", "Recurly Churn Report — 3.5% median B2B", "May 2026"],
  ["LivMo", "SaaS Churn Benchmarks 2026 (M&A view)", "May 2026"],
  ["SubJolt", "Churn Rate Benchmarks by Industry", "Apr 2026"],
  ["SaaStr", "Top 10 CS Metrics Investors Care About", "Mar 2025"],
  ["Gainsight", "CS Metrics: What to Track in 2026", "Sep 2025"],
  ["SaaS Capital", "2026 Spending Benchmarks (CS/Support 9% of ARR)", "Jun 2026"],
  ["Benchmarkit", "2025 SaaS Performance Metrics", "2025"],
  ["SaaS Mag", "Capital Efficiency Metrics: 2026 Guide", "Apr 2026"],
  ["LTV:CAC Book", "CAC Benchmarks 2026", "Apr 2026"],
  ["Optifai", "What Is a Good CAC Payback Benchmark?", "Apr 2026"],
  ["ScaleXP", "2025 SaaS Benchmarks: CAC Payback", "Dec 2025"],
  ["DealHub", "What Is COGS for SaaS?", "Apr 2026"],
  ["SF AI Labs", "The AI Project Gross-Margin Reset", "May 2026"],
  ["GetMonetizely", "Economics of AI-First B2B SaaS in 2026", "Dec 2025"],
  ["SoftwareSeni", "Why AI Gross Margins Are Lower (ICONIQ data)", "Jun 2026"],
  ["SaaS Mag", "The AI COGS Problem", "May 2026"],
  ["FE International", "NRR Explained — Multiple Mapping", "May 2026"],
  ["ValueAdd VC", "SaaS Valuation Multiples 2026", "2026"],
  ["Stacc", "AI Customer Service Cost Savings — 47 Stats", "May 2026"],
  ["DigitalApplied", "AI Customer Support 2026: 50+ ROI Data Points", "May 2026"],
  ["Fin AI", "ROI of AI Customer Service: 2026 Benchmarks", "Mar 2026"],
  ["Adewale (Medium)", "The Bifurcation: Enterprise Is Not Going Anywhere", "Mar 2026"],
  ["Retool", "Build vs. Buy Shift: Vibe Coding & Shadow IT", "Feb 2026"],
  ["MindStudio", "10 AI Agents for CS Teams", "Feb 2026"],
  ["Kellblog", "The Customer Acquisition Cost Ratio", "May 2026"],
  ["Esinli", "IRR in Private Equity and Venture Capital", "Jul 2025"],
];

function References() {
  return (
    <ChapterShell
      id="references"
      eyebrow="∞ · References & Methodology"
      title="33 primary and secondary sources."
      intro="January 2025 – June 2026. Where sources conflict, the report presents ranges rather than point estimates. Financial formulas follow Brealey-Myers conventions; GAAP allocations reflect ASC 606 and Big Four SaaS audit practice."
    >
      <div className="border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-card">
            <tr className="text-left font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/80">
              <th className="p-3 font-normal w-12">#</th>
              <th className="p-3 font-normal">Source</th>
              <th className="p-3 font-normal">Contribution</th>
              <th className="p-3 font-normal text-right">Date</th>
            </tr>
          </thead>
          <tbody>
            {REFERENCES.map(([source, contribution, date], i) => (
              <tr key={i} className={`border-t border-border ${i % 2 ? "bg-card/40" : ""}`}>
                <td className="p-3 font-mono text-muted-foreground/60 tabular-nums">{String(i + 1).padStart(2, "0")}</td>
                <td className="p-3 text-foreground">{source}</td>
                <td className="p-3 text-muted-foreground/80 text-xs">{contribution}</td>
                <td className="p-3 text-right font-mono text-accent text-xs tabular-nums">{date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-xs text-muted-foreground/60 italic max-w-3xl leading-relaxed">
        Published Q2 2026 by The CS Quarterly Intelligence Desk. All data sourced from publicly available research, surveys,
        and regulatory filings. This report constitutes market analysis and does not constitute investment advice.
      </p>
    </ChapterShell>
  );
}
