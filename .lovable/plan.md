

## Problem Analysis

Three distinct issues are causing inconsistency across generated scenes:

### Issue 1: Outfit Override Conflict (Root Cause)
When Path A (`useReferenceAsStart=true`) is active, the **storyboard generator** correctly extracts the outfit from the reference photo and embeds it in each scene's `image_prompt` (e.g., "fitted black bustier top featuring sheer mesh panels"). But then `generate-scene-image` **overrides** this with the config dropdown values. In the request logs, `config.outfitType` is "Pajamas" — so the scene image generator tells the AI "Change their clothing to Pajamas" while the embedded prompt describes a completely different outfit. This creates a tug-of-war where the AI picks different interpretations each time.

The same applies to nails, hair, and makeup — the storyboard's embedded descriptions conflict with the config dropdown values.

### Issue 2: Nails Changing
Same root cause. The storyboard embeds "short, almond-shaped, natural nude-pink" from the reference photo, but config says "Long Coffin Nails". Each scene resolves this conflict differently.

### Issue 3: Narrative Incoherence (Martini in Bed)
The storyboard generator for Path A lacks explicit instructions about **narrative coherence** — it's told to vary shots but not to ensure the story arc makes logical sense. A rooftop bar scene followed by a bed scene with a martini breaks continuity.

---

## Plan

### 1. Fix outfit/style override in `generate-scene-image` for Path A

In `supabase/functions/generate-scene-image/index.ts`, when `config.useReferenceAsStart === true`, skip the config-based outfit/style lines in the prompt. The storyboard's `image_prompt` (passed as `prompt`) already contains the full character description extracted from the reference photo — trust it instead of overriding.

**Changes (~lines 322-354)**:
- Detect Path A mode: `const isPathA = config.useReferenceAsStart === true;`
- In the EDIT MODE prompt (when `previewCharacter` exists):
  - If `isPathA` and NOT `isFinalLook`: remove the `OUTFIT: Change their clothing to` line and the `STYLE: Hair/Makeup/Skin/Nails` line. The scene prompt already contains these details verbatim.
  - If `isPathA` and `isFinalLook`: only override the outfit (to the final look outfit), keep other style details from the embedded prompt.
  - If NOT `isPathA`: keep existing behavior (use config values).

### 2. Add narrative coherence instructions to storyboard generator

In `supabase/functions/generate-storyboard/index.ts`, in the Path A system prompt (~lines 290-320):
- Add a `NARRATIVE COHERENCE` block requiring:
  - Each scene must logically follow the previous one
  - Props/objects introduced should persist or be naturally set down
  - The final scene should feel like a natural conclusion to the story arc
  - Avoid jarring location jumps (e.g., bar → bed) unless there's a clear transition

### 3. Deploy both edge functions

Deploy `generate-scene-image` and `generate-storyboard` after changes.

---

### Technical Details

**`generate-scene-image/index.ts`** — Modified prompt construction:
```text
// When Path A is active, the storyboard's image_prompt already contains
// full identity, outfit, and style details from the reference photo.
// Do NOT override with config dropdown values.
if (isPathA && !isFinalLook) {
  // Use prompt as-is, only add realism/environment/continuity blocks
} else {
  // Existing behavior: apply config outfit/style values
}
```

**`generate-storyboard/index.ts`** — Added narrative coherence block:
```text
NARRATIVE COHERENCE (CRITICAL):
- Each scene must flow logically from the previous one
- If the character holds a prop (drink, phone, bag), it should persist 
  naturally or be set down in a believable way
- The sequence should tell a cohesive mini-story with a clear arc
- Avoid jarring environment jumps — transitions must feel organic
- The final scene should feel like a natural conclusion
```

