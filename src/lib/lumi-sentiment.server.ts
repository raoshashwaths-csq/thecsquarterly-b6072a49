// Server-only sentiment engine for tagged Lumi runs.
// Layer A: lexicon scorer (free, instant). Layer B: AI tiebreaker on borderline /
// disagreement / thin reply. Best-effort — AI failure falls back to lexicon.
import { scoreSentiment } from "./sentiment.score";

export type AccountSentiment = "Positive" | "Neutral" | "Critical";
export type StakeholderSentiment = "positive" | "neutral" | "negative";

export type InferredSentiment = {
  label: AccountSentiment;
  stakeholderLabel: StakeholderSentiment;
  confidence: "low" | "med" | "high";
  source: "lexicon" | "ai";
  rationale: string;
  rawScore: number;
};

function toAccount(label: "positive" | "neutral" | "negative"): AccountSentiment {
  return label === "positive" ? "Positive" : label === "negative" ? "Critical" : "Neutral";
}
function toStakeholder(label: AccountSentiment): StakeholderSentiment {
  return label === "Positive" ? "positive" : label === "Critical" ? "negative" : "neutral";
}

export async function inferLumiRunSentiment(args: {
  question: string;
  reply: string;
  priorAccount?: AccountSentiment | null;
  priorStakeholder?: StakeholderSentiment | null;
}): Promise<InferredSentiment> {
  const text = `${args.question}\n${args.reply}`.trim();
  const lex = scoreSentiment(text);
  const lexLabel = toAccount(lex.label);

  // Decide whether to escalate to AI.
  const borderline = lex.label === "neutral" && Math.abs(lex.score) >= 1;
  const disagrees =
    !!args.priorAccount &&
    ((args.priorAccount === "Critical" && lexLabel === "Positive") ||
      (args.priorAccount === "Positive" && lexLabel === "Critical"));
  const thinReply = args.reply.trim().length < 200;

  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey || (!borderline && !disagrees && !thinReply)) {
    const confidence: InferredSentiment["confidence"] =
      Math.abs(lex.score) >= 4 ? "high" : Math.abs(lex.score) >= 2 ? "med" : "low";
    return {
      label: lexLabel,
      stakeholderLabel: toStakeholder(lexLabel),
      confidence,
      source: "lexicon",
      rationale: `Lexicon score ${lex.score}`,
      rawScore: lex.score,
    };
  }

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Classify the sentiment of the operator's situation described in this Lumi exchange about a specific customer account. Focus on the customer relationship health, NOT the quality of Lumi's answer. Return JSON: {\"label\":\"Positive|Neutral|Critical\",\"confidence\":\"low|med|high\",\"rationale\":\"one short sentence\"}. Critical = relationship is at risk, escalation, churn signal, hostility. Positive = renewal locked, expansion, champion strong, calm. Neutral = routine, mixed, or unclear.",
          },
          {
            role: "user",
            content: `Question: ${args.question}\n\nLumi answer: ${args.reply.slice(0, 3000)}`,
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`AI ${res.status}`);
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as {
      label?: string;
      confidence?: string;
      rationale?: string;
    };
    const label: AccountSentiment =
      parsed.label === "Positive" || parsed.label === "Critical" || parsed.label === "Neutral"
        ? parsed.label
        : lexLabel;
    const confidence: InferredSentiment["confidence"] =
      parsed.confidence === "high" || parsed.confidence === "med" || parsed.confidence === "low"
        ? parsed.confidence
        : "med";
    return {
      label,
      stakeholderLabel: toStakeholder(label),
      confidence,
      source: "ai",
      rationale: (parsed.rationale ?? "").slice(0, 240) || `Lexicon score ${lex.score}`,
      rawScore: lex.score,
    };
  } catch {
    const confidence: InferredSentiment["confidence"] =
      Math.abs(lex.score) >= 4 ? "high" : Math.abs(lex.score) >= 2 ? "med" : "low";
    return {
      label: lexLabel,
      stakeholderLabel: toStakeholder(lexLabel),
      confidence,
      source: "lexicon",
      rationale: `Lexicon score ${lex.score} (AI fallback)`,
      rawScore: lex.score,
    };
  }
}

// Rolling majority over the last N events (including the new one).
// 3+ Critical → Critical; 3+ Positive → Positive; else Neutral.
export function rollingAccountSentiment(recent: AccountSentiment[]): AccountSentiment {
  const last = recent.slice(-5);
  let pos = 0, crit = 0;
  for (const l of last) {
    if (l === "Positive") pos++;
    else if (l === "Critical") crit++;
  }
  if (crit >= 3) return "Critical";
  if (pos >= 3) return "Positive";
  return "Neutral";
}
