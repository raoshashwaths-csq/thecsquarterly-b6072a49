import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, Trash2, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  listContracts, upsertContract, deleteContract,
  createContractUploadUrl, createContractDownloadUrl,
  noticeWindow,
  type CSContract,
} from "@/lib/csfactors.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ContractVault({
  accountId,
  renewalDate,
}: {
  accountId: string;
  renewalDate: string | null;
}) {
  const qc = useQueryClient();
  const list = useServerFn(listContracts);
  const upsert = useServerFn(upsertContract);
  const del = useServerFn(deleteContract);
  const signUpload = useServerFn(createContractUploadUrl);
  const signDownload = useServerFn(createContractDownloadUrl);

  const { data: rows = [] } = useQuery({
    queryKey: ["cs-contracts", accountId],
    queryFn: () => list({ data: { account_id: accountId } }),
  });

  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large (max 20MB)");
      return;
    }
    setUploading(true);
    try {
      const { path, token } = await signUpload({
        data: { account_id: accountId, filename: file.name },
      });
      const { error: upErr } = await supabase.storage
        .from("cs-contracts")
        .uploadToSignedUrl(path, token, file);
      if (upErr) throw upErr;
      await upsert({
        data: {
          patch: {
            account_id: accountId,
            doc_type: "MSA",
            file_path: path,
            file_name: file.name,
            mime_type: file.type || null,
            size_bytes: file.size,
            auto_renewal: false,
            notice_days: 90,
          },
        },
      });
      qc.invalidateQueries({ queryKey: ["cs-contracts", accountId] });
      toast.success("Contract uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function patch(row: CSContract, p: Partial<CSContract>) {
    await upsert({
      data: {
        id: row.id,
        patch: {
          account_id: accountId,
          doc_type: (p.doc_type ?? row.doc_type) as "MSA" | "SOW" | "Amendment" | "Other",
          file_path: row.file_path,
          file_name: row.file_name,
          mime_type: row.mime_type,
          size_bytes: row.size_bytes,
          signed_value_cents: p.signed_value_cents !== undefined ? p.signed_value_cents : row.signed_value_cents,
          executed_on: p.executed_on !== undefined ? p.executed_on : row.executed_on,
          auto_renewal: p.auto_renewal !== undefined ? p.auto_renewal : row.auto_renewal,
          notice_days: p.notice_days ?? row.notice_days,
        },
      },
    });
    qc.invalidateQueries({ queryKey: ["cs-contracts", accountId] });
  }

  async function download(row: CSContract) {
    if (!row.file_path) return;
    const { url } = await signDownload({ data: { path: row.file_path } });
    window.open(url, "_blank");
  }

  async function remove(id: string) {
    if (!confirm("Delete this contract record and file?")) return;
    await del({ data: { id } });
    qc.invalidateQueries({ queryKey: ["cs-contracts", accountId] });
  }

  const window90 = noticeWindow(renewalDate, 90) as { band: 30 | 60 | 90 | null; days?: number };

  return (
    <div className="space-y-4">
      {window90.band && (
        <div className="border-l-[3px] border-l-accent bg-accent/5 px-4 py-3">
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-accent font-semibold mb-1">
            Critical Notification Window — {window90.band}d
          </div>
          <p className="text-xs text-foreground/80">
            Renewal in {window90.days} days. Confirm intent before the {window90.band}-day opt-out deadline.
          </p>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) uploadFile(f);
        }}
        className={cn(
          "border border-dashed p-6 text-center transition-colors cursor-pointer",
          dragOver ? "border-accent bg-accent/5" : "border-border bg-muted/20 hover:bg-muted/40",
        )}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
        <p className="text-xs text-foreground/70">
          {uploading ? "Uploading…" : "Drop MSA / SOW / Amendment here, or click to choose a file"}
        </p>
        <p className="font-mono uppercase tracking-widest text-xs text-muted-foreground mt-1">
          PDF · DOCX · PNG · max 20MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.doc,image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {/* List */}
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No contracts on file.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="border border-border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => download(r)}
                  disabled={!r.file_path}
                  className="inline-flex items-center gap-2 text-sm font-semibold hover:text-accent disabled:opacity-50"
                >
                  <FileText className="h-4 w-4" />
                  {r.file_name ?? "(no file)"}
                  {r.file_path && <Download className="h-3 w-3 opacity-60" />}
                </button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(r.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Type</label>
                  <Select value={r.doc_type} onValueChange={(v) => patch(r, { doc_type: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MSA">MSA</SelectItem>
                      <SelectItem value="SOW">SOW</SelectItem>
                      <SelectItem value="Amendment">Amendment</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Signed value ($)</label>
                  <Input
                    type="number"
                    defaultValue={r.signed_value_cents !== null ? r.signed_value_cents / 100 : ""}
                    onBlur={(e) => {
                      const v = e.target.value === "" ? null : Math.round(Number(e.target.value) * 100);
                      patch(r, { signed_value_cents: v });
                    }}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Executed on</label>
                  <Input
                    type="date"
                    defaultValue={r.executed_on ?? ""}
                    onBlur={(e) => patch(r, { executed_on: e.target.value || null })}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <Switch
                    checked={r.auto_renewal}
                    onCheckedChange={(v) => patch(r, { auto_renewal: v })}
                  />
                  <span className="font-mono uppercase tracking-widest text-xs text-muted-foreground">
                    Auto-renewal
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
