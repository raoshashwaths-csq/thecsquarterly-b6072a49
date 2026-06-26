import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle2, Tag } from "lucide-react";
import {
  listMyAccountsForTagging,
  tagQRunToAccount,
} from "@/lib/q-agent.functions";
import type { TreeId } from "@/lib/q-trees";

// Tree-aware stakeholder suggestions. The dropdown surfaces the roles most
// commonly anchored by each tree so the tag captures *who* the run is for.
const STAKEHOLDER_BY_TREE: Record<TreeId, string[]> = {
  T1: ["Champion", "Executive Sponsor", "Buyer"],
  T2: ["New Champion", "Outgoing Champion", "Skip-Level Manager"],
  T3: ["Economic Buyer", "Champion", "Procurement"],
  T4: ["Champion", "Economic Buyer", "Power User"],
  T5: ["Executive Sponsor", "Champion", "Power User"],
  T6: ["Implementation Lead", "Champion", "Technical Owner"],
  T7: ["Executive Sponsor", "Our VP / CCO", "Customer C-suite"],
  T8: ["Manager", "Cross-functional Peer", "Skip-Level"],
  T9: ["Power User", "Admin", "Champion"],
  T10: ["Champion", "Sales AE", "Product Manager"],
  T11: ["Procurement", "Economic Buyer", "Champion"],
  T12: ["Buyer A", "Buyer B", "Executive Sponsor"],
  T13: ["Champion", "Detractor", "Executive Sponsor"],
  T14: ["Implementation Lead", "Executive Sponsor", "Technical Owner"],
  T15: ["CFO", "COO", "Champion"],
  T16: ["Product Manager", "Champion", "Economic Buyer"],
  T17: ["Former Champion", "New Decision Maker", "Economic Buyer"],
  T18: ["CSM", "Manager", "Peer CSM"],
  T19: ["Board", "CEO", "CFO"],
  T20: ["VP CS", "CFO", "CRO"],
  T21: ["CRO / Sales VP", "AE", "Sales Ops"],
};

function suggestionsForTree(treeId: string): string[] {
  return STAKEHOLDER_BY_TREE[treeId as TreeId] ?? ["Champion", "Executive Sponsor", "Power User"];
}

export function RunAccountTagger({
  runId,
  treeId,
  initialAccountId,
  initialStakeholder,
  isOwner,
}: {
  runId: string;
  treeId: string;
  initialAccountId: string | null;
  initialStakeholder: string | null;
  isOwner: boolean;
}) {
  const listFn = useServerFn(listMyAccountsForTagging);
  const tagFn = useServerFn(tagQRunToAccount);

  const [accounts, setAccounts] = useState<Array<{ id: string; name: string; health: number | null; arr: number | null }>>([]);
  const [accountId, setAccountId] = useState<string>(initialAccountId ?? "");
  const [stakeholder, setStakeholder] = useState<string>(initialStakeholder ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<boolean>(Boolean(initialAccountId));
  const [loading, setLoading] = useState(true);
  const [lastSentiment, setLastSentiment] = useState<{
    label: "Positive" | "Neutral" | "Critical";
    source: "lexicon" | "ai";
    confidence: "low" | "med" | "high";
  } | null>(null);

  const stakeholderOptions = useMemo(() => suggestionsForTree(treeId), [treeId]);

  useEffect(() => {
    if (!isOwner) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    listFn({})
      .then((r) => {
        if (!cancelled) setAccounts(r.accounts);
      })
      .catch(() => {
        // Silent — the tagger just hides if accounts can't be loaded.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOwner, listFn]);

  if (!isOwner) return null;

  async function onSave() {
    if (!accountId) {
      toast.error("Pick an account first");
      return;
    }
    setSaving(true);
    try {
      const r = await tagFn({
        data: {
          runId,
          accountId,
          stakeholder: stakeholder || null,
        },
      });
      setSaved(true);
      toast.success(`Tagged to ${r.accountName ?? "account"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not tag run");
    } finally {
      setSaving(false);
    }
  }

  async function onClear() {
    setSaving(true);
    try {
      await tagFn({ data: { runId, accountId: null, stakeholder: null } });
      setAccountId("");
      setStakeholder("");
      setSaved(false);
      toast.success("Tag removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not clear tag");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="border border-border bg-card p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-secondary-accent">
          Tag this run
        </div>
        <p className="text-sm text-foreground/60 mt-2">Loading your accounts…</p>
      </section>
    );
  }

  if (accounts.length === 0) {
    return (
      <section className="border border-border bg-card p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-secondary-accent mb-2">
          Tag this run
        </div>
        <p className="text-sm text-foreground/70 mb-3">
          You don't have any accounts on CSFactors yet. Add one to pin this Lumi run to it.
        </p>
        <Link
          to="/csfactors"
          className="font-mono text-[11px] uppercase tracking-[0.22em] border border-border px-4 py-2 inline-block hover:border-foreground"
        >
          Open CSFactors →
        </Link>
      </section>
    );
  }

  return (
    <section className="border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Tag className="h-3.5 w-3.5 text-secondary-accent" />
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-secondary-accent">
          Tag this run to an account
        </div>
        {saved && (
          <span className="ml-auto inline-flex items-center gap-1 text-emerald-500 text-xs font-mono uppercase tracking-[0.2em]">
            <CheckCircle2 className="h-3 w-3" /> Tagged
          </span>
        )}
      </div>
      <p className="text-sm text-foreground/70 mb-4">
        Pin this run to an account on your CSFactors dashboard. It will show up on the account timeline so the next time you open the card, your reasoning travels with it.
      </p>
      <div className="grid md:grid-cols-2 gap-3">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/60">Account</span>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            disabled={saving}
            className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm"
          >
            <option value="">Select an account…</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
                {typeof a.arr === "number" ? ` — $${a.arr.toLocaleString()} ARR` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/60">
            Stakeholder (optional)
          </span>
          <input
            list={`stakeholder-options-${runId}`}
            value={stakeholder}
            onChange={(e) => setStakeholder(e.target.value)}
            disabled={saving}
            placeholder="e.g. Champion, CFO, Power User"
            className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm"
          />
          <datalist id={`stakeholder-options-${runId}`}>
            {stakeholderOptions.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </label>
      </div>
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !accountId}
          className="font-mono text-[11px] uppercase tracking-[0.22em] bg-accent text-accent-foreground px-4 py-2 hover:opacity-90 disabled:opacity-50"
        >
          {saved ? "Update tag" : "Tag run"}
        </button>
        {saved && (
          <button
            type="button"
            onClick={onClear}
            disabled={saving}
            className="font-mono text-[11px] uppercase tracking-[0.22em] border border-border px-4 py-2 hover:border-foreground"
          >
            Remove tag
          </button>
        )}
        {saved && accountId && (
          <Link
            to="/csfactors"
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent border-b border-accent/40 hover:border-accent pb-0.5"
          >
            Open on CSFactors →
          </Link>
        )}
      </div>
    </section>
  );
}
