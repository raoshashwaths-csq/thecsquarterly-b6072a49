import { useMemo, useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { noticeWindow, type CSAccount } from "@/lib/csfactors.functions";

type SortKey =
  | "name"
  | "ucc"
  | "carr"
  | "invoiced_arr"
  | "active_headcount"
  | "final_cs_nps"
  | "implementation_progress"
  | "contract_renewal_date"
  | "csm_sentiment";

type Col = {
  key: keyof CSAccount | "actions";
  label: string;
  sortKey?: SortKey;
  numeric?: boolean;
  width?: string;
};

const COLS: Col[] = [
  { key: "name", label: "Name", sortKey: "name", width: "200px" },
  { key: "ucc", label: "UCC", sortKey: "ucc", width: "120px" },
  { key: "account_manager", label: "Account Manager", width: "160px" },
  { key: "csm_name", label: "CSM", width: "160px" },
  { key: "associate_director", label: "Assoc. Director", width: "160px" },
  { key: "backup_owner", label: "Backup AM/CSM", width: "160px" },
  { key: "customer_success", label: "Customer Success", width: "160px" },
  { key: "key_account_manager", label: "KAM", width: "140px" },
  { key: "contract_renewal_date", label: "Renewal Date", sortKey: "contract_renewal_date", width: "140px" },
  { key: "carr", label: "CARR", sortKey: "carr", numeric: true, width: "120px" },
  { key: "invoiced_arr", label: "Invoiced ARR", sortKey: "invoiced_arr", numeric: true, width: "140px" },
  { key: "journey_stage", label: "Journey Stage", width: "140px" },
  { key: "cs_transition_start", label: "CS Transition Start", width: "150px" },
  { key: "customer_city", label: "City", width: "120px" },
  { key: "csm_sentiment", label: "CSM Sentiment", sortKey: "csm_sentiment", width: "140px" },
  { key: "active_headcount", label: "Headcount", sortKey: "active_headcount", numeric: true, width: "110px" },
  { key: "country", label: "Country", width: "120px" },
  { key: "sub_region", label: "Sub Region", width: "120px" },
  { key: "actual_go_live", label: "Actual Go Live", width: "130px" },
  { key: "planned_go_live", label: "Planned Go Live", width: "140px" },
  { key: "implementation_progress", label: "Impl %", sortKey: "implementation_progress", numeric: true, width: "100px" },
  { key: "da_project_manager", label: "DA - PM", width: "140px" },
  { key: "project_manager_ii", label: "PM II", width: "140px" },
  { key: "server_location", label: "Server Location", width: "140px" },
  { key: "server_name", label: "Server Name", width: "140px" },
  { key: "marquee_client", label: "Marquee", width: "100px" },
  { key: "existing_erp", label: "Existing ERP", width: "140px" },
  { key: "existing_crm", label: "Existing CRM", width: "140px" },
  { key: "region", label: "Region", width: "120px" },
  { key: "payroll_service_type", label: "Payroll Service", width: "150px" },
  { key: "final_cs_nps", label: "NPS", sortKey: "final_cs_nps", numeric: true, width: "80px" },
  { key: "industry", label: "Industry", width: "140px" },
];

function fmtMoney(n: number | null) {
  if (n === null || n === undefined) return "—";
  return `$${Number(n).toLocaleString("en-US")}`;
}

function NoticeBadge({ a }: { a: CSAccount }) {
  const { band, days } = noticeWindow(a.contract_renewal_date, 90) as {
    band: 30 | 60 | 90 | null;
    days?: number;
  };
  if (!band) return null;
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 ml-2 font-mono uppercase tracking-widest text-[9px] border border-accent/60 bg-accent/10 text-accent">
      {band}d · {days}d out
    </span>
  );
}

function SentimentDot({ s }: { s: CSAccount["csm_sentiment"] }) {
  if (!s) return <span className="text-muted-foreground">—</span>;
  const cls =
    s === "Positive"
      ? "bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border-emerald-600/40"
      : s === "Neutral"
        ? "bg-secondary-accent/15 text-secondary-accent border-secondary-accent/40"
        : "bg-destructive/15 text-destructive border-destructive/40";
  return (
    <span className={cn("inline-flex px-2 py-0.5 border font-mono uppercase tracking-widest text-xs", cls)}>
      {s}
    </span>
  );
}

