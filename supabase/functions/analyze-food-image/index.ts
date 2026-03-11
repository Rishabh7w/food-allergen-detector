import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface UserProfile {
  allergies: string[];
  severity: "mild" | "moderate" | "severe";
  crossContaminationSensitive: boolean;
}

function computeRiskScore(
  detectedAllergens: { name: string; risk: string; isPersonalRisk: boolean }[],
  userProfile: UserProfile | null
): { riskScore: number; riskLevel: string; recommendation: string } {
  if (!detectedAllergens.length) {
    return { riskScore: 0, riskLevel: "Safe", recommendation: "No allergens detected. This food appears safe to consume." };
  }

  let baseScore = 0;
  const personalMatches = detectedAllergens.filter((a) => a.isPersonalRisk);
  const highRiskCount = detectedAllergens.filter((a) => a.risk === "high").length;
  const mediumRiskCount = detectedAllergens.filter((a) => a.risk === "medium").length;

  // Base scoring from detected allergens
  baseScore += highRiskCount * 25;
  baseScore += mediumRiskCount * 12;
  baseScore += detectedAllergens.filter((a) => a.risk === "low").length * 5;

  // Personal risk amplification
  if (userProfile && personalMatches.length > 0) {
    if (userProfile.severity === "severe") {
      baseScore = Math.max(baseScore, 90);
      baseScore += personalMatches.length * 5;
    } else if (userProfile.severity === "moderate") {
      baseScore = Math.max(baseScore, 60);
      baseScore += personalMatches.length * 8;
    } else {
      // mild
      baseScore = Math.max(baseScore, 40);
      baseScore += personalMatches.length * 5;
    }

    if (userProfile.crossContaminationSensitive) {
      baseScore += 10;
    }
  }

  const riskScore = Math.min(100, Math.max(0, baseScore));

  let riskLevel: string;
  let recommendation: string;

  if (riskScore <= 30) {
    riskLevel = "Safe";
    recommendation = "This food appears safe for consumption. Always check labels for certainty.";
  } else if (riskScore <= 60) {
    riskLevel = "Caution";
    recommendation = "Some potential allergens detected. Verify ingredients before consuming.";
  } else if (riskScore <= 85) {
    riskLevel = "High Risk";
    recommendation = "Significant allergen risk detected. Avoid if you have known allergies to these substances.";
  } else {
    riskLevel = "Critical";
    recommendation = "CRITICAL: Severe allergen risk. Avoid consumption immediately.";
  }

  return { riskScore, riskLevel, recommendation };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, ingredients, userAllergens, userProfile, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const profileContext = userProfile
      ? `\n\nCRITICAL - USER ALLERGY PROFILE:
- Allergies: ${userProfile.allergies?.join(", ") || "None"}
- Severity: ${userProfile.severity || "moderate"}
- Cross-contamination sensitive: ${userProfile.crossContaminationSensitive ? "YES" : "NO"}
Flag ANY ingredient that could trigger these specific allergies as HIGH RISK with isPersonalRisk=true.`
      : userAllergens?.length
        ? `\n\nCRITICAL - USER ALLERGIES: ${userAllergens.join(", ")}. Flag matching allergens with isPersonalRisk=true.`
        : "";

    const systemPrompt = `You are an expert multi-modal food allergen detection system combining computer vision, OCR, and NLP analysis.${profileContext}

Your capabilities:
1. **Image Analysis (CNN/Vision)**: Identify food items, ingredients, and potential allergens from food photos
2. **OCR & Label Reading**: Extract and analyze ingredient text from food packaging labels
3. **NLP Allergen Detection**: Parse ingredient lists to detect allergen keywords and hidden allergens
4. **Personalized Risk Engine**: Cross-reference findings with the user's allergy profile
5. **Explainability (Grad-CAM Simulation)**: When analyzing images, identify the specific regions you focused on. Return attention regions with normalized coordinates (0-1), labels, and intensity scores. Focus on regions containing allergen-relevant ingredients, food items, or label text.

You MUST respond using the multimodal_allergen_analysis tool. Analyze thoroughly for these allergen categories:
- Milk/Dairy, Eggs, Fish, Shellfish/Crustaceans, Tree Nuts, Peanuts
- Wheat/Gluten, Soybeans, Sesame, Mustard, Celery, Lupin, Mollusks, Sulfites

For each detected allergen provide: name, risk level (high/medium/low), source (which ingredient/visual cue), explanation, and whether it's a personal risk for this user.

Also extract any visible ingredients from images, provide OCR text if a label is detected, and give personalized safety recommendations.`;

    const messages: any[] = [{ role: "system", content: systemPrompt }];

    if (mode === "image" && imageBase64) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: `Analyze this food image for allergens.${ingredients ? ` Additional context: ${ingredients}` : ""}` },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
        ]
      });
    } else if (mode === "label" && imageBase64) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: "This is a food product label/packaging. Perform OCR to extract all ingredients, then analyze for allergens. Identify any allergen declarations (Contains:, May contain:, etc)." },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: `Analyze these food ingredients for allergens: ${ingredients}`
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: "multimodal_allergen_analysis",
              description: "Return comprehensive multi-modal allergen analysis results",
              parameters: {
                type: "object",
                properties: {
                  detectedFood: { type: "array", items: { type: "string" } },
                  extractedIngredients: { type: "string" },
                  allergens: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        risk: { type: "string", enum: ["high", "medium", "low"] },
                        triggeredBy: { type: "string" },
                        explanation: { type: "string" },
                        isPersonalRisk: { type: "boolean" },
                        detectionMethod: { type: "string", enum: ["vision", "ocr", "nlp", "cross-reference"] }
                      },
                      required: ["name", "risk", "triggeredBy", "explanation", "isPersonalRisk", "detectionMethod"],
                      additionalProperties: false
                    }
                  },
                  overallSafety: { type: "string", enum: ["safe", "caution", "danger"] },
                  personalSafety: { type: "string", enum: ["safe", "caution", "danger"] },
                  summary: { type: "string" },
                  personalizedWarning: { type: "string" },
                  recommendations: { type: "array", items: { type: "string" } },
                  analysisMethodsUsed: {
                    type: "array",
                    items: { type: "string", enum: ["Computer Vision (CNN)", "OCR Text Extraction", "NLP Ingredient Analysis", "Personalized Risk Engine"] }
                  },
                  confidenceScore: { type: "number" },
                  attentionRegions: {
                    type: "array",
                    description: "Regions of the image the model focused on for its prediction. Each region has normalized coordinates (0-1), a label, and intensity.",
                    items: {
                      type: "object",
                      properties: {
                        x: { type: "number", description: "Normalized center X coordinate (0-1)" },
                        y: { type: "number", description: "Normalized center Y coordinate (0-1)" },
                        width: { type: "number", description: "Normalized width (0-1)" },
                        height: { type: "number", description: "Normalized height (0-1)" },
                        label: { type: "string", description: "What was detected in this region" },
                        intensity: { type: "number", description: "Attention intensity 0-1 (1 = highest focus)" },
                        allergenRisk: { type: "string", enum: ["high", "medium", "low", "none"] }
                      },
                      required: ["x", "y", "width", "height", "label", "intensity", "allergenRisk"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["detectedFood", "extractedIngredients", "allergens", "overallSafety", "personalSafety", "summary", "personalizedWarning", "recommendations", "analysisMethodsUsed", "confidenceScore", "attentionRegions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "multimodal_allergen_analysis" } },
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
      const aiResult = JSON.parse(toolCall.function.arguments);

      // Apply server-side risk scoring engine
      const parsedProfile: UserProfile | null = userProfile
        ? { allergies: userProfile.allergies || [], severity: userProfile.severity || "moderate", crossContaminationSensitive: !!userProfile.crossContaminationSensitive }
        : userAllergens?.length
          ? { allergies: userAllergens, severity: "moderate", crossContaminationSensitive: false }
          : null;

      const riskAssessment = computeRiskScore(aiResult.allergens || [], parsedProfile);

      const result = {
        ...aiResult,
        riskAssessment: {
          riskScore: riskAssessment.riskScore,
          riskLevel: riskAssessment.riskLevel,
          recommendation: riskAssessment.recommendation,
        },
        foodPrediction: {
          name: aiResult.detectedFood?.[0] || "Unknown",
          confidence: (aiResult.confidenceScore || 0) / 100,
        },
        explainability: {
          heatmapImageUrl: null,
          attentionRegions: aiResult.attentionRegions || [],
        },
      };

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Could not parse analysis results" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-food-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
