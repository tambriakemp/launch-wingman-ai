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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { prompts, pdfUrl, mode } = await req.json();

    let promptTexts: string[] = [];

    if (mode === "pdf" && pdfUrl) {
      // Pass the public URL directly to the AI API to avoid memory limits

      const extractResponse = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-pro",
            messages: [
              {
                role: "system",
                content:
                  "You are a document parser specializing in extracting AI image generation prompts from visually complex PDF layouts. The PDF may use a multi-column grid layout where each prompt is a text block paired with a corresponding image (above, below, or beside it). Read across all columns on every page, top to bottom, left to right. Each text block near an image is a separate, complete prompt. Do NOT merge text from adjacent columns. Return ONLY the prompts as a JSON array of strings. Each string should be one complete, standalone prompt exactly as written.",
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Extract all individual AI image generation prompts from this PDF. The document uses a magazine-style multi-column grid layout where each prompt appears as a text block near a photo. Read across columns on each page and extract every prompt as a separate entry. Return them as a JSON array of strings.",
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: pdfUrl,
                    },
                  },
                ],
              },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "extract_prompts",
                  description: "Return extracted prompts from the PDF",
                  parameters: {
                    type: "object",
                    properties: {
                      prompts: {
                        type: "array",
                        items: { type: "string" },
                        description: "Array of individual prompt texts",
                      },
                    },
                    required: ["prompts"],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: {
              type: "function",
              function: { name: "extract_prompts" },
            },
          }),
        }
      );



      if (!extractResponse.ok) {
        const errText = await extractResponse.text();
        console.error("AI extract error:", extractResponse.status, errText);
        throw new Error(`AI extraction failed: ${extractResponse.status}`);
      }

      const extractData = await extractResponse.json();
      const toolCall = extractData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const parsed = JSON.parse(toolCall.function.arguments);
        promptTexts = parsed.prompts || [];
      }
    } else if (prompts && Array.isArray(prompts)) {
      promptTexts = prompts.filter((p: string) => p.trim().length > 0);
    } else {
      throw new Error("Provide either prompts array or pdfUrl");
    }

    if (promptTexts.length === 0) {
      return new Response(
        JSON.stringify({ prompts: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate titles for all prompts using AI
    const titleResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
              content:
                "You are a naming specialist for AI image generation prompts. Read the ENTIRE prompt carefully. Your job is to create SHORT, UNIQUE titles that describe the VISUAL SCENE depicted. NEVER copy or paraphrase the opening sentence of the prompt.\n\nProcess:\n1) WHERE is the scene set? (e.g., 'Rooftop bar', 'Sunlit vineyard', 'Rainy Tokyo street')\n2) WHAT is the subject wearing? (e.g., 'Red slip dress', 'Oversized blazer')\n3) What CAMERA ANGLE is described? (e.g., 'Full Body', 'Medium Shot', 'Close-Up')\n\nFormat: 'SETTING — OUTFIT (ANGLE)'\nKeep titles 4-8 words total. Each title must be distinct even if prompts are similar.",
            },
            {
              role: "user",
              content: `Here are examples of the expected output:

Input: "A woman standing on a sunlit rooftop terrace overlooking the city skyline at golden hour. She is wearing a flowing red maxi dress with delicate gold jewelry. The wind gently moves her hair. Full body shot captured with natural lighting."
Title: "Rooftop Terrace — Red Maxi Dress (Full Body)"

Input: "Close-up portrait in a cozy coffee shop with warm ambient lighting. The subject wears an oversized cream knit sweater with minimal makeup. Shallow depth of field with bokeh background."
Title: "Coffee Shop — Cream Sweater (Close-Up)"

Input: "Medium shot of a woman walking through a vibrant flower market in the early morning. She is dressed in a linen jumpsuit with a straw tote bag. Soft diffused light."
Title: "Flower Market — Linen Jumpsuit (Medium Shot)"

Now generate titles for each prompt below using the same format. Do NOT echo the prompt's wording.\n\n${promptTexts
                .map((p, i) => `[${i + 1}]: ${p.substring(0, 600)}`)
                .join("\n\n")}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_titles",
                description: "Return generated titles for prompts",
                parameters: {
                  type: "object",
                  properties: {
                    titles: {
                      type: "array",
                      items: { type: "string" },
                      description:
                        "Array of short titles, one per prompt, in same order",
                    },
                  },
                  required: ["titles"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_titles" },
          },
        }),
      }
    );

    let titles: string[] = promptTexts.map(
      (_, i) => `Prompt ${i + 1}`
    );

    if (titleResponse.ok) {
      const titleData = await titleResponse.json();
      const toolCall = titleData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const parsed = JSON.parse(toolCall.function.arguments);
      if (parsed.titles && parsed.titles.length > 0) {
          titles = promptTexts.map((_, i) => parsed.titles[i] || `Prompt ${i + 1}`);
        }
      }
    } else {
      console.error("Title generation failed, using defaults");
      await titleResponse.text(); // consume body
    }

    const result = promptTexts.map((text, i) => ({
      title: titles[i] || `Prompt ${i + 1}`,
      text,
    }));

    return new Response(
      JSON.stringify({ prompts: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("parse-prompts-bulk error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
