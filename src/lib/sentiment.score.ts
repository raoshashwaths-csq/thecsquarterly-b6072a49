// Pure client lexicon scorer — no AI gateway round-trip needed for a 3-bucket label.
// Returns one of "positive" | "neutral" | "negative" plus the raw score for debug.

export type SentimentLabel = "positive" | "neutral" | "negative";

const POSITIVE = [
  "great", "good", "well", "win", "won", "resolved", "calm", "relieved",
  "grateful", "confident", "renewed", "expanded", "aligned", "supportive",
  "clear", "progress", "breakthrough", "settled", "thanks", "happy",
  "celebrated", "saved", "retained", "growth", "agreed", "approved",
];

const NEGATIVE = [
  "bad", "worse", "anxious", "stressed", "stress", "angry", "frustrated",
  "frustrating", "hostile", "tense", "blocked", "stuck", "drained", "burned",
  "burnout", "exhausted", "lost", "losing", "lose", "churn", "escalated",
  "blew", "blown", "yelled", "blamed", "rejected", "denied", "dispute",
  "conflict", "messy", "ugly", "spiral", "panic", "fear", "scared", "hopeless",
  "dread", "overwhelmed", "miserable", "fight", "broken",
];

const INTENSIFIERS = ["very", "extremely", "really", "deeply", "completely"];
const NEGATORS = ["not", "no", "never", "didn't", "wasn't", "isn't", "aren't"];

export function scoreSentiment(raw: string): { label: SentimentLabel; score: number } {
  if (!raw || !raw.trim()) return { label: "neutral", score: 0 };
  const tokens = raw.toLowerCase().replace(/[^\w\s']/g, " ").split(/\s+/).filter(Boolean);
  let score = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const prev = tokens[i - 1] ?? "";
    const prev2 = tokens[i - 2] ?? "";
    const intensify = INTENSIFIERS.includes(prev) || INTENSIFIERS.includes(prev2) ? 2 : 1;
    const negate = NEGATORS.includes(prev) || NEGATORS.includes(prev2);
    let delta = 0;
    if (POSITIVE.includes(t)) delta = 1;
    else if (NEGATIVE.includes(t)) delta = -1;
    if (!delta) continue;
    if (negate) delta = -delta;
    score += delta * intensify;
  }
  const label: SentimentLabel = score >= 2 ? "positive" : score <= -2 ? "negative" : "neutral";
  return { label, score };
}
