

## Skip Character Preview — Use Scene 1 as the Character Anchor

### Summary
Remove the separate "Generate Character Preview" step. Instead, when the user clicks "Generate Storyboard", the storyboard is generated immediately (text-only as it already is), and Scene 1's generated image becomes the character preview / identity anchor for all subsequent scenes. This eliminates the two-step flow (preview → storyboard) and makes it a single action.

### Changes

**1. `src/pages/AIStudio.tsx`**

**Remove preview gating:**
- Remove the `handleGeneratePreview` function entirely
- Remove the `previewCharacterImage` requirement check in `handleGenerateStoryboard` (line 414-417)
- Remove `isPreviewGenerating`, `previewStep` state variables
- Keep `previewCharacterImage` state — it will now be set automatically when Scene 1 finishes generating

**Replace the inline Character Preview Bar (lines 848-898):**
- Remove the "Generate Character Preview" button and the preview bar UI
- Replace with a simpler "Generate Storyboard" CTA that only requires a reference image + safety terms acceptance
- The storyboard generation button (lines 900-917) moves up to replace the preview block

**Update the "Generate Storyboard" button conditions:**
- Only require `referenceImage` and `showSafetyTerms` (no longer require `previewCharacterImage`)

**Auto-set character preview from Scene 1:**
- In the queue processor (line ~214), after Scene 1's image is generated successfully, also call `setPreviewCharacterImage(data.imageUrl)` so the identity anchor is set for subsequent scenes
- This means scenes 2+ will use Scene 1's image as their `anchorImageUrl` (the existing logic at lines 157-161 already falls back to `previewCharacterImage`)

**For GRWM (Get Ready With Me) vlog mode:**
- Scene 1 serves as the default look preview
- The final-look scene (last scene) serves as the final look preview — set `previewFinalLookImage` when it generates

**2. Queue processor anchor logic (lines 143-162):**
- For non-carousel: Scene 1 has no anchor (uses raw reference images), scenes 2+ anchor to Scene 1's generated image via `previewCharacterImage`
- For carousel: already works this way (Scene 1 generates first, slides 2+ wait for it)
- The existing code mostly handles this — just need to ensure `previewCharacterImage` gets populated from Scene 1

**3. Cleanup:**
- Remove `previewStep` state and its usage
- Remove `StudioPreview` import if still present
- Keep save/load logic for `character_preview_url` — it will now store Scene 1's image

### What stays the same
- The storyboard text generation flow
- The scene image generation queue
- The edge functions (no changes needed)
- Save/load project functionality
- The "Regenerate" capability can remain — it would regenerate Scene 1 and update the anchor

