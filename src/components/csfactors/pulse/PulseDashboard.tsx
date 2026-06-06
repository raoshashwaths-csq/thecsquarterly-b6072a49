import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { CSAccount } from "@/lib/csfactors.functions";
import { pulseSeedAccounts } from "@/lib/mocks/pulseSeed";

/* ------------------------------------------------------------------ *
 * Pulse — editorial dark dashboard.
 * Visual reference: csq-mockup-pulse-dark. Navy ground, gold hairline
 * dividers, large Didone-ish display headlines, mono micro-labels.
 * Everything below is composed inline so the layout matches 1:1.
 * ------------------------------------------------------------------ */

/* ============ Mockup-locked data (used when seed portfolio) ========= */

type DemoAccount = {
  name: string;
  plan: "Enterprise" | "Growth" | "Core";
  owner: string;
  avatar: string;
  arr: number;
  renewal: string;
  nrr: number;
  health: number;
  trend: number[]; // sparkline values
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
];

type Burner = { tag: string; name: string; plan: string; owner: string; avatar: string; days: number; state: "Overdue" | "At Risk" };
const BURNERS: Burner[] = [
  { tag: "ESCALATED", name: "Northbridge Global",    plan: "Enterprise Plan", owner: "Maya Patel", avatar: AVA("Maya"),  days: -14, state: "Overdue" },
  { tag: "ESCALATED", name: "Pioneer Manufacturing", plan: "Growth Plan",     owner: "Ethan Cole", avatar: AVA("Ethan"), days:   2, state: "At Risk" },
  { tag: "ESCALATED", name: "Helix Financial",       plan: "Enterprise Plan", owner: "Lina Park",  avatar: AVA("Lina"),  days:   9, state: "At Risk" },
];

type LedgerRow = { time: string; headline: string; account: string; detail: string };
const LEDGER: LedgerRow[] = [
  { time: "9:02 AM", headline: "Usage drop detected",    account: "Northbridge Global",    detail: "↓ 28% in Weekly Active Users" },
  { time: "8:41 AM", headline: "Exec sponsor change",    account: "Pioneer Manufacturing", detail: "New: Jennifer Lee (VP Operations)" },
  { time: "8:17 AM", headline: "Support escalation",     account: "Helix Financial",       detail: "Severity 2 → Severity 1" },
  { time: "7:56 AM", headline: "Renewal date updated",   account: "Atlas Logistics",       detail: "May 28, 2025 → Jun 15, 2025" },
  { time: "7:32 AM", headline: "Expansion opportunity",  account: "Vertex Biotech",        detail: "$185K ARR identified" },
  { time: "7:05 AM", headline: "Health score change",    account: "Summit Retail",         detail: "76 → 62 (↓ 14)" },
  { time: "6:48 AM", headline: "Churn risk increased",   account: "Clearwater Insurance",  detail: "Likelihood 2 → 4" },
];

// 5x5 [row=impact 5..1][col=likelihood 1..5] count
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

/* ============ Tiny helpers ============ */

function fmtUSD(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}

