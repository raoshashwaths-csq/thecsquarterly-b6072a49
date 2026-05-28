import { createFileRoute } from "@tanstack/react-router";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { designationFromPriceId } from "@/lib/price-map";

let _supabase: SupabaseClient<Database> | null = null;
function getSupabase(): SupabaseClient<Database> {
  if (!_supabase) {
    _supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

type StripePriceLike = {
  id?: string;
  lookup_key?: string | null;
  product?: string | { id: string };
  metadata?: Record<string, string>;
};

type StripeSubItem = {
  current_period_start?: number;
  current_period_end?: number;
  price?: StripePriceLike;
};

type StripeSubscription = {
  id: string;
  status: string;
  customer: string;
  cancel_at_period_end?: boolean;
  current_period_start?: number;
  current_period_end?: number;
  metadata?: Record<string, string>;
  items?: { data?: StripeSubItem[] };
};

function readPriceId(item?: StripeSubItem): string | null {
  const p = item?.price;
  return p?.lookup_key || p?.metadata?.lovable_external_id || p?.id || null;
}

function readProductId(item?: StripeSubItem): string | null {
  const prod = item?.price?.product;
  if (!prod) return null;
  return typeof prod === "string" ? prod : prod.id;
}

async function upsertSubscription(sub: StripeSubscription, env: StripeEnv) {
  const userId = sub.metadata?.userId;
  if (!userId) {
    console.error("[webhook] no userId on subscription", sub.id);
    return;
  }
  const item = sub.items?.data?.[0];
  const priceId = readPriceId(item);
  const productId = readProductId(item);
  const designation = designationFromPriceId(priceId);
  const periodStart = item?.current_period_start ?? sub.current_period_start;
  const periodEnd = item?.current_period_end ?? sub.current_period_end;

  const row = {
    user_id: userId,
    stripe_subscription_id: sub.id,
    stripe_customer_id: sub.customer,
    product_id: productId,
    price_id: priceId,
    designation,
    // Legacy column kept in sync so older readers still resolve a paid tier.
    tier: designation ?? "vanguard",
    status: sub.status,
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
    environment: env,
    updated_at: new Date().toISOString(),
  };

  const { error } = await getSupabase()
    .from("subscriptions")
    .upsert(row, { onConflict: "stripe_subscription_id" });
  if (error) console.error("[webhook] upsert error", error);
}

async function markCanceled(sub: StripeSubscription, env: StripeEnv) {
  const { error } = await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", sub.id)
    .eq("environment", env);
  if (error) console.error("[webhook] cancel update error", error);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  const obj = event.data.object as unknown as StripeSubscription;
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await upsertSubscription(obj, env);
      break;
    case "customer.subscription.deleted":
      await markCanceled(obj, env);
      break;
    default:
      console.log("[webhook] unhandled", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("[webhook] bad env", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("[webhook] error", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
