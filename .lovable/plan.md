

## Analysis: Memory Limit Exceeded in `generate-character-preview`

### Root Cause

The edge function logs show **"Memory limit exceeded"** (not CPU). Supabase edge functions have a ~150MB memory limit. The function is hitting this because:

1. **Multiple full-resolution base64 images are sent in the request body** -- `referenceImage`, `referenceImages` (array), `environmentImage`, `environmentImages` (array). Each high-res image can be 5-15MB as base64.
2. **These same base64 strings are duplicated into `contentParts`** -- they're stripped of prefix and re-wrapped, but remain fully in memory alongside the originals.
3. **The entire request body + the `contentParts` array + the JSON-serialized API request body** all coexist in memory simultaneously. For 3-4 high-res images, that's easily 60-120MB of base64 strings duplicated 2-3 times.
4. **The AI API response** also contains a full base64 image (~5-10MB), which is then decoded into a `Uint8Array` (another copy) and uploaded.

In short: the function holds multiple copies of multiple large images in memory simultaneously.

### Solution: Upload images to storage first, pass URLs instead of base64

The fix is to move image uploads to the **client side** before invoking the edge function, so the function only receives lightweight URLs instead of massive base64 payloads.

#### 1. Create a client-side helper to upload reference/environment images to storage

Before calling `generate-character-preview`, upload each base64 image to the `ai-studio` storage bucket and collect the public URLs. This moves the heavy data out of the edge function's memory.

#### 2. Modify `AIStudio.tsx` -- upload images before invoking

In `handleGeneratePreview`, upload `referenceImage`, `referenceImages`, `environmentImage`, and `environmentImages` to storage first. Pass the resulting URLs in `previewBody` instead of raw base64.

New fields: `referenceImageUrl`, `referenceImageUrls`, `environmentImageUrl`, `environmentImageUrls`.

#### 3. Modify `generate-character-preview/index.ts` -- accept URLs instead of base64

- Accept the new URL fields alongside (or instead of) the base64 fields for backward compatibility.
- When URLs are provided, pass them directly as `image_url` objects to the AI model (Gemini accepts URLs natively).
- Remove the base64 stripping/re-wrapping logic when URLs are available.
- This eliminates all large base64 strings from the function's memory.

#### 4. Memory impact

| Before | After |
|--------|-------|
| ~4 images × 10MB base64 × 2-3 copies = 80-120MB | ~4 short URL strings = <1KB |

The function's memory usage drops from ~100MB+ to under 10MB.

### No other changes needed

- The AI model (Gemini) supports both `data:` base64 URLs and public HTTP URLs in `image_url` fields, so no prompt changes are required.
- The storage upload/download at the end of the function (for the generated result) is fine -- it's a single image and streams efficiently.

