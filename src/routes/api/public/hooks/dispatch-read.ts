/**
 * Future Operator — dispatch-read reflection prompt.
 *
 * Called from the dispatch page when scroll depth >= 90%. Authenticated
 * users only (the client sends `x-user-id` after verifying with Supabase),
 * but we also re-check via `x-cron-secret` so callers cannot spoof arbitrary
 * user ids. Practitioner+ only.
 *
 * Body: `{ "userId": "...", "slug": "..." }`.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Input = z.object({
  userId: z.string().uuid(),
  slug: z.string().min(1).max(200),
});

export const Route = createFileRoute("/api/public/hooks/dispatch-read")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronSecret = process.env.FUTURE_OPERATOR_WEBHOOK_SECRET;
        if (!cronSecret || request.headers.get("x-cron-secret") !== cronSecret) {
          return new Response("Unauthorized", { status: 401 });
        }

        let data: z.infer<typeof Input>;
        try {
          data = Input.parse(await request.json());
        } catch (e) {
          return Response.json({ error: String(e) }, { status: 400 });
        }

        const { generateReflectionPromptFor } = await import("@/lib/future-operator.server");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { DESIGNATION_RANK, tierToDesignation } = await import("@/lib/entitlements");

        const { data: sub } = await supabaseAdmin
          .from("subscriptions")
          .select("tier, designation")
          .eq("user_id", data.userId)
          .eq("status", "active")
          .maybeSingle();
        const designation = ((sub?.designation as string | null) ?? tierToDesignation(sub?.tier ?? null)) as
          | keyof typeof DESIGNATION_RANK
          | undefined;
        if (!designation || DESIGNATION_RANK[designation] < DESIGNATION_RANK.practitioner) {
          return Response.json({ ok: false, skipped: "tier" });
        }

        try {
          const r = await generateReflectionPromptFor(data.userId, "dispatch_read", { slug: data.slug });
          return Response.json(r);
        } catch (e) {
          return Response.json({ ok: false, error: String((e as Error).message ?? e) });
        }
      },
    },
  },
});
