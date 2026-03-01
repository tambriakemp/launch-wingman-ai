

## Fix Outfit Consistency Across Storyboard Scenes

### Problem
When generating storyboard images, the AI model changes the outfit between scenes even though the same outfit is specified. The outfit text is included in the prompt but the model doesn't strictly follow it without a strong visual reference.

### Root Cause
The preview character image (which shows the correct outfit) is sent as a reference, but the prompt doesn't strongly enough enforce outfit matching. Additionally, there's no mechanism to automatically use a previously generated "good" image as an outfit reference for subsequent scenes.

### Solution

#### 1. Strengthen outfit enforcement in the prompt (Edge Function)
**File: `supabase/functions/generate-scene-image/index.ts`**

Update the prompt template to be much more forceful about outfit consistency:
- Add "CRITICAL CONSISTENCY RULE" section that explicitly tells the model to keep the exact same outfit across all scenes
- When a preview character image is provided, add instruction: "The reference image shows the EXACT outfit to use. Do NOT change, modify, or reinterpret the clothing."
- Move outfit description higher in the prompt hierarchy (before scene description)

#### 2. Auto-pass preview character as outfit reference (Edge Function)
When no outfit is explicitly locked but a preview character image exists, treat it as an implicit outfit lock by adding stronger language:
```
"OUTFIT CONTINUITY: You MUST replicate the exact same clothing, accessories, colors, and styling from the reference character image. Any deviation is unacceptable."
```

#### 3. Use first successfully generated scene as outfit anchor (Frontend)
**File: `src/pages/AIStudio.tsx`**

When processing the queue, if no outfit lock exists but a scene has already been generated, automatically include that first generated image URL as an outfit reference for all subsequent scenes. This gives the model a visual anchor.

### Changes Summary

| File | Change |
|------|--------|
| `supabase/functions/generate-scene-image/index.ts` | Strengthen outfit consistency language in prompt; auto-treat preview image as outfit reference |
| `src/pages/AIStudio.tsx` | Pass first generated scene image as outfit anchor when no explicit lock exists |

### Technical Details

In the edge function prompt, restructure from:
```
Scene Description: ...
MANDATORY STYLE REQUIREMENTS:
- Outfit: ...
```

To:
```
CRITICAL - OUTFIT CONSISTENCY (HIGHEST PRIORITY):
You MUST use EXACTLY this outfit: [outfit description]
If a reference image is provided, copy the clothing EXACTLY.
Do NOT improvise, change colors, add/remove layers, or reinterpret.

Scene to depict: ...
```

In `AIStudio.tsx`, update the queue processor to find the first available generated image and pass it as `outfitAnchorUrl` to the edge function, which will include it as an additional image reference with strict copy instructions.

