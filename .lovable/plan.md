

## Problem

The `generate-scene-image` edge function (used for storyboard scenes) is missing the environment consistency improvements that were added to `generate-character-preview`. Specifically:

1. **`environmentLabel` is never passed** from `AIStudio.tsx` to the scene generation call (lines 159-180) — even though the function accepts it for mismatch detection
2. **No text separator** between character reference images and environment images in the content array — the model can't distinguish which images are "person" vs "room"
3. **No strict environment fidelity block** in the scene prompt — only a weak "Maintain exact spatial consistency" line buried in lock instructions
4. Environment images are interleaved with character/product/anchor images with no visual separation

## Plan

### 1. Pass `environmentLabel` from `AIStudio.tsx` to `generate-scene-image`

Add `environmentLabel` to the scene generation invocation body at line ~178.

### 2. Add text separator and strict fidelity block to `generate-scene-image/index.ts`

Mirror what `generate-character-preview` does:
- Insert a text separator before environment images: `"The following images show the ENVIRONMENT/ROOM — reproduce this space EXACTLY as shown:"`
- Include the environment label in the separator
- Add an `ENVIRONMENT FIDELITY (CRITICAL)` block to both edit-mode and generate-from-scratch prompts, with single-env and multi-env variants
- Remove the weak "Maintain exact spatial consistency" line from lock instructions (line 198)

### Files to modify
- `src/pages/AIStudio.tsx` — add `environmentLabel` to the `generate-scene-image` invocation body
- `supabase/functions/generate-scene-image/index.ts` — add text separator before env images, add strict environment fidelity prompt block, remove weak line 198

