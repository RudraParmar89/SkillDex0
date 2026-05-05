import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    const { candidateEmail, candidateName, jobTitle, emailType, customMessage } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");

    const prompt = `Write a professional ${emailType === "interview" ? "interview invitation" : "job offer"} email for ${candidateName} for the role of ${jobTitle}. ${customMessage ? `Additional note: ${customMessage}` : ""} Keep it concise. Return only the HTML email body.`;

    const aiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a professional HR email writer. Return only the HTML email body content, no subject line." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiRes.ok) throw new Error("AI generation failed");
    const aiData = await aiRes.json();
    
    return new Response(JSON.stringify({
      success: true,
      subject: emailType === "interview" ? `Interview Invitation - ${jobTitle}` : `Congratulations! Job Offer - ${jobTitle}`,
      body: aiData.choices?.[0]?.message?.content || "<p>Please contact us for next steps.</p>",
      to: candidateEmail,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});