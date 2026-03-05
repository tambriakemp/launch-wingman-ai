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
        text: `CRITICAL INSTRUCTION — IDENTITY PRESERVATION:
You are given a reference photo of a real person. This is the ONLY person who must appear in the generated image. You MUST:
1. Use the EXACT same face, facial structure, eye shape, eye color, nose, lips, jawline, skin tone, and complexion from the reference photo — do NOT alter, beautify, age, or stylize them.
2. Match their hair color, texture, and approximate length.
3. Match their body type and proportions.
4. The generated person must be immediately recognizable as the same individual in the reference photo. If placed side by side, a viewer should have zero doubt it is the same person.
5. Do NOT substitute, blend, or merge with any other person's features.

COMPOSITION: Frame as a wide or medium shot. The person must be fully visible (head to toe if standing). Do NOT crop tightly or zoom in. Leave breathing room. Use 16:9 or 3:2 landscape composition.

Now generate a high-quality, visually striking image for this scene, featuring the EXACT person from the reference photo:\n\n${prompt}`,
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
    console.log("AI response structure:", JSON.stringify(Object.keys(data)));
    console.log("First choice keys:", JSON.stringify(data.choices?.[0] ? Object.keys(data.choices[0]) : "no choices"));
    const message = data.choices?.[0]?.message;
    if (message) {
      console.log("Message keys:", JSON.stringify(Object.keys(message)));
    }

    // Try multiple known response formats
    let imageUrl =
      message?.images?.[0]?.image_url?.url ||   // Lovable AI format
      message?.content?.[0]?.image_url?.url ||   // OpenAI-style multimodal
      null;

    // Check if content is an array with image parts
    if (!imageUrl && Array.isArray(message?.content)) {
      const imgPart = message.content.find((p: any) => p.type === "image_url" || p.image_url);
      if (imgPart) {
        imageUrl = imgPart.image_url?.url || imgPart.url;
      }
    }

    // Check inline_data format (Gemini native)
    if (!imageUrl && message?.content?.[0]?.inline_data) {
      const inline = message.content[0].inline_data;
      imageUrl = `data:${inline.mime_type};base64,${inline.data}`;
    }

    if (!imageUrl) {
      console.error("Full AI response (no image found):", JSON.stringify(data).slice(0, 2000));
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
