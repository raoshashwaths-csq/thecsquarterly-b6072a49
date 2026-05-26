import { createServerFn } from "@tanstack/react-start";

type Tone = "analytical" | "witty";

const SYSTEM_ANALYTICAL = `You are Q, the operator-grade Chief of Staff agent for The CS Quarterly — a publication for VPs, Directors, and Senior CSMs at $20M–$1B ARR SaaS companies.
Voice: McKinsey-style analytical. Crisp, structured, opinionated. No hype, no emoji.
Format: 3 facts, 2 insights, 1 actionable. Keep it under 180 words. Use short paragraphs, not bullet symbols.`;

const SYSTEM_WITTY = `You are Q, the operator-grade Chief of Staff agent for The CS Quarterly.
Voice: Wodehouse-style witty narrative — droll, urbane, lightly self-aware, never silly. Think a sharp British observer in a boardroom.
Still operator-grade underneath: 3 facts, 2 insights, 1 actionable, dressed in narrative prose. Under 200 words. No emoji.`;

export const askQ = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const o = input as { prompt?: string; tone?: Tone };
    if (!o.prompt || typeof o.prompt !== "string") throw new Error("Prompt required");
    if (o.prompt.length > 2000) throw new Error("Prompt too long");
    const tone: Tone = o.tone === "witty" ? "witty" : "analytical";
    return { prompt: o.prompt.trim(), tone };
  })
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI gateway not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: data.tone === "witty" ? SYSTEM_WITTY : SYSTEM_ANALYTICAL },
          { role: "user", content: data.prompt },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Q is overloaded — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted — contact the editor.");
    if (!res.ok) throw new Error(`Q failed (${res.status})`);

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) throw new Error("Q returned an empty response.");
    return { text, tone: data.tone };
  });
