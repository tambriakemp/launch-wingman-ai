import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Photo categories mapping to subcategory slugs
const PHOTO_CATEGORIES = {
  "lifestyle": "Lifestyle photos - people using products, candid moments, real-life scenarios, people in everyday situations",
  "flat-lays": "Flat lay photos - top-down shots of arranged items on a flat surface, product arrangements viewed from above",
  "workspace": "Workspace photos - desk setups, office environments, work-from-home scenes, computer setups, creative workspaces",
  "nature": "Nature photos - outdoor scenes, plants, landscapes, natural elements, flowers, trees, scenic views",
  "mockups": "Mockup photos - product mockups, device frames, template-style images, branded merchandise displays",
  "dark-aesthetic": "Dark aesthetic photos - moody, dark-toned images with dramatic lighting, shadows, noir style"
};

interface AnalysisResult {
  subcategory: string;
  confidence: number;
  reasoning?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[ANALYZE-PHOTO] Function started");

    // Parse request
    const { imageBase64, filename } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Missing imageBase64 in request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("[ANALYZE-PHOTO] Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Lovable API key
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the category description for the prompt
    const categoryDescriptions = Object.entries(PHOTO_CATEGORIES)
      .map(([slug, desc]) => `- ${slug}: ${desc}`)
      .join("\n");

    const systemPrompt = `You are an expert photo categorization assistant. Analyze images and categorize them into exactly one of the predefined categories. Be decisive and consistent.`;

    const userPrompt = `Analyze this photo and categorize it into exactly ONE of these categories:

${categoryDescriptions}

Respond with a JSON object containing:
- subcategory: the category slug (one of: lifestyle, flat-lays, workspace, nature, mockups, dark-aesthetic)
- confidence: your confidence score from 0-100
- reasoning: brief explanation of why you chose this category

${filename ? `Filename hint: ${filename}` : ''}`;

    console.log("[ANALYZE-PHOTO] Calling Lovable AI for image analysis...");

    // Call Lovable AI with vision capability
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "categorize_photo",
              description: "Categorize the photo into one of the predefined subcategories",
              parameters: {
                type: "object",
                properties: {
                  subcategory: {
                    type: "string",
                    enum: ["lifestyle", "flat-lays", "workspace", "nature", "mockups", "dark-aesthetic"],
                    description: "The category slug for this photo"
                  },
                  confidence: {
                    type: "number",
                    minimum: 0,
                    maximum: 100,
                    description: "Confidence score from 0-100"
                  },
                  reasoning: {
                    type: "string",
                    description: "Brief explanation of why this category was chosen"
                  }
                },
                required: ["subcategory", "confidence"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "categorize_photo" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ANALYZE-PHOTO] AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    console.log("[ANALYZE-PHOTO] AI response received");

    // Extract the tool call result
    let result: AnalysisResult = { subcategory: "lifestyle", confidence: 50 };

    try {
      const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const parsed = JSON.parse(toolCall.function.arguments);
        result = {
          subcategory: parsed.subcategory || "lifestyle",
          confidence: parsed.confidence || 50,
          reasoning: parsed.reasoning
        };
      }
    } catch (parseError) {
      console.error("[ANALYZE-PHOTO] Error parsing AI response:", parseError);
      // Fall back to default
    }

    console.log(`[ANALYZE-PHOTO] Result: ${result.subcategory} (${result.confidence}% confidence)`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[ANALYZE-PHOTO] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
