

## Plan: Fix blank-screen image generation — switch to Gemini-first pipeline

### Root Cause

Your platform setting `image_model` is currently set to `flux_kontext`. This means **every** image generation request routes to fal.ai Flux first. When Flux returns small/blank images or errors, the asset validation layer rejects them (the "10372 bytes" errors you saw), and Gemini only runs as a last-resort fallback after Flux fully fails. This is why "all images are blank" on new projects — Flux is the bottleneck.

### Strategy

Since you chose **Quality first + Gemini for images**, the plan is:

1. **Switch the platform setting** `image_model` from `flux_kontext` back to `gemini` in the database, so Gemini is the default for all users immediately.

2. **Simplify the Gemini path in `generate-scene-image`** — when `platformModel === "gemini"`, skip all Flux/fal.ai key resolution logic entirely (lines 306-355). This removes ~50 lines of unnecessary execution on every request.

3. **Relax asset validation for Gemini base64 responses** — Gemini returns large base64 data URIs (typically 200KB+), so the size/entropy checks are irrelevant for base64. Only apply `validateGeneratedAsset` when the image was fetched from a URL (Flux path). For base64, just verify the format magic bytes.

4. **Keep Flux as BYOK-only option** — users with a personal fal.ai key can still select Flux via a future per-user setting, but the platform default is Gemini.

5. **Add retry with model downgrade** — if `gemini-3-pro-image-preview` returns 503 after 3 retries, try once with `gemini-3.1-flash-image-preview` (faster, still good quality) before giving up.

### On videos: Kling vs Gemini

- **Kling (via fal.ai)** is purpose-built for image-to-video and produces cinematic, consistent motion. It's the right choice for your video pipeline.
- **Gemini** does not currently offer a comparable image-to-video API through the Lovable AI Gateway — it's text/image generation only.
- **Recommendation**: Keep Kling for videos, use Gemini for images. No changes to the video pipeline.

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/generate-scene-image/index.ts` | Simplify Gemini-first flow, skip Flux resolution when platform=gemini, relax base64 validation, add flash-image fallback |
| Database | Update `platform_settings` row: `image_model` = `"gemini"` |

### What This Fixes

- All new image generations will use Gemini directly — no more Flux blank frames
- No more "10372 bytes" validation errors from small Flux outputs
- Faster generation (no wasted Flux attempt before Gemini fallback)
- Videos continue using Kling unchanged

