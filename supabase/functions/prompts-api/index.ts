import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_ACTIONS = [
  "list_prompts",
  "search_prompts",
  "get_prompt",
  "update_prompt",
  "regenerate_cover",
  "list_characters",
] as const;

type Action = (typeof VALID_ACTIONS)[number];

async function authenticate(
  req: Request,
  supabaseUrl: string,
  anonKey: string
): Promise<{ userId: string; serviceClient: ReturnType<typeof createClient> }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.replace("Bearer ", "");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  if (token.startsWith("lw_sk_")) {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(token));
    const keyHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const { data: keyRow, error } = await serviceClient
      .from("personal_api_keys")
      .select("user_id")
      .eq("key_hash", keyHash)
      .maybeSingle();

    if (error || !keyRow) throw new Error("Invalid API key");

    serviceClient
      .from("personal_api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("key_hash", keyHash)
      .then(() => {});

    return { userId: keyRow.user_id, serviceClient };
  }

  // JWT auth
  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) throw new Error("Invalid token");

  return { userId: claimsData.claims.sub as string, serviceClient };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    const { userId, serviceClient } = await authenticate(req, SUPABASE_URL, SUPABASE_ANON_KEY);
    const body = await req.json().catch(() => ({}));
    const action = body.action as Action;

    if (!action || !VALID_ACTIONS.includes(action)) {
      return new Response(
        JSON.stringify({ error: `Invalid action. Valid: ${VALID_ACTIONS.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: unknown;

    switch (action) {
      case "list_prompts": {
        const limit = Math.min(body.limit || 50, 200);
        const offset = body.offset || 0;
        const tag = body.tag as string | undefined;
        const type = body.type as string | undefined;

        let query = serviceClient
          .from("content_vault_resources")
          .select("id, title, description, tags, resource_type, cover_image_url", { count: "exact" })
          .in("resource_type", type ? [type] : ["image_prompt", "video_prompt"])
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (tag) {
          query = query.contains("tags", [tag]);
        }

        const { data, error, count } = await query;
        if (error) throw error;

        result = {
          prompts: (data || []).map((r: any) => ({
            id: r.id,
            title: r.title,
            prompt: r.description,
            tags: r.tags || [],
            type: r.resource_type,
            cover_image_url: r.cover_image_url,
          })),
          total: count || 0,
          limit,
          offset,
        };
        break;
      }

      case "search_prompts": {
        const query = body.query as string;
        if (!query) {
          return new Response(JSON.stringify({ error: "query is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const limit = Math.min(body.limit || 20, 100);

        const { data, error } = await serviceClient
          .from("content_vault_resources")
          .select("id, title, description, tags, resource_type, cover_image_url")
          .in("resource_type", ["image_prompt", "video_prompt"])
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) throw error;

        result = {
          prompts: (data || []).map((r: any) => ({
            id: r.id,
            title: r.title,
            prompt: r.description,
            tags: r.tags || [],
            type: r.resource_type,
            cover_image_url: r.cover_image_url,
          })),
          query,
        };
        break;
      }

      case "get_prompt": {
        const promptId = body.promptId as string;
        if (!promptId) {
          return new Response(JSON.stringify({ error: "promptId is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data, error } = await serviceClient
          .from("content_vault_resources")
          .select("id, title, description, tags, resource_type, cover_image_url, resource_url, created_at")
          .eq("id", promptId)
          .in("resource_type", ["image_prompt", "video_prompt"])
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          return new Response(JSON.stringify({ error: "Prompt not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        result = {
          prompt: {
            id: data.id,
            title: data.title,
            prompt: data.description,
            tags: data.tags || [],
            type: data.resource_type,
            cover_image_url: data.cover_image_url,
            resource_url: data.resource_url,
            created_at: data.created_at,
          },
        };
        break;
      }

      case "update_prompt": {
        const promptId = body.promptId as string;
        if (!promptId) {
          return new Response(JSON.stringify({ error: "promptId is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const updates: Record<string, unknown> = {};
        if (body.title !== undefined) updates.title = body.title;
        if (body.prompt !== undefined) updates.description = body.prompt;
        if (body.tags !== undefined) updates.tags = body.tags;

        if (Object.keys(updates).length === 0) {
          return new Response(
            JSON.stringify({ error: "Provide at least one field to update: title, prompt, tags" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await serviceClient
          .from("content_vault_resources")
          .update(updates)
          .eq("id", promptId)
          .in("resource_type", ["image_prompt", "video_prompt"])
          .select("id, title, description, tags, resource_type, cover_image_url")
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          return new Response(JSON.stringify({ error: "Prompt not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        result = {
          success: true,
          prompt: {
            id: data.id,
            title: data.title,
            prompt: data.description,
            tags: data.tags || [],
            type: data.resource_type,
            cover_image_url: data.cover_image_url,
          },
        };
        break;
      }

      case "regenerate_cover": {
        const promptId = body.promptId as string;
        if (!promptId) {
          return new Response(JSON.stringify({ error: "promptId is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Fetch the prompt
        const { data: prompt, error: fetchErr } = await serviceClient
          .from("content_vault_resources")
          .select("id, description, cover_image_url")
          .eq("id", promptId)
          .in("resource_type", ["image_prompt", "video_prompt"])
          .maybeSingle();

        if (fetchErr) throw fetchErr;
        if (!prompt) {
          return new Response(JSON.stringify({ error: "Prompt not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const referenceImageUrl = body.referenceImageUrl as string | undefined;

        // Call Lovable AI gateway directly (same logic as generate-prompt-cover)
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

        const contentParts: any[] = [];
        if (referenceImageUrl) {
          contentParts.push({
            type: "text",
            text: `CRITICAL INSTRUCTION — IDENTITY PRESERVATION:
You are given a reference photo of a real person. This is the ONLY person who must appear in the generated image. You MUST:
1. Use the EXACT same face, facial structure, eye shape, eye color, nose, lips, jawline, skin tone, and complexion from the reference photo.
2. Match their hair color, texture, and approximate length.
3. Match their body type and proportions.
4. The generated person must be immediately recognizable as the same individual.

COMPOSITION: Frame as a wide or medium shot. The person must be fully visible (head to toe if standing). Use 16:9 or 3:2 landscape composition.

Now generate a high-quality image for this scene, featuring the EXACT person from the reference photo:\n\n${prompt.description}`,
          });
          contentParts.push({
            type: "image_url",
            image_url: { url: referenceImageUrl },
          });
        } else {
          contentParts.push({
            type: "text",
            text: `Generate an image based on this prompt. Create a high-quality, visually striking image. Frame the shot as a wide or medium shot so the main subject is fully visible. Use a 16:9 or 3:2 landscape composition:\n\n${prompt.description}`,
          });
        }

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-pro-image-preview",
            messages: [{ role: "user", content: contentParts }],
            modalities: ["image", "text"],
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error("AI gateway error:", aiResponse.status, errText);
          throw new Error(`AI gateway error: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const message = aiData.choices?.[0]?.message;

        let imageUrl =
          message?.images?.[0]?.image_url?.url ||
          message?.content?.[0]?.image_url?.url ||
          null;

        if (!imageUrl && Array.isArray(message?.content)) {
          const imgPart = message.content.find((p: any) => p.type === "image_url" || p.image_url);
          if (imgPart) imageUrl = imgPart.image_url?.url || imgPart.url;
        }

        if (!imageUrl && message?.content?.[0]?.inline_data) {
          const inline = message.content[0].inline_data;
          imageUrl = `data:${inline.mime_type};base64,${inline.data}`;
        }

        if (!imageUrl) {
          throw new Error("No image was generated by AI");
        }

        // Upload to content-media bucket
        const raw = imageUrl.includes(",") ? imageUrl.split(",")[1] : imageUrl;
        const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
        const fileName = `covers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

        const { error: uploadErr } = await serviceClient.storage
          .from("content-media")
          .upload(fileName, bytes, { contentType: "image/jpeg", upsert: true });

        if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

        const { data: urlData } = serviceClient.storage.from("content-media").getPublicUrl(fileName);
        const coverUrl = urlData.publicUrl;

        // Update the resource
        const { error: updateErr } = await serviceClient
          .from("content_vault_resources")
          .update({ cover_image_url: coverUrl })
          .eq("id", promptId);

        if (updateErr) throw updateErr;

        result = { success: true, cover_image_url: coverUrl };
        break;
      }

      case "list_characters": {
        const limit = Math.min(body.limit || 20, 50);

        const { data, error } = await serviceClient
          .from("characters")
          .select("id, name, niche, photo_urls")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) throw error;

        result = {
          characters: (data || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            niche: c.niche,
            photo_urls: c.photo_urls || [],
          })),
        };
        break;
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[prompts-api]", message);
    const status = message === "Unauthorized" || message === "Invalid API key" || message === "Invalid token" ? 401 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