function heatColor(v: number) {
  // 0 → near-transparent cream, max → red. Tuned for the mockup ramp.
  if (v === 0) return { bg: "rgba(245,232,200,0.92)", fg: "#1a2a4a" };
  const max = 16;
  const t = Math.min(1, v / max);
  // cream → orange → red
  // anchor stops: 0:#f5e8c8, 0.45:#f3c66a, 0.7:#e98a3a, 1:#c63a2e
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

  // KPI values lock to the mockup for the demo portfolio
  const totalARR = useMemo(() => rows.reduce((s, r) => s + r.arr, 0), [rows]);
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

  // Map our rows to CSAccount for click-out
  const matchLive = (name: string): CSAccount | undefined =>
    liveOrSeed.find((a) => a.name === name) ?? liveOrSeed[0];

  return (
    <div className="text-foreground">
      {/* ============== HEADER ============== */}
      <header className="pb-8">
        <div className="flex items-start justify-between gap-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-accent/80">
            CSFACTORS&nbsp;&nbsp;/&nbsp;&nbsp;PULSE
          </div>
          <div className="text-right font-mono text-[10px] uppercase tracking-[0.32em] text-accent/80 tabular-nums leading-relaxed">
            <div>{stamp.date || "—"}</div>
            <div>{stamp.time || "—"}</div>
          </div>
        </div>
        <h1
          className="mt-6 font-display text-[64px] md:text-[88px] leading-[0.95] tracking-[-0.02em] text-foreground"
          suppressHydrationWarning
        >
          {(() => {
            const h = new Date().getHours();
            const g = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
            return (
              <>
                {g}, <span className="italic">{firstName}</span>
                <span className="text-accent">.</span>
              </>
            );
          })()}
        </h1>
      </header>

      <GoldRule />

      {/* ============== KPI STRIP ============== */}
      <section className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[color:var(--color-accent)]/30 py-7">
        <Kpi label="NRR"             value={`${nrr}%`}    trend={`↑ ${Math.abs(nrr - 106)}pp vs prior 30 days`} up />
        <Kpi label="GRR"             value={`${grr}%`}    trend="↑ 2pp vs prior 30 days" up />
        <Kpi label="Logo Churn"      value={`${churn}%`}  trend="↓ 0.4pp vs prior 30 days" up />
        <Kpi label="Portfolio Health" value={String(portfolioHealth)} trend="↑ 5 vs prior 30 days" up />
      </section>

      <GoldRule />

      {/* ============== BURNING THREE ============== */}
      <section className="pt-6 pb-8">
        <Eyebrow>The Burning Three</Eyebrow>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[color:var(--color-accent)]/25 border border-[color:var(--color-accent)]/25">
          {BURNERS.map((b) => (
            <article key={b.name} className="p-5 grid grid-cols-[1fr_auto_auto] gap-5 items-start">
              <div>
                <span className="inline-block px-2 py-0.5 bg-red-500/15 text-red-400 font-mono text-[10px] uppercase tracking-[0.22em] border border-red-500/40">
                  {b.tag}
                </span>
                <div className="mt-3 font-display text-2xl leading-tight tracking-tight">{b.name}</div>
                <div className="mt-1 text-sm text-foreground/65">{b.plan}</div>
              </div>
              <div className="flex flex-col items-start gap-1.5">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent/80">Owner</div>
                <div className="flex items-center gap-2">
                  <img src={b.avatar} alt="" className="h-7 w-7 rounded-full bg-card/60 ring-1 ring-accent/30" />
                  <div className="leading-tight">
                    <div className="text-sm">{b.owner}</div>
                    <div className="text-xs text-foreground/55">Strategic</div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent/80">Days to Renewal</div>
                <div className={cn("font-display text-3xl mt-1 tabular-nums", b.state === "Overdue" ? "text-red-400" : "text-amber-300")}>
                  {b.days}
                </div>
                <div className={cn("text-xs mt-0.5", b.state === "Overdue" ? "text-red-400" : "text-amber-300")}>
                  {b.state}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <GoldRule />

      {/* ============== HEATMAP + LEDGER (side-by-side) ============== */}
      <section className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-[color:var(--color-accent)]/25 py-8">
        {/* Heatmap */}
        <div className="lg:pr-10">
          <Eyebrow>Accounts at Risk</Eyebrow>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/55">
            Impact × Likelihood
          </div>

          <div className="mt-5 flex">
            {/* Y axis */}
            <div className="flex flex-col gap-[6px] pr-3 pt-0">
              {IMPACT_ROWS.map((r) => (
                <div key={r.n} className="h-[44px] flex items-center justify-end gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/65">
                  <span className="tabular-nums">{r.n}</span>
                  <span>{r.label}</span>
                </div>
              ))}
            </div>
            {/* Grid */}
            <div className="flex-1">
              <div className="grid grid-cols-5 gap-[6px]">
                {HEATMAP.flatMap((row, ri) =>
                  row.map((v, ci) => {
                    const { bg, fg } = heatColor(v);
                    return (
                      <div
                        key={`${ri}-${ci}`}
                        className="h-[44px] flex items-center justify-center font-display text-xl tabular-nums"
                        style={{ background: bg, color: fg }}
                      >
                        {v}
                      </div>
                    );
                  }),
                )}
              </div>
              {/* X axis */}
              <div className="mt-2 grid grid-cols-5 gap-[6px]">
                {LIKELIHOOD_COLS.map((c) => (
                  <div key={c.n} className="text-center font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/65">
                    <span className="tabular-nums">{c.n}</span> {c.label}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/55">
                Likelihood
              </div>
            </div>
            <div className="pl-2 hidden md:flex items-center">
              <div
                aria-hidden
                className="rotate-180 font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/55"
                style={{ writingMode: "vertical-rl" }}
              >
                Impact
              </div>
            </div>
          </div>
        </div>

        {/* Ledger */}
        <div className="lg:pl-10 mt-10 lg:mt-0">
          <Eyebrow>Reckoning Ledger</Eyebrow>
          <ol className="mt-5 relative">
            <span
              aria-hidden
              className="absolute left-[58px] top-2 bottom-2 w-px bg-[color:var(--color-accent)]/30"
            />
            {LEDGER.map((e) => (
              <li key={e.time} className="grid grid-cols-[60px_1fr_180px_1fr] items-center gap-4 py-2.5">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/65 tabular-nums">
                  {e.time}
                </div>
                <div className="relative pl-4">
                  <span
                    aria-hidden
                    className="absolute left-[-9px] top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full border border-[color:var(--color-accent)]/70 bg-background"
                  />
                  <span className="text-sm text-foreground/85">{e.headline}</span>
                </div>
                <div className="text-sm text-accent">{e.account}</div>
                <div className="text-sm text-foreground/70 text-right">{e.detail}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <GoldRule />

      {/* ============== PORTFOLIO OVERVIEW ============== */}
      <section className="pt-6 pb-12">
        <Eyebrow>Portfolio Overview</Eyebrow>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left font-mono text-[10px] uppercase tracking-[0.22em] text-accent/80 border-b border-[color:var(--color-accent)]/30">
                <Th>Account</Th><Th>Plan</Th><Th>Owner</Th>
                <Th align="right">ARR (USD)</Th>
                <Th>Renewal Date</Th>
                <Th align="right">NRR %</Th>
                <Th align="right">Health Score</Th>
                <Th>Trend (30d)</Th>
                <Th>Risk</Th>
                <Th align="right">Days to Renewal</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.name}
                  className="border-b border-[color:var(--color-accent)]/15 hover:bg-accent/[0.04] cursor-pointer transition-colors"
                  onClick={() => {
                    const a = matchLive(r.name);
                    if (a) onRowClick(a);
                  }}
                >
                  <Td><span className="font-display text-base">{r.name}</span></Td>
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
                  <Td><span className={cn("font-mono uppercase tracking-[0.18em] text-xs", RISK_COLOR[r.risk])}>{r.risk}</span></Td>
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
      </section>
    </div>
  );
}

/* ============ tiny presentational primitives ============ */

function GoldRule() {
  return <div aria-hidden className="h-px w-full bg-[color:var(--color-accent)]/40" />;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-accent/85">{children}</div>
  );
}

function Kpi({ label, value, trend, up }: { label: string; value: string; trend: string; up?: boolean }) {
  return (
    <div className="px-6 first:pl-0 last:pr-0">
      <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-accent/80">{label}</div>
      <div className="mt-3 font-display text-[64px] leading-none tracking-[-0.02em] tabular-nums">{value}</div>
      <div className={cn("mt-3 text-sm", up ? "text-foreground/75" : "text-foreground/75")}>{trend}</div>
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th className={cn("py-3 px-3 font-semibold", align === "right" ? "text-right" : "text-left")}>{children}</th>
  );
}

function Td({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <td className={cn("py-3.5 px-3 align-middle", align === "right" ? "text-right" : "text-left")}>{children}</td>
  );
}
