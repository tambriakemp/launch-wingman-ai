

## Improved AI Studio Generation Workflow: "Review-Then-Generate"

### The Problem

The current flow generates the storyboard text AND immediately queues ALL scene images at once. This causes:

1. **No review opportunity** -- prompts go straight to image generation without user approval
2. **Identical outputs** -- every scene uses the same canonical character preview as the base image, with only the text prompt varying. The AI model often ignores subtle prompt differences, producing nearly identical poses/compositions
3. **No scene-to-scene chaining** -- scenes don't reference the previously generated image, so there's no visual narrative flow
4. **Wasted credits** -- bad prompts burn through AI credits before the user can catch them

### The New Workflow

**Phase 1: Generate Storyboard Text Only (no images)**
- "Generate Storyboard" creates all scene text (script, action, detail, image prompt, video prompt) but does NOT auto-queue any images
- User sees all scenes in the filmstrip with empty thumbnails and full text details

**Phase 2: User Reviews and Edits Each Scene**
- User navigates through scenes, editing script/voiceover, action, detail, image prompt, and video prompt as needed
- A clear "Approve" or "Ready" status indicator per scene lets the user mark scenes as reviewed
- The SceneCard shows an "Edit" mode for all text fields (not just the image/video prompts)

**Phase 3: Sequential Image Generation with Chaining**
- User clicks "Generate Image" on Scene 1 first
- Once Scene 1's image exists, Scene 2's generation uses Scene 1's output as a **secondary reference** (alongside the canonical character preview) for visual continuity
- Each subsequent scene receives the previous scene's generated image as context
- The edge function prompt is updated to instruct: "Reference the previous scene image for continuity of lighting, spatial position, and narrative flow, but keep identity anchored to the canonical preview"

### Technical Changes

**1. `src/pages/AIStudio.tsx` -- Stop auto-queuing images after storyboard generation**

In `handleGenerateStoryboard` (around line 334), remove the auto-queue block:
```
// REMOVE: Auto-queue all scene images
const tasks: QueueItem[] = board.steps.map(...)
addToQueue(tasks);
```

The storyboard will be created with empty media slots, giving users time to review.

**2. `src/pages/AIStudio.tsx` -- Pass previous scene's image URL to each generation task**

Update the queue processor (around line 114-172) to look up the previous scene's generated image and pass it as `previousSceneImageUrl`:
```
const previousSceneImage = task.index > 0 
  ? generatedMediaRef.current[task.index - 1]?.imageUrl 
  : undefined;
```

Add `previousSceneImageUrl` to the edge function call body.

**3. `src/components/ai-studio/SceneCard.tsx` -- Make all text fields editable**

Add inline edit capability for Script/Voiceover, Action, and Detail fields (not just image/video prompts). Add callbacks: `onUpdateScript`, `onUpdateAction`, `onUpdateDetail`.

**4. `supabase/functions/generate-scene-image/index.ts` -- Use previous scene's image for continuity**

When `previousSceneImageUrl` is provided:
- Push it as an additional reference image
- Add prompt instruction: "The previous scene in this sequence is shown. Maintain visual continuity -- similar lighting, time of day, and spatial awareness. The person should appear to be continuing naturally from the previous scene. However, keep identity anchored to the canonical character preview."

This prevents the "5 identical images" problem because each scene now has unique visual context from its predecessor.

**5. `src/components/ai-studio/StudioStoryboard.tsx` -- Add "Generate All" convenience button**

For users who want to batch-generate after reviewing, add a "Generate All Images" button that queues scenes sequentially (the queue processor already handles sequential execution). This is the same as before but happens after review rather than automatically.

### Files to Modify

- **`src/pages/AIStudio.tsx`** -- Remove auto-queue, pass previous scene image, add edit callbacks for all text fields
- **`src/components/ai-studio/SceneCard.tsx`** -- Make Script, Action, Detail fields editable inline
- **`supabase/functions/generate-scene-image/index.ts`** -- Accept and use `previousSceneImageUrl` for continuity chaining
- **`src/components/ai-studio/StudioStoryboard.tsx`** -- Add "Generate All Images" button for post-review batch generation

### Summary of Flow After Changes

```text
1. User configures character, environment, look
2. User clicks "Generate Storyboard"
3. AI creates all text content (scripts, prompts, actions)
4. User reviews/edits each scene's text content
5. User generates images one-by-one (or batch after review)
6. Each image uses the previous scene's output for continuity
7. User can regenerate any scene that doesn't match expectations
```

