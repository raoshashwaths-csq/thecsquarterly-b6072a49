/**
 * Future Operator — server-only generation helpers.
 *
 * Service-role only. Never imported at module scope of route files or
 * *.functions.ts modules. Always load via dynamic import inside a handler.
 *
 * Every Future Operator call is metered against an admin-controlled budget
 * stored in `app_settings.future_operator.limits` — NOT against the
 * subscriber's monthly Lumi quota (q_usage).
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { FUTURE_OPERATOR_VOICE_RULES } from "./future-operator-voice";

const QUEST_MODEL = "google/gemini-2.5-flash";
const DRIFT_MODEL = "google/gemini-2.5-flash";
const REFLECTION_MODEL = "google/gemini-2.5-pro";
const INTRO_MODEL = "google/gemini-2.5-pro";

const LUMI_BASE_VOICE = [
  "You are Lumi — The CS Quarterly's operational advisor, speaking in the Future Operator persona.",
  "The audience is a VP/Director of Customer Success at a $20M–$1B ARR SaaS company.",
  "No hype, no hedging, no emoji. Economist / Stratechery register.",
].join("\n");

type FoProfile = {
  user_id: string;
  future_team_state: string | null;
  core_commitments: string[] | null;
  current_biggest_risk: string | null;
  current_focus_account: string | null;
  pending_renewal_at: string | null;
  last_quest_generated_at: string | null;
  active_quests: unknown;
  timezone: string;
};

async function callGateway(model: string, system: string, user: string, jsonMode = false): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Gateway ${res.status}: ${await res.text().catch(() => "")}`);
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return (json.choices?.[0]?.message?.content ?? "").trim();
}

async function loadProfile(userId: string): Promise<FoProfile | null> {
  const { data } = await supabaseAdmin
    .from("future_operator_profiles")
    .select(
      "user_id, future_team_state, core_commitments, current_biggest_risk, current_focus_account, pending_renewal_at, last_quest_generated_at, active_quests, timezone",
    )
    .eq("user_id", userId)
    .maybeSingle();
  return (data ?? null) as FoProfile | null;
}

async function recentLumiMemoryContext(userId: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from("lumi_memory")
    .select("content, memory_type, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(8);
  if (!data?.length) return "None yet.";
  return data.map((r) => `- (${r.memory_type ?? "note"}) ${r.content}`).join("\n");
}

/**
 * Admin-controlled budget gate. Counts today's notifications by type for
 * this user against `app_settings.future_operator.limits`. Throws on exceed
 * and writes a `lumi_events` row so admins can see budget pressure.
 *
 * NEVER decrements q_usage.
 */
