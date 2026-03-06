

# Add "Ultra-Realistic" Toggle to AI Studio Look Section

## What Changes

Add a new toggle switch under the Look section (next to the existing "Exact Face & Skin Tone" toggle) called **"Ultra-Realistic Mode"**. When enabled, it appends the specified hyper-realistic prompt instructions to all image generation calls.

## Files to Modify

### 1. `src/components/ai-studio/types.ts`
- Add `ultraRealistic: boolean` to `AppConfig`

### 2. `src/components/ai-studio/constants.ts`
- Add `ultraRealistic: false` to `INITIAL_CONFIG`

### 3. `src/components/ai-studio/StudioSetup.tsx`
- Add a new toggle card below the "Exact Face & Skin Tone" toggle, styled identically:
  - Title: **"Ultra-Realistic Skin & Photo"**
  - Subtitle: "iPhone Pro quality with natural skin texture and pores"
  - Switch bound to `config.ultraRealistic`

### 4. `src/components/ai-studio/StoryboardToolbar.tsx`
- Add matching toggle in the settings popover (next to the existing Exact Face toggle)

### 5. `src/components/ai-studio/SavedLooks.tsx`
- Add `'ultraRealistic'` to the saved config keys array

### 6. `supabase/functions/generate-character-preview/index.ts`
- If `config.ultraRealistic` is true, append the ultra-realistic prompt block to the generation prompt

### 7. `supabase/functions/generate-scene-image/index.ts`
- If `config.ultraRealistic` is true, append the ultra-realistic prompt block to scene generation prompts

The prompt appended when enabled:
> Ultra-realistic, shot on a real iPhone Pro back-facing camera, 8K resolution, natural perspective. Skin appears hyper-realistic with visible pores, natural texture, and subtle imperfections, showcasing real-world skin detail. Enhancing realism without looking overdone. Photorealistic color grading, sharp facial focus, true-to-life contrast, no artificial smoothing, no filters, no stylization. No text, logos, captions, or overlays anywhere in the image.

