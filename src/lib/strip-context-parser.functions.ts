import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function assertAdmin(userId: string) {
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (!(roles ?? []).some((r) => r.role === "admin")) throw new Error("Forbidden");
}

function getCloudflareEnv() {
  return {
    AI_GATEWAY_URL: process.env.AI_GATEWAY_URL!,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID!,
    CLOUDFLARE_API_KEY: process.env.CLOUDFLARE_API_KEY!,
    AI_GATEWAY_NAME: process.env.AI_GATEWAY_NAME!,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Category extraction from aggregated alt text
// ─────────────────────────────────────────────────────────────────────────────

function deriveCategory(text: string): string {
  const lowered = text.toLowerCase();
  const keywords: Record<string, string[]> = {
    "Champion Risk": ["champion", "single thread", "stakeholder", "backup"],
    "Renewal Conversations": ["renewal", "qbr", "executive", "cfo"],
    "Expansion Play": ["expansion", "upsell", "cross-sell", "pricing"],
    "Escalation": ["escalation", "crisis", "incident", "downtime"],
    "Team Dynamics": ["manager", "managing up", "politics", "peer"],
    "AI & Tools": ["ai", "automation", "dashboard", "tool"],
    "Diagnostics": ["diagnostic", "benchmark", "assessment", "survey"],
  };

  for (const [category, words] of Object.entries(keywords)) {
    if (words.some((w) => lowered.includes(w))) return category;
  }
  return "General";
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-panel AI vision analysis
// ─────────────────────────────────────────────────────────────────────────────

interface PanelAnalysis {
  altText: string;
  placements: Array<{
    targetType: "post" | "playbook";
    targetSlug: string;
    placement: "after-intro" | "after-section" | "end";
    confidence: number;
    note: string;
  }>;
}

async function analyzePanelImage(imageUrl: string, existingAlt: string): Promise<PanelAnalysis> {
  const env = getCloudflareEnv();

  const res = await fetch(
    `${env.AI_GATEWAY_URL}/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.CLOUDFLARE_API_KEY}`,
        "Content-Type": "application/json",
        "cf-ai-gateway": env.AI_GATEWAY_NAME,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: `Analyze this comic strip panel for a B2B SaaS editorial.

${existingAlt ? `Existing alt text: "${existingAlt}"` : "No existing alt text."}

Provide a JSON response with:
1. "altText": Improved, descriptive alt text for accessibility
2. "placements": Array of suggested placements, each with:
   - "targetType": "post" or "playbook"
   - "targetSlug": slug of the relevant article or playbook
   - "placement": "after-intro", "after-section", or "end"
   - "confidence": number 0-1
   - "note": brief explanation of why this placement fits

Consider these content slugs for matching:
- Posts: high-touch-cs-scaling-liability, negotiators-dilemma-renewals, stakeholder-mapping-frameworks, escalation-playbook-c-suite, qualification-bridge-sales-cs, ai-orchestration-cs-org
- Playbooks: renewal-conversation-backwards, feature-request-never-built, champion-leaves-48-hours, escalation-first-60-seconds, executive-digest-replaces-qbr, expansion-conversation-no-pitch, managing-up-without-politics

Return ONLY valid JSON.`,
          },
          {
            role: "user",
            content: imageUrl, // Vision model accepts image URL as content
          },
        ],
        max_tokens: 1024,
      }),
    }
  );

  if (!res.ok) throw new Error(`Vision model error: ${res.status}`);

  const json = await res.json() as { result?: { response?: string } };
  const raw = json.result?.response ?? "";

  // Extract JSON from markdown code block if present
  const jsonMatch = raw.match(/```json\n?([\s\S]*?)\n?```/) || raw.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch?.[1] ?? jsonMatch?.[0] ?? raw);

  return {
    altText: parsed.altText ?? existingAlt ?? "",
    placements: (parsed.placements ?? []).map((p: Record<string, unknown>) => ({
      targetType: (p.targetType ?? p.target_type ?? "post") as "post" | "playbook",
      targetSlug: String(p.targetSlug ?? p.target_slug ?? ""),
      placement: (p.placement ?? "after-intro") as "after-intro" | "after-section" | "end",
      confidence: Math.min(1, Math.max(0, Number(p.confidence) || 0.5)),
      note: String(p.note ?? ""),
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main exported server function: AI-powered strip context parser
// ─────────────────────────────────────────────────────────────────────────────

export const parseStripContext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      stripId: z.string().uuid(),
      panels: z.array(
        z.object({
          imageUrl: z.string().optional(),
          imageAlt: z.string().optional(),
        })
      ),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    // 1. Fetch existing placements to avoid duplicates
    const { data: existing } = await supabaseAdmin
      .from("strip_placements")
      .select("target_slug")
      .eq("strip_id", data.stripId);
    const existingSlugs = new Set((existing ?? []).map((p) => p.target_slug));

    // 2. Call AI for each panel with imageUrl
    const panelContexts: PanelAnalysis[] = [];
    for (const panel of data.panels) {
      if (!panel.imageUrl) continue;

      // Vision model uses image URL directly in the message content
      const ctx = await analyzePanelImage(panel.imageUrl, panel.imageAlt ?? "");
      panelContexts.push(ctx);
    }

    // 3. Aggregate -- pick the highest-confidence placement per target
    const allPlacements = panelContexts.flatMap((c) => c.placements ?? []);
    const bestBySlug = new Map<string, PanelAnalysis["placements"][0]>();
    for (const p of allPlacements) {
      if (existingSlugs.has(p.targetSlug)) continue; // skip already-placed
      const existingPlacement = bestBySlug.get(p.targetSlug);
      if (!existingPlacement || p.confidence > existingPlacement.confidence) {
        bestBySlug.set(p.targetSlug, p);
      }
    }

    // 4. Derive category from alt texts
    const allAlts = panelContexts.map((c) => c.altText).filter(Boolean);
    const category = deriveCategory(allAlts.join(" "));

    return {
      category,
      altTexts: panelContexts.map((c) => c.altText),
      placements: Array.from(bestBySlug.values()).map((p) => ({
        targetType: p.targetType, // "post" | "playbook"
        targetSlug: p.targetSlug, // e.g. "high-touch-cs-scaling-liability"
        placement: p.placement, // "after-intro" | "after-section" | "end"
        confidence: p.confidence, // 0-1
        adminNote: p.note, // "why this placement"
      })),
    };
  });
