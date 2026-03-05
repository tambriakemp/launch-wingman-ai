

## Problem Analysis

The tab crash during preview regeneration is caused by **browser memory exhaustion**. Here's why:

1. **Base64 images stored in React state**: `referenceImage`, `referenceImages`, `environmentImages`, `productImage` are all held as raw base64 strings in memory — each high-res photo can be 5-15MB as base64.

2. **Memory spike during upload**: When `handleGeneratePreview` runs, it calls `uploadImagesToStorage` which converts ALL base64 strings to `Uint8Array` simultaneously via `Promise.all` (line 327-332). This effectively **triples** memory usage momentarily (base64 in state + decoded bytes + upload buffers).

3. **No cleanup**: Old base64 data stays in state even after URLs are obtained from storage.

## Plan

### 1. Upload images to storage immediately on file selection (not during preview generation)

Modify `StoryboardToolbar` (or wherever images are picked) so that when the user selects a file, it:
- Uploads to storage immediately
- Stores the **public URL** in state instead of base64
- This keeps memory usage flat regardless of how many images are loaded

Update `AIStudio.tsx` state to use URLs:
- `referenceImage` / `referenceImages` → store URLs after upload
- `environmentImage` / `environmentImages` → store URLs after upload  
- `productImage` → store URL after upload

### 2. Simplify `handleGeneratePreview` to pass URLs directly

Since images are already uploaded, `handleGeneratePreview` skips the upload step entirely — just passes the stored URLs to the edge function. This eliminates the memory spike.

### 3. Fix the queue processor to use URLs instead of base64

Lines 161-165 in the queue processor still pass raw base64 fields (`referenceImage`, `productImage`, `environmentImage`) to `generate-scene-image`. Update these to pass URLs instead.

Lines 126-133 extract base64 from locked image URLs — if the imageUrl is already a storage URL (not base64), skip the split logic.

### 4. Add defensive guards against tab crashes

- Wrap the preview regeneration in a safety check: if `performance.memory` (Chrome) shows high usage, warn the user before proceeding
- Add `try/catch` around the image upload helper to handle `RangeError` (out of memory) gracefully with a toast instead of crashing

### Files to modify
- `src/pages/AIStudio.tsx` — change state from base64 to URLs, simplify preview/scene generation
- `src/components/ai-studio/StoryboardToolbar.tsx` (or image picker component) — upload on selection, return URL
- `src/components/ai-studio/uploadToStorage.ts` — add a helper for File → storage URL (not just base64 → storage)

