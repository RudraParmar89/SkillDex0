import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { resumeText } = await req.json();
    if (!resumeText) throw new Error("resumeText is required");

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) resume analyzer. Analyze the provided resume text and return a JSON object with this exact structure:
{
  "score": <number 0-100>,
  "pros": [<string array of 3-7 strengths>],
  "cons": [<string array of 3-7 weaknesses>],
  "recommendations": [<string array of 4-8 actionable improvements>],
  "keywords": { "found": [<string array>], "missing": [<string array>] },
  "sections": [ {"name": "Contact Information", "found": <boolean>}, {"name": "Summary/Objective", "found": <boolean>}, {"name": "Work Experience", "found": <boolean>}, {"name": "Education", "found": <boolean>}, {"name": "Skills", "found": <boolean>} ]
}
Scoring criteria: Completeness (30%), Keyword relevance (25%), Formatting (15%), Quantifiable achievements (15%), ATS compatibility (15%).`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this resume:\n\n${resumeText.slice(0, 8000)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_analysis",
            parameters: {
              type: "object",
              properties: {
                score: { type: "number" }, pros: { type: "array", items: { type: "string" } }, cons: { type: "array", items: { type: "string" } }, recommendations: { type: "array", items: { type: "string" } },
                keywords: { type: "object", properties: { found: { type: "array", items: { type: "string" } }, missing: { type: "array", items: { type: "string" } } }, required: ["found", "missing"] },
                sections: { type: "array", items: { type: "object", properties: { name: { type: "string" }, found: { type: "boolean" } }, required: ["name", "found"] } },
              },
              required: ["score", "pros", "cons", "recommendations", "keywords", "sections"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_analysis" } },
      }),
    });

    if (!response.ok) throw new Error(`AI error: ${response.status}`);
    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    return new Response(toolCall.function.arguments, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("analyze-resume error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});