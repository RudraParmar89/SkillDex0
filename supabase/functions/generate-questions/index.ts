import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { role, count } = await req.json();
    if (!role || typeof role !== "string" || role.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Role is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const numQuestions = Math.min(Math.max(count || 10, 3), 15);
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert recruiter and hiring manager. Generate exactly ${numQuestions} high-quality pre-screening interview questions for candidates applying to a specific job role. The questions should:
- Be behavioral and situational (STAR method friendly)
- Test both technical competence and cultural fit
- Range from fundamental to advanced
- Be specific to the role, not generic
- Help differentiate strong candidates from average ones

Return ONLY a JSON array of strings, no other text. Example: ["Question 1?", "Question 2?"]`,
          },
          { role: "user", content: `Generate ${numQuestions} pre-screening questions for the role: "${role.trim()}"` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_questions",
            description: "Return the generated screening questions",
            parameters: {
              type: "object",
              properties: { questions: { type: "array", items: { type: "string" }, description: "Array of screening questions" } },
              required: ["questions"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_questions" } },
      }),
    });

    if (!response.ok) throw new Error(`AI error: ${response.status}`);
    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ questions: parsed.questions }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const content = data.choices?.[0]?.message?.content || "[]";
    return new Response(JSON.stringify({ questions: JSON.parse(content) }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-questions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});