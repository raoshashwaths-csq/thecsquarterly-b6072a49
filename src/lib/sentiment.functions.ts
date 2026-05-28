import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { scoreSentiment, type SentimentLabel } from "@/lib/sentiment.score";

const RecordInput = z.object({
  rawText: z.string().min(1).max(4000),
  flaggedKeywords: z.array(z.string().min(1).max(80)).max(20).optional(),
});

export const recordDailySentiment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => RecordInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { label } = scoreSentiment(data.rawText);
    const today = new Date().toISOString().slice(0, 10);

    const { error } = await supabase
      .from("user_daily_sentiment")
      .upsert(
        {
          user_id: userId,
          date: today,
          raw_text_feedback: data.rawText,
          calculated_sentiment_score: label,
          flagged_keywords: data.flaggedKeywords ?? [],
        },
        { onConflict: "user_id,date" },
      );

    if (error) throw new Error(error.message);
    return { ok: true, label, date: today };
  });

export type DailySentimentRow = {
  date: string;
  calculated_sentiment_score: SentimentLabel;
  flagged_keywords: string[];
};

export const getMonthlySentiment = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data, error } = await supabase
      .from("user_daily_sentiment")
      .select("date, calculated_sentiment_score, flagged_keywords")
      .eq("user_id", userId)
      .gte("date", since.toISOString().slice(0, 10))
      .order("date", { ascending: true });

    if (error) throw new Error(error.message);
    return { rows: (data ?? []) as DailySentimentRow[] };
  });
