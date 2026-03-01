

## Strict Character Identity Gates

### Problem

The saved character photos (raw selfies) and the "Default Look" preview are visually different people because the AI re-interprets the face during preview generation. There's no enforcement that the generated preview character becomes THE canonical identity for all subsequent scenes. Raw reference photos can still leak through and compete with the preview.

### Solution

Add strict identity gating at three levels:

### 1. Lock the Preview as the Canonical Identity

Once the "Default Look" preview is generated and the user advances to storyboard, that generated image becomes the ONLY character reference sent to `generate-scene-image`. Stop sending raw `referenceImage`/`referenceImages` alongside it.

**File**: `src/pages/AIStudio.tsx`
- In the queue processor, when `previewCharacterImage` exists, do NOT pass `referenceImage` or `referenceImages` to the edge function
- Only fall back to raw references if no preview has been generated

```
// Current: sends both previewCharacter AND referenceImage
body: { referenceImage, referenceImages, previewCharacter: activePreview, ... }

// Fixed: if preview exists, don't send raw refs
body: {
  referenceImage: activePreview ? undefined : referenceImage,
  referenceImages: activePreview ? undefined : (referenceImages.length > 0 ? referenceImages : undefined),
  previewCharacter: activePreview,
  ...
}
```

### 2. Block Storyboard Generation Without a Preview

Add a gate that prevents "Generate Full Storyboard" from being called unless a `previewCharacterImage` exists. This ensures the user has always validated the character look before proceeding.

**File**: `src/pages/AIStudio.tsx`
- In `handleGenerateStoryboard`, add a check: if `!previewCharacterImage`, show a toast error and return early
- This already partially exists (the flow goes setup -> preview -> storyboard) but there's no hard gate preventing direct storyboard generation

### 3. Strengthen Edge Function to Reject Ambiguous Identity

When `previewCharacter` is provided, explicitly tell the model to IGNORE any raw reference photos and use ONLY the preview as the identity source.

**File**: `supabase/functions/generate-scene-image/index.ts`
- When `previewCharacter` is present, skip adding `referenceImage`/`referenceImages` to `contentParts` entirely (server-side gate matching the client-side one)
- Update the prompt to say: "A GENERATED CHARACTER PREVIEW is provided. This is the CANONICAL identity. Do NOT deviate from this person's appearance."

### 4. Improve Preview-to-Scene Prompt Consistency

**File**: `supabase/functions/generate-character-preview/index.ts`
- Add stronger identity anchoring language: "This generated image will serve as the canonical identity reference for all future scenes. Accuracy to the reference photo is paramount."

### Files Changed

| File | Change |
|------|--------|
| `src/pages/AIStudio.tsx` | Stop sending raw refs when preview exists; add storyboard gate requiring preview |
| `supabase/functions/generate-scene-image/index.ts` | Server-side gate: skip raw refs when previewCharacter present; stronger canonical identity prompt |
| `supabase/functions/generate-character-preview/index.ts` | Strengthen canonical identity language in preview generation prompt |

### Why This Works

Currently the model receives multiple competing identity signals (raw selfie + AI preview + anchor image). By eliminating the raw photos once a preview exists, the model gets ONE clear identity to replicate. The preview becomes the single source of truth, and every scene references that same generated face.

