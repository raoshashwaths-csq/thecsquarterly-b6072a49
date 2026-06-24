// Paddle webhook handler. Auth comes from the Paddle signature, not Supabase.
// Stable URL: /api/public/payments/webhook?env=sandbox|live

import { createFileRoute } from "@tanstack/react-router";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { EventName, type PaddleEnv, verifyWebhook } from "@/lib/paddle.server";
import { designationFromPriceId } from "@/lib/tiers";

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

type SubItem = {
  price?: { id?: string; importMeta?: { externalId?: string | null } | null };
  product?: { id?: string; importMeta?: { externalId?: string | null } | null };
};

type SubscriptionData = {
  id: string;
  customerId: string;
  status: string;
  items?: SubItem[];
  currentBillingPeriod?: { startsAt?: string | null; endsAt?: string | null } | null;
  scheduledChange?: { action?: string | null } | null;
  customData?: { userId?: string } | null;
};

function extractIds(data: SubscriptionData) {
  const item = data.items?.[0];
  const priceId = item?.price?.importMeta?.externalId ?? null;
  const productId = item?.product?.importMeta?.externalId ?? null;
  return { priceId, productId };
}

async function handleSubscriptionUpsert(data: SubscriptionData, env: PaddleEnv) {
  const userId = data.customData?.userId;
  if (!userId) {
    console.error("[paddle webhook] missing customData.userId", data.id);
    return;
  }
  const { priceId, productId } = extractIds(data);
  if (!priceId || !productId) {
    console.warn(
      "[paddle webhook] skipping — missing importMeta.externalId on price/product",
      { subId: data.id },
    );
    return;
  }
  const designation = designationFromPriceId(priceId);

  const row = {
    user_id: userId,
    paddle_subscription_id: data.id,
    paddle_customer_id: data.customerId,
    product_id: productId,
    price_id: priceId,
    designation,
    // Keep legacy `tier` column in sync so older readers still resolve.
    tier: designation ?? "vanguard",
    status: data.status,
    current_period_start: data.currentBillingPeriod?.startsAt ?? null,
    current_period_end: data.currentBillingPeriod?.endsAt ?? null,
    cancel_at_period_end: data.scheduledChange?.action === "cancel",
    environment: env,
    updated_at: new Date().toISOString(),
  };

  const { error } = await getSupabase()
    .from("subscriptions")
    .upsert(row, { onConflict: "paddle_subscription_id" });
  if (error) console.error("[paddle webhook] upsert error", error);
}

async function handleSubscriptionCanceled(data: SubscriptionData, env: PaddleEnv) {
  const { error } = await getSupabase()
    .from("subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: false,
      current_period_end: data.currentBillingPeriod?.endsAt ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", data.id)
    .eq("environment", env);
  if (error) console.error("[paddle webhook] cancel update error", error);
}

async function handleWebhook(req: Request, env: PaddleEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.eventType) {
    case EventName.SubscriptionCreated:
    case EventName.SubscriptionUpdated:
      await handleSubscriptionUpsert(event.data as unknown as SubscriptionData, env);
      break;
    case EventName.SubscriptionCanceled:
      await handleSubscriptionCanceled(event.data as unknown as SubscriptionData, env);
      break;
    default:
      console.log("[paddle webhook] unhandled", event.eventType);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("[paddle webhook] bad env", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("[paddle webhook] error", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
