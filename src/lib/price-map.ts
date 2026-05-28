// Shared mapping between Stripe price lookup keys, designations, and billing cadence.
// IMPORTANT: keep in sync with products created via batch_create_product.
import type { Designation } from "./entitlements";

export type Cadence = "monthly" | "yearly";

export const PRICE_TO_DESIGNATION: Record<string, Designation> = {
  practitioner_monthly: "practitioner",
  practitioner_yearly: "practitioner",
  operator_monthly: "operator",
  operator_yearly: "operator",
  team_monthly: "team",
  team_yearly: "team",
  scale_monthly: "scale",
  scale_yearly: "scale",
  enterprise_monthly: "enterprise",
  enterprise_yearly: "enterprise",
};

export function designationFromPriceId(priceId: string | null | undefined): Designation | null {
  if (!priceId) return null;
  return PRICE_TO_DESIGNATION[priceId] ?? null;
}

export function priceIdFor(designation: Designation, cadence: Cadence): string | null {
  if (designation === "reader" || designation === "strategic_partner") return null;
  return `${designation}_${cadence === "monthly" ? "monthly" : "yearly"}`;
}
