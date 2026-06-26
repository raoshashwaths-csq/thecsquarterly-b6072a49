import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertQUnderCap } from "./q-usage.functions";

const EMBED_MODEL = "openai/text-embedding-3-small";
const EMBED_DIM = 1536;
const CHAT_MODEL = "google/gemini-2.5-flash";

// ---------------------------------------------------------------------------
// Situation Room per-user quota (admin-configurable via app_settings)
// ---------------------------------------------------------------------------

type SituationWindow = "day" | "week" | "month";
type SituationLimits = { max_prompts: number; window: SituationWindow };

const DEFAULT_LIMITS: SituationLimits = { max_prompts: 5, window: "month" };

function windowBounds(window: SituationWindow): { startIso: string; resetIso: string } {
  const now = new Date();
  if (window === "day") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const reset = new Date(start.getTime() + 86_400_000);
    return { startIso: start.toISOString(), resetIso: reset.toISOString() };
  }
  if (window === "week") {
    // ISO week, Monday 00:00 UTC
    const day = now.getUTCDay(); // 0..6, Sun=0
    const diff = (day + 6) % 7; // days since Monday
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff));
    const reset = new Date(start.getTime() + 7 * 86_400_000);
    return { startIso: start.toISOString(), resetIso: reset.toISOString() };
  }
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const reset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { startIso: start.toISOString(), resetIso: reset.toISOString() };
}

async function loadSituationLimits(): Promise<SituationLimits> {
  const { data } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", "situation_room.limits")
    .maybeSingle();
  const raw = (data as { value?: Partial<SituationLimits> } | null)?.value;
  const max = Number(raw?.max_prompts);
  const win = raw?.window;
  return {
    max_prompts: Number.isFinite(max) && max > 0 ? Math.floor(max) : DEFAULT_LIMITS.max_prompts,
    window: win === "day" || win === "week" || win === "month" ? win : DEFAULT_LIMITS.window,
  };
}

async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  return !!data;
}

async function logLumiEvent(userId: string, event: string, meta: Record<string, unknown>): Promise<void> {
  try {
    await supabaseAdmin.from("lumi_events").insert({ user_id: userId, event, meta: meta as never });
  } catch {
    /* metrics are best-effort */
  }
}

async function countSituationsInWindow(userId: string, startIso: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from("situation_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startIso);
  return count ?? 0;
}

async function assertSituationQuota(userId: string): Promise<void> {
  if (await isAdmin(userId)) return;
  const limits = await loadSituationLimits();
  const { startIso } = windowBounds(limits.window);
  const used = await countSituationsInWindow(userId, startIso);
  if (used >= limits.max_prompts) {
    await logLumiEvent(userId, "situation.quota_blocked", {
      used,
      max: limits.max_prompts,
      window: limits.window,
    });
    throw new Error("SITUATION_QUOTA_EXCEEDED");
  }
}



type Dispatch = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  section: string;
  excerpt: string;
  similarity: number;
  framework: string;
  why: string;
};

type ChatMsg = { role: "user" | "assistant"; content: string };

async function embedText(apiKey: string, text: string): Promise<number[] | null> {
  const input = text.trim().slice(0, 4000);
  if (!input) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({ model: EMBED_MODEL, input, dimensions: EMBED_DIM }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: Array<{ embedding?: number[] }> };
    const v = json.data?.[0]?.embedding;
    return Array.isArray(v) && v.length === EMBED_DIM ? v : null;
  } catch {
    return null;
  }
}

async function callChat(
  apiKey: string,
  system: string,
  messages: ChatMsg[],
  jsonObject = false,
): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({
      model: CHAT_MODEL,
      ...(jsonObject ? { response_format: { type: "json_object" } } : {}),
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });
  if (res.status === 429) throw new Error("Lumi is at capacity — try again in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings.");
  if (!res.ok) throw new Error(`Lumi failed (${res.status})`);
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content ?? "";
}

const StartInput = z.object({
  situation: z.string().trim().min(20).max(4000),
});