export function AccountsGrid({
  accounts,
  onRowClick,
}: {
  accounts: CSAccount[];
  onRowClick: (a: CSAccount) => void;
}) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("carr");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let rows = accounts;
    if (needle) {
      rows = rows.filter((a) => {
        const hay = [
          a.name,
          a.ucc,
          a.account_manager,
          a.csm_name,
          a.country,
          a.industry,
          a.journey_stage,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(needle);
      });
    }
    return [...rows].sort((a, b) => {
      const av = a[sortKey] as unknown;
      const bv = b[sortKey] as unknown;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [accounts, q, sortKey, sortDir]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("desc");
    }
  }

  function renderCell(a: CSAccount, c: Col) {
    const v = a[c.key as keyof CSAccount];
    if (c.key === "name") {
      return (
        <button
          type="button"
          onClick={() => onRowClick(a)}
          className="font-display text-sm font-semibold leading-tight text-left hover:text-accent flex items-center"
        >
          {a.name}
          <NoticeBadge a={a} />
        </button>
      );
    }
    if (c.key === "csm_sentiment") return <SentimentDot s={a.csm_sentiment} />;
    if (c.key === "marquee_client") {
      return a.marquee_client ? (
        <span className="font-mono uppercase tracking-widest text-xs text-accent">Yes</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    }
    if (c.key === "carr" || c.key === "invoiced_arr") {
      return <span className="font-mono tabular-nums">{fmtMoney(v as number | null)}</span>;
    }
    if (c.key === "implementation_progress") {
      if (v === null || v === undefined) return <span className="text-muted-foreground">—</span>;
      return <span className="font-mono tabular-nums">{v as number}%</span>;
    }
    if (c.key === "final_cs_nps") {
      if (v === null || v === undefined) return <span className="text-muted-foreground">—</span>;
      return <span className="font-mono tabular-nums">{v as number}/10</span>;
    }
    if (c.numeric && (v === null || v === undefined)) return <span className="text-muted-foreground">—</span>;
    if (v === null || v === undefined || v === "") return <span className="text-muted-foreground">—</span>;
    return <span className={c.numeric ? "font-mono tabular-nums" : ""}>{String(v)}</span>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by name, UCC, owner, country, industry…"
            className="pl-9 h-9 font-mono text-xs"
          />
        </div>
        <span className="font-mono uppercase tracking-widest text-xs text-muted-foreground">
          {filtered.length} of {accounts.length} accounts
        </span>
      </div>

      <div className="border border-border bg-card overflow-x-auto">
        <table className="text-xs font-mono" style={{ minWidth: "100%" }}>
          <thead className="bg-muted/40">
            <tr className="text-left">
              {COLS.map((c, idx) => {
                const isSticky = idx < 2;
                return (
                  <th
                    key={c.key as string}
                    className={cn(
                      "px-3 py-2.5 border-b border-border whitespace-nowrap font-semibold text-xs uppercase tracking-[0.15em] text-muted-foreground",
                      isSticky && "md:sticky bg-muted/40 z-10",
                      idx === 0 && "md:left-0",
                      idx === 1 && "md:left-[200px] border-r border-border",
                    )}
                    style={{ minWidth: c.width }}
                  >
                    {c.sortKey ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.sortKey!)}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        {c.label}
                        <ArrowUpDown
                          className={cn(
                            "h-3 w-3 opacity-40",
                            sortKey === c.sortKey && "opacity-100 text-accent",
                          )}
                        />
                      </button>
                    ) : (
                      c.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr
                key={a.id}
                className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => onRowClick(a)}
              >
                {COLS.map((c, idx) => {
                  const isSticky = idx < 2;
                  return (
                    <td
                      key={c.key as string}
                      className={cn(
                        "px-3 py-2.5 whitespace-nowrap",
                        isSticky && "md:sticky bg-card z-10",
                        idx === 0 && "md:left-0",
                        idx === 1 && "md:left-[200px] border-r border-border",
                      )}
                      onClick={(e) => {
                        if (c.key === "name") e.stopPropagation();
                      }}
                    >
                      {renderCell(a, c)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
