import { useEffect, useMemo, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { CSAccount } from "@/lib/csfactors.functions";
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
    : liveOrSeed.slice(0, 12).map((a, i) => ({
        name: a.name,
        plan: (a.tier ?? "Core") as DemoAccount["plan"],
        owner: a.csm_name ?? "—",
        avatar: AVA(a.csm_name ?? a.name + i),
        arr: Number(a.arr),
        renewal: a.contract_renewal_date ?? "—",
        nrr: Math.round(80 + a.health * 0.4),
        health: a.health,
        trend: Array.from({ length: 10 }, (_, k) => Math.max(20, Math.min(100, a.health + (k - 5) * 1.4))),
        risk: a.health < 45 ? "Critical" : a.health < 60 ? "High" : a.health < 75 ? "Medium" : "Low",
        daysToRenewal: 30,
      }));

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
      {activeView === "360" && <ThreeSixtyView rows={rows} />}
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
                <span className="inline-block px-2 py-0.5 bg-red-500/15 text-red-400 font-mono text-[10px] uppercase tracking-widest border border-red-500/40">
                  {b.tag}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-foreground/45">
                  {b.context}
                </span>
              </div>
              <div>
                <div
                  className="text-[24px] leading-[1.1] tracking-tight"
                  style={{ fontFamily: '"Cormorant Garamond", "Newsreader", Georgia, serif' }}
                >
                  {b.name}
                </div>
                <div className="mt-1 text-sm text-foreground/60">{b.plan}</div>
              </div>
              <div className="mt-auto flex items-end justify-between gap-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-accent/80 mb-1.5">Owner</div>
                  <div className="flex items-center gap-2">
                    <img src={b.avatar} alt="" className="h-7 w-7 rounded-full bg-card/60 ring-1 ring-accent/30" />
                    <div className="leading-tight">
                      <div className="text-sm">{b.owner}</div>
                      <div className="text-xs text-foreground/55">{b.ownerType}</div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-accent/80 mb-1">Days to Renewal</div>
                  <div className={cn(
                    "font-mono text-[32px] leading-none tabular-nums",
                    b.state === "Overdue" ? "text-red-400" : b.days < 14 ? "text-amber-300" : "text-orange-300",
                  )}>
                    {b.days}
                  </div>
                  <div className={cn(
                    "text-[11px] mt-1 font-mono uppercase tracking-widest",
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
      <section className="grid grid-cols-1 lg:grid-cols-2 lg:gap-10 py-8">
        {/* Heatmap */}
        <div>
          <Eyebrow>Accounts at Risk</Eyebrow>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-foreground/55">
            Impact × Likelihood
          </div>

          <div className="mt-5 flex">
            <div className="flex flex-col gap-[6px] pr-3">
              {IMPACT_ROWS.map((r) => (
                <div key={r.n} className="h-[44px] flex items-center justify-end gap-2 font-mono text-[10px] uppercase tracking-widest text-foreground/65">
                  <span className="tabular-nums">{r.n}</span>
                  <span>{r.label}</span>
                </div>
              ))}
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-5 gap-[6px]">
                {HEATMAP.flatMap((row, ri) =>
                  row.map((v, ci) => {
                    const { bg, fg } = heatColor(v);
                    return (
                      <div
                        key={`${ri}-${ci}`}
                        className="h-[44px] flex items-center justify-center font-mono text-base tabular-nums"
                        style={{ background: bg, color: fg }}
                      >
                        {v}
                      </div>
                    );
                  }),
                )}
              </div>
              <div className="mt-2 grid grid-cols-5 gap-[6px]">
                {LIKELIHOOD_COLS.map((c) => (
                  <div key={c.n} className="text-center font-mono text-[9px] uppercase tracking-widest text-foreground/65 leading-tight">
                    <div className="tabular-nums">{c.n}</div>
                    <div className="whitespace-nowrap">{c.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-center font-mono text-[10px] uppercase tracking-widest text-foreground/55">
                Likelihood
              </div>
            </div>
          </div>
        </div>

        {/* Ledger — vertical rail aligned through dot centers */}
        <div className="mt-10 lg:mt-0">
          <Eyebrow>Reckoning Ledger</Eyebrow>
          <ol className="mt-5 relative">
            {/* Vertical rail: anchored to the dot column (left=78px), spans dot centers */}
            <span
              aria-hidden
              className="absolute w-px bg-accent/30"
              style={{ left: "78px", top: "20px", bottom: "20px" }}
            />
            {LEDGER.map((e) => (
              <li
                key={e.time}
                className="grid grid-cols-[64px_14px_1fr_140px] items-center gap-3 py-2 min-h-[40px]"
              >
                <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/65 tabular-nums leading-none">
                  {e.time}
                </div>
                {/* Dot cell — exactly 14px wide, centered, dot is 10px → keeps perfect alignment */}
                <div className="flex items-center justify-center h-full">
                  <span
                    aria-hidden
                    className="block h-2.5 w-2.5 rounded-full border border-accent/70 bg-background"
                  />
                </div>
                <div className="text-[13px] leading-tight text-foreground/85 truncate">
                  <span className="font-medium">{e.headline}</span>
                  <span className="text-foreground/45"> · </span>
                  <span className="text-accent/90">{e.account}</span>
                </div>
                <div className="text-[12px] text-foreground/65 text-right leading-tight truncate">
                  {e.detail}
                </div>
              </li>
            ))}
          </ol>
        </div>
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
  return (
    <div className="mt-4 overflow-x-auto border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left font-mono text-[10px] uppercase tracking-widest text-accent/80 border-b border-border bg-card/40">
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
              onClick={() => { const a = matchLive(r.name); if (a) onRowClick(a); }}
            >
              <Td><span style={{ fontFamily: '"Cormorant Garamond", serif' }} className="text-[17px]">{r.name}</span></Td>
              <Td><span className="text-foreground/80">{r.plan}</span></Td>
              <Td>
                <span className="inline-flex items-center gap-2">
                  <img src={r.avatar} alt="" className="h-6 w-6 rounded-full ring-1 ring-accent/30 bg-card/60" />
                  <span className="text-foreground/85">{r.owner}</span>
                </span>
              </Td>
              <Td align="right"><span className="font-mono tabular-nums">{fmtUSD(r.arr)}</span></Td>
              <Td><span className="text-foreground/80">{r.renewal}</span></Td>
              <Td align="right"><span className="font-mono tabular-nums">{r.nrr}%</span></Td>
              <Td align="right"><span className="font-mono tabular-nums">{r.health}</span></Td>
              <Td><Sparkline data={r.trend} color={TREND_COLOR[r.risk]} /></Td>
              <Td><span className={cn("font-mono uppercase tracking-widest text-[11px] font-medium", RISK_COLOR[r.risk])}>{r.risk}</span></Td>
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

      <Eyebrow>Contract Lifecycle Timeline</Eyebrow>
      <ol className="mt-5 relative border-l border-border ml-3">
        {sorted.map((r) => {
          const tone = r.daysToRenewal < 0 ? "text-red-400 border-red-400" : r.daysToRenewal < 30 ? "text-amber-300 border-amber-300" : "text-emerald-400 border-emerald-400";
          return (
            <li key={r.name} className="relative pl-6 py-4 border-b border-border last:border-b-0">
              <span className={cn("absolute -left-[7px] top-6 h-3 w-3 rounded-full bg-background border-2", tone)} />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/55">{r.renewal}</div>
                  <div style={{ fontFamily: '"Cormorant Garamond", serif' }} className="text-[22px] leading-tight mt-1">{r.name}</div>
                  <div className="text-sm text-foreground/65 mt-1">{r.plan} · {r.owner}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono tabular-nums text-lg">{fmtUSD(r.arr)}</div>
                  <div className={cn("font-mono text-[11px] uppercase tracking-widest mt-1", tone.split(" ")[0])}>
                    {r.daysToRenewal < 0 ? `${Math.abs(r.daysToRenewal)} days overdue` : `${r.daysToRenewal} days out`}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ================== 360 view ================== */

function ThreeSixtyView({ rows }: { rows: DemoAccount[] }) {
  const cohorts = [
    { label: "Enterprise", filter: (r: DemoAccount) => r.plan === "Enterprise" },
    { label: "Growth",     filter: (r: DemoAccount) => r.plan === "Growth" },
    { label: "Core",       filter: (r: DemoAccount) => r.plan === "Core" },
  ];
  return (
    <section className="pt-7 pb-12 space-y-10">
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
    <div className="relative bg-card border border-border p-5 pt-6 overflow-hidden">
      {/* Flush top accent rail — 100% width, zero radius */}
      <span aria-hidden className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: rail }} />
      <div className="font-mono text-[11px] font-medium uppercase tracking-widest text-foreground/65">{label}</div>
      <div className="mt-3 font-mono text-[44px] md:text-[52px] leading-none tabular-nums text-foreground">{value}</div>
      <div className="mt-3 text-[12px] text-foreground/65">{trend}</div>
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
