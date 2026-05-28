import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, FileDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { bulkImportAccounts } from "@/lib/csfactors.functions";
import { toast } from "sonner";

const TEMPLATE = `name,tier,arr,health,qbr_status,renewal_quarter,champion,economic_buyer,blocker,notes
Acme Corp,Enterprise,120000,84,Completed,Q3-2026,Jane Doe,John Smith,,Strong adoption
Stark Industries,Enterprise,450000,42,Overdue,Q2-2026,,,Champion left,At risk
`;

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error("CSV is empty or only has a header.");
  const headers = lines[0].split(",").map((h) => h.trim());
  const required = ["name", "tier", "arr", "health", "qbr_status", "renewal_quarter"];
  for (const r of required) {
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
      champion: row.champion || null,
      economic_buyer: row.economic_buyer || null,
      blocker: row.blocker || null,
      notes: row.notes || null,
    };
  });
  if (rows.length > 500) throw new Error("Maximum 500 rows per import.");
  return rows;
}

function splitCsvLine(line: string) {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else { inQ = !inQ; }
    } else if (c === "," && !inQ) {
      out.push(cur); cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

export function ImportCsvDialog() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const bulk = useServerFn(bulkImportAccounts);
  const qc = useQueryClient();

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE], { type: "text/csv" });
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
    if (f.size > 1_000_000) {
      toast.error("File too large (max 1MB)");
      return;
    }
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
            Upload a CSV with the columns below. Max 500 rows.
          </p>
          <code className="block text-xs font-mono bg-muted p-3 border border-border overflow-x-auto">
            name, tier, arr, health, qbr_status, renewal_quarter, champion?, economic_buyer?, blocker?, notes?
          </code>
          <Button type="button" variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
            <FileDown className="h-4 w-4" /> Download template
          </Button>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              CSV file
            </span>
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
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
