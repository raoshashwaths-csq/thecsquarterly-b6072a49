import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { firstNameFromUser, type BrandSection } from "@/lib/brand-pdf";
import { listExportable, summarizeWorkspaceForExport, getLumiQuotaSnapshot } from "@/lib/exports.functions";
import { getNode, breadcrumbFor } from "@/lib/q-trees";

type RunRow = { id: string; node_id: string; created_at: string; witty: boolean; zones: { diagnosis: string; playbook: string; executable: string }; context: Record<string, string> };
type WorkspaceRow = { id: string; kind: string; tag: string; title: string; url: string | null; created_at: string };

export function ExportDialog({
  open,
  onOpenChange,
  preselectedRunIds,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  preselectedRunIds?: string[];
}) {
  const { user } = useAuth();
  const firstName = firstNameFromUser(user);
  const listFn = useServerFn(listExportable);
  const summaryFn = useServerFn(summarizeWorkspaceForExport);
  const quotaFn = useServerFn(getLumiQuotaSnapshot);

  const [runs, setRuns] = useState<RunRow[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceRow[]>([]);
  const [quota, setQuota] = useState<{ used: number; cap: number | null } | null>(null);
  const [selectedRuns, setSelectedRuns] = useState<Set<string>>(new Set(preselectedRunIds ?? []));
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    listFn({})
      .then((r) => {
        setRuns(r.runs as RunRow[]);
        setWorkspace(r.workspace as WorkspaceRow[]);
      })
      .catch((e) => toast.error((e as Error).message));
    quotaFn({})
      .then((q) => setQuota({ used: q.used, cap: q.cap }))
      .catch(() => undefined);
  }, [open, listFn, quotaFn]);

  function toggle(set: Set<string>, id: string, update: (s: Set<string>) => void) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    update(next);
  }

  async function exportRuns() {
    if (selectedRuns.size === 0) {
      toast.error("Pick at least one run to export");
      return;
    }
    setBusy(true);
    try {
      const { renderBrandedPdf } = await import("@/lib/brand-pdf");
      const picked = runs.filter((r) => selectedRuns.has(r.id));
      const sections: BrandSection[] = [];
      picked.forEach((r, idx) => {
        const node = getNode(r.node_id);
        const crumb = breadcrumbFor(r.node_id).join(" › ");
        if (idx > 0) sections.push({ kind: "divider" });
        sections.push({
          kind: "prose",
          eyebrow: crumb || "Lumi Run",
          title: node?.label ?? "Lumi decision",
          body: `Diagnosis\n${r.zones.diagnosis}\n\nPlaybook\n${r.zones.playbook}\n\nExecutable\n${r.zones.executable}`,
        });
      });
      renderBrandedPdf({
        firstName,
        title: picked.length === 1 ? (getNode(picked[0].node_id)?.label ?? "Lumi Run") : "Lumi Runs Selection",
        subtitle: `${picked.length} run${picked.length === 1 ? "" : "s"} from your workspace`,
        kicker: "Lumi Runs",
        sections,
        filenameSlug: "lumi-runs",
      });
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  async function exportArticles() {
    if (selectedItems.size === 0) {
      toast.error("Pick at least one saved item");
      return;
    }
    setBusy(true);
    try {
      const { renderBrandedPdf } = await import("@/lib/brand-pdf");
      const picked = workspace.filter((w) => selectedItems.has(w.id));
      const sections: BrandSection[] = picked.flatMap((w, i) => {
        const out: BrandSection[] = [];
        if (i > 0) out.push({ kind: "divider" });
        out.push({
          kind: "prose",
          eyebrow: `${w.kind}${w.tag ? ` · ${w.tag}` : ""}`.toUpperCase(),
          title: w.title || "Saved item",
          body: w.url || "(Saved reference — open from your workspace for the full source.)",
        });
        return out;
      });
      renderBrandedPdf({
        firstName,
        title: "Reading Selection",
        subtitle: `${picked.length} saved item${picked.length === 1 ? "" : "s"}`,
        kicker: "Articles",
        sections,
        filenameSlug: "articles",
      });
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  async function exportLumiSummary() {
    setBusy(true);
    try {
      const digest = await summaryFn({});
      const { renderBrandedPdf } = await import("@/lib/brand-pdf");
      const sections: BrandSection[] = [];
      if (digest.headline) sections.push({ kind: "quote", body: digest.headline, attribution: "Lumi" });
      if (digest.themes?.length) sections.push({ kind: "bullets", eyebrow: "Themes", items: digest.themes });
      if (digest.key_runs?.length) {
        sections.push({ kind: "divider" });
        for (const kr of digest.key_runs) {
          sections.push({ kind: "prose", title: kr.title, body: kr.insight });
        }
      }
      if (digest.action_items?.length) sections.push({ kind: "bullets", eyebrow: "Action items", items: digest.action_items });
      if (digest.watchlist?.length) sections.push({ kind: "bullets", eyebrow: "Watchlist", items: digest.watchlist });
      renderBrandedPdf({
        firstName,
        title: "Workspace Digest",
        subtitle: "Lumi-summarized from your recent runs and saved reading",
        kicker: "Lumi Summary",
        sections,
        filenameSlug: "lumi-summary",
      });
      onOpenChange(false);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === "Q_MONTHLY_CAP_REACHED") toast.error("You've used your Lumi quota for the month.");
      else toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Export to branded PDF</DialogTitle>
          <DialogDescription>
            Heavyweight midnight stock, gold + cream type, prepared for{" "}
            <span className="text-foreground font-medium">{firstName}</span>.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="runs">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="runs">Lumi runs</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="summary">Lumi summary</TabsTrigger>
          </TabsList>

          <TabsContent value="runs" className="space-y-3">
            <div className="max-h-[40vh] overflow-y-auto border border-border rounded">
              {runs.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No Lumi runs yet.</p>
              ) : runs.map((r) => {
                const node = getNode(r.node_id);
                const checked = selectedRuns.has(r.id);
                return (
                  <label key={r.id} className="flex items-start gap-3 p-3 border-b border-border hover:bg-muted/40 cursor-pointer">
                    <Checkbox checked={checked} onCheckedChange={() => toggle(selectedRuns, r.id, setSelectedRuns)} />
                    <div className="min-w-0">
                      <div className="font-display text-sm truncate">{node?.label ?? "Lumi decision"}</div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()} · {r.witty ? "Witty" : "Analytical"}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="flex justify-end">
              <Button onClick={exportRuns} disabled={busy}>Download PDF</Button>
            </div>
          </TabsContent>

          <TabsContent value="articles" className="space-y-3">
            <div className="max-h-[40vh] overflow-y-auto border border-border rounded">
              {workspace.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">Save articles from the Codex or Vanguard to export them here.</p>
              ) : workspace.map((w) => {
                const checked = selectedItems.has(w.id);
                return (
                  <label key={w.id} className="flex items-start gap-3 p-3 border-b border-border hover:bg-muted/40 cursor-pointer">
                    <Checkbox checked={checked} onCheckedChange={() => toggle(selectedItems, w.id, setSelectedItems)} />
                    <div className="min-w-0">
                      <div className="font-display text-sm truncate">{w.title || "Untitled"}</div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {w.kind} · {new Date(w.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="flex justify-end">
              <Button onClick={exportArticles} disabled={busy}>Download PDF</Button>
            </div>
          </TabsContent>

          <TabsContent value="summary" className="space-y-3">
            <div className="border border-border rounded p-5 space-y-3">
              <p className="text-sm text-foreground/85">
                Lumi will read your recent runs and saved articles, then write a one-pager digest — themes,
                key runs, action items, watchlist. Counts as <strong>1 Lumi call</strong> against your monthly quota.
              </p>
              {quota && (
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  Quota: {quota.used} / {quota.cap ?? "∞"} used this month
                </p>
              )}
              <Button onClick={exportLumiSummary} disabled={busy} className="w-full">
                {busy ? "Lumi is composing…" : "Generate Lumi summary PDF"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
