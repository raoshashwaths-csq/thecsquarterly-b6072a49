import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createAccount } from "@/lib/csfactors.functions";
import { toast } from "sonner";

export function AddAccountDialog() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const create = useServerFn(createAccount);
  const qc = useQueryClient();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      await create({
        data: {
          name: String(fd.get("name") ?? "").trim(),
          tier: (fd.get("tier") as "Enterprise" | "Mid-Market" | "SMB") ?? "Mid-Market",
          arr: Number(fd.get("arr") ?? 0),
          health: Number(fd.get("health") ?? 70),
          qbr_status: (fd.get("qbr_status") as "Completed" | "Scheduled" | "Overdue") ?? "Scheduled",
          renewal_quarter: String(fd.get("renewal_quarter") ?? "").trim(),
          champion: (String(fd.get("champion") ?? "").trim() || null),
          economic_buyer: (String(fd.get("economic_buyer") ?? "").trim() || null),
          blocker: (String(fd.get("blocker") ?? "").trim() || null),
          notes: (String(fd.get("notes") ?? "").trim() || null),
        },
      });
      toast.success("Account added");
      await qc.invalidateQueries({ queryKey: ["cs-accounts"] });
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add account");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Add Account
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display tracking-tight">New Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Account name" name="name" required maxLength={200} />
            <div className="space-y-1.5">
              <Label htmlFor="tier" className="font-mono uppercase tracking-widest text-xs">Tier</Label>
              <Select name="tier" defaultValue="Mid-Market">
                <SelectTrigger id="tier"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                  <SelectItem value="Mid-Market">Mid-Market</SelectItem>
                  <SelectItem value="SMB">SMB</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field label="ARR (USD)" name="arr" type="number" min={0} required defaultValue="50000" />
            <Field label="Health (0-100)" name="health" type="number" min={0} max={100} required defaultValue="70" />
            <div className="space-y-1.5">
              <Label htmlFor="qbr_status" className="font-mono uppercase tracking-widest text-xs">QBR status</Label>
              <Select name="qbr_status" defaultValue="Scheduled">
                <SelectTrigger id="qbr_status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field label="Renewal (e.g. Q3-2026)" name="renewal_quarter" required defaultValue="Q3-2026" />
            <Field label="Champion" name="champion" />
            <Field label="Economic buyer" name="economic_buyer" />
          </div>
          <Field label="Blocker" name="blocker" />
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="font-mono uppercase tracking-widest text-xs">Notes</Label>
            <Textarea id="notes" name="notes" maxLength={5000} rows={3} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Add account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  name,
  type = "text",
  ...rest
}: { label: string; name: string; type?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="font-mono uppercase tracking-widest text-xs">
        {label}
      </Label>
      <Input id={name} name={name} type={type} {...rest} />
    </div>
  );
}
