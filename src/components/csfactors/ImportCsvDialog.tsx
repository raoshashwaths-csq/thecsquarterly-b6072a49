import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, FileDown } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { bulkImportAccounts } from "@/lib/csfactors.functions";
import { toast } from "sonner";

const REQUIRED = new Set(["name","tier","arr","health","qbr_status","renewal_quarter"]);

const HEADERS = [
  "name","tier","arr","health","qbr_status","renewal_quarter","champion","economic_buyer","blocker","notes",
  "ucc","account_manager","csm_name","associate_director","backup_owner","customer_success","key_account_manager",
  "contract_renewal_date","carr","invoiced_arr","journey_stage","cs_transition_start","customer_city",
  "csm_sentiment","active_headcount","country","sub_region","actual_go_live","planned_go_live",
  "implementation_progress","da_project_manager","project_manager_ii","server_location","server_name",
  "marquee_client","existing_erp","existing_crm","region","payroll_service_type","final_cs_nps","industry",
];

// Header row in the CSV template marks required columns with a trailing asterisk
// (e.g. `name*`). The parser strips the asterisk before validation.
const TEMPLATE_HEADERS = HEADERS.map((h) => (REQUIRED.has(h) ? `${h}*` : h));

const SAMPLE = [
  TEMPLATE_HEADERS.join(","),
  `Acme Corp,Enterprise,120000,84,Completed,Q3-2026,Jane Doe,John Smith,,Strong adoption,UCC-001,Maria K,David L,Priya S,Sam B,CS Team,Tom R,2026-09-15,140000,120000,Adopted,2024-01-10,Boston,Positive,420,USA,Northeast,2024-03-01,2024-02-15,100,Lina P,Hari V,AWS us-east-1,prod-na-01,true,SAP,Salesforce,NA,Standard,9,Manufacturing`,
  `Stark Industries,Enterprise,450000,42,Overdue,Q2-2026,,,Champion left,At risk,UCC-002,Maria K,Jamie T,David L,,CS Team,,2026-06-30,500000,450000,Onboarding,2025-11-01,Malibu,Critical,1800,USA,West,,2026-04-01,55,Lina P,,Azure westus2,prod-na-02,true,Oracle,HubSpot,NA,Premium,4,Aerospace`,
].join("\n") + "\n";

function splitCsvLine(line: string) {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else { inQ = !inQ; }
    } else if (c === "," && !inQ) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

