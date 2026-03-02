

## Fix Character and Environment Consistency

### Root Cause Analysis

After reviewing the full generation pipeline (both edge functions and the frontend queue processor), I identified three core issues causing inconsistency:

### Problem 1: Wrong Model for the Job

Both `generate-character-preview` and `generate-scene-image` use `google/gemini-2.5-flash-image` -- the fast/cheap image model. This model is architecturally weak at preserving facial identity from reference photos across multiple generations. The available `google/gemini-3-pro-image-preview` model produces significantly better results for identity preservation and scene accuracy, but is slower and more expensive.

### Problem 2: Scene Images Are Generated from Scratch (Not Edited)

Currently, each scene is generated as a completely new image with reference photos + a text prompt. The model interprets all inputs loosely and creates a "new" person and environment each time. Instead, scenes should use **image editing** -- take the validated character preview image and ask the model to modify it (change pose, outfit, background) rather than generate from scratch. This preserves the character's identity far more reliably.

### Problem 3: Anchor Chain Drift

The current system chains: Scene 1 output becomes the anchor for Scene 2, Scene 2 output becomes anchor for Scene 3, etc. Errors compound with each generation. Instead, every scene should anchor back to the **original character preview** (the canonical identity), not the previous scene's output.

---

### Solution

#### Change 1: Upgrade to Higher-Quality Model (`generate-scene-image/index.ts`, `generate-character-preview/index.ts`)

Switch both edge functions from `google/gemini-2.5-flash-image` to `google/gemini-3-pro-image-preview`. This model has better identity preservation and scene rendering capabilities.

#### Change 2: Use Image Editing for Scene Generation (`generate-scene-image/index.ts`)

When a `previewCharacter` (canonical identity image) is available, restructure the prompt to be an **edit instruction** rather than a generation-from-scratch instruction. The character preview image becomes the base image that gets modified:

```text
Current approach:  "Here are reference photos + environment photos + text prompt -> generate new image"
New approach:      "Here is THE character image -> edit this person into [scene], wearing [outfit], in [environment]"
```

This means:
- Place the character preview as the PRIMARY image (already done)
- Restructure the text prompt as an editing instruction: "Edit this image: change the scene to [X], change the outfit to [Y], keep the person's face and body IDENTICAL"
- Environment images become secondary context for the edit, not competing references

#### Change 3: Always Anchor to Character Preview, Not Previous Scene (`AIStudio.tsx`)

In the queue processor, stop using `lastGeneratedUrl` (the previous scene's output) as the anchor. Instead, always use `previewCharacterRef.current` (or `previewFinalLookRef.current` for final-look scenes) as the identity anchor. This prevents drift across scenes.

```text
Current:  Scene 1 -> anchor -> Scene 2 -> anchor -> Scene 3  (drift accumulates)
Fixed:    Preview -> anchor -> Scene 1
          Preview -> anchor -> Scene 2   (each scene references the same source)
          Preview -> anchor -> Scene 3
```

#### Change 4: Reduce Prompt Overload (`generate-scene-image/index.ts`)

The current prompt packs ~30 instructions into one block. Simplify to three clear priorities:
1. **Identity** (keep this person exactly)
2. **Scene** (what they're doing, where)
3. **Style** (outfit, hair, makeup)

Remove redundant/competing instructions that confuse the model (e.g., duplicate identity blocks, verbose continuity instructions that the model can't reliably follow).

---

### Files to Change

| File | Change |
|------|--------|
| `supabase/functions/generate-scene-image/index.ts` | Switch to `gemini-3-pro-image-preview`; restructure prompt as edit instruction when preview exists; simplify prompt hierarchy |
| `supabase/functions/generate-character-preview/index.ts` | Switch to `gemini-3-pro-image-preview` for higher fidelity preview |
| `src/pages/AIStudio.tsx` | Remove `lastGeneratedUrl` anchor chaining; always use character preview as anchor for every scene |

### Trade-offs

- **Slower generation**: `gemini-3-pro-image-preview` is slower than `gemini-2.5-flash-image` but produces significantly better results
- **Higher cost**: The pro model costs more per generation, but generates fewer wasted/inconsistent images that need regeneration
