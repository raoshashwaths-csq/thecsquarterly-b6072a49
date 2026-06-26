import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import {
  listMyLumiMemory,
  updateLumiMemory,
  deleteLumiMemory,
  deleteAllLumiMemory,
  type LumiMemoryRow,
} from "@/lib/lumi-memory.functions";
import { SectionCard } from "@/components/dashboard/SectionCard";

const TYPE_LABEL: Record<string, string> = {
  situation: "Situation",
  preference: "Preference",
  account: "Account",
  framework: "Framework",
  reading: "Reading",
};

export function MemorySettings() {
  const fetchList = useServerFn(listMyLumiMemory);
  const doUpdate = useServerFn(updateLumiMemory);
  const doDelete = useServerFn(deleteLumiMemory);
  const doDeleteAll = useServerFn(deleteAllLumiMemory);
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [confirmAll, setConfirmAll] = useState(false);

  const q = useQuery({
    queryKey: ["lumi-memory"],
    queryFn: () => fetchList(),
    staleTime: 30_000,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["lumi-memory"] });

  if (q.isLoading) {
    return (
      <SectionCard eyebrow="Lumi · Memory" title="Lumi Memory" description="Loading…">
        <div className="h-12" />
      </SectionCard>
    );
  }

  const data = q.data;
  if (!data) return null;

  if (!data.hasAccess) {
    return (
      <SectionCard
        eyebrow="Lumi · Memory"
        title="Lumi Memory"
        description="Long-term context that makes every Lumi answer sharper."
        actions={
          <Link
            to="/pricing"
            className="px-5 py-2.5 bg-foreground text-background font-mono text-xs uppercase tracking-widest"
          >
            Upgrade
          </Link>
        }
      >
        <div className="text-xs text-muted-foreground">
          Lumi Memory is a Practitioner+ feature. Upgrade to give Lumi long-term context across every conversation.
        </div>
      </SectionCard>
    );
  }

  const grouped = data.items.reduce<Record<string, LumiMemoryRow[]>>((acc, row) => {
    (acc[row.memory_type] ||= []).push(row);
    return acc;
  }, {});

  return (
    <SectionCard
      eyebrow="Lumi · Memory"
      title="Lumi Memory"
      description={`Lumi remembers ${data.items.length} thing${data.items.length === 1 ? "" : "s"} about your operating context. Edit, pin, or wipe at any time.`}
      actions={
        data.items.length > 0 ? (
          <button
            type="button"
            onClick={() => setConfirmAll(true)}
            className="px-5 py-2.5 border border-destructive/40 text-destructive font-mono text-xs uppercase tracking-widest hover:bg-destructive/10 transition-colors"
          >
            Delete all
          </button>
        ) : null
      }
    >
      {data.items.length === 0 ? (
        <div className="text-xs text-muted-foreground">
          Lumi hasn't recorded anything yet. Ask Lumi a question and durable facts will appear here.
        </div>
      ) : (
        <div className="space-y-6">
          {(["situation", "account", "preference", "framework", "reading"] as const).map((type) => {
            const rows = grouped[type];
            if (!rows?.length) return null;
            return (
              <div key={type}>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary-accent mb-3">
                  {TYPE_LABEL[type]} · {rows.length}
                </div>
                <div className="space-y-2">
                  {rows.map((row) => (
                    <div key={row.id} className="border border-border p-4">
                      {editingId === row.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value.slice(0, 2000))}
                            rows={3}
                            className="w-full p-3 bg-transparent border border-border focus:border-foreground outline-none text-sm font-serif resize-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 border border-border font-mono text-[10px] uppercase tracking-widest"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await doUpdate({ data: { id: row.id, content: draft } });
                                  toast.success("Memory updated.");
                                  setEditingId(null);
                                  refresh();
                                } catch (e) {
                                  toast.error(e instanceof Error ? e.message : "Update failed.");
                                }
                              }}
                              className="px-3 py-1.5 bg-foreground text-background font-mono text-[10px] uppercase tracking-widest"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="text-sm font-serif leading-relaxed">{row.content}</div>
                            <div className="mt-2 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                              <span>{new Date(row.created_at).toISOString().slice(0, 10)}</span>
                              {row.source && <span>· {row.source}</span>}
                              {row.pinned && <span className="text-accent">· pinned</span>}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await doUpdate({ data: { id: row.id, pinned: !row.pinned } });
                                  refresh();
                                } catch (e) {
                                  toast.error(e instanceof Error ? e.message : "Update failed.");
                                }
                              }}
                              className="px-2 py-1 border border-border font-mono text-[10px] uppercase tracking-widest hover:border-foreground transition-colors"
                            >
                              {row.pinned ? "Unpin" : "Pin"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(row.id);
                                setDraft(row.content);
                              }}
                              className="px-2 py-1 border border-border font-mono text-[10px] uppercase tracking-widest hover:border-foreground transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await doDelete({ data: { id: row.id } });
                                  toast.success("Memory deleted.");
                                  refresh();
                                } catch (e) {
                                  toast.error(e instanceof Error ? e.message : "Delete failed.");
                                }
                              }}
                              className="px-2 py-1 border border-destructive/40 text-destructive font-mono text-[10px] uppercase tracking-widest hover:bg-destructive/10 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirmAll && (
        <div className="mt-6 border border-destructive/40 bg-destructive/5 p-4">
          <div className="font-mono text-xs uppercase tracking-widest text-destructive mb-2">
            Delete all Lumi memory?
          </div>
          <div className="text-xs text-muted-foreground mb-3">
            Lumi will lose every context note about your situation, accounts, and preferences. This cannot be undone.
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmAll(false)}
              className="px-3 py-1.5 border border-border font-mono text-[10px] uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await doDeleteAll();
                  toast.success("All memory deleted.");
                  setConfirmAll(false);
                  refresh();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Delete failed.");
                }
              }}
              className="px-3 py-1.5 bg-destructive text-background font-mono text-[10px] uppercase tracking-widest"
            >
              Yes, delete everything
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