function s(v: string) { return v.trim() || null; }
function n(v: string) { return v.trim() === "" ? null : Number(v); }
function d(v: string) {
  const x = v.trim();
  if (!x) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(x)) return null;
  return x;
}
function b(v: string) {
  const x = v.trim().toLowerCase();
  if (!x) return null;
  return x === "true" || x === "yes" || x === "1";
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error("CSV is empty or only has a header.");
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().replace(/\*+$/, ""));
  for (const r of ["name", "tier", "arr", "health", "qbr_status", "renewal_quarter"]) {
    if (!headers.includes(r)) throw new Error(`Missing required column: ${r}`);
  }
  const rows = lines.slice(1).map((line, idx) => {
    const cols = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = (cols[i] ?? "").trim()));
    const arr = Number(row.arr);
    const health = Number(row.health);
    if (Number.isNaN(arr) || arr < 0) throw new Error(`Row ${idx + 2}: invalid ARR`);
    if (Number.isNaN(health) || health < 0 || health > 100)
      throw new Error(`Row ${idx + 2}: invalid health (0-100)`);
    if (!["Enterprise", "Mid-Market", "SMB"].includes(row.tier))
      throw new Error(`Row ${idx + 2}: tier must be Enterprise, Mid-Market or SMB`);
    if (!["Completed", "Scheduled", "Overdue"].includes(row.qbr_status))
      throw new Error(`Row ${idx + 2}: qbr_status must be Completed, Scheduled or Overdue`);
    return {
      name: row.name,
      tier: row.tier as "Enterprise" | "Mid-Market" | "SMB",
      arr,
      health: Math.round(health),
      qbr_status: row.qbr_status as "Completed" | "Scheduled" | "Overdue",
      renewal_quarter: row.renewal_quarter,
      champion: s(row.champion ?? ""),
      economic_buyer: s(row.economic_buyer ?? ""),
      blocker: s(row.blocker ?? ""),
      notes: s(row.notes ?? ""),
      ucc: s(row.ucc ?? ""),
      account_manager: s(row.account_manager ?? ""),
      csm_name: s(row.csm_name ?? ""),
      associate_director: s(row.associate_director ?? ""),
      backup_owner: s(row.backup_owner ?? ""),
      customer_success: s(row.customer_success ?? ""),
      key_account_manager: s(row.key_account_manager ?? ""),
      contract_renewal_date: d(row.contract_renewal_date ?? ""),
      carr: n(row.carr ?? ""),
      invoiced_arr: n(row.invoiced_arr ?? ""),
      journey_stage: s(row.journey_stage ?? ""),
      cs_transition_start: d(row.cs_transition_start ?? ""),
      customer_city: s(row.customer_city ?? ""),
      csm_sentiment: (["Positive", "Neutral", "Critical"].includes(row.csm_sentiment)
        ? row.csm_sentiment
        : null) as "Positive" | "Neutral" | "Critical" | null,
      active_headcount: n(row.active_headcount ?? "") as number | null,
      country: s(row.country ?? ""),
      sub_region: s(row.sub_region ?? ""),
      actual_go_live: d(row.actual_go_live ?? ""),
      planned_go_live: d(row.planned_go_live ?? ""),
      implementation_progress: n(row.implementation_progress ?? "") as number | null,
      da_project_manager: s(row.da_project_manager ?? ""),
      project_manager_ii: s(row.project_manager_ii ?? ""),
      server_location: s(row.server_location ?? ""),
      server_name: s(row.server_name ?? ""),
      marquee_client: b(row.marquee_client ?? ""),
      existing_erp: s(row.existing_erp ?? ""),
      existing_crm: s(row.existing_crm ?? ""),
      region: s(row.region ?? ""),
      payroll_service_type: s(row.payroll_service_type ?? ""),
      final_cs_nps: n(row.final_cs_nps ?? "") as number | null,
      industry: s(row.industry ?? ""),
    };
  });
  if (rows.length > 500) throw new Error("Maximum 500 rows per import.");
  return rows;
}

export function ImportCsvDialog() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const bulk = useServerFn(bulkImportAccounts);
  const qc = useQueryClient();

  function downloadTemplate() {
    const blob = new Blob([SAMPLE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "csfactors-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2_000_000) { toast.error("File too large (max 2MB)"); return; }
    setBusy(true);
    try {
      const text = await f.text();
      const rows = parseCsv(text);
      const res = await bulk({ data: { rows } });
      toast.success(`Imported ${res.inserted} account${res.inserted === 1 ? "" : "s"}`);
      await qc.invalidateQueries({ queryKey: ["cs-accounts"] });
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" /> Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display tracking-tight">Import accounts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-foreground/70">
            Combined template covers all {HEADERS.length} account fields. Max 500 rows. Required columns are marked with an <span className="text-accent font-semibold">*</span> in the header row: <code>name*, tier*, arr*, health*, qbr_status*, renewal_quarter*</code>. Everything else is optional.
          </p>
          <details className="text-xs">
            <summary className="cursor-pointer font-mono uppercase tracking-widest text-xs text-muted-foreground">
              View full column list ({HEADERS.length})
            </summary>
            <div className="block mt-2 text-[11px] font-mono bg-muted p-3 border border-border overflow-x-auto leading-relaxed">
              {HEADERS.map((h, i) => (
                <span key={h}>
                  {i > 0 && ", "}
                  <span className={REQUIRED.has(h) ? "text-accent font-semibold" : ""}>
                    {h}{REQUIRED.has(h) && <span aria-hidden>*</span>}
                  </span>
                </span>
              ))}
            </div>
          </details>
          <Button type="button" variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
            <FileDown className="h-4 w-4" /> Download template
          </Button>
          <label className="block">
            <span className="font-mono uppercase tracking-widest text-xs text-muted-foreground">CSV file</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={onFile}
              disabled={busy}
              className="mt-2 block w-full text-sm file:mr-3 file:border file:border-border file:bg-card file:px-3 file:py-1.5 file:text-xs file:font-mono file:uppercase file:tracking-widest hover:file:bg-muted"
            />
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
