import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { questions, answers, jobTitle } = await req.json();
    if (!questions || !answers || !jobTitle) throw new Error("Missing data");

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const qaPairs = questions.map((q: any, i: number) => `Q${i + 1}: ${q.question}\nA${i + 1}: ${answers[q.id] || "(No answer provided)"}`).join("\n\n");

    const systemPrompt = `You are an expert recruiter evaluating pre-screening answers for a "${jobTitle}" position. Score each answer and provide an overall ranking score.
Return a JSON object with this exact structure:
{
  "overallScore": <number 0-100>,
  "answerScores": [ { "questionId": "<string>", "score": <number 0-10>, "feedback": "<short 1-sentence evaluation>" } ],
  "summary": "<2-sentence overall assessment>"
}`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: qaPairs },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_answer_scores",
            parameters: {
              type: "object",
              properties: {
                overallScore: { type: "number" },
                answerScores: { type: "array", items: { type: "object", properties: { questionId: { type: "string" }, score: { type: "number" }, feedback: { type: "string" } }, required: ["questionId", "score", "feedback"] } },
                summary: { type: "string" },
              },
              required: ["overallScore", "answerScores", "summary"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_answer_scores" } },
      }),
    });

    if (!response.ok) throw new Error(`AI error: ${response.status}`);
    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    return new Response(toolCall.function.arguments, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("score-answers error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});