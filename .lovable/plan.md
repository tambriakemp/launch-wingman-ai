

## Problem Analysis

From the logs, the error is clear: **the edge function is timing out**. The client sends a request to `generate-scene-image` with 6 environment images + preview + anchor image (all as URLs), and the AI model takes too long to respond. The client's fetch connection closes before the response arrives, causing:
- Edge function: `"Http: connection closed before message completed"` / `"Cannot read headers: request closed"`
- Client: `"Failed to fetch"` → mapped to `"⏱️ The request timed out or was interrupted. Video generation can take 3-5 minutes — please try again."`

The error message mentions "Video generation" even for image generation failures — that's misleading.

## Plan

### 1. Fix error messages to be context-specific

Update `getUserFriendlyErrorMessage` in `constants.ts`:
- The "failed to fetch" message currently says "Video generation can take 3-5 minutes" — but this fires for image generation too
- Make the function accept an optional `context` parameter (`'image' | 'video' | 'general'`) so the message is appropriate
- Add specific messages for image generation timeouts vs video timeouts
- Update all call sites in `AIStudio.tsx` to pass the context based on `task.type`

### 2. Reduce environment images sent to the model

The request body shows **6 environment images** being sent. Each one the model must download and process, massively increasing latency. Limit to max 3 environment images (the model doesn't need 6 angles of the same room — 2-3 is sufficient for spatial understanding). This is the single biggest speed improvement available without changing models.

### 3. Add client-side timeout with retry guidance

The `supabase.functions.invoke` call has no timeout. Add an `AbortController` with a 90-second timeout for image generation, and show a clear message: "Image generation timed out after 90 seconds. This can happen with complex scenes — try regenerating this scene."

### 4. Model speed consideration

`google/gemini-3-pro-image-preview` is the best quality image model available. The alternative `google/gemini-2.5-flash-image` is faster but lower quality. Rather than switching models, the biggest speed gain comes from reducing the number of images sent (point 2 above). No model change recommended.

### Files to modify
- `src/components/ai-studio/constants.ts` — make error messages context-aware (image vs video)
- `src/pages/AIStudio.tsx` — add AbortController timeout, limit env images to 3, pass error context
- `supabase/functions/generate-scene-image/index.ts` — cap environment images to 3 server-side as safety net

