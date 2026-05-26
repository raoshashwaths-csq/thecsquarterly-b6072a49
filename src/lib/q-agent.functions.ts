import { createServerFn } from "@tanstack/react-start";

export const askQ = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const o = input as { question?: string; witty?: boolean };
    if (!o.question || typeof o.question !== "string") throw new Error("Question required");
    if (o.question.length > 1000) throw new Error("Question too long");
    return { question: o.question.trim(), witty: Boolean(o.witty) };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI not configured");

    const system = data.witty
      ? "You are Q, the operator agent for The CS Quarterly — a Wodehouse-witted consigliere for Customer Success leaders. Reply in 2–4 short paragraphs with dry British wit, vivid metaphor, and the air of a slightly amused butler. Underneath the wit, deliver a real, sharp operator answer about CS, escalations, churn, QBRs, or expansion. Never use emoji. Never hedge."
      : "You are Q, the operator agent for The CS Quarterly. Audience: VPs and Directors of Customer Success at $20M–$1B ARR SaaS companies. Reply in 2–4 tight paragraphs, McKinsey register — structured, opinionated, specific. No fluff, no hype, no emoji. Lead with the operator answer, then the why.";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: data.question },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Q is at capacity — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted.");
    if (!res.ok) throw new Error(`Q failed (${res.status})`);

    const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const reply = json.choices?.[0]?.message?.content ?? "";
    return { reply };
  });
