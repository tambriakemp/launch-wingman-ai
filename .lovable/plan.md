

## Plan: Fix silent Flux-to-Gemini fallback

### Problem
Your fal.ai key is stored, the platform is set to `flux_kontext`, and the platform `FAL_KEY` is configured — yet the system silently falls back to Gemini without telling you. The code has three silent fallback paths that provide no visibility.

### Changes

**File: `supabase/functions/generate-scene-image/index.ts`**

1. **Add logging at every decision point** — log which fal.ai key source is being used (user BYOK vs platform), log the base image URL being sent to Flux, and log the full Flux response status and body on failure.

2. **Return the model used in the response** — include `"model": "flux_kontext"` or `"model": "gemini"` in the JSON response so the frontend can display which model actually generated the image.

3. **Fix the user key lookup for proxied requests** — when the request comes through `ai-studio-api` with a service role token, the `getUser()` call fails. Add a fallback: accept an optional `userId` field in the request body (already available from the proxy) and use it to look up the user's fal.ai key directly instead of relying solely on JWT parsing.

4. **Surface fallback in the response** — add a `"fallback": true` field when Gemini was used despite Flux being configured, so the frontend can show a subtle indicator like "Generated with fallback model".

**File: `src/pages/AIStudio.tsx`**

5. **Pass `userId` in the request body** when calling `generate-scene-image`, so the edge function can look up the user's BYOK key even when called via proxy.

6. **Show model info** — display a small badge or toast indicating which model was used, especially when a fallback occurred.

### Scope
- 2 files changed
- No database changes
- Improves transparency and fixes the BYOK key lookup for proxied auth flows
