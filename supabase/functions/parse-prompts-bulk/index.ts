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
      // Download PDF and convert to base64 data URL (Gemini requires data URLs for PDFs, not raw URLs)
      const pdfResponse = await fetch(pdfUrl);
      if (!pdfResponse.ok) throw new Error("Failed to download PDF from storage");
      const pdfArrayBuf = await pdfResponse.arrayBuffer();
      const pdfBytes = new Uint8Array(pdfArrayBuf);
      let binary = "";
      for (let i = 0; i < pdfBytes.length; i++) {
        binary += String.fromCharCode(pdfBytes[i]);
      }
      const pdfBase64 = btoa(binary);
      const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`;

      const extractResponse = await fetch(
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
                  "You are a document parser. Extract individual AI image generation prompts from this PDF content. Each prompt is typically separated by headings, images, or page breaks. Return ONLY the prompts as a JSON array of strings. Each string should be a complete, standalone prompt.",
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Extract all individual AI image generation prompts from this PDF. Return them as a JSON array of strings.",
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: pdfDataUrl,
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
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content:
                "Generate short, descriptive titles (3-6 words) for AI image generation prompts. Each title should capture the essence/subject of the prompt.",
            },
            {
              role: "user",
              content: `Generate a short title (3-6 words) for each of these ${promptTexts.length} prompts:\n\n${promptTexts
                .map((p, i) => `Prompt ${i + 1}: ${p.substring(0, 200)}`)
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
        if (parsed.titles && parsed.titles.length === promptTexts.length) {
          titles = parsed.titles;
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
