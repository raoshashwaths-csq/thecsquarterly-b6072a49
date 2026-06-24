import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getPaddleClient, type PaddleEnv } from "@/lib/paddle.server";

type PortalResult = { url: string } | { error: string };

type SubscriptionSummary = {
  hasSubscription: boolean;
  designation: string | null;
  status: string | null;
  priceId: string | null;
  productId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  environment: PaddleEnv | null;
};

/**
 * Returns the signed-in user's current Paddle subscription (newest row first).
 * Filters by environment so test rows never leak into the live published app.
 */
export const getMyPaddleSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) => {
    if (data.environment !== "sandbox" && data.environment !== "live") {
      throw new Error("Invalid environment");
    }
    return data;
  })
  .handler(async ({ data, context }): Promise<SubscriptionSummary> => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("subscriptions")
      .select(
        "designation, status, price_id, product_id, current_period_end, cancel_at_period_end, environment",
      )
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!row) {
      return {
        hasSubscription: false,
        designation: null,
        status: null,
        priceId: null,
        productId: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        environment: data.environment,
      };
    }

    return {
      hasSubscription: true,
      designation: row.designation,
      status: row.status,
      priceId: row.price_id,
      productId: row.product_id,
      currentPeriodEnd: row.current_period_end,
      cancelAtPeriodEnd: row.cancel_at_period_end ?? false,
      environment: (row.environment as PaddleEnv) ?? data.environment,
    };
  });

/**
 * Creates a Paddle customer-portal session for the signed-in user.
 * The frontend opens result.url in a new tab.
 */
export const createPaddlePortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) => {
    if (data.environment !== "sandbox" && data.environment !== "live") {
      throw new Error("Invalid environment");
    }
    return data;
  })
  .handler(async ({ data, context }): Promise<PortalResult> => {
    try {
      const { supabase, userId } = context;

      const { data: row, error } = await supabase
        .from("subscriptions")
        .select("paddle_customer_id, paddle_subscription_id, environment")
        .eq("user_id", userId)
        .eq("environment", data.environment)
        .not("paddle_customer_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return { error: error.message };
      if (!row?.paddle_customer_id) {
        return {
          error:
            "No active subscription found. Subscribe to a tier first to manage billing.",
        };
      }

      const paddle = getPaddleClient(data.environment);
      const subscriptionIds = row.paddle_subscription_id
        ? [row.paddle_subscription_id]
        : [];
      const session = await paddle.customerPortalSessions.create(
        row.paddle_customer_id,
        subscriptionIds,
      );

      return { url: session.urls.general.overview };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to open billing portal";
      return { error: message };
    }
  });