export async function assertFutureOperatorBudget(
  userId: string,
  kind: "daily-quest" | "drift-signal" | "reflection-prompt" | "intro",
): Promise<void> {
  if (kind === "intro") return; // intro is one-off per onboarding
  const { data: settings } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", "future_operator.limits")
    .maybeSingle();

  type Limits = {
    daily_quest_calls_per_user_per_day?: number;
    drift_signals_per_user_per_day?: number;
    reflection_calls_per_user_per_day?: number;
  };
  const v = (settings?.value ?? {}) as Limits;
  const cap =
    kind === "daily-quest"
      ? v.daily_quest_calls_per_user_per_day ?? 1
      : kind === "drift-signal"
        ? v.drift_signals_per_user_per_day ?? 2
        : v.reflection_calls_per_user_per_day ?? 4;

  const startOfDayUtc = new Date();
  startOfDayUtc.setUTCHours(0, 0, 0, 0);

  const { count } = await supabaseAdmin
    .from("future_operator_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("type", kind)
    .gte("delivered_at", startOfDayUtc.toISOString());

  if ((count ?? 0) >= cap) {
    await supabaseAdmin.from("lumi_events").insert({
      user_id: userId,
      event_type: "future_operator.budget_blocked",
      meta: { kind, cap, used: count ?? 0 },
    } as never);
    throw new Error(`future_operator_budget_exceeded:${kind}`);
  }
}

function profileContextBlock(p: FoProfile, recent: string): string {
  return [
    `Future state they're heading toward: ${p.future_team_state ?? "not specified"}`,
    `Their three core commitments: ${(p.core_commitments ?? []).join(" | ") || "not specified"}`,
    `Their biggest current risk: ${p.current_biggest_risk ?? "not specified"}`,
    `Focus account: ${p.current_focus_account ?? "not specified"}`,
    `Nearest renewal: ${p.pending_renewal_at ?? "not specified"}`,
    `Recent Lumi context:\n${recent}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

export async function generateDailyQuestsFor(userId: string): Promise<{ ok: boolean; quests?: unknown[] }> {
  await assertFutureOperatorBudget(userId, "daily-quest");
  const profile = await loadProfile(userId);
  if (!profile) return { ok: false };

  const recent = await recentLumiMemoryContext(userId);
  const system = `${LUMI_BASE_VOICE}\n\n${FUTURE_OPERATOR_VOICE_RULES}\n\nGenerate exactly 3 daily quests for today. Each quest:
- A single, specific action they can complete today — not a mindset, not a vague goal
- CS-specific, tied to one of their core commitments or current risks
- Under 30 minutes to complete
- Written as instruction from their future self, second person present tense
- Concrete enough they cannot claim to have done it without actually doing it

Return JSON only:
{"quests":[{"id":"q1","label":"≤6 words","instruction":"≤60 words","commitment":"which commitment this serves","estimated_minutes":15,"lumi_followup":"the question Lumi asks when they mark complete"}]}`;

  const user = `${profileContextBlock(profile, recent)}\n\nGenerate today's three quests.`;
  const raw = await callGateway(QUEST_MODEL, system, user, true);

  type Quest = {
    id: string;
    label: string;
    instruction: string;
    commitment: string;
    estimated_minutes: number;
    lumi_followup: string;
    completed?: boolean;
  };
  let parsed: { quests?: Quest[] };
  try {
    parsed = JSON.parse(raw) as { quests?: Quest[] };
  } catch {
    return { ok: false };
  }
  const quests = (parsed.quests ?? []).slice(0, 3).map((q, i) => ({
    id: q.id || `q${i + 1}`,
    label: String(q.label ?? "").slice(0, 80),
    instruction: String(q.instruction ?? "").slice(0, 600),
    commitment: String(q.commitment ?? ""),
    estimated_minutes: Number.isFinite(q.estimated_minutes) ? Number(q.estimated_minutes) : 15,
    lumi_followup: String(q.lumi_followup ?? ""),
    completed: false,
  }));
  if (!quests.length) return { ok: false };

  await supabaseAdmin
    .from("future_operator_profiles")
    .update({
      active_quests: quests as never,
      last_quest_generated_at: new Date().toISOString(),
    } as never)
    .eq("user_id", userId);

  await supabaseAdmin.from("future_operator_notifications").insert({
    user_id: userId,
    type: "daily-quest",
    message: "Your three quests for today are ready.",
    subtext: quests[0].label,
    action_label: "See today's quests",
    action_route: "/account/quests",
    trigger_type: "scheduled",
    trigger_context: { quest_count: quests.length },
  } as never);

  return { ok: true, quests };
}

export async function generateDriftSignalFor(
  userId: string,
  triggerType: string,
  triggerContext: Record<string, unknown>,
): Promise<{ ok: boolean }> {
  await assertFutureOperatorBudget(userId, "drift-signal");
  const profile = await loadProfile(userId);
  if (!profile) return { ok: false };
  const recent = await recentLumiMemoryContext(userId);

  const system = `${LUMI_BASE_VOICE}\n\n${FUTURE_OPERATOR_VOICE_RULES}\n\nWrite a single Drift Signal triggered by: ${triggerType}.
Specific context: ${JSON.stringify(triggerContext)}.
Return ONLY the message text. No JSON, no quotes, no preamble. Under 80 words. End with one concrete instruction.`;

  const user = profileContextBlock(profile, recent);
  const message = await callGateway(DRIFT_MODEL, system, user, false);
  if (!message) return { ok: false };

  const actionRoute =
    triggerType === "quest-drift"
      ? "/account/quests"
      : triggerType === "lumi-drift"
        ? "/?lumi=open"
        : "/account/quests";
  const actionLabel =
    triggerType === "quest-drift"
      ? "See today's quests"
      : triggerType === "lumi-drift"
        ? "Open Lumi"
        : "Check in now";

  await supabaseAdmin.from("future_operator_notifications").insert({
    user_id: userId,
    type: "drift-signal",
    message,
    action_label: actionLabel,
    action_route: actionRoute,
    trigger_type: triggerType,
    trigger_context: triggerContext as never,
  } as never);

  // Randomise next drift signal — between 6 and 28 hours from now.
  const hoursUntilNext = 6 + Math.random() * 22;
  const next = new Date();
  next.setHours(next.getHours() + hoursUntilNext);
  await supabaseAdmin
    .from("future_operator_profiles")
    .update({ next_drift_signal_at: next.toISOString() } as never)
    .eq("user_id", userId);

  return { ok: true };
}

export async function generateReflectionPromptFor(
  userId: string,
  triggerEvent: string,
  triggerContext: Record<string, unknown>,
): Promise<{ ok: boolean }> {
  await assertFutureOperatorBudget(userId, "reflection-prompt");
  const profile = await loadProfile(userId);
  if (!profile) return { ok: false };
  const recent = await recentLumiMemoryContext(userId);

  const system = `${LUMI_BASE_VOICE}\n\n${FUTURE_OPERATOR_VOICE_RULES}\n\nWrite a single Reflection Prompt triggered by: ${triggerEvent}.
Context: ${JSON.stringify(triggerContext)}.
Return ONLY the message text. Under 40 words. End with one open question.`;

  const user = profileContextBlock(profile, recent);
  const message = await callGateway(REFLECTION_MODEL, system, user, false);
  if (!message) return { ok: false };

  const { data: inserted } = await supabaseAdmin
    .from("future_operator_notifications")
    .insert({
      user_id: userId,
      type: "reflection-prompt",
      message,
      action_label: "Open Lumi",
      action_route: "/?lumi=open",
      trigger_type: triggerEvent,
      trigger_context: triggerContext as never,
    } as never)
    .select("id")
    .maybeSingle();

  // Wire the Lumi-drawer seed once we have the row id, so opening the
  // drawer can pre-pend this notification's message as the first turn.
  if (inserted?.id) {
    await supabaseAdmin
      .from("future_operator_notifications")
      .update({ action_route: `/?lumi=open&seed=${inserted.id}` } as never)
      .eq("id", inserted.id);
  }
  return { ok: true };
}

export async function generateIntroMessageFor(userId: string): Promise<{ ok: boolean }> {
  const profile = await loadProfile(userId);
  if (!profile) return { ok: false };
  const recent = await recentLumiMemoryContext(userId);

  const system = `${LUMI_BASE_VOICE}\n\n${FUTURE_OPERATOR_VOICE_RULES}\n\nWrite the first Future Operator message this person will ever receive. Introduce yourself as them, 12 months from now. Reference at least one specific detail from their context. Under 90 words. End with a single forward-looking sentence about what comes next.`;
  const user = profileContextBlock(profile, recent);
  const message = await callGateway(INTRO_MODEL, system, user, false);
  if (!message) return { ok: false };

  await supabaseAdmin.from("future_operator_notifications").insert({
    user_id: userId,
    type: "intro",
    message,
    action_label: "See today's quests",
    action_route: "/account/quests",
    trigger_type: "onboarding",
  } as never);
  return { ok: true };
}
