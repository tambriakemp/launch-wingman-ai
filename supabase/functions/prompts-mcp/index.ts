import { Hono } from "hono";
import { McpServer, StreamableHttpTransport } from "mcp-lite";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

async function authenticate(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");
  const token = authHeader.replace("Bearer ", "");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const serviceClient = createClient(SUPABASE_URL, serviceRoleKey);

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

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) throw new Error("Invalid token");

  return { userId: data.claims.sub as string, serviceClient };
}

function mapPrompt(r: any) {
  return {
    id: r.id,
    title: r.title,
    prompt: r.description,
    tags: r.tags || [],
    type: r.resource_type,
    cover_image_url: r.cover_image_url,
  };
}

const app = new Hono();

const mcpServer = new McpServer({
  name: "launchely-prompts",
  version: "1.0.0",
});

mcpServer.tool("list_prompts", {
  description: "List AI prompts with pagination. Filter by tag or type (image_prompt/video_prompt).",
  inputSchema: {
    type: "object" as const,
    properties: {
      limit: { type: "number", description: "Max results (default 50, max 200)" },
      offset: { type: "number", description: "Pagination offset (default 0)" },
      tag: { type: "string", description: "Filter by tag/category" },
      type: { type: "string", description: "image_prompt or video_prompt" },
      authHeader: { type: "string", description: "Authorization header value" },
    },
  },
  handler: async (params: any) => {
    const { serviceClient } = await authenticate(params.authHeader || null);
    const limit = Math.min(params.limit || 50, 200);
    const offset = params.offset || 0;

    let query = serviceClient
      .from("content_vault_resources")
      .select("id, title, description, tags, resource_type, cover_image_url", { count: "exact" })
      .in("resource_type", params.type ? [params.type] : ["image_prompt", "video_prompt"])
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (params.tag) query = query.contains("tags", [params.tag]);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            prompts: (data || []).map(mapPrompt),
            total: count || 0,
            limit,
            offset,
          }),
        },
      ],
    };
  },
});

mcpServer.tool("search_prompts", {
  description: "Search AI prompts by keyword in title or prompt text.",
  inputSchema: {
    type: "object" as const,
    properties: {
      query: { type: "string", description: "Search query" },
      limit: { type: "number", description: "Max results (default 20)" },
      authHeader: { type: "string", description: "Authorization header value" },
    },
    required: ["query"],
  },
  handler: async (params: any) => {
    const { serviceClient } = await authenticate(params.authHeader || null);
    const limit = Math.min(params.limit || 20, 100);

    const { data, error } = await serviceClient
      .from("content_vault_resources")
      .select("id, title, description, tags, resource_type, cover_image_url")
      .in("resource_type", ["image_prompt", "video_prompt"])
      .or(`title.ilike.%${params.query}%,description.ilike.%${params.query}%`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return {
      content: [{ type: "text" as const, text: JSON.stringify({ prompts: (data || []).map(mapPrompt) }) }],
    };
  },
});

mcpServer.tool("get_prompt", {
  description: "Get a single AI prompt by ID with full details.",
  inputSchema: {
    type: "object" as const,
    properties: {
      promptId: { type: "string", description: "Prompt UUID" },
      authHeader: { type: "string", description: "Authorization header value" },
    },
    required: ["promptId"],
  },
  handler: async (params: any) => {
    const { serviceClient } = await authenticate(params.authHeader || null);

    const { data, error } = await serviceClient
      .from("content_vault_resources")
      .select("id, title, description, tags, resource_type, cover_image_url, resource_url, created_at")
      .eq("id", params.promptId)
      .in("resource_type", ["image_prompt", "video_prompt"])
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Prompt not found");

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            ...mapPrompt(data),
            resource_url: data.resource_url,
            created_at: data.created_at,
          }),
        },
      ],
    };
  },
});

mcpServer.tool("update_prompt", {
  description: "Update an AI prompt's title, prompt text, and/or tags.",
  inputSchema: {
    type: "object" as const,
    properties: {
      promptId: { type: "string", description: "Prompt UUID" },
      title: { type: "string", description: "New title" },
      prompt: { type: "string", description: "New prompt text" },
      tags: { type: "array", items: { type: "string" }, description: "New tags array" },
      authHeader: { type: "string", description: "Authorization header value" },
    },
    required: ["promptId"],
  },
  handler: async (params: any) => {
    const { serviceClient } = await authenticate(params.authHeader || null);

    const updates: Record<string, unknown> = {};
    if (params.title !== undefined) updates.title = params.title;
    if (params.prompt !== undefined) updates.description = params.prompt;
    if (params.tags !== undefined) updates.tags = params.tags;

    if (Object.keys(updates).length === 0) throw new Error("Provide at least one field to update");

    const { data, error } = await serviceClient
      .from("content_vault_resources")
      .update(updates)
      .eq("id", params.promptId)
      .in("resource_type", ["image_prompt", "video_prompt"])
      .select("id, title, description, tags, resource_type, cover_image_url")
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Prompt not found");

    return {
      content: [{ type: "text" as const, text: JSON.stringify({ success: true, prompt: mapPrompt(data) }) }],
    };
  },
});

