

## AI Studio -- Faceless Creator / Storyboard Generator

Replicate the full "Faceless Creator" app flow as a new AI Studio feature within the existing Launchely app, using the Lovable AI gateway for image generation and Google Veo for video generation.

### Overview

The reference app is a 3-phase content creation tool:
1. **Setup** -- Upload character reference, environment, and product images. Configure mode (Vlog/UGC), category, topic, outfit, hairstyle, makeup, skin, nails, aspect ratio, camera movement, and optional custom script.
2. **Preview** -- AI generates a character preview (and final look preview for GRWM). User confirms before proceeding.
3. **Storyboard** -- AI generates a 13-15 scene storyboard with scripts, A-roll/B-roll descriptions, and image/video prompts. Each scene gets an AI-generated image, with options to regenerate, upscale, lock character/outfit/environment for consistency, generate video, edit prompts, batch operations, and export as ZIP.

### Architecture

All AI calls go through backend functions using the Lovable AI gateway (no client-side API keys):

```text
AI Studio Page (React)
  |
  |-- generate-storyboard (edge fn) --> Lovable Gateway (gemini-2.5-flash, structured output)
  |-- generate-scene-image (edge fn) --> Lovable Gateway (gemini-2.5-flash-image)
  |-- generate-scene-video (edge fn) --> Lovable Gateway (veo model -- see note)
  |
  |-- Storage: "ai-studio" bucket for generated assets
  |-- DB: "ai_studio_projects" table for saving/loading projects
```

**Video generation note:** The reference app uses Google's `veo-3.1-fast-generate-preview` model via the Google GenAI SDK directly. The Lovable AI gateway currently supports chat completion models. Video generation will be implemented as a placeholder that can be activated once video model support is confirmed, or we can use the image-to-video approach through an alternative API. We will start with full image generation support and add video as a follow-up.

### What Gets Built

#### Phase 1: Database and Storage
- New `ai-studio` storage bucket (public) for generated images
- New `ai_studio_projects` table to save project configs and storyboard data per user
- RLS policies so users only see their own projects

#### Phase 2: Edge Functions (3 functions)

**`generate-storyboard`**
- Accepts: reference image (base64), product image, environment image, full AppConfig
- Calls Lovable AI gateway with `google/gemini-2.5-flash` using tool calling for structured output
- Returns: `VlogStoryboard` JSON (analysis + 13-15 steps with prompts, scripts, scene descriptions)
- Also handles: topic brainstorming, image safety validation

**`generate-scene-image`**
- Accepts: scene prompt, reference images, locked references, config, aspect ratio
- Calls Lovable AI gateway with `google/gemini-2.5-flash-image` (Nano Banana)
- Handles consistency locks (character/outfit/environment) by including locked reference images
- Returns: base64 image, uploaded to storage bucket, returns public URL
- Also handles: upscaling (re-generation at higher quality)

**`generate-character-preview`**
- Accepts: reference image, environment image, config, isFinalLook flag
- Calls Lovable AI gateway with `google/gemini-2.5-flash-image`
- Returns: character preview image URL

#### Phase 3: Frontend Components

**New page: `/app/ai-studio`** (protected route)

Components to create:
- `src/pages/AIStudio.tsx` -- Main page with 3-phase flow
- `src/components/ai-studio/StudioSetup.tsx` -- Phase 1: All configuration (mode selector, uploads, style options, category/topic, script input)
- `src/components/ai-studio/StudioPreview.tsx` -- Phase 2: Character preview confirmation
- `src/components/ai-studio/StudioStoryboard.tsx` -- Phase 3: Scene cards grid with batch toolbar
- `src/components/ai-studio/SceneCard.tsx` -- Individual scene with image/video, locks, prompts, actions
- `src/components/ai-studio/UploadZone.tsx` -- Drag-and-drop image upload with preview
- `src/components/ai-studio/StudioHelp.tsx` -- Help modal explaining the workflow
- `src/components/ai-studio/ImageLightbox.tsx` -- Full-screen image viewer with navigation

Key features replicated:
- Vlog and UGC creation modes
- 13 vlog categories with AI topic brainstorming
- Full style customization (outfit, hairstyle, makeup, skin, nails, camera movement)
- GRWM (Get Ready With Me) mode with starting outfit and final look reveal
- Custom script input option
- Character/Outfit/Environment consistency locks (mutual exclusion)
- Batch select, regenerate, upscale, and delete
- Editable image and video prompts per scene
- Script/voiceover display per scene
- ZIP export of all images + script
- Safety terms acceptance before generation
- Parallel task queue for image generation
- Lightbox with arrow navigation

#### Phase 4: Navigation
- Add "AI Studio" link to the project sidebar under a new section
- Add route `/app/ai-studio` in `App.tsx`
- Gate behind Pro subscription using existing `useFeatureAccess`

### Files to Create
1. `supabase/functions/generate-storyboard/index.ts`
2. `supabase/functions/generate-scene-image/index.ts`
3. `supabase/functions/generate-character-preview/index.ts`
4. `src/pages/AIStudio.tsx`
5. `src/components/ai-studio/StudioSetup.tsx`
6. `src/components/ai-studio/StudioPreview.tsx`
7. `src/components/ai-studio/StudioStoryboard.tsx`
8. `src/components/ai-studio/SceneCard.tsx`
9. `src/components/ai-studio/UploadZone.tsx`
10. `src/components/ai-studio/StudioHelp.tsx`
11. `src/components/ai-studio/ImageLightbox.tsx`
12. `src/components/ai-studio/types.ts`
13. `src/components/ai-studio/constants.ts`
14. Database migration (table + storage bucket + RLS)

### Files to Modify
1. `src/App.tsx` -- Add route
2. `src/components/layout/ProjectSidebar.tsx` -- Add nav link

### Implementation Order
This is a large feature. I recommend building it in stages:
1. Types, constants, database, and storage setup
2. Edge functions (storyboard generation, scene image generation, character preview)
3. Setup phase UI (uploads, configuration)
4. Preview phase UI
5. Storyboard phase UI (scene cards, batch operations, lightbox)
6. Navigation and routing
7. Export functionality (ZIP download)

### No Extra API Keys Needed
Everything uses the pre-configured `LOVABLE_API_KEY` through the Lovable AI gateway. No additional secrets are required for image generation. Video generation will be marked as "coming soon" unless the gateway supports video models.

