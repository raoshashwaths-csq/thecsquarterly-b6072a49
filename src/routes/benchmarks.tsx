import { createFileRoute } from "@tanstack/react-router";
import { LumiRouteLoader } from "@/components/site/LumiRouteLoader";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, ChevronRight, Activity, Cpu, AlertTriangle, ShieldCheck, TrendingUp, Layers, Calculator, ScrollText, FileWarning, Sparkles } from "lucide-react";
import { useCountUp } from "@/components/benchmarks/useCountUp";
import { ACV_BANDS, BENCHMARK_MATRIX, HURDLE_RATES, VARIABLE_GLOSSARY, COGS_ITEMS, OPEX_ITEMS, CHECKLIST, AI_CALLOUTS, AI_GM_DRIVERS, MARGIN_GOVERNORS, type AcvBand } from "@/components/benchmarks/data";

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
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-100">
      <SiteHeader />
      <main className="flex-1 relative">
        {/* ambient grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(56,189,248,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.4) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse at top, black 30%, transparent 75%)",
          }}
        />
        <div className="relative grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-0">
          <BenchmarkSidebar active={active} />
          <div className="min-w-0">
            <Hero />
            <div className="max-w-5xl mx-auto px-6 lg:px-10 pb-24 space-y-24">
              <ExecutiveSummary />
              <Chapter1 />
              <Chapter2 />
              <Chapter3 />
              <Chapter4 />
              <Chapter5 />
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
      className={`hidden lg:block sticky top-16 self-start h-[calc(100vh-4rem)] border-r border-[#1E293B] bg-[#0F172A]/70 backdrop-blur transition-all ${
        collapsed ? "w-[68px]" : "w-[260px]"
      }`}
    >
      <div className="p-4 flex items-center justify-between border-b border-[#1E293B]">
        {!collapsed && (
          <div>
            <div className="font-mono text-[10px] tracking-[0.3em] text-[#38BDF8] uppercase">Q2 2026 Edition</div>
            <div className="font-display text-sm mt-1 text-slate-200">State of the Industry</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="text-slate-400 hover:text-[#38BDF8] transition-colors p-1 cursor-pointer"
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
                  ? "border-[#38BDF8] bg-[#38BDF8]/10 text-[#38BDF8]"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#1E293B]/40"
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

function Hero() {
  return (
    <section className="relative border-b border-[#1E293B] px-6 lg:px-10 pt-14 pb-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-[#38BDF8] border border-[#38BDF8]/40 px-2 py-0.5">
            Q2 2026 · Institutional Research
          </span>
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-slate-500">
            N = 2,900+ SaaS companies
          </span>
        </div>
        <h1 className="font-display text-4xl md:text-6xl tracking-tight leading-[1.02] text-balance">
          The Churn Compression &amp; Post-Sale Financial Architecture.
        </h1>
        <p className="mt-4 max-w-3xl text-base md:text-lg text-slate-400 leading-relaxed">
          Customer Success has structurally inverted from retention insurance to primary engine of
          capital-efficient growth. Six forces reshape post-sale economics across NRR compression,
          expansion dependency, GAAP allocation, and the AI gross-margin reset.
        </p>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1E293B] border border-[#1E293B]">
          <KpiCard label="Median Net Revenue Retention" value={101} suffix="%" direction="down" detail="Compressed from 2021–22 peaks. Top quartile holds >120%." accent="#38BDF8" />
          <KpiCard label="Median Gross Revenue Retention" value={84} suffix="%" direction="down" detail="SMB-anchored floor. Enterprise band 91–94%." accent="#EF4444" />
          <KpiCard label="Expansion ARR Dependency" value={40} suffix="%+" direction="up" detail="At >$50M ARR, expansion exceeds 50% of net-new ARR." accent="#06B6D4" />
        </div>
      </div>
    </section>
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
    <div className="relative bg-[#0F172A]/80 p-6 backdrop-blur group overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />
      <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500 mb-5">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-5xl md:text-6xl font-light tabular-nums tracking-tight" style={{ color: accent }}>
          {display}
        </span>
        <span className="font-mono text-2xl text-slate-400">{suffix}</span>
        <Arrow className="h-5 w-5 ml-1" style={{ color: accent }} />
      </div>
      <div className="mt-5 pt-4 border-t border-[#1E293B] text-xs text-slate-500 leading-relaxed">{detail}</div>
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
      <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#38BDF8] mb-3">{eyebrow}</div>
      <h2 className="font-display text-3xl md:text-4xl tracking-tight text-slate-100 leading-tight">{title}</h2>
      {intro && <p className="mt-4 text-slate-400 leading-relaxed max-w-3xl">{intro}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Callout({ tone = "accent", children }: { tone?: "accent" | "warn" | "danger"; children: React.ReactNode }) {
  const color = tone === "danger" ? "#EF4444" : tone === "warn" ? "#F59E0B" : "#38BDF8";
  return (
    <div
      className="my-6 p-5 bg-[#0F172A] border-l-2 text-sm leading-relaxed text-slate-300"
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
      <div className="grid md:grid-cols-2 gap-px bg-[#1E293B] border border-[#1E293B]">
        {forces.map((f, i) => (
          <div key={i} className="bg-[#0F172A]/80 p-5 flex gap-4">
            <span className="font-mono text-xs text-[#38BDF8] tabular-nums shrink-0">0{i + 1}</span>
            <p className="text-sm text-slate-300 leading-relaxed">{f}</p>
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
      <h3 className="font-display text-xl text-slate-200 mt-2">1.1 · The 2026 Churn Realities</h3>
      <p className="mt-3 text-slate-400 text-sm leading-relaxed max-w-3xl">
        Median B2B SaaS annual churn: <span className="text-[#38BDF8] font-mono">3.5%</span> — split{" "}
        <span className="text-slate-200 font-mono">2.6%</span> voluntary and{" "}
        <span className="text-slate-200 font-mono">0.8%</span> involuntary. Each demands a different intervention.
      </p>
      <div className="mt-5 grid md:grid-cols-3 gap-px bg-[#1E293B] border border-[#1E293B]">
        {[
          { t: "Vendor consolidation", b: "Procurement teams cutting 323 tools → 150–200 core platforms." },
          { t: "Seat rationalization", b: "CIOs de-provisioning inactive licenses; converting full-seat to limited deployments." },
          { t: "'Good enough' substitution", b: "AI-enabled workflows collapsing switching costs for peripheral software." },
        ].map((f) => (
          <div key={f.t} className="bg-[#0F172A] p-5">
            <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#06B6D4] mb-3">Voluntary Force</div>
            <div className="font-display text-base text-slate-100">{f.t}</div>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">{f.b}</p>
          </div>
        ))}
      </div>
      <Callout tone="warn">
        <strong className="text-slate-100">Critical Insight:</strong> Voluntary churn is a product-market-fit signal.
        Involuntary churn is an operational failure. Never aggregate the two for board reporting. 43% of SaaS companies still
        lack automated dunning sequences beyond a single reminder — 30–50 bps of recoverable NRR.
      </Callout>

      <h3 className="font-display text-xl text-slate-200 mt-10">1.2 · The Expansion Dependency</h3>
      <p className="mt-3 text-slate-400 text-sm leading-relaxed max-w-3xl">
        Expansion ARR = 40% of total Net New ARR at the median, &gt;50% above $50M ARR. The ROI gap:
      </p>
      <div className="mt-5 grid grid-cols-2 gap-px bg-[#1E293B] border border-[#1E293B]">
        <div className="bg-[#0F172A] p-6">
          <div className="font-mono text-[10px] tracking-[0.25em] text-slate-500 uppercase">Expand existing</div>
          <div className="mt-2 font-mono text-4xl text-[#06B6D4]">20:1</div>
          <div className="mt-2 text-xs text-slate-400">$1K → $1.5K MRR · ~$500 in success effort</div>
        </div>
        <div className="bg-[#0F172A] p-6">
          <div className="font-mono text-[10px] tracking-[0.25em] text-slate-500 uppercase">Acquire net-new</div>
          <div className="mt-2 font-mono text-4xl text-[#EF4444]">2:1</div>
          <div className="mt-2 text-xs text-slate-400">Same incremental MRR · 10x the acquisition cost</div>
        </div>
      </div>
      <Callout>
        <strong className="text-slate-100">The trap:</strong> 105% NRR with 85% GRR is a churn problem papered over by upsell.
        105% NRR with 95% GRR is genuine stickiness. Disaggregate NRR by acquisition cohort and watch the slope.
      </Callout>

      <h3 className="font-display text-xl text-slate-200 mt-10">1.3 · Profile Splitting</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm border border-[#1E293B]">
          <thead className="bg-[#0F172A]">
            <tr className="text-left font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
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
              <tr key={m} className="border-t border-[#1E293B]">
                <td className="p-3 text-slate-300 font-sans">{m}</td>
                <td className="p-3 tabular-nums text-[#06B6D4]">{b}</td>
                <td className="p-3 tabular-nums text-slate-200">{v}</td>
                <td className="p-3 tabular-nums text-[#38BDF8]">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Callout>
        <strong className="text-slate-100">Pricing architecture matters more than the label.</strong> Consumption-priced SaaS
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
        <div className="flex gap-1 p-1 bg-[#0F172A] border border-[#1E293B] w-fit">
          <button
            onClick={() => setBand("all")}
            className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors cursor-pointer ${
              band === "all" ? "bg-[#38BDF8]/20 text-[#38BDF8]" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All Bands
          </button>
          {ACV_BANDS.map((b) => (
            <button
              key={b.id}
              onClick={() => setBand(b.id)}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] transition-colors cursor-pointer ${
                band === b.id ? "bg-[#38BDF8]/20 text-[#38BDF8]" : "text-slate-400 hover:text-slate-200"
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
          className="bg-[#0F172A] border border-[#1E293B] px-3 py-1.5 text-xs text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-[#38BDF8] md:w-60"
        />
      </div>

      <div className="overflow-x-auto border border-[#1E293B]">
        <table className="w-full text-sm">
          <thead className="bg-[#0F172A]">
            <tr className="text-left font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
              <th className="p-3 font-normal sticky left-0 bg-[#0F172A] z-10 min-w-[200px]">Metric</th>
              {visibleBands.map((b) => (
                <th key={b.id} className="p-3 font-normal">
                  <div className="text-[#38BDF8]">{b.label}</div>
                  <div className="text-slate-600 text-[9px] mt-0.5 normal-case tracking-normal">{b.range}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((m, i) => (
              <tr key={m.key} className={`border-t border-[#1E293B] ${i % 2 ? "bg-[#0F172A]/30" : ""}`}>
                <td className="p-3 text-slate-300 text-sm sticky left-0 bg-[#020617] z-10">{m.label}</td>
                {visibleBands.map((b) => {
                  const v = BENCHMARK_MATRIX[b.id][m.key];
                  const isNumeric = /%|\$|mo|days/.test(v);
                  return (
                    <td
                      key={b.id}
                      className={`p-3 text-sm ${isNumeric ? "font-mono tabular-nums text-slate-100" : "text-slate-400"}`}
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
        <strong className="text-slate-100">Caution on benchmark misapplication:</strong> 100% NRR is solid performance for an
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
      <div className="flex border-b border-[#1E293B] mb-6">
        {[
          { id: "payback", label: "Tab A · CS-CAC Payback" },
          { id: "irr", label: "Tab B · IRR & Capital Allocation" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as "payback" | "irr")}
            className={`px-5 py-3 text-xs font-mono uppercase tracking-[0.22em] border-b-2 -mb-px transition-colors cursor-pointer ${
              tab === t.id
                ? "border-[#38BDF8] text-[#38BDF8]"
                : "border-transparent text-slate-500 hover:text-slate-300"
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
              <span className="text-slate-500">Payback = </span>
              <HoverVar name="Fully Loaded CS Spend" onHover={setHovered} />
              <span className="text-slate-500"> / (</span>
              <HoverVar name="MRR per Account" onHover={setHovered} />
              <span className="text-slate-500"> × </span>
              <HoverVar name="Subscription Gross Margin %" onHover={setHovered} />
              <span className="text-slate-500">)</span>
            </EquationBlock>

            <div className="mt-6 p-5 bg-[#0F172A] border border-[#1E293B]">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-4">
                Worked Example · $60K ACV Mid-Market Account
              </div>
              <table className="w-full text-sm">
                <tbody className="font-mono">
                  {[
                    ["Fully loaded CS spend / account", "($155,000 + $72,000) / 40 = $5,675/yr", "$473/mo"],
                    ["Monthly GM contribution", "$5,000 × 0.78", "$3,900/mo"],
                    ["CS-CAC Payback Period", "$473 / $3,900", "0.12 months"],
                  ].map(([k, calc, v]) => (
                    <tr key={k} className="border-t border-[#1E293B] first:border-t-0">
                      <td className="py-2 text-slate-400 text-xs">{k}</td>
                      <td className="py-2 text-slate-500 text-xs">{calc}</td>
                      <td className="py-2 text-right text-[#38BDF8] tabular-nums">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-slate-500 leading-relaxed">
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
                <span className="text-slate-500">NPV = </span>
                <span className="text-[#06B6D4]">Σ</span>
                <span className="text-slate-500"> ( CF</span>
                <sub className="text-slate-500">t</sub>
                <span className="text-slate-500"> / (1 + r)</span>
                <sup className="text-slate-500">t</sup>
                <span className="text-slate-500"> ) − CF</span>
                <sub className="text-slate-500">0</sub>
              </div>
              <div className="text-[10px] text-slate-600 font-sans tracking-wide">
                CF<sub>t</sub> = net cash flow · CF<sub>0</sub> = initial investment · r = WACC + risk premium (15–20% typical) · T = 3–5 yr horizon
              </div>
            </div>
          </EquationBlock>

          <EquationBlock label="Equation 4 — Internal Rate of Return">
            <span className="text-slate-500">0 = </span>
            <span className="text-[#06B6D4]">Σ</span>
            <span className="text-slate-500"> ( CF</span>
            <sub className="text-slate-500">t</sub>
            <span className="text-slate-500"> / (1 + IRR)</span>
            <sup className="text-slate-500">t</sup>
            <span className="text-slate-500"> )</span>
          </EquationBlock>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-3">
              Institutional Hurdle Rates — IRR range: 25–35%
            </div>
            <div className="grid md:grid-cols-2 gap-px bg-[#1E293B] border border-[#1E293B]">
              {HURDLE_RATES.map((h) => {
                const isPremium = h.rate.includes("25") || h.rate.includes("30") || h.rate.includes("35");
                return (
                  <div key={h.type} className="bg-[#0F172A] p-5">
                    <div className="flex items-baseline justify-between gap-3 mb-2">
                      <div className="font-display text-sm text-slate-100">{h.type}</div>
                      <div
                        className="font-mono text-lg tabular-nums shrink-0"
                        style={{ color: isPremium ? "#38BDF8" : "#06B6D4" }}
                      >
                        {h.rate}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 leading-relaxed">{h.rationale}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-[#1E293B] border border-[#1E293B]">
            {[
              { title: "Base Case", body: "Target improvement achieved. Must clear hurdle rate.", tone: "#38BDF8" },
              { title: "Conservative", body: "50% of target. If this clears hurdle, investment is robust.", tone: "#06B6D4" },
              { title: "Optimistic", body: "150% of target. If ONLY this clears hurdle — reject or redesign.", tone: "#EF4444" },
            ].map((s) => (
              <div key={s.title} className="bg-[#0F172A] p-5">
                <div
                  className="font-mono text-[10px] uppercase tracking-[0.3em] mb-2"
                  style={{ color: s.tone }}
                >
                  {s.title}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{s.body}</p>
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
    <div className="bg-[#0F172A] border border-[#1E293B] p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#38BDF8] mb-4">{label}</div>
      <div className="font-mono text-lg md:text-xl leading-relaxed text-slate-100">{children}</div>
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
      className="text-[#38BDF8] underline decoration-dotted underline-offset-4 hover:text-[#7DD3FC] transition-colors cursor-help font-mono"
    >
      {name}
    </button>
  );
}

function VariableInspector({ name }: { name: string | null }) {
  const data = name ? VARIABLE_GLOSSARY[name] : null;
  return (
    <aside className="bg-[#0F172A] border border-[#1E293B] p-5 h-fit sticky top-24">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-3">Variable Inspector</div>
      {!data ? (
        <div className="text-xs text-slate-600 leading-relaxed italic">
          Hover over any variable in the equation to expose its CFO-audit inclusions and exclusions.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="font-display text-sm text-slate-100">{name}</div>
          {data.magnitude && (
            <div className="text-[11px] font-mono text-[#06B6D4] border-l-2 border-[#06B6D4] pl-3">{data.magnitude}</div>
          )}
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#38BDF8] mb-2">Included</div>
            <ul className="space-y-1.5">
              {data.included.map((x) => (
                <li key={x} className="text-xs text-slate-300 flex gap-2">
                  <Check className="h-3 w-3 text-[#38BDF8] shrink-0 mt-0.5" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#EF4444] mb-2">Excluded</div>
            <ul className="space-y-1.5">
              {data.excluded.map((x) => (
                <li key={x} className="text-xs text-slate-400 flex gap-2">
                  <span className="text-[#EF4444] shrink-0">×</span>
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
      <div className="grid lg:grid-cols-2 gap-px bg-[#1E293B] border border-[#1E293B]">
        {/* COGS */}
        <div className="bg-[#0F172A] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#EF4444]">COGS Panel</div>
              <div className="font-display text-xl text-slate-100 mt-1">Above the gross margin line</div>
            </div>
            <AlertTriangle className="h-5 w-5 text-[#EF4444]" />
          </div>

          <div className="space-y-2 mb-6">
            {COGS_ITEMS.map((c) => (
              <div key={c.role} className="border-l-2 border-[#EF4444]/50 pl-3 py-1">
                <div className="text-sm text-slate-200">{c.role}</div>
                <div className="text-[11px] text-slate-500">{c.note}</div>
              </div>
            ))}
          </div>

          {/* Gauge */}
          <div className="pt-5 border-t border-[#1E293B]">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-3">
              AI Gross Margin Penalty
            </div>
            <div className="relative h-2 bg-[#1E293B] mb-2">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#EF4444] via-[#F59E0B] to-[#06B6D4]"
                style={{ width: `${traditional}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 h-4 w-px bg-slate-300"
                style={{ left: `${compressedFloor}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 h-4 w-px bg-[#38BDF8]"
                style={{ left: `${traditional}%` }}
              />
            </div>
            <div className="flex justify-between font-mono text-[10px] text-slate-500">
              <span className="text-[#EF4444]">LLM-native 52%</span>
              <span className="text-slate-300">AI-augmented 65–70%</span>
              <span className="text-[#38BDF8]">Traditional 80%</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {AI_GM_DRIVERS.slice(0, 3).map((d) => (
              <div key={d.driver} className="bg-[#020617] p-3 border border-[#1E293B]">
                <div className="text-[10px] text-slate-500 leading-tight">{d.driver}</div>
                <div className="font-mono text-base text-[#EF4444] mt-1 tabular-nums">{d.pct}</div>
                <div className="text-[9px] text-slate-600">floor {d.floor}</div>
              </div>
            ))}
          </div>
        </div>

        {/* OpEx */}
        <div className="bg-[#0F172A] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#06B6D4]">OpEx · S&M Panel</div>
              <div className="font-display text-xl text-slate-100 mt-1">Below the gross margin line</div>
            </div>
            <TrendingUp className="h-5 w-5 text-[#06B6D4]" />
          </div>

          <div className="space-y-2 mb-6">
            {OPEX_ITEMS.map((c) => (
              <div key={c.role} className="border-l-2 border-[#06B6D4]/50 pl-3 py-1">
                <div className="text-sm text-slate-200">{c.role}</div>
                <div className="text-[11px] text-slate-500">{c.note}</div>
              </div>
            ))}
          </div>

          <div className="pt-5 border-t border-[#1E293B] bg-[#020617]/40 -mx-6 -mb-6 px-6 pb-6 mt-auto">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#06B6D4] mb-3">
              The Allocation Test
            </div>
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "If this person stopped performing this activity tomorrow, would the customer still receive the subscription
              service they contracted for?"
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="bg-[#06B6D4]/10 border border-[#06B6D4]/30 p-2">
                <span className="text-[#06B6D4]">YES →</span> <span className="text-slate-300">OpEx</span>
              </div>
              <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 p-2">
                <span className="text-[#EF4444]">NO →</span> <span className="text-slate-300">COGS</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Callout tone="warn">
        <strong className="text-slate-100">Hybrid role test:</strong> A CSM splitting 60% proactive / 40% troubleshooting must
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
      <div className="mb-6 p-4 bg-[#0F172A] border border-[#1E293B]">
        <div className="flex items-center justify-between mb-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500">Audit Progress</div>
          <div className="font-mono text-sm text-[#38BDF8] tabular-nums">
            {completedCount} / {CHECKLIST.length}
          </div>
        </div>
        <div className="h-1 bg-[#1E293B] overflow-hidden">
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
              className={`bg-[#0F172A] border transition-all duration-300 ${
                checked ? "border-[#38BDF8]/60 shadow-[0_0_0_1px_rgba(56,189,248,0.2)]" : "border-[#1E293B]"
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
                      ? "bg-[#38BDF8] border-[#38BDF8]"
                      : "border-slate-600 hover:border-[#38BDF8]"
                  }`}
                  aria-label="Mark audited"
                >
                  {checked && <Check className="h-3 w-3 text-[#020617]" strokeWidth={3} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-slate-600 tabular-nums">0{i + 1}</span>
                    <span className="font-display text-base text-slate-100">{item.title}</span>
                  </div>
                </div>
                <ChevronRight
                  className={`h-4 w-4 text-slate-500 transition-transform ${isOpen ? "rotate-90" : ""}`}
                />
              </button>
              <div
                className="grid transition-[grid-template-rows] duration-300 ease-out"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <div className="p-5 pt-2 border-t border-[#1E293B] space-y-4 text-sm">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#EF4444] mb-1.5">
                        Error Pattern
                      </div>
                      <p className="text-slate-300 leading-relaxed">{item.error}</p>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#F59E0B] mb-1.5">
                        Detection Method · Forensic Catch
                      </div>
                      <p className="text-slate-300 leading-relaxed">{item.detection}</p>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#38BDF8] mb-1.5">
                        Correction Protocol
                      </div>
                      <p className="text-slate-300 leading-relaxed">{item.correction}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Callout tone="warn">
        <strong className="text-slate-100">The meta-rule:</strong> If a retention metric improves by &gt;5 points
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
      <div className="grid md:grid-cols-2 gap-px bg-[#1E293B] border border-[#1E293B]">
        {AI_CALLOUTS.map((c) => {
          const accent =
            c.tone === "danger" ? "#EF4444" : c.tone === "warn" ? "#F59E0B" : c.tone === "expansion" ? "#06B6D4" : "#38BDF8";
          return (
            <div key={c.id} className="bg-[#0F172A] p-6 relative overflow-hidden group">
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
              <div className="font-display text-lg text-slate-100">{c.title}</div>
              <div className="mt-5 flex items-baseline gap-3">
                <span className="font-mono text-4xl tabular-nums" style={{ color: accent }}>
                  {c.metric}
                </span>
              </div>
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500 mt-1">
                {c.metricLabel}
              </div>
              <p className="mt-4 text-xs text-slate-400 leading-relaxed">{c.body}</p>
            </div>
          );
        })}
      </div>

      <h3 className="font-display text-xl text-slate-200 mt-12 mb-4">CS Activities as Gross Margin Governors</h3>
      <div className="overflow-x-auto border border-[#1E293B]">
        <table className="w-full text-sm">
          <thead className="bg-[#0F172A]">
            <tr className="text-left font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
              <th className="p-3 font-normal">CS Activity</th>
              <th className="p-3 font-normal">Margin Mechanism</th>
              <th className="p-3 font-normal text-right">Bps Recovery</th>
            </tr>
          </thead>
          <tbody>
            {MARGIN_GOVERNORS.map((g, i) => (
              <tr key={g.activity} className={`border-t border-[#1E293B] ${i % 2 ? "bg-[#0F172A]/30" : ""}`}>
                <td className="p-3 text-slate-200">{g.activity}</td>
                <td className="p-3 text-slate-500 text-xs">{g.mech}</td>
                <td className="p-3 text-right font-mono text-[#06B6D4] tabular-nums">{g.recovery}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="font-display text-xl text-slate-200 mt-12 mb-4">Five-Step Pricing Architecture · 115%+ World-Class NRR</h3>
      <ol className="space-y-2">
        {[
          { t: "Base Seat Preservation", b: "Maintain core subscription pricing — GRR defense prerequisite." },
          { t: "AI Add-On as Separate SKU", b: "Distinct line item; consumption- or per-task-priced. Metered expansion mechanism." },
          { t: "Tiered Capability Progression", b: "Basic → Professional → Enterprise AI. Each tier upgrade = expansion event." },
          { t: "Usage-Based Overages", b: "Generous bounded limits per tier. Predictable overage pricing captures power-user revenue." },
          { t: "Annual Commitment Incentives", b: "15–20% discount for annual AI commits. Improves predictability; reduces churn." },
        ].map((s, i) => (
          <li key={s.t} className="flex gap-4 p-4 bg-[#0F172A] border border-[#1E293B]">
            <div className="font-mono text-2xl text-[#38BDF8] tabular-nums leading-none w-10 shrink-0">0{i + 1}</div>
            <div>
              <div className="font-display text-sm text-slate-100">{s.t}</div>
              <div className="text-xs text-slate-500 mt-1 leading-relaxed">{s.b}</div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 p-6 bg-gradient-to-br from-[#0F172A] to-[#020617] border border-[#06B6D4]/30">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#06B6D4] mb-4">
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
              <tr key={k} className="border-t border-[#1E293B] first:border-t-0">
                <td className="py-2 text-slate-400 text-xs">{k}</td>
                <td className="py-2 text-right text-slate-100 tabular-nums">{v}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-[#06B6D4]/40">
              <td className="py-3 text-[#06B6D4] uppercase text-[10px] tracking-[0.2em]">NRR Contribution (at 95% GRR)</td>
              <td className="py-3 text-right text-[#06B6D4] text-2xl tabular-nums">131%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout tone="warn">
        <strong className="text-slate-100">The imperative:</strong> SaaS companies commanding premium valuations through 2027
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
      <div className="border border-[#1E293B] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0F172A]">
            <tr className="text-left font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
              <th className="p-3 font-normal w-12">#</th>
              <th className="p-3 font-normal">Source</th>
              <th className="p-3 font-normal">Contribution</th>
              <th className="p-3 font-normal text-right">Date</th>
            </tr>
          </thead>
          <tbody>
            {REFERENCES.map(([source, contribution, date], i) => (
              <tr key={i} className={`border-t border-[#1E293B] ${i % 2 ? "bg-[#0F172A]/30" : ""}`}>
                <td className="p-3 font-mono text-slate-600 tabular-nums">{String(i + 1).padStart(2, "0")}</td>
                <td className="p-3 text-slate-200">{source}</td>
                <td className="p-3 text-slate-500 text-xs">{contribution}</td>
                <td className="p-3 text-right font-mono text-[#38BDF8] text-xs tabular-nums">{date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-xs text-slate-600 italic max-w-3xl leading-relaxed">
        Published Q2 2026 by The CS Quarterly Intelligence Desk. All data sourced from publicly available research, surveys,
        and regulatory filings. This report constitutes market analysis and does not constitute investment advice.
      </p>
    </ChapterShell>
  );
}
