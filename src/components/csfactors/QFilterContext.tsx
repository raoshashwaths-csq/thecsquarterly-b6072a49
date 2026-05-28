import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { CSAccount, Tier } from "@/lib/csfactors.functions";

export type QFilter =
  | { kind: "segment"; value: Tier; label: string }
  | { kind: "health"; value: "low" | "high"; label: string }
  | { kind: "risk"; value: "high"; label: string }
  | { kind: "qbr"; value: "overdue"; label: string };

type Ctx = {
  filter: QFilter | null;
  setFilter: (f: QFilter | null) => void;
  applyPrompt: (prompt: string) => QFilter | null;
};

const QFilterCtx = createContext<Ctx | null>(null);

export function QFilterProvider({ children }: { children: ReactNode }) {
  const [filter, setFilter] = useState<QFilter | null>(null);

  const applyPrompt = useCallback((promptRaw: string): QFilter | null => {
    const p = promptRaw.toLowerCase();
    let next: QFilter | null = null;
    if (/enterprise/.test(p)) next = { kind: "segment", value: "Enterprise", label: "Enterprise segment" };
    else if (/mid[-\s]?market/.test(p)) next = { kind: "segment", value: "Mid-Market", label: "Mid-Market segment" };
    else if (/\bsmb\b|small business/.test(p)) next = { kind: "segment", value: "SMB", label: "SMB segment" };
    else if (/low[-\s]?health|unhealthy|red account/.test(p)) next = { kind: "health", value: "low", label: "Low-health accounts" };
    else if (/high[-\s]?health|healthy/.test(p)) next = { kind: "health", value: "high", label: "High-health accounts" };
    else if (/high[-\s]?risk|at[-\s]?risk|churn risk/.test(p)) next = { kind: "risk", value: "high", label: "High-risk cohort" };
    else if (/qbr.*overdue|overdue.*qbr/.test(p)) next = { kind: "qbr", value: "overdue", label: "QBRs overdue" };
    if (next) setFilter(next);
    return next;
  }, []);

  const value = useMemo(() => ({ filter, setFilter, applyPrompt }), [filter, applyPrompt]);
  return <QFilterCtx.Provider value={value}>{children}</QFilterCtx.Provider>;
}

export function useQFilter() {
  const ctx = useContext(QFilterCtx);
  if (!ctx) throw new Error("useQFilter must be used inside QFilterProvider");
  return ctx;
}

export function applyQFilter(accounts: CSAccount[], filter: QFilter | null): CSAccount[] {
  if (!filter) return accounts;
  switch (filter.kind) {
    case "segment":
      return accounts.filter((a) => a.tier === filter.value);
    case "health":
      return accounts.filter((a) => (filter.value === "low" ? a.health < 50 : a.health >= 70));
    case "risk":
      return accounts.filter((a) => a.health < 50 || a.csm_sentiment === "Critical");
    case "qbr":
      return accounts.filter((a) => a.qbr_status === "Overdue");
  }
}
