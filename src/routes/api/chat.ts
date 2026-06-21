import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type ChatRequestBody = { messages?: unknown };

async function fetchLatestContext() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const sb = createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const fetchOne = (type: string) =>
    sb
      .from("watch_events")
      .select("heart_rate,spo2,steps,score,created_at")
      .eq("event_type", type)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

  const [vitals, steps, score] = await Promise.all([
    fetchOne("vitals"),
    fetchOne("steps"),
    fetchOne("game_score"),
  ]);
  return {
    heart_rate: vitals.data?.heart_rate ?? null,
    spo2: vitals.data?.spo2 ?? null,
    steps: steps.data?.steps ?? null,
    score: score.data?.score ?? null,
  };
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(body.messages)) {
          return new Response("Messages required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const ctx = await fetchLatestContext();
        const ctxBlock = ctx
          ? `Latest smartwatch readings:\n- Heart Rate: ${ctx.heart_rate ?? "n/a"} bpm\n- SpO2: ${ctx.spo2 ?? "n/a"}%\n- Steps: ${ctx.steps ?? "n/a"}\n- Game Score: ${ctx.score ?? "n/a"}`
          : "No recent smartwatch readings available.";

        const system = `You are a friendly smartwatch health companion. Use the user's live data below to give short, conversational wellness tips. Do NOT provide medical diagnoses — suggest seeing a professional for medical concerns. Keep replies under 3 short sentences and use occasional emojis.\n\n${ctxBlock}`;

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");
        const result = streamText({
          model,
          system,
          messages: await convertToModelMessages(body.messages as UIMessage[]),
        });
        return result.toUIMessageStreamResponse({
          originalMessages: body.messages as UIMessage[],
        });
      },
    },
  },
});
