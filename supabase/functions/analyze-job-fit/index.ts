import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { resumeText, jobTitle, jobDescription, jobRequirements } = await req.json();
    if (!resumeText || !jobTitle) throw new Error("resumeText and jobTitle are required");

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const systemPrompt = `You are an expert recruiter and hiring manager. Analyze how well a candidate's resume matches a specific job role. Return a JSON object with this exact structure:
{
  "fitScore": <number 0-100>,
  "fitLevel": "<string: 'Excellent Fit' | 'Good Fit' | 'Moderate Fit' | 'Weak Fit' | 'Poor Fit'>",
  "summary": "<string: 2-3 sentence overall assessment>",
  "matchedSkills": [<string array of skills from resume that match the job>],
  "missingSkills": [<string array of important skills for the job that are missing>],
  "strengths": [<string array of 2-4 key strengths for this role>],
  "concerns": [<string array of 2-4 potential concerns or gaps>]
}
Scoring: 80-100 Excellent, 60-79 Good, 40-59 Moderate, 20-39 Weak, 0-19 Poor.`;

    const jobContext = `Job Title: ${jobTitle}\n${jobDescription ? `Description: ${jobDescription}` : ""}\n${jobRequirements?.length ? `Requirements: ${jobRequirements.join(", ")}` : ""}`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${jobContext}\n\nCandidate Resume:\n${resumeText.slice(0, 6000)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_fit_analysis",
            parameters: {
              type: "object",
              properties: {
                fitScore: { type: "number" }, fitLevel: { type: "string" }, summary: { type: "string" },
                matchedSkills: { type: "array", items: { type: "string" } }, missingSkills: { type: "array", items: { type: "string" } },
                strengths: { type: "array", items: { type: "string" } }, concerns: { type: "array", items: { type: "string" } },
              },
              required: ["fitScore", "fitLevel", "summary", "matchedSkills", "missingSkills", "strengths", "concerns"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_fit_analysis" } },
      }),
    });

    if (!response.ok) throw new Error(`AI error: ${response.status}`);
    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    return new Response(toolCall.function.arguments, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("analyze-job-fit error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});