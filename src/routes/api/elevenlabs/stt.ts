import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const MAX_AUDIO_BYTES = 12 * 1024 * 1024;

const ElevenLabsResponse = z.object({
  text: z.string().optional().default(""),
});

async function verifyBearer(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return false;
  const supabase = createClient(url, key, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(authHeader.slice("Bearer ".length));
  return !error && !!data.user;
}

export const Route = createFileRoute("/api/elevenlabs/stt")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authed = await verifyBearer(request);
        if (!authed) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "ElevenLabs is not configured." }, { status: 503 });
        }

        const form = await request.formData();
        const audio = form.get("audio");
        if (!(audio instanceof Blob)) {
          return Response.json({ error: "Audio file is required." }, { status: 400 });
        }
        if (audio.size > MAX_AUDIO_BYTES) {
          return Response.json({ error: "Voice note is too long. Try a shorter question." }, { status: 413 });
        }

        const upstream = new FormData();
        upstream.append("file", audio, "q-voice-input.webm");
        upstream.append("model_id", "scribe_v2");
        upstream.append("tag_audio_events", "false");
        upstream.append("diarize", "false");
        upstream.append("language_code", "eng");

        try {
          const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
            method: "POST",
            headers: { "xi-api-key": apiKey },
            body: upstream,
          });

          const body = await response.text();
          if (!response.ok) {
            return Response.json(
              { error: response.status >= 500 ? "Speech service is temporarily unavailable." : "Voice transcription failed." },
              { status: response.status >= 500 ? 503 : response.status },
            );
          }

          const parsed = ElevenLabsResponse.safeParse(JSON.parse(body));
          if (!parsed.success) {
            return Response.json({ error: "Unexpected transcription response." }, { status: 502 });
          }
          return Response.json({ text: parsed.data.text.trim() });
        } catch {
          return Response.json({ error: "Speech service is temporarily unavailable." }, { status: 503 });
        }
      },
    },
  },
});