import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { ingredients } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert food allergen detection system. Analyze the given food ingredients and detect potential allergens.

You MUST respond using the suggest_allergens tool. Analyze each ingredient carefully for these major allergen categories:
- Milk/Dairy
- Eggs
- Fish
- Shellfish/Crustaceans
- Tree Nuts
- Peanuts
- Wheat/Gluten
- Soybeans
- Sesame
- Mustard
- Celery
- Lupin
- Mollusks
- Sulfites

For each detected allergen, provide:
- The allergen name
- Risk level: "high" (definitely contains), "medium" (may contain/cross-contamination risk), "low" (trace amounts possible)
- Which specific ingredient(s) triggered the detection
- A brief explanation

Also provide an overall safety summary and any recommendations.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze these food ingredients for allergens: ${ingredients}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_allergens",
              description: "Return detected allergens with risk levels and details",
              parameters: {
                type: "object",
                properties: {
                  allergens: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Allergen name" },
                        risk: { type: "string", enum: ["high", "medium", "low"] },
                        triggeredBy: { type: "string", description: "Which ingredient(s) triggered this" },
                        explanation: { type: "string", description: "Brief explanation" },
                      },
                      required: ["name", "risk", "triggeredBy", "explanation"],
                      additionalProperties: false,
                    },
                  },
                  overallSafety: { type: "string", enum: ["safe", "caution", "danger"] },
                  summary: { type: "string", description: "Overall safety summary" },
                  recommendations: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of recommendations",
                  },
                },
                required: ["allergens", "overallSafety", "summary", "recommendations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_allergens" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service credits exhausted. Please try again later." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Could not parse analysis results" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("detect-allergens error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
