import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose,
} from "@/components/ui/sheet";
import { X } from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { HealthChip } from "@/components/dashboard/HealthChip";
import { StakeholderMap } from "@/components/csfactors/StakeholderMap";
import { ContractVault } from "@/components/csfactors/ContractVault";
import { AccountTimeline } from "@/components/csfactors/AccountTimeline";
import { AccountActionsList } from "@/components/csfactors/AccountActionsList";
import {
  updateAccount, deleteAccount, logAccountEvent, noticeWindow,
  type CSAccount,
} from "@/lib/csfactors.functions";
import { toast } from "sonner";

type Patch = Partial<CSAccount>;

export function AccountDrawer({
  account,
  open,
  onOpenChange,
}: {
  account: CSAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const update = useServerFn(updateAccount);
  const del = useServerFn(deleteAccount);
  const logEv = useServerFn(logAccountEvent);
  const [draft, setDraft] = useState<CSAccount | null>(account);

  useEffect(() => {
    setDraft(account);
  }, [account?.id]);

  if (!draft || !account) return null;
  const acc = account;

  async function save(patch: Patch) {
    setDraft((d) => (d ? { ...d, ...patch } : d));
    try {
      await update({ data: { id: acc.id, patch: patch as never } });
      qc.invalidateQueries({ queryKey: ["cs-accounts"] });
      await logEv({ data: { account_id: acc.id, kind: "field.edit", payload: patch as never } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function onDelete() {
    if (!confirm(`Delete ${acc.name}?`)) return;
    await del({ data: { id: acc.id } });
    qc.invalidateQueries({ queryKey: ["cs-accounts"] });
    onOpenChange(false);
    toast.success("Account deleted");
  }

  const window90 = noticeWindow(draft.contract_renewal_date, 90) as { band: 30 | 60 | 90 | null };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto p-0 max-w-full"
      >
        <SheetHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-4 border-b border-border bg-card sticky top-0 z-20 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-mono uppercase tracking-[0.3em] text-[10px] md:text-xs text-secondary-accent font-semibold">
                Account Profile Optimization
              </div>
              <SheetTitle className="font-display text-xl md:text-2xl tracking-tight mt-2 break-words">
                {draft.name}
              </SheetTitle>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <HealthChip score={draft.health} />
                {window90.band && (
                  <span className="font-mono uppercase tracking-widest text-[10px] md:text-xs px-2 py-0.5 border border-accent bg-accent/10 text-accent">
                    Notice {window90.band}d
                  </span>
                )}
              </div>
            </div>
            <SheetClose
              className="shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-sm border border-border bg-background hover:bg-muted hover:text-accent transition-colors"
              aria-label="Close account"
            >
              <X className="h-4 w-4" />
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="px-4 md:px-6 py-4">
          <Accordion type="multiple" defaultValue={["actions", "timeline", "identity", "commercial", "stakeholders"]} className="space-y-1">
            <Section value="actions" title="Actions raised">
              <AccountActionsList accountId={account.id} accountName={draft.name} />
            </Section>

            <Section value="timeline" title="Timeline & milestones">
              <AccountTimeline accountId={account.id} />
            </Section>



            <Section value="identity" title="Identity">
              <Grid>
                <Field label="Name" value={draft.name} onSave={(v) => save({ name: v })} />
                <Field label="UCC" value={draft.ucc} onSave={(v) => save({ ucc: v })} />
                <SelectField
                  label="Tier" value={draft.tier}
                  options={["Enterprise", "Mid-Market", "SMB"]}
                  onSave={(v) => save({ tier: v as CSAccount["tier"] })}
                />
                <Field label="Industry" value={draft.industry} onSave={(v) => save({ industry: v })} />
                <ToggleField label="Marquee client" value={!!draft.marquee_client} onSave={(v) => save({ marquee_client: v })} />
              </Grid>
            </Section>

            <Section value="ownership" title="Ownership">
              <Grid>
                <Field label="Account Manager" value={draft.account_manager} onSave={(v) => save({ account_manager: v })} />
                <Field label="CSM Name" value={draft.csm_name} onSave={(v) => save({ csm_name: v })} />
                <Field label="Associate Director" value={draft.associate_director} onSave={(v) => save({ associate_director: v })} />
                <Field label="Backup AM/CSM" value={draft.backup_owner} onSave={(v) => save({ backup_owner: v })} />
                <Field label="Customer Success" value={draft.customer_success} onSave={(v) => save({ customer_success: v })} />
                <Field label="Key Account Manager" value={draft.key_account_manager} onSave={(v) => save({ key_account_manager: v })} />
                <Field label="DA - Project Manager" value={draft.da_project_manager} onSave={(v) => save({ da_project_manager: v })} />
                <Field label="Project Manager II" value={draft.project_manager_ii} onSave={(v) => save({ project_manager_ii: v })} />
              </Grid>
            </Section>

            <Section value="commercial" title="Commercial">
              <Grid>
                <Field label="CARR ($)" type="number" value={draft.carr} onSave={(v) => save({ carr: v === "" ? null : Number(v) })} />
                <Field label="Invoiced ARR ($)" type="number" value={draft.invoiced_arr} onSave={(v) => save({ invoiced_arr: v === "" ? null : Number(v) })} />
                <Field label="ARR (legacy/USD)" type="number" value={draft.arr} onSave={(v) => save({ arr: Number(v) })} />
                <Field label="Contract Renewal Date" type="date" value={draft.contract_renewal_date} onSave={(v) => save({ contract_renewal_date: v || null })} />
                <Field label="Renewal Quarter" value={draft.renewal_quarter} onSave={(v) => save({ renewal_quarter: v })} />
                <Field label="Final CS NPS (0-10)" type="number" value={draft.final_cs_nps} onSave={(v) => save({ final_cs_nps: v === "" ? null : Number(v) })} />
                <SelectField
                  label="CSM Sentiment" value={draft.csm_sentiment ?? ""}
                  options={["", "Positive", "Neutral", "Critical"]}
                  optionLabels={{ "": "—" }}
                  onSave={(v) => save({ csm_sentiment: (v || null) as CSAccount["csm_sentiment"] })}
                />
                <Field label="Health (0-100)" type="number" value={draft.health} onSave={(v) => save({ health: Number(v) })} />
                <SelectField
                  label="QBR Status" value={draft.qbr_status}
                  options={["Completed", "Scheduled", "Overdue"]}
                  onSave={(v) => save({ qbr_status: v as CSAccount["qbr_status"] })}
                />
              </Grid>
            </Section>

            <Section value="lifecycle" title="Lifecycle">
              <Grid>
                <Field label="Journey Stage" value={draft.journey_stage} onSave={(v) => save({ journey_stage: v })} />
                <Field label="CS Transition Start" type="date" value={draft.cs_transition_start} onSave={(v) => save({ cs_transition_start: v || null })} />
                <Field label="Planned Go Live" type="date" value={draft.planned_go_live} onSave={(v) => save({ planned_go_live: v || null })} />
                <Field label="Actual Go Live" type="date" value={draft.actual_go_live} onSave={(v) => save({ actual_go_live: v || null })} />
                <Field label="Implementation Progress (%)" type="number" value={draft.implementation_progress} onSave={(v) => save({ implementation_progress: v === "" ? null : Number(v) })} />
                <Field label="Active Headcount" type="number" value={draft.active_headcount} onSave={(v) => save({ active_headcount: v === "" ? null : Number(v) })} />
              </Grid>
            </Section>

            <Section value="geography" title="Geography">
              <Grid>
                <Field label="Customer City" value={draft.customer_city} onSave={(v) => save({ customer_city: v })} />
                <Field label="Country" value={draft.country} onSave={(v) => save({ country: v })} />
                <Field label="Region" value={draft.region} onSave={(v) => save({ region: v })} />
                <Field label="Sub Region" value={draft.sub_region} onSave={(v) => save({ sub_region: v })} />
              </Grid>
            </Section>

            <Section value="stack" title="Tech Stack">
              <Grid>
                <Field label="Server Location" value={draft.server_location} onSave={(v) => save({ server_location: v })} />
                <Field label="Server Name" value={draft.server_name} onSave={(v) => save({ server_name: v })} />
                <Field label="Existing ERP" value={draft.existing_erp} onSave={(v) => save({ existing_erp: v })} />
                <Field label="Existing CRM" value={draft.existing_crm} onSave={(v) => save({ existing_crm: v })} />
                <Field label="Payroll Service Type" value={draft.payroll_service_type} onSave={(v) => save({ payroll_service_type: v })} />
              </Grid>
            </Section>

            <Section value="stakeholders" title="Stakeholder Influence Directory">
              <StakeholderMap accountId={account.id} />
            </Section>

            <Section value="contracts" title="Contract Repository Ledger">
              <ContractVault accountId={account.id} renewalDate={draft.contract_renewal_date} />
            </Section>

            <Section value="notes" title="Notes & Stakeholders (legacy)">
              <Grid>
                <Field label="Champion" value={draft.champion} onSave={(v) => save({ champion: v })} />
                <Field label="Economic Buyer" value={draft.economic_buyer} onSave={(v) => save({ economic_buyer: v })} />
                <Field label="Open Blocker" value={draft.blocker} onSave={(v) => save({ blocker: v })} />
              </Grid>
              <div className="mt-3 space-y-1.5">
                <Label className="font-mono uppercase tracking-widest text-xs">Notes</Label>
                <Textarea
                  defaultValue={draft.notes ?? ""}
                  onBlur={(e) => save({ notes: e.target.value || null })}
                  rows={4}
                  maxLength={5000}
                />
              </div>
            </Section>
          </Accordion>

          <div className="mt-6 flex justify-end pt-4 border-t border-border">
            <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete}>
              Delete account
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ value, title, children }: { value: string; title: string; children: React.ReactNode }) {
  return (
    <AccordionItem value={value} className="border border-border bg-card">
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <span className="font-mono uppercase tracking-[0.2em] text-xs text-foreground/80">
          {title}
        </span>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">{children}</AccordionContent>
    </AccordionItem>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>;
}

function Field({
  label,
  value,
  type = "text",
  onSave,
}: {
  label: string;
  value: string | number | null | undefined;
  type?: string;
  onSave: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="font-mono uppercase tracking-widest text-xs">{label}</Label>
      <Input
        type={type}
        defaultValue={value ?? ""}
        onBlur={(e) => {
          const v = e.target.value;
          if (String(value ?? "") !== v) onSave(v);
        }}
        className="h-9 text-sm font-mono"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  optionLabels,
  onSave,
}: {
  label: string;
  value: string;
  options: string[];
  optionLabels?: Record<string, string>;
  onSave: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="font-mono uppercase tracking-widest text-xs">{label}</Label>
      <Select value={value || "__none__"} onValueChange={(v) => onSave(v === "__none__" ? "" : v)}>
        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o || "__none__"} value={o || "__none__"}>
              {optionLabels?.[o] ?? o ?? "—"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ToggleField({
  label,
  value,
  onSave,
}: {
  label: string;
  value: boolean;
  onSave: (v: boolean) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="font-mono uppercase tracking-widest text-xs">{label}</Label>
      <div className="h-9 flex items-center">
        <Switch checked={value} onCheckedChange={onSave} />
      </div>
    </div>
  );
}
