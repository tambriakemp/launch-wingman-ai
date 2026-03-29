import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const docs = {
  name: "AI Studio API",
  version: "1.0",
  description: "Unified API for automating AI Studio content creation. All actions use POST to /functions/v1/ai-studio-api with a JSON body containing an 'action' field.",
  authentication: "Authorization: Bearer <supabase_jwt_token>",
  baseUrl: "https://ydhagqgurqhlguxkkppb.supabase.co/functions/v1/ai-studio-api",

  actions: {
    generate_storyboard: {
      description: "Generate a full vlog or UGC storyboard with scene breakdowns, scripts, and prompts.",
      method: "POST",
      requiredFields: ["action", "config"],
      optionalFields: ["referenceImageUrls", "referenceImageUrl", "productImageUrl", "environmentImageUrls", "environmentImageUrl", "storyboardAction"],
      notes: "Set storyboardAction to 'brainstorm' to generate just a topic idea. Default is 'generate' for full storyboard.",
      example: {
        action: "generate_storyboard",
        config: {
          creationMode: "vlog",
          vlogCategory: "Get Ready With Me",
          vlogTopic: "Morning routine for work",
          outfitType: "Business casual blazer",
          outfitDetails: "",
          outfitAdditionalInfo: "",
          finalLookType: "Evening dress",
          finalLook: "",
          finalLookAdditionalInfo: "",
          hairstyle: "Sleek low bun",
          customHairstyle: "",
          makeup: "Natural glam",
          customMakeup: "",
          skinComplexion: "Medium",
          customSkinComplexion: "",
          skinUndertone: "warm",
          nailStyle: "French tips",
          customNailStyle: "",
          sceneCount: 10,
          useOwnScript: false,
          userScript: "",
          exactMatch: true,
          matchFace: true,
          matchSkin: true,
          ultraRealistic: true,
          avatarDescription: "",
          ugcPrompt: "",
          productDescription: "",
          useProductAsHair: false,
          aspectRatio: "9:16",
          cameraMovement: "",
        },
        referenceImageUrls: ["https://storage.example.com/ref1.jpg"],
        environmentImageUrls: ["https://storage.example.com/env1.jpg"],
      },
    },

    generate_character_preview: {
      description: "Generate a canonical character preview image from reference photos. This becomes the identity anchor for all scene images.",
      method: "POST",
      requiredFields: ["action", "config", "referenceImageUrls"],
      optionalFields: ["environmentImageUrls", "isFinalLook", "identityAnchorUrl", "environmentLabel"],
      example: {
        action: "generate_character_preview",
        config: { "...": "same AppConfig as generate_storyboard" },
        referenceImageUrls: ["https://storage.example.com/face.jpg", "https://storage.example.com/profile.jpg"],
        isFinalLook: false,
      },
    },

    generate_scene_image: {
      description: "Generate a single scene image for a storyboard step. Use the character preview as identity anchor for consistency.",
      method: "POST",
      requiredFields: ["action", "prompt", "config"],
      optionalFields: [
        "previewCharacter", "environmentImageUrls", "environmentImages", "lockedRefs",
        "isFinalLook", "isUpscale", "baseImageUrl", "anchorImageUrl",
        "previousSceneImageUrl", "environmentLabel", "sceneNumber", "totalScenes",
      ],
      notes: "previewCharacter should be the URL returned from generate_character_preview. previousSceneImageUrl enables visual continuity chaining between sequential scenes.",
      example: {
        action: "generate_scene_image",
        prompt: "Walking into a bright modern kitchen, morning sunlight streaming through windows",
        config: { "...": "same AppConfig" },
        previewCharacter: "https://storage.example.com/preview.png",
        environmentImageUrls: ["https://storage.example.com/kitchen1.jpg"],
        isFinalLook: false,
        anchorImageUrl: "https://storage.example.com/preview.png",
        previousSceneImageUrl: null,
        sceneNumber: 1,
        totalScenes: 10,
      },
    },

    generate_video: {
      description: "Submit a video generation job from a scene image. Returns a requestId for polling. Uses credits or BYOK fal.ai key.",
      method: "POST",
      requiredFields: ["action", "imageUrl", "videoPrompt"],
      optionalFields: ["aspectRatio"],
      notes: "Video generation is async. Use check_video_status to poll for completion.",
      example: {
        action: "generate_video",
        imageUrl: "https://storage.example.com/scene1.png",
        videoPrompt: "The woman walks into the kitchen and picks up a coffee cup, morning light",
        aspectRatio: "9:16",
      },
    },

    check_video_status: {
      description: "Poll the status of an in-progress video generation job.",
      method: "POST",
      requiredFields: ["action", "requestId", "statusUrl"],
      optionalFields: ["responseUrl"],
      returns: "{ status: 'completed' | 'in_progress' | 'failed', videoUrl?: string, error?: string }",
      example: {
        action: "check_video_status",
        requestId: "abc123",
        statusUrl: "https://queue.fal.run/.../status",
        responseUrl: "https://queue.fal.run/.../response",
      },
    },

    list_projects: {
      description: "List all saved AI Studio projects for the authenticated user.",
      method: "POST",
      requiredFields: ["action"],
      example: { action: "list_projects" },
    },

    get_project: {
      description: "Get a saved project with its full config, storyboard, and generated media URLs.",
      method: "POST",
      requiredFields: ["action", "projectId"],
      example: { action: "get_project", projectId: "uuid-here" },
    },

    list_character_references: {
      description: "List the user's saved character reference images (up to 3 slots). Returns public URLs for each occupied slot.",
      method: "POST",
      requiredFields: ["action"],
      exampleResponse: {
        references: [
          { slot: 0, url: "https://storage.example.com/characters/user_id/saved-reference-0.png" },
          { slot: 1, url: "https://storage.example.com/characters/user_id/saved-reference-1.png" },
        ],
      },
      example: { action: "list_character_references" },
    },

    list_environment_references: {
      description: "List all saved environment reference image groups and their images. Returns groups with public URLs.",
      method: "POST",
      requiredFields: ["action"],
      exampleResponse: {
        groups: [
          {
            id: "uuid",
            name: "Kitchen",
            images: [
              { id: "uuid", label: "kitchen1.png", url: "https://storage.example.com/environments/user_id/group_id/kitchen1.png" },
            ],
          },
        ],
      },
      example: { action: "list_environment_references" },
    },
  },

  appConfigSchema: {
    description: "The config object used across storyboard and image generation. All fields are strings unless noted.",
    fields: {
      creationMode: { type: "string", values: ["vlog", "ugc"], description: "Content creation mode" },
      vlogCategory: { type: "string", description: "Vlog category (e.g. 'Get Ready With Me', 'Day In My Life')" },
      vlogTopic: { type: "string", description: "Specific topic for the vlog" },
      useOwnScript: { type: "boolean", description: "Whether to use a custom script instead of AI-generated" },
      userScript: { type: "string", description: "Custom script text (when useOwnScript is true)" },
      outfitType: { type: "string", description: "Outfit type or 'Custom Outfit'" },
      outfitDetails: { type: "string", description: "Custom outfit description (when outfitType is 'Custom Outfit')" },
      outfitAdditionalInfo: { type: "string", description: "Additional outfit notes" },
      finalLookType: { type: "string", description: "Final look outfit type (for GRWM)" },
      finalLook: { type: "string", description: "Custom final look description" },
      finalLookAdditionalInfo: { type: "string", description: "Additional final look notes" },
      hairstyle: { type: "string", description: "Hairstyle or 'Custom Hairstyle'" },
      customHairstyle: { type: "string", description: "Custom hairstyle description" },
      makeup: { type: "string", description: "Makeup style or 'Custom'" },
      customMakeup: { type: "string", description: "Custom makeup description" },
      skinComplexion: { type: "string", description: "Skin complexion or 'Custom'" },
      customSkinComplexion: { type: "string", description: "Custom skin complexion" },
      skinUndertone: { type: "string", description: "Skin undertone (warm, cool, neutral)" },
      nailStyle: { type: "string", description: "Nail style or 'Custom'" },
      customNailStyle: { type: "string", description: "Custom nail style" },
      sceneCount: { type: "number|null", description: "Number of scenes to generate (null for default 13-15)" },
      exactMatch: { type: "boolean", description: "Strict identity matching mode" },
      matchFace: { type: "boolean", description: "Match face from reference" },
      matchSkin: { type: "boolean", description: "Match skin tone from reference" },
      ultraRealistic: { type: "boolean", description: "Ultra-realistic rendering mode" },
      aspectRatio: { type: "string", values: ["1:1", "9:16", "16:9"], description: "Output aspect ratio" },
      avatarDescription: { type: "string", description: "Text description of avatar (when no image)" },
      ugcPrompt: { type: "string", description: "UGC marketing prompt" },
      productDescription: { type: "string", description: "Product being featured" },
      useProductAsHair: { type: "boolean", description: "Use product image as hair reference" },
      cameraMovement: { type: "string", description: "Camera movement style" },
    },
  },

  workflow: {
    description: "Typical automation workflow",
    steps: [
      "1. Upload reference images to ai-studio storage bucket",
      "2. Call generate_storyboard to get scene breakdowns",
      "3. Call generate_character_preview to create identity anchor",
      "4. For each storyboard step, call generate_scene_image with the preview URL as previewCharacter",
      "5. Chain scenes by passing previousSceneImageUrl from the last generated scene",
      "6. Optionally call generate_video for each scene image",
      "7. Poll check_video_status until complete",
    ],
  },

  imageUpload: {
    description: "All image references must be URLs. Upload images to storage first.",
    bucket: "ai-studio",
    pathConventions: {
      characters: "characters/{user_id}/",
      environments: "environments/{user_id}/{group_id}/",
      storyboard: "storyboard/",
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(JSON.stringify(docs, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
