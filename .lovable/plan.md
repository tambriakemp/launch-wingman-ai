

## Fix Carousel Image Generation: Scene 1 as Base + Stronger Visual Consistency

### Problem
1. **Scene 1 should be the base/first image** — currently all scenes generate independently from the character preview. Scene 1's generated image should serve as the anchor for subsequent slides.
2. **Visual inconsistency across carousel slides** — hair, accessories, rings change between slides because each image is generated independently with only the character preview as reference. The carousel mode needs much stricter identity locking.

### Changes

**1. `src/pages/AIStudio.tsx` — Use Scene 1's output as anchor for carousel scenes 2+**

In the queue processing logic (~line 143-164), add carousel-specific anchoring:
- When `config.creationMode === 'carousel'` and `task.index > 0`, use `currentGeneratedMedia[0]?.imageUrl` as `anchorImageUrl` instead of the character preview
- This makes Scene 1 the visual anchor for all subsequent carousel slides, ensuring consistency
- Scene 1 still uses the character preview as its anchor (existing behavior)

**2. `supabase/functions/generate-scene-image/index.ts` — Add carousel-specific consistency prompts**

In the prompt construction (~line 236-286), add a carousel branch:
- When `config.creationMode === 'carousel'`, append stronger consistency instructions to the prompt:
  - "CAROUSEL CONSISTENCY (CRITICAL): This image is part of a cohesive carousel set. The subject's hair, accessories, jewelry, rings, nail color, and every visible detail MUST remain IDENTICAL to the reference/anchor image. Do NOT add, remove, or change ANY accessories, hairstyle, or detail. If the anchor shows hair down with no rings, EVERY slide must show hair down with no rings."
- When `previousSceneImageUrl` is provided in carousel mode, strengthen the continuity instruction to explicitly call out detail matching (hair position, accessories, rings, nails)

**3. `src/pages/AIStudio.tsx` — Generate All Images sequentially for carousel**

Currently "Generate All Images" creates tasks for all scenes that haven't been generated. For carousel mode, ensure scene 1 is always generated first:
- In the "Generate All Images" button handler (~line 975-979), when `config.creationMode === 'carousel'`:
  - If scene 1 hasn't been generated yet, only queue scene 1 first
  - After scene 1 completes, the user can click "Generate All Images" again to queue the rest (which will now have scene 1 as anchor)
  - Alternative: queue all but process scene 1 first, then use its output for the rest — this requires checking in the queue processor if scene 1 is done before processing scene 2+

The simplest approach: in the queue processor (~line 140-200), when processing a carousel task where `task.index > 0` and `currentGeneratedMedia[0]?.imageUrl` doesn't exist yet, skip the task and re-queue it at the end. This naturally ensures scene 1 generates first.

### Technical details

- `anchorImageUrl` is already passed to the edge function and used as a strong identity reference
- `previousSceneImageUrl` provides the preceding scene's image for continuity chaining
- For carousel, we override `anchorImageUrl` to always point to Scene 1 (not the preview) for slides 2+
- The edge function prompt gets an additional carousel-specific block demanding exact accessory/hair/detail matching

