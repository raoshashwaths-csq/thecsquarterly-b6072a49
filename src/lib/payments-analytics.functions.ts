import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { gatewayFetch, type PaddleEnv } from "@/lib/paddle.server";
import { TIERS, designationFromPriceId, type Designation } from "@/lib/tiers";

async function assertAdmin(userId: string) {
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Forbidden");
}

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

type ChurnEvent = {
  paddle_subscription_id: string | null;
  designation: string | null;
  status: string;
  updated_at: string;
  current_period_end: string | null;
};

export type PaymentsAnalytics = {
  environment: PaddleEnv;
  generatedAt: string;
  totals: {
    activePaid: number;
    mrrCents: number;
    arrCents: number;
    canceled30d: number;
    canceled90d: number;
    churnRate30d: number; // canceled30 / (active + canceled30)
    netNew30d: number;
  };
  byTier: Array<{
    designation: Designation;
    label: string;
    active: number;
    monthlyValue: number;
    canceled30d: number;
    mrrCents: number;
  }>;
  conversion: {
    available: boolean;
    rate: number | null;
    started: number | null;
    completed: number | null;
    error?: string;
  };
  recentCancels: ChurnEvent[];
  signups30d: Array<{ date: string; count: number }>;
};

export const getPaymentsAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) => {
    if (data.environment !== "sandbox" && data.environment !== "live") {
      throw new Error("Invalid environment");
    }
    return data;
  })
  .handler(async ({ data, context }): Promise<PaymentsAnalytics> => {
    await assertAdmin(context.userId);
    const env = data.environment;
    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select(
        "paddle_subscription_id, designation, price_id, status, updated_at, created_at, current_period_end",
      )
      .eq("environment", env)
      .order("updated_at", { ascending: false })
      .limit(2000);

    const rows = subs ?? [];

    const tierMeta = new Map<Designation, { label: string; monthly: number }>();
    for (const t of TIERS) {
      tierMeta.set(t.designation, { label: t.label, monthly: t.priceMonthlyValue });
    }

    const byTierMap = new Map<
      Designation,
      { active: number; canceled30d: number; mrrCents: number }
    >();
    let activePaid = 0;
    let mrrCents = 0;
    let canceled30d = 0;
    let canceled90d = 0;
    let netNew30d = 0;
    const signupBuckets = new Map<string, number>();
    const recentCancels: ChurnEvent[] = [];

    for (const r of rows) {
      const designation =
        (r.designation as Designation | null) ?? designationFromPriceId(r.price_id);
      const meta = designation ? tierMeta.get(designation) : null;
      const monthly = meta?.monthly ?? 0;

      if (designation) {
        if (!byTierMap.has(designation))
          byTierMap.set(designation, { active: 0, canceled30d: 0, mrrCents: 0 });
      }
      const bucket = designation ? byTierMap.get(designation)! : null;

      if (ACTIVE_STATUSES.has(r.status)) {
        if (monthly > 0) {
          activePaid += 1;
          mrrCents += monthly * 100;
          if (bucket) {
            bucket.active += 1;
            bucket.mrrCents += monthly * 100;
          }
        }
      }

      const updated = r.updated_at ? new Date(r.updated_at) : null;
      const created = r.created_at ? new Date(r.created_at) : null;

      if (r.status === "canceled" && updated) {
        if (updated >= d30) {
          canceled30d += 1;
          if (bucket) bucket.canceled30d += 1;
          if (recentCancels.length < 25) {
            recentCancels.push({
              paddle_subscription_id: r.paddle_subscription_id,
              designation,
              status: r.status,
              updated_at: r.updated_at,
              current_period_end: r.current_period_end,
            });
          }
        }
        if (updated >= d90) canceled90d += 1;
      }

      if (created && created >= d30 && monthly > 0) {
        netNew30d += 1;
        const key = created.toISOString().slice(0, 10);
        signupBuckets.set(key, (signupBuckets.get(key) ?? 0) + 1);
      }
    }

    const denom = activePaid + canceled30d;
    const churnRate30d = denom > 0 ? canceled30d / denom : 0;

    const byTier = Array.from(byTierMap.entries())
      .map(([designation, v]) => {
        const meta = tierMeta.get(designation)!;
        return {
          designation,
          label: meta.label,
          active: v.active,
          monthlyValue: meta.monthly,
          canceled30d: v.canceled30d,
          mrrCents: v.mrrCents,
        };
      })
      .sort((a, b) => b.active - a.active);

    // Build 30-day signup timeseries (zero-fill)
    const signups30d: Array<{ date: string; count: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      signups30d.push({ date: key, count: signupBuckets.get(key) ?? 0 });
    }

    // Paddle checkout-conversion metric (best-effort)
    const conversion: PaymentsAnalytics["conversion"] = {
      available: false,
      rate: null,
      started: null,
      completed: null,
    };
    try {
      const from = d30.toISOString().slice(0, 10);
      const to = now.toISOString().slice(0, 10);
      const res = await gatewayFetch(
        env,
        `/metrics/checkout-conversion?from=${from}&to=${to}`,
      );
      if (res.ok) {
        const body = (await res.json()) as {
          data?: {
            timeseries?: Array<{ amount?: string; count?: number; rate?: string | number }>;
          };
        };
        const series = body.data?.timeseries ?? [];
        if (series.length) {
          let started = 0;
          let completed = 0;
          for (const pt of series) {
            const c = pt.count ?? 0;
            const a = Number(pt.amount ?? 0);
            started += c;
            completed += a;
          }
          conversion.available = true;
          conversion.started = started;
          conversion.completed = completed;
          conversion.rate = started > 0 ? completed / started : 0;
        }
      } else {
        conversion.error = `Paddle metric unavailable (${res.status})`;
      }
    } catch (e) {
      conversion.error = e instanceof Error ? e.message : "Paddle metric error";
    }

    return {
      environment: env,
      generatedAt: now.toISOString(),
      totals: {
        activePaid,
        mrrCents,
        arrCents: mrrCents * 12,
        canceled30d,
        canceled90d,
        churnRate30d,
        netNew30d,
      },
      byTier,
      conversion,
      recentCancels,
      signups30d,
    };
  });
