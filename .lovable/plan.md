

## Problem

The character preview prompt currently gives the AI model vague environment instructions like "Use the provided environment image as the setting/backdrop" or "Maintain exact spatial consistency." This is insufficient — the model treats environment images as loose inspiration rather than a strict reference, freely altering colors, furniture placement, lighting, and layout between regenerations.

## Root Cause

1. **No explicit environment fidelity instructions** — the prompt tells the model to use the environment but doesn't enforce preserving specific details (wall color, furniture, fixtures, lighting, camera angle).
2. **Environment images are mixed in with reference images** without clear labeling — the model may not distinguish which images are "the person" vs "the room."
3. **No environment description metadata is passed** — the environment group label (e.g., "Modern Kitchen", "Marble Bathroom") isn't sent to the edge function, so the prompt can't anchor the setting semantically.

## Plan

### 1. Pass environment group metadata to the edge function

- From `AIStudio.tsx`, include the selected environment group's `label` (e.g., "White Kitchen") in the request body as `environmentLabel`.
- This gives the prompt a semantic anchor for the space.

### 2. Strengthen environment fidelity in the prompt (`generate-character-preview/index.ts`)

Replace the current vague environment instructions with strict fidelity language:

- **Single environment image**: "ENVIRONMENT FIDELITY (CRITICAL): The environment reference image provided shows the EXACT room/space. You MUST reproduce this environment precisely — same wall colors, flooring, furniture, fixtures, lighting direction, and camera perspective. Do NOT substitute, rearrange, or reimagine any element of the space. The character is placed INTO this real environment."

- **Multi-environment images**: Add: "Multiple angles of the SAME space are provided. Cross-reference all angles to ensure spatial accuracy — objects visible in one angle must be consistent with their position in other angles."

- **With label**: Prepend "The environment is: {label}." to ground the model semantically.

### 3. Separate environment images from reference images in the content array with text markers

Insert a text part between reference images and environment images:
```
[ref images] → { type: "text", text: "The following images show the ENVIRONMENT/ROOM — reproduce this space exactly:" } → [env images] → [main prompt]
```

This prevents the model from confusing environment photos with additional character reference angles.

### Files to modify
- `src/pages/AIStudio.tsx` — pass `environmentLabel` in the preview request body
- `supabase/functions/generate-character-preview/index.ts` — add text separator, strengthen environment prompt, use label

