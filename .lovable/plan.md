

## Fix Z-Index Overlap & Video Orientation Issues

### Issue 1: Z-Index — Scene card icons appear on top of modals

The lock/overlay icons in `SceneCard.tsx` use `z-[60]`, which is higher than the dialog overlay's `z-50`. They bleed through modals.

**Fix in `src/components/ai-studio/SceneCard.tsx`** (line 154):
- Change `z-[60]` to `z-10` — the icons only need to be above their parent image, not above page-level modals.

### Issue 2: Video orientation — landscape videos in portrait project

The root cause is that **scene images are generated without any aspect ratio constraint**. The `generate-scene-image` edge function uses Gemini's image generation (`google/gemini-3-pro-image-preview`) but never specifies output dimensions or orientation. Gemini defaults to whatever it chooses (often square or landscape). When these images are fed to Kling for video generation, even though `aspect_ratio: "9:16"` is passed, the landscape source image influences Kling to produce landscape-oriented video.

**Fix in two places:**

1. **`supabase/functions/generate-scene-image/index.ts`** — Add aspect ratio to the prompt text so Gemini generates images matching the project orientation. The function needs to receive `aspectRatio` from the client and append an instruction like:
   - For 9:16: "OUTPUT FORMAT: Generate a PORTRAIT oriented image (9:16 aspect ratio, taller than wide)."
   - For 16:9: "OUTPUT FORMAT: Generate a LANDSCAPE oriented image (16:9 aspect ratio, wider than tall)."
   - For 1:1: "OUTPUT FORMAT: Generate a SQUARE image (1:1 aspect ratio)."

2. **`supabase/functions/ai-studio-api/index.ts`** — Pass `aspectRatio` through in the `generate_scene_image` action mapping (currently it's not forwarded).

3. **`src/pages/AIStudio.tsx`** — Ensure `aspectRatio` is included in the body when calling `generate-scene-image` (check if `config.aspectRatio` is already sent; if not, add it).

### Changes summary

| File | Change |
|------|--------|
| `src/components/ai-studio/SceneCard.tsx` | `z-[60]` → `z-10` |
| `supabase/functions/generate-scene-image/index.ts` | Read `aspectRatio` from request body, append orientation instruction to prompt |
| `supabase/functions/ai-studio-api/index.ts` | Forward `aspectRatio` in `generate_scene_image` case |
| `src/pages/AIStudio.tsx` | Verify `aspectRatio` is sent with scene image generation requests |

