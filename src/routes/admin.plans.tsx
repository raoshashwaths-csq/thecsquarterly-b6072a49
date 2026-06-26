import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, Minus, Plus, Trash2, Save, ArrowLeft, AlertTriangle } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import {
  adminListPlans,
  adminUpsertPlan,
  adminDeletePlan,
  adminUpsertFeature,
  adminDeleteFeature,
  adminBulkSetAssignments,
  adminGrandfatherCounts,
  adminResnapshotAll,
  type PublicPlan,
  type PublicFeature,
  type PublicAssignment,
} from "@/lib/plans.functions";

export const Route = createFileRoute("/_authenticated/admin/plans")({
  head: () => ({
    meta: [{ title: "Plan & SKU editor — Admin" }],
  }),
  component: AdminPlansPage,
});

type Tab = "plans" | "matrix" | "sku";

function AdminPlansPage() {
  const { user } = useAuth();
  const { isAdmin, loading } = useEntitlements();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("plans");

  useEffect(() => {
    if (!loading && user && !isAdmin) navigate({ to: "/" });
  }, [loading, user, isAdmin, navigate]);

  const list = useServerFn(adminListPlans);
  const counts = useServerFn(adminGrandfatherCounts);

  const plansQ = useQuery({
    queryKey: ["admin:plans"],
    enabled: !!user && isAdmin,
    queryFn: () => list(),
  });
  const countsQ = useQuery({
    queryKey: ["admin:plans:counts"],
    enabled: !!user && isAdmin,
    queryFn: () => counts(),
  });

  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 max-w-7xl mx-auto px-6 py-16">Loading…</main>
        <SiteFooter />
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-[1500px] mx-auto px-6 py-10 w-full">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-2">
              Admin · Pricing
            </div>
            <h1 className="font-display text-5xl">Plans &amp; Feature SKUs</h1>
            <p className="text-sm text-foreground/70 mt-2 max-w-2xl">
              Edit pricing, copy, and which SKUs unlock at each tier. Changes appear on /pricing within 30 seconds. Existing subscribers keep their grandfathered features unless you explicitly re-snapshot.
            </p>
          </div>
          <Link
            to="/admin"
            className="font-mono text-xs uppercase tracking-[0.25em] border border-border px-3 py-2 hover:bg-muted/40 transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft size={12} /> Back to Newsroom
          </Link>
        </div>

        <div className="border-b border-border mb-8 flex gap-1">
          {(
            [
              ["plans", "Plans"],
              ["matrix", "Feature matrix"],
              ["sku", "SKU reference"],
            ] as Array<[Tab, string]>
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={
                "px-4 py-2 font-mono text-xs uppercase tracking-[0.25em] border-b-2 -mb-px transition-colors " +
                (tab === k
                  ? "border-accent text-foreground"
                  : "border-transparent text-foreground/60 hover:text-foreground")
              }
            >
              {label}
            </button>
          ))}
        </div>

        {plansQ.isLoading && <div className="text-sm text-foreground/60">Loading…</div>}
        {plansQ.error && (
          <div className="text-sm text-destructive">Failed to load: {(plansQ.error as Error).message}</div>
        )}

        {plansQ.data && (
          <>
            {tab === "plans" && (
              <PlansTab
                plans={plansQ.data.plans}
                counts={countsQ.data ?? {}}
              />
            )}
            {tab === "matrix" && (
              <MatrixTab
                plans={plansQ.data.plans}
                features={plansQ.data.features}
                assignments={plansQ.data.assignments}
              />
            )}
            {tab === "sku" && (
              <SkuTab
                plans={plansQ.data.plans}
                features={plansQ.data.features}
                assignments={plansQ.data.assignments}
              />
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

// =================== Plans Tab ===================

function PlansTab({
  plans,
  counts,
}: {
  plans: PublicPlan[];
  counts: Record<string, { total: number; snapshotted: number }>;
}) {
  const [editing, setEditing] = useState<PublicPlan | "new" | null>(null);
  const qc = useQueryClient();
  const upsert = useServerFn(adminUpsertPlan);
  const del = useServerFn(adminDeletePlan);
  const resnap = useServerFn(adminResnapshotAll);

  const resnapMut = useMutation({
    mutationFn: (designation?: string) => resnap({ data: designation ? { designation } : {} }),
    onSuccess: (r) => {
      toast.success(`Re-snapshotted ${(r as { updated: number }).updated} subscribers`);
      qc.invalidateQueries({ queryKey: ["admin:plans:counts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Plan deleted");
      qc.invalidateQueries({ queryKey: ["admin:plans"] });
      qc.invalidateQueries({ queryKey: ["plans:public"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-foreground/70">
          {plans.length} plan{plans.length === 1 ? "" : "s"} · Showing inactive too
        </div>
        <button
          onClick={() => setEditing("new")}
          className="font-mono text-xs uppercase tracking-[0.25em] border border-accent text-accent px-3 py-2 hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-2"
        >
          <Plus size={12} /> New plan
        </button>
      </div>

      <div className="border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              {["Order", "Designation", "Label", "Band", "Price /mo", "Price /yr", "Seats", "CTA", "Active", "Grandfathered", ""].map((h) => (
                <th key={h} className="text-left px-3 py-2 font-mono uppercase tracking-widest text-[10px] text-foreground/60 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => {
              const c = counts[p.designation];
              return (
                <tr key={p.id} className="border-b border-border/60 last:border-b-0 hover:bg-muted/20">
                  <td className="px-3 py-2 font-mono text-xs">{p.display_order}</td>
                  <td className="px-3 py-2 font-mono text-xs text-secondary-accent">{p.designation}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{p.label}{p.highlight && <span className="ml-2 text-[10px] font-mono uppercase tracking-widest text-accent">★ {p.highlight_label}</span>}</div>
                    <div className="text-xs text-foreground/60 line-clamp-1">{p.tagline}</div>
                  </td>
                  <td className="px-3 py-2 text-xs">{p.band}</td>
                  <td className="px-3 py-2 font-mono text-xs">{p.price_monthly_display}</td>
                  <td className="px-3 py-2 font-mono text-xs">{p.price_annual_display ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">{p.seat_cap_display}</td>
                  <td className="px-3 py-2 text-xs">
                    <span className="font-mono uppercase tracking-widest text-[10px] text-foreground/60">{p.cta_kind}</span>
                  </td>
                  <td className="px-3 py-2">{p.is_active ? <Check size={14} className="text-accent" /> : <Minus size={14} className="text-foreground/40" />}</td>
                  <td className="px-3 py-2 text-xs">
                    {c ? (
                      <span>
                        {c.snapshotted}/{c.total}
                        <button
                          onClick={() => {
                            if (confirm(`Re-snapshot all ${c.total} ${p.label} subscribers to the current plan? This overrides their grandfathered features.`)) {
                              resnapMut.mutate(p.designation);
                            }
                          }}
                          className="ml-2 text-[10px] font-mono uppercase tracking-widest text-accent hover:underline"
                        >
                          Re-snapshot
                        </button>
                      </span>
                    ) : (
                      <span className="text-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 flex gap-2">
                    <button
                      onClick={() => setEditing(p)}
                      className="text-xs font-mono uppercase tracking-widest text-accent hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete plan "${p.label}"? This cascades to assignments. Existing subscribers keep their snapshot.`)) {
                          delMut.mutate(p.id);
                        }
                      }}
                      className="text-xs text-destructive hover:underline"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <PlanEditor
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["admin:plans"] });
            qc.invalidateQueries({ queryKey: ["plans:public"] });
            setEditing(null);
          }}
          upsert={upsert}
        />
      )}
    </div>
  );
}

function PlanEditor({
  initial,
  onClose,
  onSaved,
  upsert,
}: {
  initial: PublicPlan | null;
  onClose: () => void;
  onSaved: () => void;
  upsert: ReturnType<typeof useServerFn<typeof adminUpsertPlan>>;
}) {
  const [form, setForm] = useState({
    id: initial?.id,
    designation: initial?.designation ?? "",
    label: initial?.label ?? "",
    tagline: initial?.tagline ?? "",
    band: initial?.band ?? ("individual" as const),
    price_monthly_cents: initial?.price_monthly_cents ?? 0,
    price_annual_cents: initial?.price_annual_cents ?? null,
    price_monthly_display: initial?.price_monthly_display ?? "$0",
    price_annual_display: initial?.price_annual_display ?? null,
    seat_cap: initial?.seat_cap ?? 1,
    seat_cap_display: initial?.seat_cap_display ?? "1 seat",
    q_cap_display: initial?.q_cap_display ?? "",
    cta_label: initial?.cta_label ?? "Subscribe",
    cta_kind: initial?.cta_kind ?? ("checkout" as const),
    highlight: initial?.highlight ?? false,
    highlight_label: initial?.highlight_label ?? null,
    contact_only: initial?.contact_only ?? false,
    display_order: initial?.display_order ?? 100,
    is_active: initial?.is_active ?? true,
    paddle_price_id_monthly: initial?.paddle_price_id_monthly ?? null,
    paddle_price_id_annual: initial?.paddle_price_id_annual ?? null,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await upsert({ data: form as never });
      toast.success("Plan saved");
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-10">
      <div className="bg-card border border-border max-w-3xl w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-2xl">{initial ? `Edit · ${initial.label}` : "New plan"}</h2>
          <button onClick={onClose} className="text-foreground/60 hover:text-foreground">✕</button>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Designation (slug)" value={form.designation} onChange={(v) => setForm({ ...form, designation: v })} disabled={!!initial} />
          <Field label="Label" value={form.label} onChange={(v) => setForm({ ...form, label: v })} />
          <Field label="Tagline" value={form.tagline} onChange={(v) => setForm({ ...form, tagline: v })} colSpan={2} />
          <Select label="Band" value={form.band} options={["individual", "team", "partner"]} onChange={(v) => setForm({ ...form, band: v as never })} />
          <Field label="Display order" type="number" value={String(form.display_order)} onChange={(v) => setForm({ ...form, display_order: parseInt(v) || 0 })} />
          <Field label="Monthly cents" type="number" value={String(form.price_monthly_cents)} onChange={(v) => setForm({ ...form, price_monthly_cents: parseInt(v) || 0 })} />
          <Field label="Annual cents" type="number" value={String(form.price_annual_cents ?? "")} onChange={(v) => setForm({ ...form, price_annual_cents: v === "" ? null : parseInt(v) || 0 })} />
          <Field label="Monthly display ($)" value={form.price_monthly_display} onChange={(v) => setForm({ ...form, price_monthly_display: v })} />
          <Field label="Annual display" value={form.price_annual_display ?? ""} onChange={(v) => setForm({ ...form, price_annual_display: v || null })} />
          <Field label="Seat cap (#)" type="number" value={String(form.seat_cap)} onChange={(v) => setForm({ ...form, seat_cap: parseInt(v) || 1 })} />
          <Field label="Seat cap display" value={form.seat_cap_display} onChange={(v) => setForm({ ...form, seat_cap_display: v })} />
          <Field label="Lumi cap display" value={form.q_cap_display} onChange={(v) => setForm({ ...form, q_cap_display: v })} colSpan={2} />
          <Field label="CTA label" value={form.cta_label} onChange={(v) => setForm({ ...form, cta_label: v })} />
          <Select label="CTA kind" value={form.cta_kind} options={["free", "checkout", "contact"]} onChange={(v) => setForm({ ...form, cta_kind: v as never })} />
          <Field label="Paddle price ID (monthly)" value={form.paddle_price_id_monthly ?? ""} onChange={(v) => setForm({ ...form, paddle_price_id_monthly: v || null })} />
          <Field label="Paddle price ID (annual)" value={form.paddle_price_id_annual ?? ""} onChange={(v) => setForm({ ...form, paddle_price_id_annual: v || null })} />
          <Field label="Highlight label" value={form.highlight_label ?? ""} onChange={(v) => setForm({ ...form, highlight_label: v || null })} colSpan={2} />
          <Toggle label="Highlight" value={form.highlight} onChange={(v) => setForm({ ...form, highlight: v })} />
          <Toggle label="Contact only (no checkout)" value={form.contact_only} onChange={(v) => setForm({ ...form, contact_only: v })} />
          <Toggle label="Active (visible on /pricing)" value={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
        </div>
        <div className="mt-6 flex items-start gap-3 text-xs text-foreground/70 p-3 bg-muted/30 border border-border">
          <AlertTriangle size={14} className="text-secondary-accent flex-shrink-0 mt-0.5" />
          <p>
            Paddle is the source of truth for what's actually charged. Editing the display price here changes what /pricing shows, but the checkout charges the linked Paddle price. Update the Paddle price entity separately when changing the amount.
          </p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="font-mono text-xs uppercase tracking-[0.25em] px-3 py-2 border border-border hover:bg-muted/40">Cancel</button>
          <button onClick={save} disabled={saving} className="font-mono text-xs uppercase tracking-[0.25em] px-3 py-2 bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2">
            <Save size={12} /> {saving ? "Saving…" : "Save plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", colSpan = 1, disabled }: { label: string; value: string; onChange: (v: string) => void; type?: string; colSpan?: number; disabled?: boolean }) {
  return (
    <label className={"flex flex-col gap-1 " + (colSpan === 2 ? "col-span-2" : "")}>
      <span className="font-mono text-[10px] uppercase tracking-widest text-foreground/60">{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
      />
    </label>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-widest text-foreground/60">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="border border-border bg-background px-3 py-2 text-sm">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-sm">{label}</span>
    </label>
  );
}

// =================== Matrix Tab ===================

type DraftAssignment = { enabled: boolean; numeric_value: number | null; override: string | null };

function MatrixTab({
  plans,
  features,
  assignments,
}: {
  plans: PublicPlan[];
  features: PublicFeature[];
  assignments: PublicAssignment[];
}) {
  const qc = useQueryClient();
  const bulkSet = useServerFn(adminBulkSetAssignments);
  const upsertFeature = useServerFn(adminUpsertFeature);
  const delFeature = useServerFn(adminDeleteFeature);
  const [showNew, setShowNew] = useState(false);

  const initialDraft = useMemo(() => {
    const map: Record<string, DraftAssignment> = {};
    for (const a of assignments) {
      map[`${a.plan_id}:${a.feature_id}`] = {
        enabled: a.enabled,
        numeric_value: a.numeric_value,
        override: a.marketing_label_override,
      };
    }
    return map;
  }, [assignments]);
  const [draft, setDraft] = useState<Record<string, DraftAssignment>>(initialDraft);
  useEffect(() => setDraft(initialDraft), [initialDraft]);

  const pendingCount = useMemo(() => {
    let n = 0;
    for (const key of Object.keys(draft)) {
      const cur = initialDraft[key];
      const next = draft[key];
      if (!cur) {
        if (next.enabled || next.numeric_value !== null || next.override) n++;
        continue;
      }
      if (cur.enabled !== next.enabled || cur.numeric_value !== next.numeric_value || cur.override !== next.override) n++;
    }
    for (const key of Object.keys(initialDraft)) {
      if (!draft[key]) n++;
    }
    return n;
  }, [draft, initialDraft]);

  const groupedFeatures = useMemo(() => {
    const out: Record<string, PublicFeature[]> = {};
    for (const f of features) {
      out[f.category] ??= [];
      out[f.category].push(f);
    }
    return out;
  }, [features]);

  async function saveAll() {
    try {
      // Save per-plan in parallel
      await Promise.all(
        plans.map((p) => {
          const rows: PublicAssignment[] = [];
          for (const f of features) {
            const key = `${p.id}:${f.id}`;
            const d = draft[key];
            if (!d) continue;
            if (!d.enabled && d.numeric_value === null && !d.override) continue;
            rows.push({
              plan_id: p.id,
              feature_id: f.id,
              enabled: d.enabled,
              numeric_value: d.numeric_value,
              marketing_label_override: d.override,
            });
          }
          return bulkSet({ data: { plan_id: p.id, rows } });
        }),
      );
      toast.success(`Saved ${pendingCount} changes`);
      qc.invalidateQueries({ queryKey: ["admin:plans"] });
      qc.invalidateQueries({ queryKey: ["plans:public"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function set(planId: string, featureId: string, patch: Partial<DraftAssignment>) {
    const key = `${planId}:${featureId}`;
    setDraft((d) => ({
      ...d,
      [key]: { enabled: false, numeric_value: null, override: null, ...d[key], ...patch },
    }));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center sticky top-0 bg-background py-3 z-10 border-b border-border">
        <div className="text-sm">
          <span className="font-mono text-xs uppercase tracking-widest text-foreground/60">
            {features.length} SKUs · {plans.length} plans
          </span>
          {pendingCount > 0 && (
            <span className="ml-3 px-2 py-1 bg-accent/15 text-accent font-mono text-[10px] uppercase tracking-widest">
              {pendingCount} unsaved
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNew(true)}
            className="font-mono text-xs uppercase tracking-[0.25em] border border-border px-3 py-2 hover:bg-muted/40 inline-flex items-center gap-2"
          >
            <Plus size={12} /> New SKU
          </button>
          <button
            onClick={saveAll}
            disabled={pendingCount === 0}
            className="font-mono text-xs uppercase tracking-[0.25em] bg-accent text-accent-foreground px-3 py-2 hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-2"
          >
            <Save size={12} /> Save changes
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="text-left p-3 font-mono uppercase tracking-widest text-[10px] text-foreground/60 sticky left-0 bg-muted/30 z-10">SKU</th>
              {plans.map((p) => (
                <th key={p.id} className="p-3 text-center font-mono uppercase tracking-widest text-[10px] text-foreground/60 whitespace-nowrap">
                  {p.label}
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedFeatures).map(([cat, list]) => (
              <FeatureCategoryRows
                key={cat}
                category={cat}
                features={list}
                plans={plans}
                draft={draft}
                set={set}
                onDeleteFeature={async (f) => {
                  if (confirm(`Delete SKU "${f.label}"? Removes from all plans.`)) {
                    await delFeature({ data: { id: f.id } });
                    qc.invalidateQueries({ queryKey: ["admin:plans"] });
                    qc.invalidateQueries({ queryKey: ["plans:public"] });
                  }
                }}
              />
            ))}
          </tbody>
        </table>
      </div>

      {showNew && (
        <NewFeatureDialog
          onClose={() => setShowNew(false)}
          upsert={upsertFeature}
          onSaved={() => {
            setShowNew(false);
            qc.invalidateQueries({ queryKey: ["admin:plans"] });
          }}
        />
      )}
    </div>
  );
}

function FeatureCategoryRows({
  category,
  features,
  plans,
  draft,
  set,
  onDeleteFeature,
}: {
  category: string;
  features: PublicFeature[];
  plans: PublicPlan[];
  draft: Record<string, DraftAssignment>;
  set: (planId: string, featureId: string, patch: Partial<DraftAssignment>) => void;
  onDeleteFeature: (f: PublicFeature) => void;
}) {
  return (
    <>
      <tr className="bg-muted/20 border-b border-border">
        <td colSpan={plans.length + 2} className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-secondary-accent sticky left-0 bg-muted/20">
          {category}
        </td>
      </tr>
      {features.map((f) => (
        <tr key={f.id} className="border-b border-border/60 hover:bg-muted/10">
          <td className="px-3 py-2 sticky left-0 bg-background hover:bg-muted/10">
            <div className="font-medium text-foreground/90">{f.label}</div>
            <div className="font-mono text-[10px] text-foreground/50">{f.code}{f.kind === "numeric" && " · numeric"}</div>
          </td>
          {plans.map((p) => {
            const key = `${p.id}:${f.id}`;
            const d = draft[key] ?? { enabled: false, numeric_value: null, override: null };
            return (
              <td key={p.id} className="px-2 py-2 text-center">
                {f.kind === "numeric" ? (
                  <div className="flex items-center gap-1 justify-center">
                    <input
                      type="checkbox"
                      checked={d.enabled}
                      onChange={(e) => set(p.id, f.id, { enabled: e.target.checked })}
                    />
                    <input
                      type="number"
                      disabled={!d.enabled}
                      value={d.numeric_value ?? ""}
                      onChange={(e) => set(p.id, f.id, { numeric_value: e.target.value === "" ? null : parseInt(e.target.value) || 0 })}
                      className="w-20 border border-border bg-background px-2 py-1 text-xs disabled:opacity-40"
                      placeholder="—"
                    />
                  </div>
                ) : (
                  <input
                    type="checkbox"
                    checked={d.enabled}
                    onChange={(e) => set(p.id, f.id, { enabled: e.target.checked })}
                  />
                )}
              </td>
            );
          })}
          <td className="px-2 py-2 text-right">
            <button onClick={() => onDeleteFeature(f)} className="text-destructive/70 hover:text-destructive">
              <Trash2 size={12} />
            </button>
          </td>
        </tr>
      ))}
    </>
  );
}

function NewFeatureDialog({
  onClose,
  onSaved,
  upsert,
}: {
  onClose: () => void;
  onSaved: () => void;
  upsert: ReturnType<typeof useServerFn<typeof adminUpsertFeature>>;
}) {
  const [form, setForm] = useState({
    code: "",
    label: "",
    category: "Editorial",
    kind: "boolean" as "boolean" | "numeric",
    description: "",
    display_order: 999,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    try {
      await upsert({ data: form as never });
      toast.success("SKU created");
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center py-10">
      <div className="bg-card border border-border max-w-xl w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-2xl">New feature SKU</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Code (feature.x.y)" value={form.code} onChange={(v) => setForm({ ...form, code: v.toLowerCase() })} colSpan={2} />
          <Field label="Label" value={form.label} onChange={(v) => setForm({ ...form, label: v })} colSpan={2} />
          <Field label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
          <Select label="Kind" value={form.kind} options={["boolean", "numeric"]} onChange={(v) => setForm({ ...form, kind: v as never })} />
          <Field label="Display order" type="number" value={String(form.display_order)} onChange={(v) => setForm({ ...form, display_order: parseInt(v) || 0 })} />
          <Toggle label="Active" value={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
          <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} colSpan={2} />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="font-mono text-xs uppercase tracking-[0.25em] px-3 py-2 border border-border">Cancel</button>
          <button onClick={save} disabled={saving} className="font-mono text-xs uppercase tracking-[0.25em] px-3 py-2 bg-accent text-accent-foreground disabled:opacity-50">
            {saving ? "Saving…" : "Create SKU"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =================== SKU Reference Tab ===================

function SkuTab({
  plans,
  features,
  assignments,
}: {
  plans: PublicPlan[];
  features: PublicFeature[];
  assignments: PublicAssignment[];
}) {
  const byPlan = useMemo(() => {
    const m: Record<string, Set<string>> = {};
    for (const a of assignments) {
      if (!a.enabled) continue;
      m[a.feature_id] ??= new Set();
      m[a.feature_id].add(a.plan_id);
    }
    return m;
  }, [assignments]);
  const grouped = useMemo(() => {
    const out: Record<string, PublicFeature[]> = {};
    for (const f of features) {
      out[f.category] ??= [];
      out[f.category].push(f);
    }
    return out;
  }, [features]);

  return (
    <div className="space-y-8">
      <div className="p-4 border border-border bg-muted/20">
        <div className="font-mono text-xs uppercase tracking-[0.25em] text-secondary-accent mb-2">SKU catalog</div>
        <p className="text-sm text-foreground/70">
          The canonical list of feature SKUs. Each row is a single toggleable capability the admin can include in any tier. Use the codes (e.g. <code className="font-mono text-xs">feature.csfactors.personal</code>) when adding gates in the codebase: <code className="font-mono text-xs">hasFeature("feature.csfactors.personal")</code>.
        </p>
      </div>

      {Object.entries(grouped).map(([cat, list]) => (
        <section key={cat}>
          <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-3">{cat}</h3>
          <div className="border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="text-left p-3 font-mono uppercase tracking-widest text-[10px] text-foreground/60">Code</th>
                  <th className="text-left p-3 font-mono uppercase tracking-widest text-[10px] text-foreground/60">Label</th>
                  <th className="text-left p-3 font-mono uppercase tracking-widest text-[10px] text-foreground/60">Kind</th>
                  <th className="text-left p-3 font-mono uppercase tracking-widest text-[10px] text-foreground/60">Included in</th>
                </tr>
              </thead>
              <tbody>
                {list.map((f) => {
                  const planIds = byPlan[f.id] ?? new Set();
                  const includedPlans = plans.filter((p) => planIds.has(p.id));
                  return (
                    <tr key={f.id} className="border-b border-border/60 last:border-b-0">
                      <td className="px-3 py-2 align-top font-mono text-[11px] text-secondary-accent whitespace-nowrap">{f.code}</td>
                      <td className="px-3 py-2 align-top">
                        <div className="font-medium">{f.label}</div>
                        {f.description && <div className="text-xs text-foreground/60 mt-0.5">{f.description}</div>}
                      </td>
                      <td className="px-3 py-2 align-top text-xs">{f.kind}</td>
                      <td className="px-3 py-2 align-top text-xs">
                        {includedPlans.length === 0 ? (
                          <span className="text-foreground/40">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {includedPlans.map((p) => (
                              <span key={p.id} className="px-1.5 py-0.5 bg-accent/10 text-accent font-mono text-[10px] uppercase tracking-widest">
                                {p.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
