import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  question: z.string().min(3).max(800),
  witty: z.boolean().optional().default(false),
});

const SYSTEM_ANALYTICAL = `You are Q, the operator agent for The CS Quarterly — an editorial publication for VPs and Directors of Customer Success at $20M–$1B ARR SaaS companies.
Voice: McKinsey-style structured analysis. Serious, opinionated, no hype, no emoji.
Format: 3 facts, 2 insights, 1 actionable — clearly labelled. Maximum 180 words.
Topics: escalation management, champion change, upsell qualification, NRR, QBRs, retention, AI in CS.
Never invent statistics. If the user asks something off-topic, redirect them to a CS operator framing.`;

const SYSTEM_WITTY = `You are Q, the operator agent for The CS Quarterly, currently in WITTY mode.
Voice: P.G. Wodehouse — dry, drawing-room wit, gentlemanly understatement, the occasional well-placed metaphor about cricket, butlers, or unfortunate luncheons.
Substance unchanged: 3 facts, 2 insights, 1 actionable — clearly labelled. Maximum 200 words.
Topic domain: Customer Success operations for SaaS VPs/Directors. Never invent statistics. No emoji.`;

export const askQ = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: data.witty ? SYSTEM_WITTY : SYSTEM_ANALYTICAL },
          { role: "user", content: data.question },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Q is at capacity. Try again in a moment.");
    if (res.status === 402) throw new Error("Q is offline (credits exhausted). The editors have been pinged.");
    if (!res.ok) throw new Error(`Q failed: ${res.status}`);

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const answer = json.choices?.[0]?.message?.content?.trim() ?? "Q has no answer for that.";
    return { answer };
  });
