import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertQUnderCap } from "./q-usage.functions";

const CHAT_MODEL = "google/gemini-2.5-flash";
const FREE_DEBRIEF_NODE = "dispatch-debrief";

async function callChatJson(apiKey: string, system: string, user: string): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({
      model: CHAT_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (res.status === 429) throw new Error("Lumi is at capacity — try again in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted.");
  if (!res.ok) throw new Error(`Lumi failed (${res.status})`);
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content ?? "";
}

function startOfMonthISO(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

async function isFreeTier(userId: string): Promise<boolean> {
  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("status, tier")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (!sub) return true;
  const tier = (sub as { tier?: string | null }).tier ?? "";
  return !tier || tier === "free" || tier === "reader";
}

async function countDebriefsThisMonth(userId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from("q_runs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("node_id", FREE_DEBRIEF_NODE)
    .gte("created_at", startOfMonthISO());
  return count ?? 0;
}

export const getDebriefQuota = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const free = await isFreeTier(context.userId);
    const used = await countDebriefsThisMonth(context.userId);
    const limit = free ? 1 : null; // null = unlimited (counts against Lumi pool)
    const blocked = free && used >= 1;
    return { used, limit, free, blocked };
  });

const StartInput = z.object({ postId: z.string().uuid() });

export const startDispatchDebrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => StartInput.parse(d))
  .handler(async ({ context, data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured.");

    const free = await isFreeTier(context.userId);
    if (free) {
      const used = await countDebriefsThisMonth(context.userId);
      if (used >= 1) throw new Error("DEBRIEF_FREE_CAP_REACHED");
    } else {
      await assertQUnderCap(context.userId);
    }

    const { data: post, error: postErr } = await supabaseAdmin
      .from("posts")
      .select("id, slug, title, subtitle, excerpt, body, section")
      .eq("id", data.postId)
      .maybeSingle();
    if (postErr || !post) throw new Error("Dispatch not found.");

    const p = post as {
      id: string;
      slug: string;
      title: string;
      subtitle: string | null;
      excerpt: string;
      body: string;
      section: string;
    };

    // Generate the opener from the 3-2-1's "1 actionable".
    let actionable = "";
    let opener = "";
    try {
      const system = [
        "You are Lumi, the operator-coach inside The CS Quarterly.",
        "A reader just finished a dispatch built on the 3-2-1 model: 3 facts, 2 insights, 1 actionable.",
        "Extract the single actionable from the dispatch, then write Lumi's opening message.",
        "Return JSON exactly: {\"actionable\":\"<≤140 chars, the 1 actionable\>\",\"opener\":\"<exactly 2 short sentences. Sentence 1 names what they just read in one specific clause. Sentence 2 asks one focused operator question that forces them to apply the actionable to a real account or situation right now.>\"}",
        "Tone: McKinsey register. No emoji. No hedging. No preamble. Address the reader directly ('you').",
      ].join("\n");
      const userPrompt = [
        `TITLE: ${p.title}`,
        p.subtitle ? `SUBTITLE: ${p.subtitle}` : "",
        `EXCERPT: ${p.excerpt}`,
        `BODY (first 5000 chars):\n${(p.body ?? "").slice(0, 5000)}`,
      ].filter(Boolean).join("\n\n");
      const raw = await callChatJson(apiKey, system, userPrompt);
      const parsed = JSON.parse(raw) as { actionable?: string; opener?: string };
      if (typeof parsed.actionable === "string") actionable = parsed.actionable.trim();
      if (typeof parsed.opener === "string") opener = parsed.opener.trim();
    } catch {
      /* fall through to default */
    }
    if (!opener) {
      opener = `You just read "${p.title}". What's the one account this applies to right now?`;
    }

    const dispatchTag = [{
      source: "dispatch-debrief",
      post_id: p.id,
      slug: p.slug,
      title: p.title,
      section: p.section,
      framework: actionable || "Dispatch debrief",
      why: p.excerpt,
      excerpt: p.excerpt,
      subtitle: p.subtitle,
      similarity: 1,
      id: p.id,
    }];

    const situationLine = `Debriefing the dispatch "${p.title}". Actionable: ${actionable || "(see dispatch)"}`;

    const { data: inserted, error } = await (
      context.supabase as unknown as { from: (t: string) => any }
    )
      .from("situation_sessions")
      .insert({
        user_id: context.userId,
        situation: situationLine,
        dispatches: dispatchTag as never,
        messages: [{ role: "assistant", content: opener }] as never,
        title: `Debrief: ${p.title}`,
      })
      .select("id")
      .single();
    if (error || !inserted) throw new Error(error?.message ?? "Could not start debrief.");

    await supabaseAdmin.from("q_runs").insert({
      user_id: context.userId,
      node_id: FREE_DEBRIEF_NODE,
      context: { postId: p.id, slug: p.slug, title: p.title.slice(0, 200) },
      witty: false,
      zones: { diagnosis: "", playbook: actionable.slice(0, 4000), executable: opener.slice(0, 4000) },
    });

    const usedAfter = free ? await countDebriefsThisMonth(context.userId) : 0;

    return {
      sessionId: (inserted as { id: string }).id,
      opening: opener,
      actionable,
      free,
      usedThisMonth: usedAfter,
      freeLimit: free ? 1 : null,
    };
  });