export const startSituation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => StartInput.parse(d))
  .handler(async ({ context, data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured.");
    await assertSituationQuota(context.userId);
    await assertQUnderCap(context.userId);

    const situation = data.situation;

    // 1. Embed the situation and retrieve top dispatches.
    const vec = await embedText(apiKey, situation);
    let dispatches: Dispatch[] = [];
    if (vec) {
      const { data: matches } = await (supabaseAdmin.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: Array<{ id: string; slug: string; title: string; similarity: number }> | null }>)(
        "match_posts",
        { _query: vec as unknown as number[], _k: 3, _section: null },
      );

      const slugs = (matches ?? []).map((m) => m.slug);
      if (slugs.length) {
        const { data: rows } = await supabaseAdmin
          .from("posts")
          .select("id, slug, title, subtitle, section, excerpt, body")
          .in("slug", slugs);
        const simBySlug = new Map((matches ?? []).map((m) => [m.slug, m.similarity]));

        // 2. Ask LLM to extract the framework name + relevance for each.
        for (const row of rows ?? []) {
          let framework = "Applicable framework";
          let why = row.excerpt ?? "";
          try {
            const extract = await callChat(
              apiKey,
              "You extract structured fields from a CS dispatch given an operator's live situation. Return JSON: {\"framework\":\"<short framework name, max 6 words>\",\"why\":\"<1-2 sentences on why this dispatch applies>\"}. Be concrete; no fluff.",
              [
                {
                  role: "user",
                  content: `OPERATOR SITUATION:\n${situation}\n\nDISPATCH TITLE: ${row.title}\nDISPATCH EXCERPT: ${row.excerpt}\nDISPATCH BODY (first 1500 chars):\n${(row.body ?? "").slice(0, 1500)}`,
                },
              ],
              true,
            );
            const parsed = JSON.parse(extract) as { framework?: string; why?: string };
            if (typeof parsed.framework === "string" && parsed.framework.trim()) framework = parsed.framework.trim();
            if (typeof parsed.why === "string" && parsed.why.trim()) why = parsed.why.trim();
          } catch {
            /* fall back to excerpt */
          }
          dispatches.push({
            id: row.id,
            slug: row.slug,
            title: row.title,
            subtitle: row.subtitle,
            section: row.section,
            excerpt: row.excerpt,
            similarity: simBySlug.get(row.slug) ?? 0,
            framework,
            why,
          });
        }
        dispatches.sort((a, b) => b.similarity - a.similarity);
      }
    }

    // 3. Opening message from Lumi.
    const dispatchContext = dispatches
      .map((d, i) => `[${i + 1}] "${d.title}" — framework: ${d.framework}\nExcerpt: ${d.excerpt}`)
      .join("\n\n");
    const openingSystem = [
      "You are Lumi, the CS analyst inside The CS Quarterly's Situation Room.",
      "An operator just pasted a high-stakes live situation. You have retrieved 3 relevant dispatches from the archive.",
      "Open the coaching conversation in 3 short paragraphs:",
      "1. Name the situation pattern in one line (e.g. 'classic stakeholder displacement, T-21 days').",
      "2. Reference dispatch [1] by title and state the single framework/data point that most applies right now.",
      "3. Ask ONE focused follow-up question to narrow the situation. No bulleted checklists yet.",
      "Tone: McKinsey register. No emoji, no hedging, no preamble.",
      "",
      "RETRIEVED DISPATCHES:",
      dispatchContext || "(no dispatches matched — proceed from first principles)",
    ].join("\n");

    const opening = await callChat(apiKey, openingSystem, [
      { role: "user", content: situation },
    ]);

    // 4. Persist the session.
    const { data: inserted, error } = await (context.supabase as unknown as { from: (t: string) => any })
      .from("situation_sessions")
      .insert({
        user_id: context.userId,
        situation,
        dispatches: dispatches as never,
        messages: [{ role: "assistant", content: opening }] as never,
      })
      .select("id")
      .single();
    if (error || !inserted) throw new Error(error?.message ?? "Could not start session.");

    // Cap accounting (mirrors askCSFactorsQ).
    await supabaseAdmin.from("q_runs").insert({
      user_id: context.userId,
      node_id: "situation-room",
      context: { situation: situation.slice(0, 2000), sessionId: (inserted as { id: string }).id },
      witty: false,
      zones: { diagnosis: "", playbook: "", executable: opening.slice(0, 8000) },
    });


    return {
      sessionId: (inserted as { id: string }).id,
      dispatches,
      opening,
    };
  });

const ContinueInput = z.object({
  sessionId: z.string().uuid(),
  message: z.string().trim().min(1).max(2000),
});

/**
 * The Situation Room is one-shot by design: a single Lumi read per situation.
 * This endpoint exists only to reject any extra messages and record the attempt
 * for monitoring. It never calls the AI and never spends tokens.
 */
export const continueSituation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ContinueInput.parse(d))
  .handler(async ({ context, data }) => {
    await logLumiEvent(context.userId, "situation.extra_attempt_blocked", {
      sessionId: data.sessionId,
      messagePreview: data.message.slice(0, 200),
    });
    throw new Error("SITUATION_SESSION_LOCKED");
  });

export const getSituationQuota = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await isAdmin(context.userId);
    const limits = await loadSituationLimits();
    const { startIso, resetIso } = windowBounds(limits.window);
    if (admin) {
      return {
        used: 0,
        max: null as number | null,
        remaining: null as number | null,
        window: limits.window,
        resetAt: resetIso,
        unlimited: true,
      };
    }
    const used = await countSituationsInWindow(context.userId, startIso);
    const remaining = Math.max(0, limits.max_prompts - used);
    return {
      used,
      max: limits.max_prompts,
      remaining,
      window: limits.window,
      resetAt: resetIso,
      unlimited: false,
    };
  });


const SaveInput = z.object({
  sessionId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
});

export const saveSituationLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SaveInput.parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await (context.supabase as unknown as { from: (t: string) => any })
      .from("situation_sessions")
      .update({ saved_to_workspace: true, title: data.title })
      .eq("id", data.sessionId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSituationSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as unknown as { from: (t: string) => any })
      .from("situation_sessions")
      .select("id, situation, title, saved_to_workspace, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{
      id: string;
      situation: string;
      title: string | null;
      saved_to_workspace: boolean;
      created_at: string;
    }>;
  });

export const getSituationSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ sessionId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await (context.supabase as unknown as { from: (t: string) => any })
      .from("situation_sessions")
      .select("id, situation, dispatches, messages, title, saved_to_workspace, created_at")
      .eq("id", data.sessionId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Situation not found.");
    return row as unknown as {
      id: string;
      situation: string;
      dispatches: Dispatch[];
      messages: ChatMsg[];
      title: string | null;
      saved_to_workspace: boolean;
      created_at: string;
    };
  });
