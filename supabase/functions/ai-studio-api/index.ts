import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_ACTIONS = [
  "generate_storyboard",
  "generate_character_preview",
  "generate_scene_image",
  "generate_video",
  "check_video_status",
  "list_projects",
  "get_project",
  "list_character_references",
  "list_environment_references",
] as const;

type Action = typeof VALID_ACTIONS[number];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    // --- Auth ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized. Provide Authorization: Bearer <token>" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    let userId: string;

    // Check if this is a personal API key (lw_sk_...)
    if (token.startsWith("lw_sk_")) {
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Hash the key
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(token));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      const { data: keyRow, error: keyError } = await serviceClient
        .from("personal_api_keys")
        .select("user_id")
        .eq("key_hash", keyHash)
        .maybeSingle();

      if (keyError || !keyRow) {
        return new Response(JSON.stringify({ error: "Invalid API key" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = keyRow.user_id;

      // Update last_used_at (fire and forget)
      serviceClient
        .from("personal_api_keys")
        .update({ last_used_at: new Date().toISOString() })
        .eq("key_hash", keyHash)
        .then(() => {});
    } else {
      // Standard JWT auth
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = claimsData.claims.sub as string;
    }

    // For API key auth, use service role client; for JWT auth, use user's token
    const supabase = token.startsWith("lw_sk_")
      ? createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
      : createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        });

    const body = await req.json();
    const action = body.action as Action;

    if (!action || !VALID_ACTIONS.includes(action)) {
      return new Response(JSON.stringify({
        error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(", ")}`,
        docs: `GET ${SUPABASE_URL}/functions/v1/ai-studio-api-docs for full documentation`,
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // --- Direct DB actions ---
    if (action === "list_projects") {
      const { data, error } = await supabase
        .from("ai_studio_projects")
        .select("id, name, mode, status, created_at, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return json({ projects: data });
    }

    if (action === "get_project") {
      const { projectId } = body;
      if (!projectId) return json({ error: "projectId is required" }, 400);
      const { data, error } = await supabase
        .from("ai_studio_projects")
        .select("*")
        .eq("id", projectId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: "Project not found" }, 404);
      return json({ project: data });
    }

    if (action === "list_character_references") {
      const references: { slot: number; url: string }[] = [];
      for (let i = 0; i < 3; i++) {
        const filePath = `characters/${userId}/saved-reference-${i}.png`;
        const { data } = await supabase.storage.from("ai-studio").list(`characters/${userId}`, {
          search: `saved-reference-${i}.png`,
        });
        if (data && data.length > 0) {
          const { data: urlData } = supabase.storage.from("ai-studio").getPublicUrl(filePath);
          references.push({ slot: i, url: urlData.publicUrl });
        }
      }
      return json({ references });
    }

    if (action === "list_environment_references") {
      const { data: groups, error: groupsError } = await supabase
        .from("ai_studio_environment_groups")
        .select("id, name, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (groupsError) throw groupsError;

      const { data: environments, error: envsError } = await supabase
        .from("ai_studio_environments")
        .select("id, label, file_path, group_id")
        .eq("user_id", userId);
      if (envsError) throw envsError;

      const result = (groups || []).map((group) => {
        const images = (environments || [])
          .filter((env) => env.group_id === group.id)
          .map((env) => {
            const { data: urlData } = supabase.storage.from("ai-studio").getPublicUrl(env.file_path);
            return { id: env.id, label: env.label, url: urlData.publicUrl };
          });
        return { id: group.id, name: group.name, images };
      });

      return json({ groups: result });
    }

    // --- Proxy actions to existing edge functions ---
    const functionMap: Record<string, string> = {
      generate_storyboard: "generate-storyboard",
      generate_character_preview: "generate-character-preview",
      generate_scene_image: "generate-scene-image",
      generate_video: "generate-video",
      check_video_status: "check-video-status",
    };

    const targetFunction = functionMap[action];
    if (!targetFunction) {
      return json({ error: "Unknown action" }, 400);
    }

    // Build the payload for the downstream function, injecting userId for BYOK key resolution
    const downstreamBody = buildDownstreamBody(action, body);
    if (!downstreamBody.userId) downstreamBody.userId = userId;

    const targetUrl = `${SUPABASE_URL}/functions/v1/${targetFunction}`;
    console.log(`[ai-studio-api] Proxying ${action} → ${targetFunction}`);

    // For API key auth, use service role key to call downstream functions
    const proxyAuthHeader = token.startsWith("lw_sk_")
      ? `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`
      : authHeader;

    const proxyResponse = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Authorization": proxyAuthHeader,
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(downstreamBody),
    });

    // Forward the response as-is (status + body)
    const responseBody = await proxyResponse.text();
    return new Response(responseBody, {
      status: proxyResponse.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[ai-studio-api] Error:", message);
    return json({ error: message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

/**
 * Maps the unified API request body to the format expected by each downstream function.
 */
function buildDownstreamBody(action: string, body: Record<string, unknown>): Record<string, unknown> {
  switch (action) {
    case "generate_storyboard": {
      // generate-storyboard expects: action ("brainstorm"|"generate"), config, referenceImageUrl, productImageUrl, environmentImageUrl, environmentImageUrls
      const payload: Record<string, unknown> = {
        action: body.storyboardAction || "generate",
        config: body.config,
      };
      // Support both single and array URL forms
      if (body.referenceImageUrls) {
        const urls = body.referenceImageUrls as string[];
        payload.referenceImageUrl = urls[0] || null;
      } else if (body.referenceImageUrl) {
        payload.referenceImageUrl = body.referenceImageUrl;
      }
      if (body.productImageUrl) payload.productImageUrl = body.productImageUrl;
      if (body.environmentImageUrls) {
        payload.environmentImageUrls = body.environmentImageUrls;
      } else if (body.environmentImageUrl) {
        payload.environmentImageUrl = body.environmentImageUrl;
      }
      return payload;
    }

    case "generate_character_preview": {
      // generate-character-preview expects: referenceImageUrls, environmentImageUrls, config, isFinalLook, identityAnchorUrl, environmentLabel
      return {
        referenceImageUrls: body.referenceImageUrls || [],
        environmentImageUrls: body.environmentImageUrls || [],
        config: body.config,
        isFinalLook: body.isFinalLook || false,
        identityAnchorUrl: body.identityAnchorUrl || null,
        environmentLabel: body.environmentLabel || null,
      };
    }

    case "generate_scene_image": {
      // generate-scene-image expects: prompt, config, previewCharacter, environmentImages (URLs), lockedRefs, isFinalLook, isUpscale, baseImageUrl, anchorImageUrl, previousSceneImageUrl, environmentLabel, etc.
      return {
        prompt: body.prompt,
        config: body.config,
        previewCharacter: body.previewCharacter || null,
        environmentImages: body.environmentImageUrls || body.environmentImages || [],
        lockedRefs: body.lockedRefs || [],
        isFinalLook: body.isFinalLook || false,
        isUpscale: body.isUpscale || false,
        baseImageUrl: body.baseImageUrl || null,
        anchorImageUrl: body.anchorImageUrl || null,
        previousSceneImageUrl: body.previousSceneImageUrl || null,
        environmentLabel: body.environmentLabel || null,
        sceneNumber: body.sceneNumber || null,
        totalScenes: body.totalScenes || null,
        aspectRatio: body.aspectRatio || "9:16",
      };
    }

    case "generate_video": {
      // generate-video expects: imageUrl, videoPrompt, aspectRatio, multiShot, characterBindUrl
      return {
        imageUrl: body.imageUrl,
        videoPrompt: body.videoPrompt,
        aspectRatio: body.aspectRatio || "9:16",
        multiShot: body.multiShot || null,
        characterBindUrl: body.characterBindUrl || null,
      };
    }

    case "check_video_status": {
      // check-video-status expects: requestId, statusUrl, responseUrl
      return {
        requestId: body.requestId,
        statusUrl: body.statusUrl,
        responseUrl: body.responseUrl || null,
      };
    }

    default:
      return body;
  }
}
