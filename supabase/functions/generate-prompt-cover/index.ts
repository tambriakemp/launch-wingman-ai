import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, referenceImageUrl } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build message content
    const contentParts: any[] = [
      {
        type: "text",
        text: `Generate an image based on this prompt. Create a high-quality, visually striking image. IMPORTANT: Frame the shot as a wide or medium shot so the main subject is fully visible from head to toe (if a person) or in its entirety. Do NOT crop tightly or zoom in — leave breathing room around the subject. Use a 16:9 or 3:2 landscape composition:\n\n${prompt}`,
      },
    ];

    // Add reference image if provided
    if (referenceImageUrl) {
      contentParts.push({
        type: "image_url",
        image_url: { url: referenceImageUrl },
      });
      // Update instruction to reference the image
      contentParts[0] = {
        type: "text",
        text: `The reference image shows the person/subject that MUST appear in the generated image. Preserve their exact facial features, hair, skin tone, body type, and overall appearance. Generate the scene described below but featuring this exact person. Do NOT change or replace the person — they must be recognizable as the same individual from the reference photo. IMPORTANT: Frame the shot as a wide or medium shot so the person is fully visible from head to toe. Do NOT crop tightly or zoom in — leave breathing room around the subject. Use a 16:9 or 3:2 landscape composition. Create a high-quality, visually striking image:\n\n${prompt}`,
      };
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview",
          messages: [
            {
              role: "user",
              content: contentParts,
            },
          ],
          modalities: ["image", "text"],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl =
      data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "No image was generated. Try a different prompt." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ imageBase64: imageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-prompt-cover error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
