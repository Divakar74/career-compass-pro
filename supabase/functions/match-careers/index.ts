import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MatchCareersRequest {
  assessmentId: string;
  answers: Array<{ questionId: string; answerText: string }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { assessmentId, answers }: MatchCareersRequest = await req.json();

    console.log("Processing career matching for assessment:", assessmentId);

    // Get all careers
    const { data: careers, error: careersError } = await supabase
      .from("careers")
      .select("*");

    if (careersError) {
      console.error("Error fetching careers:", careersError);
      throw careersError;
    }

    // Prepare answers summary for AI
    const answersSummary = answers.map(a => a.answerText).join("; ");

    // Call Lovable AI to analyze career matches
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const aiPrompt = `Based on the following user responses to a career assessment, analyze which careers from the list would be the best matches. Rate each career from 0-100 and provide brief reasoning.

User Responses: ${answersSummary}

Available Careers:
${careers?.map((c, i) => `${i + 1}. ${c.title} - ${c.description}`).join("\n")}

Return your analysis as a JSON array with this structure:
[{"careerIndex": 0, "score": 85, "reasoning": "Great match because..."}]

Only include careers with a score of 60 or higher. Order by score descending.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a career counseling expert. Analyze assessment responses and match them to suitable careers with accuracy and helpful reasoning.",
          },
          { role: "user", content: aiPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    // Parse AI response
    let matches;
    try {
      const parsed = JSON.parse(aiContent);
      matches = Array.isArray(parsed) ? parsed : parsed.matches || [];
    } catch (e) {
      console.error("Failed to parse AI response:", aiContent);
      throw new Error("Invalid AI response format");
    }

    // Save career matches to database
    const matchRecords = matches.map((match: any) => ({
      assessment_id: assessmentId,
      career_id: careers![match.careerIndex].id,
      match_score: match.score,
      reasoning: match.reasoning,
    }));

    const { error: insertError } = await supabase
      .from("career_matches")
      .insert(matchRecords);

    if (insertError) {
      console.error("Error saving matches:", insertError);
      throw insertError;
    }

    // Mark assessment as completed
    const { error: updateError } = await supabase
      .from("assessments")
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq("id", assessmentId);

    if (updateError) {
      console.error("Error updating assessment:", updateError);
      throw updateError;
    }

    console.log("Career matching completed successfully");

    return new Response(
      JSON.stringify({ success: true, matches: matchRecords.length }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in match-careers function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});