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
  "create_prompt",
  "delete_prompt",
  "list_spaces",
  "list_space_categories",
  "list_planner_tasks",
  "create_planner_task",
  "update_planner_task",
  "delete_planner_task",
] as const;

type Action = (typeof VALID_ACTIONS)[number];

const VAULT_URL = "https://launchely.com/app/content-vault/ai-prompts/general";
const PLANNER_URL = "https://launchely.com/app/planner";

const VALID_STATUSES = ["todo", "in-progress", "in-review", "done", "blocked", "abandoned"];
const VALID_PRIORITIES = ["urgent", "high", "normal", "low"];

async function resolveProjectId(serviceClient: any, userId: string): Promise<string> {
  const { data, error } = await serviceClient
    .from("projects")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Create a project in Launchely before adding planner tasks via MCP");
  return data.id;
}

async function resolveSpaceId(
  serviceClient: any,
  userId: string,
  spaceId?: string,
  spaceName?: string
): Promise<string | null> {
  if (spaceId) {
    const { data } = await serviceClient
      .from("planner_spaces").select("id").eq("id", spaceId).eq("user_id", userId).maybeSingle();
    if (!data) throw new Error(`Space '${spaceId}' not found`);
    return data.id;
  }
  if (spaceName) {
    const { data } = await serviceClient
      .from("planner_spaces").select("id").eq("user_id", userId).ilike("name", spaceName).maybeSingle();
    if (!data) throw new Error(`Space named '${spaceName}' not found`);
    return data.id;
  }
  const { data } = await serviceClient
    .from("planner_spaces").select("id").eq("user_id", userId)
    .order("position", { ascending: true }).limit(1).maybeSingle();
  return data?.id || null;
}

function buildDateFields(p: { dueDate?: string | null; startAt?: string | null; endAt?: string | null }) {
  const { dueDate, startAt, endAt } = p;
  if (startAt && endAt) {
    if (new Date(endAt) < new Date(startAt)) throw new Error("endAt must be >= startAt");
    return { start_at: startAt, end_at: endAt, due_at: endAt, due_date: endAt.slice(0, 10) };
  }
  if (startAt && !endAt) {
    return { start_at: startAt, end_at: startAt, due_at: startAt, due_date: startAt.slice(0, 10) };
  }
  if (dueDate) {
    return { start_at: null, end_at: null, due_at: dueDate, due_date: dueDate.slice(0, 10) };
  }
  return { start_at: null, end_at: null, due_at: null, due_date: null };
}

function triggerCalendarSync(taskId: string, action: "create" | "update" | "delete", authHeader: string | null) {
  if (!authHeader) return;
  try {
    fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/sync-calendar-event`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
      },
      body: JSON.stringify({ task_id: taskId, action }),
    }).catch(() => {});
  } catch {
    // fire-and-forget
  }
}

function mapTask(t: any, spaceName?: string | null) {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.column_id,
    priority: t.priority,
    space: t.space_id ? { id: t.space_id, name: spaceName || null } : null,
    category: t.category,
    due_at: t.due_at,
    start_at: t.start_at,
    end_at: t.end_at,
    location: t.location,
    recurrence: t.recurrence_rule,
    planner_url: PLANNER_URL,
  };
}

async function requireAdmin(serviceClient: any, userId: string) {
  const { data, error } = await serviceClient.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(`Admin check failed: ${error.message}`);
  if (!data) throw new Error("Forbidden: admin role required");
}

async function resolveSubcategoryId(
  serviceClient: any,
  subcategorySlug: string = "general"
): Promise<string> {
  const { data, error } = await serviceClient
    .from("content_vault_subcategories")
    .select("id, content_vault_categories!inner(slug)")
    .eq("slug", subcategorySlug)
    .eq("content_vault_categories.slug", "ai-prompts")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Subcategory '${subcategorySlug}' not found under ai-prompts`);
  return data.id;
}

