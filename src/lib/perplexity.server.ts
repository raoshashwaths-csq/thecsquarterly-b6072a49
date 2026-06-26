/**
 * Perplexity live-research helper for Lumi.
 *
 * Lumi's primary context is the operator's own data (CSFactors portfolio) and
 * the curated lumi_knowledge corpus. When the operator asks something that
 * requires *current external* intelligence — benchmarks, market trends, a
 * specific public company, vendor research, or anything time-bounded that the
 * model would otherwise hallucinate — we ground the answer with a single
 * Perplexity `sonar` call and inject the grounded answer + citations into
 * the system prompt.
 *
 * Server-only: do NOT import this from `*.functions.ts` at module scope
 * (handler bodies only). It reads PERPLEXITY_API_KEY from process.env.
 */

const PPLX_MODEL = "sonar";

// CS-industry / publication allow-list for source filtering (mirrors the
// weekly external-intel pull). Tight enough to keep Lumi credible.
const DOMAIN_FILTER = [
  "keybanc.com", "iconiqcapital.com", "mckinsey.com", "bain.com", "bcg.com",
  "saastr.com", "gainsight.com", "churnzero.com", "openviewpartners.com",
  "pavilion.so", "forrester.com", "gartner.com", "tsia.com", "totango.com",
  "catalyst.io", "vitally.io", "hbr.org", "harvard.edu", "deloitte.com",
  "kpmg.com", "pwc.com", "scaleventurepartners.com",
];

const RESEARCH_SIGNALS = [
  /\bbenchmark/i,
  /\bindustry\b/i,
  /\bmarket\b/i,
  /\btrend/i,
  /\bresearch\b/i,
  /\baverage\b/i,
  /\bmedian\b/i,
  /\bpercentile\b/i,
  /\bcompetitor/i,
  /\bcurrent\b/i,
  /\blatest\b/i,
  /\brecent\b/i,
  /\bnews\b/i,
  /\b20(2[4-9]|3\d)\b/, // recent/forward years
  /\bsaas\b.{0,40}\b(nrr|grr|churn|payback|cac|ltv|nps)\b/i,
  /\bwhat (is|are) (the )?(typical|standard|average|median)\b/i,
];

export function shouldUseLiveResearch(question: string): boolean {
  if (!question || question.length < 4) return false;
  return RESEARCH_SIGNALS.some((re) => re.test(question));
}

export type LiveResearchStatus =
  | "ok" // grounded answer + (likely) citations
  | "disabled" // no PERPLEXITY_API_KEY
  | "empty" // call succeeded but no usable content
  | "error"; // network / non-200

export type LiveResearch = {
  answer: string;
  citations: string[];
  block: string; // formatted system-prompt block, "" when nothing usable
  status: LiveResearchStatus;
  attempted: boolean; // true when we tried (i.e. caller deemed it research-style)
};

const FALLBACK_NOTE = [
  "LIVE EXTERNAL RESEARCH: unavailable for this question (Perplexity returned no usable result).",
  "Acknowledge this to the operator in one short sentence — e.g. \"I couldn't pull fresh external research on that just now\" — then answer as best you can from the operator's own portfolio data and the curated knowledge above. Do not invent benchmarks, numbers, or sources.",
].join("\n");

function emptyResult(status: LiveResearchStatus, attempted: boolean): LiveResearch {
  return {
    answer: "",
    citations: [],
    block: attempted ? FALLBACK_NOTE : "",
    status,
    attempted,
  };
}

/**
 * One-shot grounded search. Best-effort: never throws. When the call fails
 * or returns nothing, `block` carries a fallback instruction telling Lumi to
 * disclose the gap and fall back to portfolio context.
 */
export async function fetchLiveResearch(
  question: string,
  opts?: { mode?: "web" | "academic"; recency?: "day" | "week" | "month" | "year" },
): Promise<LiveResearch> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return emptyResult("disabled", true);

  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: PPLX_MODEL,
        max_tokens: 600,
        temperature: 0.1,
        search_mode: opts?.mode ?? "web",
        search_recency_filter: opts?.recency ?? "year",
        search_domain_filter: DOMAIN_FILTER,
        messages: [
          {
            role: "system",
            content:
              "You are a research assistant for Customer Success operators (VPs and Directors at $20M–$1B ARR SaaS). Reply in 2–4 tight sentences. Always cite a specific number or finding plus the source name. No hedging, no marketing language, no emoji.",
          },
          { role: "user", content: question },
        ],
      }),
    });

    if (!res.ok) return emptyResult("error", true);
    const j = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      citations?: string[];
    };
    const answer = j.choices?.[0]?.message?.content?.trim() ?? "";
    if (!answer) return emptyResult("empty", true);
    const citations = Array.isArray(j.citations) ? j.citations.slice(0, 6) : [];

    const citeBlock = citations.length
      ? `\nSources: ${citations.map((c, i) => `[${i + 1}] ${c}`).join("  ")}`
      : "";

    const block = [
      "LIVE EXTERNAL RESEARCH (from Perplexity, grounded in industry sources):",
      answer,
      citeBlock,
      "Use this only if it directly supports the operator's question. Attribute claims to the source name. If the operator asked about their own portfolio, the portfolio data above wins.",
    ]
      .filter(Boolean)
      .join("\n");

    return { answer, citations, block, status: "ok", attempted: true };
  } catch {
    return emptyResult("error", true);
  }
}

