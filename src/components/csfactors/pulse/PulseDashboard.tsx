import { useEffect, useMemo, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { CSAccount } from "@/lib/csfactors.functions";
import { getPortfolioTrend, type TrendPoint as ApiTrendPoint, type TrendRange as ApiTrendRange } from "@/lib/csfactors.functions";
import { pulseSeedAccounts } from "@/lib/mocks/pulseSeed";

/* ------------------------------------------------------------------ *
 * Pulse — editorial midnight dashboard.
 * Midnight slate canvas, layered navy cards, hairline filament borders,
 * KPI accent rails (gold/emerald/crimson/teal), live view switching.
 * ------------------------------------------------------------------ */

/* ============ Mockup-locked data ========= */

type DemoAccount = {
  name: string;
  plan: "Enterprise" | "Growth" | "Core";
  owner: string;
  avatar: string;
  arr: number;
  renewal: string;
  nrr: number;
  health: number;
  trend: number[];
  risk: "Critical" | "High" | "Medium" | "Low";
  daysToRenewal: number;
};

const AVA = (seed: string) =>
  `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear&backgroundColor=b6e3f4,c0aede,d1d4f9`;

const DEMO: DemoAccount[] = [
  { name: "Northbridge Global",   plan: "Enterprise", owner: "Maya Patel",   avatar: AVA("Maya"),   arr: 3_250_000, renewal: "May 7, 2025",  nrr:  98, health: 42, trend: [70,68,64,60,55,50,46,44,43,42], risk: "Critical", daysToRenewal: -14 },
  { name: "Pioneer Manufacturing",plan: "Growth",     owner: "Ethan Cole",   avatar: AVA("Ethan"),  arr: 1_120_000, renewal: "May 23, 2025", nrr: 101, health: 58, trend: [72,70,69,66,64,62,60,59,59,58], risk: "High",     daysToRenewal:  2  },
  { name: "Helix Financial",      plan: "Enterprise", owner: "Lina Park",    avatar: AVA("Lina"),   arr: 2_480_000, renewal: "May 30, 2025", nrr:  95, health: 60, trend: [74,72,70,68,66,65,63,62,61,60], risk: "High",     daysToRenewal:  9  },
  { name: "Atlas Logistics",      plan: "Growth",     owner: "Noah Alvarez", avatar: AVA("Noah"),   arr:   760_000, renewal: "Jun 15, 2025", nrr: 103, health: 74, trend: [68,70,71,72,73,72,73,74,74,74], risk: "Medium",   daysToRenewal: 25  },
  { name: "Vertex Biotech",       plan: "Growth",     owner: "Sophie Turner",avatar: AVA("Sophie"), arr: 1_850_000, renewal: "Jun 30, 2025", nrr: 118, health: 82, trend: [70,72,74,76,78,79,80,81,82,82], risk: "Low",      daysToRenewal: 40  },
  { name: "Summit Retail",        plan: "Core",       owner: "Jordan Blake", avatar: AVA("Jordan"), arr:   540_000, renewal: "Jul 12, 2025", nrr:  92, health: 62, trend: [70,68,67,66,65,64,63,63,62,62], risk: "Medium",   daysToRenewal: 53  },
  { name: "Clearwater Insurance", plan: "Core",       owner: "Ava Chen",     avatar: AVA("Ava"),    arr:   420_000, renewal: "Aug 2, 2025",  nrr:  89, health: 49, trend: [62,60,58,56,54,52,51,50,49,49], risk: "High",     daysToRenewal: 74  },
  { name: "TechCore Solutions",   plan: "Enterprise", owner: "Daniel Reyes", avatar: AVA("Daniel"), arr: 2_140_000, renewal: "Aug 18, 2025", nrr:  91, health: 51, trend: [66,64,62,60,58,56,54,53,52,51], risk: "Critical", daysToRenewal: 90  },
];

type Burner = { tag: string; name: string; plan: string; owner: string; ownerType: string; avatar: string; days: number; state: "Overdue" | "At Risk" | "Critical Renewal Risk"; context: string };
const BURNERS: Burner[] = [
  { tag: "ESCALATED", name: "Northbridge Global",    plan: "Enterprise Plan", owner: "Maya Patel",   ownerType: "Strategic",   avatar: AVA("Maya"),   days: -14, state: "Overdue",                context: "$3.25M ARR · Champion departed Q4" },
  { tag: "ESCALATED", name: "Pioneer Manufacturing", plan: "Growth Plan",     owner: "Ethan Cole",   ownerType: "Velocity",    avatar: AVA("Ethan"),  days:   2, state: "At Risk",                context: "$1.12M ARR · Usage off 18% MoM" },
  { tag: "ESCALATED", name: "TechCore Solutions",    plan: "Enterprise Plan", owner: "Daniel Reyes", ownerType: "Strategic",   avatar: AVA("Daniel"), days:  90, state: "Critical Renewal Risk",  context: "$2.14M ARR · Procurement loop stalled" },
];

type LedgerRow = { time: string; headline: string; account: string; detail: string };
const LEDGER: LedgerRow[] = [
  { time: "9:02 AM", headline: "Usage drop detected",    account: "Northbridge Global",    detail: "↓ 28% Weekly Active Users" },
  { time: "8:41 AM", headline: "Exec sponsor change",    account: "Pioneer Manufacturing", detail: "New: Jennifer Lee (VP Ops)" },
  { time: "8:17 AM", headline: "Support escalation",     account: "Helix Financial",       detail: "Severity 2 → Severity 1" },
  { time: "7:56 AM", headline: "Renewal date updated",   account: "Atlas Logistics",       detail: "May 28 → Jun 15, 2025" },
  { time: "7:32 AM", headline: "Expansion opportunity",  account: "Vertex Biotech",        detail: "$185K ARR identified" },
  { time: "7:05 AM", headline: "Health score change",    account: "Summit Retail",         detail: "76 → 62 (↓ 14)" },
  { time: "6:48 AM", headline: "Churn risk increased",   account: "Clearwater Insurance",  detail: "Likelihood 2 → 4" },
];

const HEATMAP: number[][] = [
  [ 0,  1,  2,  4,  7],
  [ 1,  2,  4,  6,  9],
  [ 3,  4,  7,  9, 12],
  [ 4,  6,  9, 11, 14],
  [ 6,  8, 11, 13, 16],
];
const IMPACT_ROWS = [
  { n: 5, label: "Critical" },
  { n: 4, label: "High" },
  { n: 3, label: "Medium" },
  { n: 2, label: "Low" },
  { n: 1, label: "Minimal" },
];
const LIKELIHOOD_COLS = [
  { n: 1, label: "Rare" },
  { n: 2, label: "Unlikely" },
  { n: 3, label: "Possible" },
  { n: 4, label: "Likely" },
  { n: 5, label: "Almost Certain" },
];

/* ============ Helpers ============ */

function fmtUSD(n: number) { return `$${n.toLocaleString("en-US")}`; }

function heatColor(v: number) {
  if (v === 0) return { bg: "rgba(245,232,200,0.92)", fg: "#1a2a4a" };
  const max = 16;
  const t = Math.min(1, v / max);
  const stops = [
    { t: 0.00, c: [245, 232, 200] },
    { t: 0.30, c: [243, 198, 106] },
    { t: 0.55, c: [233, 138,  58] },
    { t: 0.80, c: [212,  78,  48] },
    { t: 1.00, c: [180,  40,  36] },
  ];
  let a = stops[0], b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].t && t <= stops[i + 1].t) { a = stops[i]; b = stops[i + 1]; break; }
  }
  const k = (t - a.t) / Math.max(0.0001, b.t - a.t);
  const c = a.c.map((x, i) => Math.round(x + (b.c[i] - x) * k));
  const luminance = (c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114) / 255;
  return { bg: `rgb(${c[0]},${c[1]},${c[2]})`, fg: luminance > 0.6 ? "#1a2a4a" : "#fff" };
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 84, h = 22, pad = 2;
  const min = Math.min(...data), max = Math.max(...data);
  const span = Math.max(1, max - min);
  const pts = data
    .map((v, i) => {
      const x = pad + (i * (w - pad * 2)) / (data.length - 1);
      const y = h - pad - ((v - min) / span) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="block">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const RISK_COLOR: Record<DemoAccount["risk"], string> = {
  Critical: "text-red-400",
  High:     "text-orange-400",
  Medium:   "text-amber-300",
  Low:      "text-emerald-400",
};
const TREND_COLOR: Record<DemoAccount["risk"], string> = {
  Critical: "#ef4444",
  High:     "#fb923c",
  Medium:   "#f59e0b",
  Low:      "#34d399",
};

/* KPI accent rail tones — flush top edge, zero radius */
const ACCENT_RAIL: Record<string, string> = {
  gold:    "#e0c58f",
  emerald: "#10b981",
  crimson: "#c0392b",
  teal:    "#5eead4",
};

type ViewKey = "pulse" | "accounts" | "renewals" | "360";
type TrendRange = "30D" | "90D" | "180D";
type TrendMetric = "nrr" | "health" | "adoption" | "risk";
type TrendPoint = { label: string; nrr: number; health: number; adoption: number; risk: number };

const RANGE_OPTIONS: { id: TrendRange; label: string }[] = [
  { id: "30D", label: "30D" },
  { id: "90D", label: "90D" },
  { id: "180D", label: "180D" },
];

const TREND_SERIES: Record<TrendRange, TrendPoint[]> = {
  "30D": [
    { label: "May 01", nrr: 108, health: 72, adoption: 66, risk: 18 },
    { label: "May 05", nrr: 109, health: 73, adoption: 68, risk: 17 },
    { label: "May 09", nrr: 111, health: 75, adoption: 70, risk: 15 },
    { label: "May 13", nrr: 110, health: 74, adoption: 69, risk: 16 },
    { label: "May 17", nrr: 112, health: 76, adoption: 72, risk: 14 },
    { label: "May 21", nrr: 114, health: 78, adoption: 74, risk: 12 },
    { label: "May 25", nrr: 113, health: 77, adoption: 75, risk: 13 },
    { label: "May 30", nrr: 115, health: 79, adoption: 77, risk: 11 },
  ],
  "90D": [
    { label: "Mar W1", nrr: 103, health: 68, adoption: 61, risk: 25 },
    { label: "Mar W2", nrr: 104, health: 69, adoption: 62, risk: 24 },
    { label: "Mar W3", nrr: 106, health: 70, adoption: 64, risk: 22 },
    { label: "Apr W1", nrr: 105, health: 69, adoption: 65, risk: 23 },
    { label: "Apr W2", nrr: 108, health: 72, adoption: 67, risk: 20 },
    { label: "Apr W3", nrr: 110, health: 74, adoption: 70, risk: 18 },
    { label: "May W1", nrr: 111, health: 75, adoption: 71, risk: 16 },
    { label: "May W2", nrr: 112, health: 77, adoption: 73, risk: 15 },
    { label: "May W3", nrr: 114, health: 78, adoption: 75, risk: 13 },
    { label: "May W4", nrr: 115, health: 79, adoption: 77, risk: 11 },
  ],
  "180D": [
    { label: "Dec", nrr: 98, health: 63, adoption: 56, risk: 34 },
    { label: "Jan", nrr: 100, health: 65, adoption: 58, risk: 31 },
    { label: "Feb", nrr: 102, health: 66, adoption: 60, risk: 28 },
    { label: "Mar", nrr: 105, health: 69, adoption: 64, risk: 24 },
    { label: "Apr", nrr: 110, health: 74, adoption: 70, risk: 18 },
    { label: "May", nrr: 115, health: 79, adoption: 77, risk: 11 },
  ],
};

const TREND_METRICS: { key: TrendMetric; label: string; color: string; suffix: string }[] = [
  { key: "nrr", label: "NRR", color: ACCENT_RAIL.gold, suffix: "%" },
  { key: "health", label: "Health", color: ACCENT_RAIL.teal, suffix: "" },
  { key: "adoption", label: "Adoption", color: ACCENT_RAIL.emerald, suffix: "%" },
  { key: "risk", label: "Risk", color: ACCENT_RAIL.crimson, suffix: "" },
];

/* ================== Component ================== */

export function PulseDashboard({
  accounts: liveAccounts,
  firstName,
  onRowClick,
}: {
  accounts: CSAccount[];
  firstName: string;
  onRowClick: (a: CSAccount) => void;
}) {
  const usingSeed = liveAccounts.length === 0;
  const liveOrSeed = usingSeed ? pulseSeedAccounts : liveAccounts;
  const rows: DemoAccount[] = usingSeed
    ? DEMO
    : liveOrSeed.slice(0, 12).map((a, i) => {
        const renewalDate = a.contract_renewal_date ? new Date(a.contract_renewal_date) : null;
        const days = renewalDate
          ? Math.round((renewalDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
          : 30;
        return {
          name: a.name,
          plan: (a.tier ?? "Core") as DemoAccount["plan"],
          owner: a.csm_name ?? "—",
          avatar: AVA(a.csm_name ?? a.name + i),
          arr: Number(a.arr),
          renewal: renewalDate
            ? renewalDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "—",
          nrr: Math.round(80 + a.health * 0.4),
          health: a.health,
          trend: Array.from({ length: 10 }, (_, k) => Math.max(20, Math.min(100, a.health + (k - 5) * 1.4))),
          risk: a.health < 45 ? "Critical" : a.health < 60 ? "High" : a.health < 75 ? "Medium" : "Low",
          daysToRenewal: days,
        };
      });

  const nrr   = usingSeed ? 112  : Math.round(rows.reduce((s, r) => s + r.nrr, 0) / Math.max(1, rows.length));
  const grr   = usingSeed ?  94  : 92;
  const churn = usingSeed ? 2.1  : 3.2;
  const portfolioHealth = usingSeed ? 78 : Math.round(rows.reduce((s, r) => s + r.health, 0) / Math.max(1, rows.length));

  const [stamp, setStamp] = useState({ date: "", time: "" });
  useEffect(() => {
    const d = new Date();
    setStamp({
      date: d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }).toUpperCase(),
      time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) + " ET",
    });
  }, []);

  /* ---- Live view switching: synced to URL hash from sidebar nav ---- */
  const hash = useRouterState({ select: (r) => r.location.hash });
  const [activeView, setActiveView] = useState<ViewKey>("pulse");
  useEffect(() => {
    const h = (hash || "").replace(/^#/, "");
    if (h === "accounts") setActiveView("accounts");
    else if (h === "renewals") setActiveView("renewals");
    else if (h === "360") setActiveView("360");
    else setActiveView("pulse");
  }, [hash]);

  const matchLive = (name: string): CSAccount | undefined =>
    liveOrSeed.find((a) => a.name === name) ?? liveOrSeed[0];

  const tabs: { id: ViewKey; label: string }[] = [
    { id: "pulse",    label: "Pulse" },
    { id: "accounts", label: "Accounts" },
    { id: "renewals", label: "Renewals" },
    { id: "360",      label: "360 Dashboard" },
  ];

  return (
    <div className="text-foreground">
      {/* ============== HEADER ============== */}
      <header className="pb-7">
        <div className="flex items-start justify-between gap-6">
          <div className="font-mono text-[11px] font-medium uppercase tracking-widest text-accent/85">
            CSFACTORS&nbsp;&nbsp;/&nbsp;&nbsp;PULSE
          </div>
          <div className="text-right font-mono text-[11px] font-medium uppercase tracking-widest text-accent/80 tabular-nums leading-relaxed">
            <div>{stamp.date || "—"}</div>
            <div>{stamp.time || "—"}</div>
          </div>
        </div>
        <h1
          className="mt-5 font-serif text-[40px] sm:text-[56px] md:text-[80px] leading-[0.98] tracking-[-0.015em] text-foreground"
          style={{ fontFamily: '"Cormorant Garamond", "Newsreader", Georgia, serif' }}
          suppressHydrationWarning
        >
          {(() => {
            const h = new Date().getHours();
            const g = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
            return (
              <>
                {g},{" "}
                <span className="italic tracking-[0.005em]" style={{ fontStyle: "italic" }}>
                  {firstName}
                </span>
                <span className="text-accent">.</span>
              </>
            );
          })()}
        </h1>
      </header>

      {/* ============== TAB STRIP ============== */}
      <div className="border-t border-border overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
        <div className="flex gap-1 -mb-px min-w-max">
          {tabs.map((t) => {
            const active = activeView === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveView(t.id)}
                className={cn(
                  "px-3 md:px-4 py-3 font-mono text-[10px] md:text-[11px] font-semibold uppercase tracking-widest transition-colors border-t-2 whitespace-nowrap",
                  active
                    ? "border-accent text-accent bg-card/60"
                    : "border-transparent text-foreground/55 hover:text-foreground/80",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeView === "pulse" && (
        <PulseView
          rows={rows}
          nrr={nrr}
          grr={grr}
          churn={churn}
          portfolioHealth={portfolioHealth}
          matchLive={matchLive}
          onRowClick={onRowClick}
        />
      )}
      {activeView === "accounts" && (
        <AccountsView rows={rows} matchLive={matchLive} onRowClick={onRowClick} />
      )}
      {activeView === "renewals" && <RenewalsView rows={rows} />}
      {activeView === "360" && <ThreeSixtyView rows={rows} live={!usingSeed} />}
    </div>
  );
}

/* ================== Pulse view ================== */

function PulseView({
  rows, nrr, grr, churn, portfolioHealth, matchLive, onRowClick,
}: {
  rows: DemoAccount[];
  nrr: number; grr: number; churn: number; portfolioHealth: number;
  matchLive: (n: string) => CSAccount | undefined;
  onRowClick: (a: CSAccount) => void;
}) {
  return (
    <>
      {/* ============== KPI STRIP ============== */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 py-7">
        <Kpi rail={ACCENT_RAIL.gold}    label="NRR"              value={`${nrr}%`}    trend={`↑ ${Math.abs(nrr - 106)}pp vs prior 30 days`} />
        <Kpi rail={ACCENT_RAIL.emerald} label="GRR"              value={`${grr}%`}    trend="↑ 2pp vs prior 30 days" />
        <Kpi rail={ACCENT_RAIL.crimson} label="Logo Churn"       value={`${churn}%`}  trend="↓ 0.4pp vs prior 30 days" />
        <Kpi rail={ACCENT_RAIL.teal}    label="Portfolio Health" value={String(portfolioHealth)} trend="↑ 5 vs prior 30 days" />
      </section>

      <Hairline />

      {/* ============== BURNING THREE ============== */}
      <section className="pt-6 pb-8">
        <Eyebrow>The Burning Three</Eyebrow>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {BURNERS.map((b) => (
            <article key={b.name} className="bg-card border border-border p-5 flex flex-col gap-4 min-h-[220px]">
              <div className="flex items-start justify-between gap-3">
                <span className="inline-block px-2 py-0.5 bg-red-500/15 text-red-400 font-mono text-[10px] font-semibold uppercase tracking-widest border border-red-500/40 whitespace-nowrap">
                  {b.tag}
                </span>
              </div>
              <div>
                <div
                  className="text-[22px] sm:text-[24px] leading-[1.1] tracking-tight"
                  style={{ fontFamily: '"Cormorant Garamond", "Newsreader", Georgia, serif' }}
                >
                  {b.name}
                </div>
                <div className="mt-1 text-[13px] text-foreground/60">{b.plan}</div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-foreground/55 leading-snug">
                  {b.context}
                </div>
              </div>
              <div className="mt-auto flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-accent/85 mb-1.5">Owner</div>
                  <div className="flex items-center gap-2">
                    <img src={b.avatar} alt="" className="h-7 w-7 rounded-full bg-card/60 ring-1 ring-accent/30 shrink-0" />
                    <div className="leading-tight min-w-0">
                      <div className="text-[13px] truncate">{b.owner}</div>
                      <div className="text-[11px] text-foreground/55">{b.ownerType}</div>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-accent/85 mb-1">Days to Renewal</div>
                  <div className={cn(
                    "font-mono text-[28px] sm:text-[32px] leading-none tabular-nums font-medium",
                    b.state === "Overdue" ? "text-red-400" : b.days < 14 ? "text-amber-300" : "text-orange-300",
                  )}>
                    {b.days}
                  </div>
                  <div className={cn(
                    "text-[10px] mt-1 font-mono font-semibold uppercase tracking-widest leading-tight max-w-[110px] ml-auto",
                    b.state === "Overdue" ? "text-red-400" : "text-amber-300",
                  )}>
                    {b.state}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Hairline />

      {/* ============== HEATMAP + LEDGER ============== */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 py-8">
        <AccountRiskMatrix />
        <ReckoningLedger />
      </section>

      <Hairline />

      {/* ============== PORTFOLIO OVERVIEW ============== */}
      <section className="pt-6 pb-12">
        <Eyebrow>Portfolio Overview</Eyebrow>
        <AccountsTable rows={rows} matchLive={matchLive} onRowClick={onRowClick} />
      </section>
    </>
  );
}

function AccountRiskMatrix() {
  return (
    <div>
      <Eyebrow>Accounts at Risk</Eyebrow>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-foreground/55">
        Impact × Likelihood
      </div>

      <div className="mt-5 overflow-x-auto pb-1">
        <div className="min-w-[520px] grid grid-cols-[88px_repeat(5,minmax(0,1fr))] gap-[6px]">
          <div className="flex items-end justify-end pr-1 pb-1 font-mono text-[9px] uppercase tracking-widest text-foreground/45">
            Impact
          </div>
          {LIKELIHOOD_COLS.map((c) => (
            <div key={c.n} className="text-center font-mono text-[9px] uppercase tracking-wider text-foreground/62 leading-tight pb-1">
              <span className="tabular-nums text-foreground/45">{c.n}</span>
              <span className="block truncate">{c.label}</span>
            </div>
          ))}

          {HEATMAP.map((row, ri) => (
            <FragmentRow key={IMPACT_ROWS[ri].n} row={row} rowMeta={IMPACT_ROWS[ri]} />
          ))}
        </div>
        <div className="mt-3 min-w-[520px] pl-[94px] text-center font-mono text-[10px] uppercase tracking-widest text-foreground/55">
          Likelihood
        </div>
      </div>
    </div>
  );
}

function FragmentRow({ row, rowMeta }: { row: number[]; rowMeta: { n: number; label: string } }) {
  return (
    <>
      <div className="h-[46px] flex items-center justify-end gap-2 pr-1 font-mono text-[10px] uppercase tracking-widest text-foreground/65 whitespace-nowrap">
        <span className="tabular-nums text-foreground/45">{rowMeta.n}</span>
        <span>{rowMeta.label}</span>
      </div>
      {row.map((v, ci) => {
        const { bg, fg } = heatColor(v);
        return (
          <div
            key={`${rowMeta.n}-${ci}`}
            className="h-[46px] flex items-center justify-center border border-background/20 font-mono text-[15px] tabular-nums font-semibold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
            style={{ background: bg, color: fg }}
            title={`${v} accounts · ${rowMeta.label} impact · ${LIKELIHOOD_COLS[ci].label} likelihood`}
          >
            {v}
          </div>
        );
      })}
    </>
  );
}

function ReckoningLedger() {
  return (
    <div>
      <Eyebrow>Reckoning Ledger</Eyebrow>
      <ol className="mt-5 relative">
        <span
          aria-hidden
          className="absolute top-[18px] bottom-[18px] w-[3px] -translate-x-1/2"
          style={{
            left: "75px",
            backgroundImage: "radial-gradient(circle, color-mix(in oklab, var(--accent) 72%, transparent) 1.35px, transparent 1.55px)",
            backgroundSize: "3px 8px",
            backgroundRepeat: "repeat-y",
          }}
        />
        {LEDGER.map((e) => (
          <li
            key={e.time}
            className="relative grid grid-cols-[56px_14px_minmax(0,1fr)] sm:grid-cols-[56px_14px_minmax(0,1fr)_minmax(96px,140px)] items-center gap-3 py-2.5 min-h-[42px]"
          >
            <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/65 tabular-nums leading-none">
              {e.time}
            </div>
            <div className="relative z-10 flex items-center justify-center h-full">
              <span
                aria-hidden
                className="block h-3 w-3 rounded-full border border-accent/80 bg-background shadow-[0_0_0_3px_var(--background)]"
              />
            </div>
            <div className="text-[13px] leading-tight text-foreground/86 min-w-0 truncate">
              <span className="font-medium">{e.headline}</span>
              <span className="text-foreground/45"> · </span>
              <span className="text-accent/95">{e.account}</span>
            </div>
            <div className="hidden sm:block text-[12px] text-foreground/65 text-right leading-tight truncate">
              {e.detail}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ================== Accounts view ================== */

function AccountsView({
  rows, matchLive, onRowClick,
}: {
  rows: DemoAccount[];
  matchLive: (n: string) => CSAccount | undefined;
  onRowClick: (a: CSAccount) => void;
}) {
  const totalARR = rows.reduce((s, r) => s + r.arr, 0);
  return (
    <section className="pt-7 pb-12">
      <div className="flex items-end justify-between mb-5">
        <div>
          <Eyebrow>Active Client Ledger</Eyebrow>
          <div className="mt-2 text-foreground/65 text-sm">
            {rows.length} accounts · {fmtUSD(totalARR)} aggregate ARR footprint
          </div>
        </div>
      </div>
      <AccountsTable rows={rows} matchLive={matchLive} onRowClick={onRowClick} />
    </section>
  );
}

function AccountsTable({
  rows, matchLive, onRowClick,
}: {
  rows: DemoAccount[];
  matchLive: (n: string) => CSAccount | undefined;
  onRowClick: (a: CSAccount) => void;
}) {
  const openAccount = (name: string) => {
    const account = matchLive(name);
    if (account) onRowClick(account);
  };
  return (
    <div className="mt-4" data-testid="accounts-ledger">
      <div className="md:hidden space-y-3">
        {rows.map((r) => (
          <button
            key={r.name}
            type="button"
            onClick={() => openAccount(r.name)}
            className="w-full border border-border bg-card p-4 text-left transition-colors hover:border-accent/45 hover:bg-accent/[0.035]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div style={{ fontFamily: '"Cormorant Garamond", serif' }} className="text-[23px] leading-[1.05] truncate">{r.name}</div>
                <div className="mt-1 text-[13px] text-foreground/62">{r.plan} · {r.renewal}</div>
              </div>
              <span className={cn("font-mono uppercase tracking-widest text-[10px] shrink-0", RISK_COLOR[r.risk])}>{r.risk}</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 font-mono text-[10px] uppercase tracking-widest">
              <div>
                <span className="block text-foreground/45">ARR</span>
                <span className="mt-1 block text-foreground/86 tabular-nums">{fmtUSD(r.arr)}</span>
              </div>
              <div>
                <span className="block text-foreground/45">Health</span>
                <span className="mt-1 block text-foreground/86 tabular-nums">{r.health}</span>
              </div>
              <div>
                <span className="block text-foreground/45">Days</span>
                <span className={cn("mt-1 block tabular-nums", r.daysToRenewal < 0 ? "text-red-400" : r.daysToRenewal < 14 ? "text-orange-400" : "text-foreground/86")}>
                  {r.daysToRenewal}
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 min-w-0">
                <img src={r.avatar} alt="" className="h-6 w-6 rounded-full ring-1 ring-accent/30 bg-card/60 shrink-0" />
                <span className="text-[13px] text-foreground/78 truncate">{r.owner}</span>
              </span>
              <Sparkline data={r.trend} color={TREND_COLOR[r.risk]} />
            </div>
          </button>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto border border-border">
        <table className="w-full min-w-[1080px] text-sm">
          <thead>
            <tr className="text-left font-mono text-[10px] uppercase tracking-widest text-accent/85 border-b border-border bg-card/55">
              <Th>Account</Th><Th>Plan</Th><Th>Owner</Th>
              <Th align="right">ARR (USD)</Th>
              <Th>Renewal Date</Th>
              <Th align="right">NRR %</Th>
              <Th align="right">Health</Th>
              <Th>Trend (30d)</Th>
              <Th>Risk</Th>
              <Th align="right">Days</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.name}
                className="border-b border-border last:border-b-0 hover:bg-accent/[0.04] cursor-pointer transition-colors"
                onClick={() => openAccount(r.name)}
              >
                <Td><span style={{ fontFamily: '"Cormorant Garamond", serif' }} className="text-[18px] leading-none whitespace-nowrap">{r.name}</span></Td>
                <Td><span className="text-foreground/80 whitespace-nowrap">{r.plan}</span></Td>
                <Td>
                  <span className="inline-flex items-center gap-2 min-w-[150px]">
                    <img src={r.avatar} alt="" className="h-6 w-6 rounded-full ring-1 ring-accent/30 bg-card/60 shrink-0" />
                    <span className="text-foreground/85 whitespace-nowrap">{r.owner}</span>
                  </span>
                </Td>
                <Td align="right"><span className="font-mono tabular-nums whitespace-nowrap">{fmtUSD(r.arr)}</span></Td>
                <Td><span className="text-foreground/80 whitespace-nowrap">{r.renewal}</span></Td>
                <Td align="right"><span className="font-mono tabular-nums">{r.nrr}%</span></Td>
                <Td align="right"><span className="font-mono tabular-nums">{r.health}</span></Td>
                <Td><Sparkline data={r.trend} color={TREND_COLOR[r.risk]} /></Td>
                <Td><span className={cn("font-mono uppercase tracking-widest text-[11px] font-semibold", RISK_COLOR[r.risk])}>{r.risk}</span></Td>
                <Td align="right">
                  <span className={cn("font-mono tabular-nums", r.daysToRenewal < 0 ? "text-red-400" : r.daysToRenewal < 14 ? "text-orange-400" : "text-foreground/85")}>
                    {r.daysToRenewal}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================== Renewals view ================== */

function RenewalsView({ rows }: { rows: DemoAccount[] }) {
  const sorted = [...rows].sort((a, b) => a.daysToRenewal - b.daysToRenewal);
  const totalPending = sorted.reduce((s, r) => s + r.arr, 0);
  const upliftEst = Math.round(totalPending * 0.12);
  return (
    <section className="pt-7 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Kpi rail={ACCENT_RAIL.gold}    label="Pending Renewal ARR" value={fmtUSD(totalPending)} trend={`${sorted.length} contracts in window`} />
        <Kpi rail={ACCENT_RAIL.emerald} label="Uplift Estimate"     value={fmtUSD(upliftEst)}    trend="12% blended expansion target" />
        <Kpi rail={ACCENT_RAIL.crimson} label="At-Risk Renewals"    value={String(sorted.filter(r => r.risk === "Critical" || r.risk === "High").length)} trend="Critical + High risk contracts" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <Eyebrow>Contract Lifecycle Timeline</Eyebrow>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-foreground/55">
            Renewal motion · uplift estimates · risk milestones
          </div>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-accent/85 tabular-nums">
          Next 180 days
        </div>
      </div>

      <ol className="mt-6 relative space-y-0">
        <span
          aria-hidden
          className="absolute top-7 bottom-7 left-[11px] sm:left-[132px] w-[3px] -translate-x-1/2"
          style={{
            backgroundImage: "radial-gradient(circle, color-mix(in oklab, var(--accent) 72%, transparent) 1.35px, transparent 1.55px)",
            backgroundSize: "3px 8px",
            backgroundRepeat: "repeat-y",
          }}
        />
        {sorted.map((r) => {
          const overdue = r.daysToRenewal < 0;
          const urgent = !overdue && r.daysToRenewal < 30;
          const tone = overdue ? "text-red-400 border-red-400" : urgent ? "text-amber-300 border-amber-300" : "text-emerald-400 border-emerald-400";
          const stage = overdue ? "Escalate" : urgent ? "Mutual plan" : r.daysToRenewal < 75 ? "Commercial align" : "Monitor";
          const uplift = Math.round(r.arr * (r.risk === "Low" ? 0.18 : r.risk === "Medium" ? 0.1 : 0.04));
          return (
            <li key={r.name} className="relative grid grid-cols-[22px_minmax(0,1fr)] sm:grid-cols-[108px_28px_minmax(0,1fr)] gap-3 sm:gap-4 py-3">
              <div className="hidden sm:block pt-5 text-right font-mono text-[10px] uppercase tracking-widest text-foreground/58 leading-tight tabular-nums">
                <span className="block">{r.renewal}</span>
                <span className={cn("block mt-1", tone.split(" ")[0])}>{overdue ? `${Math.abs(r.daysToRenewal)} overdue` : `${r.daysToRenewal} days`}</span>
              </div>
              <div className="relative z-10 flex justify-center pt-5">
                <span className={cn("h-4 w-4 rounded-full bg-background border-2 shadow-[0_0_0_5px_var(--background)]", tone)} />
              </div>
              <article className="bg-card border border-border p-4 sm:p-5 hover:bg-accent/[0.035] transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="sm:hidden font-mono text-[10px] uppercase tracking-widest text-foreground/55 mb-1">{r.renewal}</div>
                    <div style={{ fontFamily: '"Cormorant Garamond", serif' }} className="text-[23px] sm:text-[26px] leading-[1.05] truncate">{r.name}</div>
                    <div className="mt-1 text-[13px] text-foreground/65">{r.plan} · {r.owner}</div>
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[10px] uppercase tracking-widest">
                      <div>
                        <span className="block text-foreground/45">Stage</span>
                        <span className="mt-1 block text-foreground/82">{stage}</span>
                      </div>
                      <div>
                        <span className="block text-foreground/45">Risk</span>
                        <span className={cn("mt-1 block", RISK_COLOR[r.risk])}>{r.risk}</span>
                      </div>
                      <div>
                        <span className="block text-foreground/45">Health</span>
                        <span className="mt-1 block text-foreground/82 tabular-nums">{r.health}</span>
                      </div>
                      <div>
                        <span className="block text-foreground/45">Uplift</span>
                        <span className="mt-1 block text-accent/90 tabular-nums">{fmtUSD(uplift)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="lg:text-right shrink-0">
                    <div className="font-mono tabular-nums text-[20px] leading-none">{fmtUSD(r.arr)}</div>
                    <div className={cn("font-mono text-[10px] uppercase tracking-widest mt-2", tone.split(" ")[0])}>
                      {overdue ? `${Math.abs(r.daysToRenewal)} days overdue` : `${r.daysToRenewal} days out`}
                    </div>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ================== 360 view ================== */

function ThreeSixtyView({ rows }: { rows: DemoAccount[] }) {
  const [range, setRange] = useState<TrendRange>("90D");
  const [metric, setMetric] = useState<TrendMetric>("health");
  const activeSeries = TREND_SERIES[range];
  const activeMetric = TREND_METRICS.find((m) => m.key === metric) ?? TREND_METRICS[1];
  const cohorts = [
    { label: "Enterprise", filter: (r: DemoAccount) => r.plan === "Enterprise" },
    { label: "Growth",     filter: (r: DemoAccount) => r.plan === "Growth" },
    { label: "Core",       filter: (r: DemoAccount) => r.plan === "Core" },
  ];
  return (
    <section className="pt-7 pb-12 space-y-10">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)] gap-4">
        <div className="bg-card border border-border p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
            <div>
              <Eyebrow>Interactive Trend Graph</Eyebrow>
              <div className="mt-1 text-[13px] text-foreground/62 leading-snug">
                Customer success signal velocity across retention, health, adoption, and risk.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={range === option.id}
                  onClick={() => setRange(option.id)}
                  className={cn(
                    "h-8 px-3 border font-mono text-[10px] uppercase tracking-widest transition-colors",
                    range === option.id
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border text-foreground/65 hover:text-foreground hover:border-accent/50",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <TrendGraph points={activeSeries} metric={activeMetric} />

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TREND_METRICS.map((m) => {
              const latest = activeSeries[activeSeries.length - 1][m.key];
              const first = activeSeries[0][m.key];
              const delta = latest - first;
              return (
                <button
                  key={m.key}
                  type="button"
                  aria-pressed={metric === m.key}
                  onClick={() => setMetric(m.key)}
                  className={cn(
                    "border p-3 text-left transition-colors",
                    metric === m.key ? "border-accent bg-accent/[0.08]" : "border-border hover:border-accent/45 hover:bg-accent/[0.035]",
                  )}
                >
                  <span className="block font-mono text-[10px] uppercase tracking-widest text-foreground/58">{m.label}</span>
                  <span className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="font-mono text-[24px] leading-none tabular-nums" style={{ color: m.color }}>
                      {latest}{m.suffix}
                    </span>
                    <span className={cn("font-mono text-[10px] uppercase tracking-widest tabular-nums", delta >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {delta >= 0 ? "+" : ""}{delta}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-4">
          <Kpi rail={ACCENT_RAIL.gold} label="Expansion Momentum" value="+$1.4M" trend="Qualified expansion surfaced from healthy cohorts" />
          <Kpi rail={ACCENT_RAIL.teal} label="Signal Coverage" value="92%" trend="Accounts with current product + support signals" />
          <Kpi rail={ACCENT_RAIL.crimson} label="Risk Compression" value="-14" trend="High-severity accounts reduced in 90 days" />
        </div>
      </div>

      <Hairline />

      <div>
        <Eyebrow>Cohort Trend Arrays</Eyebrow>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {cohorts.map((c) => {
            const subset = rows.filter(c.filter);
            const avg = subset.length ? Math.round(subset.reduce((s, r) => s + r.health, 0) / subset.length) : 0;
            const arr = subset.reduce((s, r) => s + r.arr, 0);
            return (
              <div key={c.label} className="bg-card border border-border p-5">
                <div className="font-mono text-[10px] uppercase tracking-widest text-accent/80">{c.label}</div>
                <div className="mt-3 font-mono text-[48px] leading-none tabular-nums">{avg}</div>
                <div className="mt-1 text-sm text-foreground/60">Avg health · {fmtUSD(arr)} ARR</div>
                <div className="mt-4 space-y-2">
                  {subset.map((r) => (
                    <div key={r.name} className="flex items-center justify-between text-xs">
                      <span className="text-foreground/80 truncate pr-3">{r.name}</span>
                      <Sparkline data={r.trend} color={TREND_COLOR[r.risk]} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Hairline />

      <div>
        <Eyebrow>Historical Health Distribution</Eyebrow>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
          {rows.map((r) => (
            <div key={r.name} className="bg-card p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <img src={r.avatar} alt="" className="h-8 w-8 rounded-full ring-1 ring-accent/30 bg-card/60" />
                <div className="min-w-0">
                  <div style={{ fontFamily: '"Cormorant Garamond", serif' }} className="text-base truncate">{r.name}</div>
                  <div className="text-xs text-foreground/55">{r.owner}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Sparkline data={r.trend} color={TREND_COLOR[r.risk]} />
                <div className="font-mono tabular-nums text-lg w-10 text-right">{r.health}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrendGraph({ points, metric }: { points: TrendPoint[]; metric: { key: TrendMetric; label: string; color: string; suffix: string } }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const w = 720;
  const h = 280;
  const padX = 44;
  const padY = 30;
  const values = points.map((p) => p[metric.key]);
  const min = Math.floor(Math.min(...values) / 5) * 5;
  const max = Math.ceil(Math.max(...values) / 5) * 5;
  const span = Math.max(1, max - min);
  const coords = points.map((p, i) => {
    const x = padX + (i * (w - padX * 2)) / Math.max(1, points.length - 1);
    const y = h - padY - ((p[metric.key] - min) / span) * (h - padY * 2);
    return { x, y, point: p };
  });
  const path = coords.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `${path} L ${coords[coords.length - 1].x.toFixed(1)} ${h - padY} L ${coords[0].x.toFixed(1)} ${h - padY} Z`;
  const active = hovered === null ? null : coords[hovered];

  return (
    <div className="relative" data-testid="trend-graph">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[260px] sm:h-[320px] overflow-hidden" role="img" aria-label={`${metric.label} trend graph`} onMouseLeave={() => setHovered(null)}>
        <defs>
          <linearGradient id={`trend-fill-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={metric.color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={metric.color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const y = padY + (line * (h - padY * 2)) / 3;
          const label = Math.round(max - (line * span) / 3);
          return (
            <g key={line}>
              <line x1={padX} x2={w - padX} y1={y} y2={y} stroke="var(--border)" strokeWidth="1" />
              <text x={12} y={y + 4} fill="var(--muted-foreground)" fontSize="10" fontFamily="var(--font-mono)">{label}</text>
            </g>
          );
        })}
        <path d={area} fill={`url(#trend-fill-${metric.key})`} />
        <path d={path} fill="none" stroke={metric.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((p, i) => (
          <g key={p.point.label} onMouseEnter={() => setHovered(i)} onFocus={() => setHovered(i)} tabIndex={0} className="outline-none">
            <rect
              x={i === 0 ? padX - 18 : p.x - ((w - padX * 2) / Math.max(1, points.length - 1)) / 2}
              y={padY - 8}
              width={(w - padX * 2) / Math.max(1, points.length - 1)}
              height={h - padY * 2 + 16}
              fill="transparent"
            />
            <circle cx={p.x} cy={p.y} r={hovered === i ? 5 : 3.5} fill="var(--background)" stroke={metric.color} strokeWidth="2" />
          </g>
        ))}
        {active && (
          <g pointerEvents="none">
            <line x1={active.x} x2={active.x} y1={padY} y2={h - padY} stroke={metric.color} strokeOpacity="0.45" strokeDasharray="3 6" />
            <circle cx={active.x} cy={active.y} r="6" fill={metric.color} />
          </g>
        )}
        {coords.map((p, i) => (
          <text key={`${p.point.label}-axis`} x={p.x} y={h - 7} textAnchor="middle" fill="var(--muted-foreground)" fontSize="9" fontFamily="var(--font-mono)" opacity={i % 2 === 0 || points.length <= 6 ? 1 : 0.45}>
            {p.point.label}
          </text>
        ))}
      </svg>
      {active && (
        <div
          className="pointer-events-none absolute min-w-[150px] border border-accent/45 bg-card px-3 py-2 shadow-2xl"
          style={{ left: `${Math.min(82, Math.max(14, (active.x / w) * 100))}%`, top: `${Math.min(72, Math.max(12, (active.y / h) * 100))}%`, transform: "translate(-50%, -115%)" }}
        >
          <div className="font-mono text-[10px] uppercase tracking-widest text-accent/85">{active.point.label}</div>
          <div className="mt-1 flex items-baseline justify-between gap-4">
            <span className="text-[13px] text-foreground/62">{metric.label}</span>
            <span className="font-mono text-[20px] tabular-nums leading-none" style={{ color: metric.color }}>
              {active.point[metric.key]}{metric.suffix}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[9px] uppercase tracking-widest text-foreground/58">
            <span>NRR {active.point.nrr}%</span>
            <span>Health {active.point.health}</span>
            <span>Adoption {active.point.adoption}%</span>
            <span>Risk {active.point.risk}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ Presentational primitives ============ */

function Hairline() {
  return <div aria-hidden className="h-px w-full bg-border" />;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[11px] font-medium uppercase tracking-widest text-accent/85">
      {children}
    </div>
  );
}

function Kpi({ rail, label, value, trend }: { rail: string; label: string; value: string; trend: string }) {
  return (
    <div className="relative bg-card border border-border p-4 sm:p-5 pt-5 sm:pt-6 overflow-hidden">
      <span aria-hidden className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: rail }} />
      <div className="font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-foreground/65">{label}</div>
      <div className="mt-2 sm:mt-3 font-mono text-[34px] sm:text-[44px] md:text-[52px] leading-none tabular-nums text-foreground font-medium">{value}</div>
      <div className="mt-2 sm:mt-3 text-[11px] sm:text-[12px] text-foreground/65 leading-snug">{trend}</div>
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th className={cn("py-3 px-3 font-medium", align === "right" ? "text-right" : "text-left")}>{children}</th>
  );
}

function Td({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <td className={cn("py-3.5 px-3 align-middle", align === "right" ? "text-right" : "text-left")}>{children}</td>
  );
}