mcpServer.tool("regenerate_cover", {
  description: "Regenerate the cover image for an AI prompt using AI image generation. Optionally pass a reference photo URL for identity preservation.",
  inputSchema: {
    type: "object" as const,
    properties: {
      promptId: { type: "string", description: "Prompt UUID" },
      referenceImageUrl: { type: "string", description: "Optional reference photo URL for identity preservation" },
      authHeader: { type: "string", description: "Authorization header value" },
    },
    required: ["promptId"],
  },
  handler: async (params: any) => {
    const { serviceClient } = await authenticate(params.authHeader || null);

    const { data: prompt, error: fetchErr } = await serviceClient
      .from("content_vault_resources")
      .select("id, description")
      .eq("id", params.promptId)
      .in("resource_type", ["image_prompt", "video_prompt"])
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!prompt) throw new Error("Prompt not found");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const contentParts: any[] = [];
    if (params.referenceImageUrl) {
      contentParts.push({
        type: "text",
        text: `CRITICAL INSTRUCTION — IDENTITY PRESERVATION:
You are given a reference photo of a real person. Use the EXACT same face, features, skin tone, hair, and body type.
COMPOSITION: Frame as a wide or medium shot. Full body visible. 16:9 or 3:2 landscape.
Generate a high-quality image for this scene:\n\n${prompt.description}`,
      });
      contentParts.push({ type: "image_url", image_url: { url: params.referenceImageUrl } });
    } else {
      contentParts.push({
        type: "text",
        text: `Generate a high-quality image. Frame as wide/medium shot. 16:9 or 3:2 landscape:\n\n${prompt.description}`,
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: contentParts }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) throw new Error(`AI gateway error: ${aiResponse.status}`);

    const aiData = await aiResponse.json();
    const message = aiData.choices?.[0]?.message;

    let imageUrl =
      message?.images?.[0]?.image_url?.url || message?.content?.[0]?.image_url?.url || null;

    if (!imageUrl && Array.isArray(message?.content)) {
      const imgPart = message.content.find((p: any) => p.type === "image_url" || p.image_url);
      if (imgPart) imageUrl = imgPart.image_url?.url || imgPart.url;
    }
    if (!imageUrl && message?.content?.[0]?.inline_data) {
      const inline = message.content[0].inline_data;
      imageUrl = `data:${inline.mime_type};base64,${inline.data}`;
    }
    if (!imageUrl) throw new Error("No image generated");

    const raw = imageUrl.includes(",") ? imageUrl.split(",")[1] : imageUrl;
    const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
    const fileName = `covers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

    const { error: uploadErr } = await serviceClient.storage
      .from("content-media")
      .upload(fileName, bytes, { contentType: "image/jpeg", upsert: true });

    if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

    const { data: urlData } = serviceClient.storage.from("content-media").getPublicUrl(fileName);

    await serviceClient
      .from("content_vault_resources")
      .update({ cover_image_url: urlData.publicUrl })
      .eq("id", params.promptId);

    return {
      content: [
        { type: "text" as const, text: JSON.stringify({ success: true, cover_image_url: urlData.publicUrl }) },
      ],
    };
  },
});

mcpServer.tool("list_characters", {
  description: "List saved characters with their reference photo URLs. Use these URLs as referenceImageUrl when calling regenerate_cover for identity preservation.",
  inputSchema: {
    type: "object" as const,
    properties: {
      limit: { type: "number", description: "Max results (default 20)" },
      authHeader: { type: "string", description: "Authorization header value" },
    },
  },
  handler: async (params: any) => {
    const { userId, serviceClient } = await authenticate(params.authHeader || null);
    const limit = Math.min(params.limit || 20, 50);

    const { data, error } = await serviceClient
      .from("characters")
      .select("id, name, niche, photo_urls")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            characters: (data || []).map((c: any) => ({
              id: c.id,
              name: c.name,
              niche: c.niche,
              photo_urls: c.photo_urls || [],
            })),
          }),
        },
      ],
    };
  },
});

// MCP transport
const transport = new StreamableHttpTransport();
transport.bind(mcpServer);

// Inject auth header into tool params from the request
app.all("/*", async (c) => {
  const authHeader = c.req.header("Authorization") || null;

  const originalRequest = c.req.raw.clone();
  
  if (c.req.method === "POST") {
    try {
      const body = await c.req.json();
      
      if (body.method === "tools/call" && body.params?.arguments) {
        body.params.arguments.authHeader = authHeader;
        const modifiedRequest = new Request(originalRequest.url, {
          method: originalRequest.method,
          headers: originalRequest.headers,
          body: JSON.stringify(body),
        });
        return await transport.handleRequest(modifiedRequest);
      }
    } catch {
      // Not JSON or not a tool call — pass through
    }
  }

  return await transport.handleRequest(originalRequest);
});

Deno.serve(app.fetch);
