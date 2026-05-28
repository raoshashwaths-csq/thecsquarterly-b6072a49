import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  listStakeholders, upsertStakeholder, deleteStakeholder,
  type CSStakeholder, type BuyingRole, type Influence, type Sentiment,
} from "@/lib/csfactors.functions";
import { toast } from "sonner";

const ROLE_LABEL: Record<BuyingRole, string> = {
  economic_buyer: "Economic Buyer",
  champion: "Champion",
  end_user: "End User",
  decision_maker: "Decision Maker",
  blocker: "Blocker",
};

export function StakeholderMap({ accountId }: { accountId: string }) {
  const qc = useQueryClient();
  const list = useServerFn(listStakeholders);
  const upsert = useServerFn(upsertStakeholder);
  const del = useServerFn(deleteStakeholder);

  const { data: rows = [] } = useQuery({
    queryKey: ["cs-stakeholders", accountId],
    queryFn: () => list({ data: { account_id: accountId } }),
  });

  const [draft, setDraft] = useState({
    contact_name: "",
    title: "",
    buying_role: "champion" as BuyingRole,
    influence: "medium" as Influence,
    sentiment: "neutral" as Sentiment,
  });

  async function add() {
    if (!draft.contact_name.trim()) return;
    try {
      await upsert({
        data: {
          patch: {
            account_id: accountId,
            contact_name: draft.contact_name.trim(),
            title: draft.title.trim() || null,
            buying_role: draft.buying_role,
            influence: draft.influence,
            sentiment: draft.sentiment,
          },
        },
      });
      setDraft({ ...draft, contact_name: "", title: "" });
      qc.invalidateQueries({ queryKey: ["cs-stakeholders", accountId] });
      toast.success("Stakeholder added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add");
    }
  }

  async function patch(id: string, patch: Partial<CSStakeholder>) {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    await upsert({
      data: {
        id,
        patch: {
          account_id: accountId,
          contact_name: patch.contact_name ?? row.contact_name,
          title: patch.title !== undefined ? patch.title : row.title,
          buying_role: (patch.buying_role ?? row.buying_role) as BuyingRole,
          influence: (patch.influence ?? row.influence) as Influence,
          sentiment: (patch.sentiment ?? row.sentiment) as Sentiment,
        },
      },
    });
    qc.invalidateQueries({ queryKey: ["cs-stakeholders", accountId] });
  }

  async function remove(id: string) {
    await del({ data: { id } });
    qc.invalidateQueries({ queryKey: ["cs-stakeholders", accountId] });
  }

  // Quadrants: x = influence (Low|Med|High), y = sentiment (positive top, negative bottom)
  const quad = {
    champions: rows.filter((r) => r.influence === "high" && r.sentiment === "positive"),
    blockers: rows.filter((r) => r.influence === "high" && r.sentiment === "negative"),
    supporters: rows.filter((r) => r.influence !== "high" && r.sentiment === "positive"),
    drag: rows.filter((r) => r.influence !== "high" && r.sentiment === "negative"),
  };

  return (
    <div className="space-y-5">
      {/* Add row */}
      <div className="grid grid-cols-12 gap-2 items-end p-3 bg-muted/30 border border-border">
        <div className="col-span-12 md:col-span-3">
          <label className="font-mono uppercase tracking-widest text-xs text-muted-foreground">Contact</label>
          <Input
            value={draft.contact_name}
            onChange={(e) => setDraft({ ...draft, contact_name: e.target.value })}
            placeholder="Jane Doe"
            className="h-8 text-xs"
          />
        </div>
        <div className="col-span-12 md:col-span-3">
          <label className="font-mono uppercase tracking-widest text-xs text-muted-foreground">Title</label>
          <Input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="VP Operations"
            className="h-8 text-xs"
          />
        </div>
        <div className="col-span-6 md:col-span-2">
          <label className="font-mono uppercase tracking-widest text-xs text-muted-foreground">Role</label>
          <Select value={draft.buying_role} onValueChange={(v) => setDraft({ ...draft, buying_role: v as BuyingRole })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(ROLE_LABEL) as BuyingRole[]).map((k) => (
                <SelectItem key={k} value={k}>{ROLE_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-3 md:col-span-2">
          <label className="font-mono uppercase tracking-widest text-xs text-muted-foreground">Influence</label>
          <Select value={draft.influence} onValueChange={(v) => setDraft({ ...draft, influence: v as Influence })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-3 md:col-span-2">
          <label className="font-mono uppercase tracking-widest text-xs text-muted-foreground">Sentiment</label>
          <Select value={draft.sentiment} onValueChange={(v) => setDraft({ ...draft, sentiment: v as Sentiment })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-12">
          <Button type="button" size="sm" onClick={add} className="gap-2">
            <Plus className="h-3.5 w-3.5" /> Add stakeholder
          </Button>
        </div>
      </div>

      {/* List */}
      {rows.length > 0 && (
        <div className="border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-left font-mono uppercase tracking-widest text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Influence</th>
                <th className="px-3 py-2">Sentiment</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2 font-semibold">{r.contact_name}</td>
                  <td className="px-3 py-2 text-foreground/70">{r.title ?? "—"}</td>
                  <td className="px-3 py-2">
                    <Select value={r.buying_role} onValueChange={(v) => patch(r.id, { buying_role: v as BuyingRole })}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(ROLE_LABEL) as BuyingRole[]).map((k) => (
                          <SelectItem key={k} value={k}>{ROLE_LABEL[k]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Select value={r.influence} onValueChange={(v) => patch(r.id, { influence: v as Influence })}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Select value={r.sentiment} onValueChange={(v) => patch(r.id, { sentiment: v as Sentiment })}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="positive">Positive</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="negative">Negative</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button variant="ghost" size="icon" onClick={() => remove(r.id)} className="h-7 w-7 text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 2x2 power matrix */}
      <div>
        <div className="font-mono uppercase tracking-[0.25em] text-xs text-secondary-accent font-semibold mb-2">
          Power Matrix
        </div>
        <div className="grid grid-cols-2 gap-px bg-border border border-border">
          <Quadrant title="Champions to protect" tone="success" rows={quad.champions} />
          <Quadrant title="Critical blockers" tone="danger" rows={quad.blockers} />
          <Quadrant title="Supportive — nurture" tone="neutral" rows={quad.supporters} />
          <Quadrant title="Background drag" tone="muted" rows={quad.drag} />
        </div>
        <div className="flex justify-between font-mono uppercase tracking-widest text-xs text-muted-foreground mt-1">
          <span>← Lower influence</span>
          <span>Higher influence →</span>
        </div>
      </div>
    </div>
  );
}

function Quadrant({
  title,
  tone,
  rows,
}: {
  title: string;
  tone: "success" | "danger" | "neutral" | "muted";
  rows: CSStakeholder[];
}) {
  const border =
    tone === "success"
      ? "border-l-emerald-600"
      : tone === "danger"
        ? "border-l-destructive"
        : tone === "neutral"
          ? "border-l-secondary-accent"
          : "border-l-border";
  return (
    <div className={cn("bg-card p-4 min-h-32 border-l-[3px]", border)}>
      <div className="font-mono uppercase tracking-widest text-xs text-muted-foreground mb-2">
        {title} · {rows.length}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {rows.length === 0 ? (
          <span className="text-xs text-muted-foreground italic">—</span>
        ) : (
          rows.map((r) => (
            <span
              key={r.id}
              className="inline-flex px-2 py-0.5 bg-muted border border-border text-xs font-mono"
              title={`${ROLE_LABEL[r.buying_role]} · ${r.influence}`}
            >
              {r.contact_name}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
