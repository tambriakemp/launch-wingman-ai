

# Admin Toggle: Require Kling API Keys for Video Generation

## Summary
Add an admin-controlled platform setting (`video_provider`) that switches the video generation backend between **fal.ai** (default, current behavior) and **Kling Direct**. When set to "kling", users must provide their own Kling Access Key + Secret Key to generate videos. All existing fal.ai logic stays untouched.

## Changes

### 1. Admin UI — New "Video Provider" toggle card
**File:** `src/components/admin/VideoProviderToggle.tsx` (new)

A card similar to `ImageModelToggle.tsx` with two options:
- **fal.ai** (Default) — current behavior, platform FAL_KEY + user BYOK fal keys
- **Kling Direct** — requires users to add their own Kling Access Key + Secret Key in Settings

Uses the existing `update-platform-settings` edge function with key `video_provider`.

**File:** `src/components/admin/ConfigTab.tsx` — import and render `<VideoProviderToggle />` alongside the existing `ImageModelToggle`.

### 2. User Settings — Kling API key fields
**File:** `src/components/settings/AiSettingsCard.tsx`

- Fetch the `video_provider` platform setting on mount
- When provider is `"kling"`, show Kling key input fields (Access Key + Secret Key) instead of / in addition to the fal.ai key section
- Store as two `user_api_keys` entries: service `kling_access_key` and `kling_secret_key`
- Show a notice explaining that Kling keys are required when the admin has enabled Kling mode

### 3. FalKeyWarning update
**File:** `src/components/ai-studio/FalKeyWarning.tsx`

- Fetch the `video_provider` setting
- When `"kling"`, check for Kling keys instead of fal.ai key and show appropriate instructions directing users to `app.klingai.com/global/dev`

### 4. Edge function — generate-video
**File:** `supabase/functions/generate-video/index.ts`

- At the top, fetch `video_provider` from `platform_settings`
- If `"kling"`:
  - Look up `kling_access_key` and `kling_secret_key` from `user_api_keys` (user must provide their own)
  - If missing, return 400 with clear error message
  - Generate a JWT (HS256) from the keys
  - Call `https://api-singapore.klingai.com/v1/videos/image2video` with the mapped payload
  - Return `{ taskId, provider: "kling" }` 
- If `"fal"` (default): existing fal.ai logic unchanged

### 5. Edge function — check-video-status
**File:** `supabase/functions/check-video-status/index.ts`

- Accept a `provider` field in the request
- When `provider === "kling"`:
  - Look up user's Kling keys, generate JWT
  - Poll `GET /v1/videos/image2video/{taskId}`
  - Map `succeed`→`completed`, `failed`→`failed`, else `in_progress`
  - Extract URL from `data.task_result.videos[0].url`
- Default: existing fal.ai polling unchanged

### 6. Frontend — AIStudio response handling
**File:** `src/pages/AIStudio.tsx`

- Store `provider` from generate-video response
- Pass `provider` + `taskId` to check-video-status calls
- Handle both response formats

## No secrets needed from you
Since users provide their own Kling keys, no platform-level Kling secrets are required.

## Files Summary
| File | Action |
|------|--------|
| `src/components/admin/VideoProviderToggle.tsx` | Create |
| `src/components/admin/ConfigTab.tsx` | Add VideoProviderToggle |
| `src/components/settings/AiSettingsCard.tsx` | Add Kling key fields |
| `src/components/ai-studio/FalKeyWarning.tsx` | Support Kling mode |
| `supabase/functions/generate-video/index.ts` | Add Kling direct path |
| `supabase/functions/check-video-status/index.ts` | Add Kling status polling |
| `src/pages/AIStudio.tsx` | Handle provider field |