async function generateCoverImage(
  serviceClient: any,
  promptText: string,
  referenceImageUrl?: string
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const contentParts: any[] = [];
  if (referenceImageUrl) {
    contentParts.push({
      type: "text",
      text: `CRITICAL INSTRUCTION — IDENTITY PRESERVATION:
Use the EXACT same face, features, skin tone, hair, and body type from the reference photo.
COMPOSITION: wide/medium shot, full body visible, 16:9 or 3:2 landscape.
Generate a high-quality image for this scene:\n\n${promptText}`,
    });
    contentParts.push({ type: "image_url", image_url: { url: referenceImageUrl } });
  } else {
    contentParts.push({
      type: "text",
      text: `Generate a high-quality image. Wide/medium shot, 16:9 or 3:2 landscape:\n\n${promptText}`,
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
  return urlData.publicUrl;
}

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

      case "create_prompt": {
        await requireAdmin(serviceClient, userId);

        const title = String(body.title || "").trim();
        const promptText = String(body.prompt || "").trim();
        if (!title || !promptText) {
          return new Response(JSON.stringify({ error: "title and prompt are required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const resourceType = body.type === "video_prompt" ? "video_prompt" : "image_prompt";
        const subcategoryId = await resolveSubcategoryId(serviceClient, body.subcategorySlug);

        const { data: dupes } = await serviceClient
          .from("content_vault_resources")
          .select("id")
          .eq("subcategory_id", subcategoryId)
          .or(`title.ilike.${title},description.ilike.${promptText}`)
          .limit(1);
        if (dupes && dupes.length > 0) {
          return new Response(
            JSON.stringify({ error: "Duplicate prompt: an existing prompt has the same title or text" }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: maxRow } = await serviceClient
          .from("content_vault_resources")
          .select("position")
          .eq("subcategory_id", subcategoryId)
          .order("position", { ascending: false })
          .limit(1)
          .maybeSingle();
        const nextPosition = ((maxRow as any)?.position ?? 0) + 1;

        let coverUrl: string | null = body.coverImageUrl || null;
        if (!coverUrl && body.generateCover) {
          coverUrl = await generateCoverImage(serviceClient, promptText, body.referenceImageUrl);
        }

        const { data: inserted, error: insertErr } = await serviceClient
          .from("content_vault_resources")
          .insert({
            title,
            description: promptText,
            resource_type: resourceType,
            resource_url: "#",
            subcategory_id: subcategoryId,
            tags: Array.isArray(body.tags) && body.tags.length > 0 ? body.tags : null,
            cover_image_url: coverUrl,
            position: nextPosition,
          })
          .select("id, title, description, tags, resource_type, cover_image_url")
          .maybeSingle();

        if (insertErr) throw insertErr;
        if (!inserted) throw new Error("Failed to create prompt");

        const ins = inserted as any;
        result = {
          success: true,
          prompt: {
            id: ins.id,
            title: ins.title,
            prompt: ins.description,
            tags: ins.tags || [],
            type: ins.resource_type,
            cover_image_url: ins.cover_image_url,
            vault_url: VAULT_URL,
          },
        };
        break;
      }

      case "delete_prompt": {
        await requireAdmin(serviceClient, userId);

        const promptId = body.promptId as string;
        if (!promptId) {
          return new Response(JSON.stringify({ error: "promptId is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data, error } = await serviceClient
          .from("content_vault_resources")
          .delete()
          .eq("id", promptId)
          .in("resource_type", ["image_prompt", "video_prompt"])
          .select("id")
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          return new Response(JSON.stringify({ error: "Prompt not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        result = { success: true, deleted_id: (data as any).id };
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

      case "list_spaces": {
        const { data, error } = await serviceClient
          .from("planner_spaces")
          .select("id, name, color, position")
          .eq("user_id", userId)
          .order("position", { ascending: true });
        if (error) throw error;
        result = { spaces: data || [] };
        break;
      }

      case "list_space_categories": {
        let q = serviceClient
          .from("space_categories")
          .select("id, space_id, name, color, position")
          .eq("user_id", userId)
          .order("position", { ascending: true });
        if (body.spaceId) q = q.eq("space_id", body.spaceId);
        const { data, error } = await q;
        if (error) throw error;
        result = { categories: data || [] };
        break;
      }

      case "list_planner_tasks": {
        const limit = Math.min(body.limit || 50, 200);
        let q = serviceClient
          .from("tasks")
          .select("id, title, description, column_id, priority, space_id, category, due_at, start_at, end_at, location, recurrence_rule")
          .eq("user_id", userId)
          .eq("task_scope", "planner")
          .order("created_at", { ascending: false })
          .limit(limit);
        if (body.spaceId) q = q.eq("space_id", body.spaceId);
        if (body.status) q = q.eq("column_id", body.status);
        if (body.dueAfter) q = q.gte("due_at", body.dueAfter);
        if (body.dueBefore) q = q.lte("due_at", body.dueBefore);
        if (body.search) q = q.or(`title.ilike.%${body.search}%,description.ilike.%${body.search}%`);
        const { data, error } = await q;
        if (error) throw error;

        const spaceIds = [...new Set((data || []).map((t: any) => t.space_id).filter(Boolean))];
        const spaceMap: Record<string, string> = {};
        if (spaceIds.length > 0) {
          const { data: spaces } = await serviceClient
            .from("planner_spaces").select("id, name").in("id", spaceIds);
          (spaces || []).forEach((s: any) => { spaceMap[s.id] = s.name; });
        }
        result = { tasks: (data || []).map((t: any) => mapTask(t, spaceMap[t.space_id])) };
        break;
      }

      case "create_planner_task": {
        const title = String(body.title || "").trim();
        if (!title) {
          return new Response(JSON.stringify({ error: "title is required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const status = body.status || "todo";
        if (!VALID_STATUSES.includes(status)) throw new Error(`Invalid status. Valid: ${VALID_STATUSES.join(", ")}`);
        const priority = body.priority || "normal";
        if (!VALID_PRIORITIES.includes(priority)) throw new Error(`Invalid priority. Valid: ${VALID_PRIORITIES.join(", ")}`);

        const projectId = await resolveProjectId(serviceClient, userId);
        const spaceId = await resolveSpaceId(serviceClient, userId, body.spaceId, body.spaceName);
        const dates = buildDateFields({ dueDate: body.dueDate, startAt: body.startAt, endAt: body.endAt });

        const { data, error } = await serviceClient
          .from("tasks")
          .insert({
            user_id: userId,
            project_id: projectId,
            title,
            description: body.description || null,
            column_id: status,
            priority,
            space_id: spaceId,
            category: body.category || null,
            location: body.location || null,
            recurrence_rule: body.recurrence || null,
            task_scope: "planner",
            task_origin: "user",
            task_type: "task",
            position: 0,
            ...dates,
          })
          .select("id, title, description, column_id, priority, space_id, category, due_at, start_at, end_at, location, recurrence_rule")
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error("Failed to create task");

        let spaceName: string | null = null;
        if (data.space_id) {
          const { data: s } = await serviceClient
            .from("planner_spaces").select("name").eq("id", data.space_id).maybeSingle();
          spaceName = s?.name || null;
        }
        triggerCalendarSync(data.id, "create", req.headers.get("Authorization"));
        result = { success: true, task: mapTask(data, spaceName) };
        break;
      }

      case "update_planner_task": {
        if (!body.taskId) {
          return new Response(JSON.stringify({ error: "taskId is required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data: existing } = await serviceClient
          .from("tasks").select("id").eq("id", body.taskId).eq("user_id", userId).eq("task_scope", "planner").maybeSingle();
        if (!existing) throw new Error("Task not found");

        const updates: Record<string, unknown> = {};
        if (body.title !== undefined) updates.title = body.title;
        if (body.description !== undefined) updates.description = body.description;
        if (body.category !== undefined) updates.category = body.category;
        if (body.location !== undefined) updates.location = body.location;
        if (body.recurrence !== undefined) updates.recurrence_rule = body.recurrence;
        if (body.status !== undefined) {
          if (!VALID_STATUSES.includes(body.status)) throw new Error(`Invalid status. Valid: ${VALID_STATUSES.join(", ")}`);
          updates.column_id = body.status;
        }
        if (body.priority !== undefined) {
          if (!VALID_PRIORITIES.includes(body.priority)) throw new Error(`Invalid priority. Valid: ${VALID_PRIORITIES.join(", ")}`);
          updates.priority = body.priority;
        }
        if (body.spaceId !== undefined || body.spaceName !== undefined) {
          updates.space_id = await resolveSpaceId(serviceClient, userId, body.spaceId, body.spaceName);
        }
        if (body.dueDate !== undefined || body.startAt !== undefined || body.endAt !== undefined) {
          Object.assign(updates, buildDateFields({
            dueDate: body.dueDate !== undefined ? body.dueDate : null,
            startAt: body.startAt !== undefined ? body.startAt : null,
            endAt: body.endAt !== undefined ? body.endAt : null,
          }));
        }
        if (Object.keys(updates).length === 0) throw new Error("Provide at least one field to update");

        const { data, error } = await serviceClient
          .from("tasks").update(updates).eq("id", body.taskId).eq("user_id", userId)
          .select("id, title, description, column_id, priority, space_id, category, due_at, start_at, end_at, location, recurrence_rule")
          .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("Update failed");

        let spaceName: string | null = null;
        if (data.space_id) {
          const { data: s } = await serviceClient
            .from("planner_spaces").select("name").eq("id", data.space_id).maybeSingle();
          spaceName = s?.name || null;
        }
        triggerCalendarSync(data.id, "update", req.headers.get("Authorization"));
        result = { success: true, task: mapTask(data, spaceName) };
        break;
      }

      case "delete_planner_task": {
        if (!body.taskId) {
          return new Response(JSON.stringify({ error: "taskId is required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        triggerCalendarSync(body.taskId, "delete", req.headers.get("Authorization"));
        const { data, error } = await serviceClient
          .from("tasks").delete()
          .eq("id", body.taskId).eq("user_id", userId).eq("task_scope", "planner")
          .select("id").maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("Task not found");
        result = { success: true, deleted_id: data.id };
        break;
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[prompts-api]", message);
    const isAuthErr = message === "Unauthorized" || message === "Invalid API key" || message === "Invalid token";
    const isForbidden = message.startsWith("Forbidden");
    const status = isAuthErr ? 401 : isForbidden ? 403 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
