

# Persistent, Specific Credit/API Key Error Alerts

## Problem
When video generation fails due to exhausted credits or a fal.ai API key issue, the user only sees a toast that auto-dismisses. They need a persistent, specific message that stays visible until manually closed.

## Approach
Use a **persistent alert banner** inside the AI Studio page (not a toast) that appears when a 402/credit error occurs and stays until the user dismisses it. The message will differ based on whether they're using platform credits vs their own fal.ai key.

## Changes

### 1. Edge function: return distinct error codes (`generate-video/index.ts`)
- For "no platform credits remaining" (line 114): add a `code` field: `{ error: "...", code: "NO_CREDITS" }`
- For "platform fal balance exhausted" (line 212): add `{ error: "...", code: "PLATFORM_EXHAUSTED" }`
- For user's own fal key failing (when `userFalKey` is set and fal returns 402/403): add `{ error: "...", code: "USER_KEY_EXHAUSTED" }`

### 2. Error message mapping (`constants.ts`)
- Update `getUserFriendlyErrorMessage` to accept an optional `errorCode` parameter
- Return specific messages:
  - `NO_CREDITS` → "You're out of video credits. Purchase more credits in Settings → AI & Video, or add your own fal.ai API key for unlimited generation."
  - `PLATFORM_EXHAUSTED` → "Platform video credits are temporarily unavailable. Add your own fal.ai API key in Settings → AI & Video to continue generating videos."
  - `USER_KEY_EXHAUSTED` → "Your fal.ai API key has insufficient balance. Top up your account at fal.ai/dashboard/billing to continue."

### 3. Persistent error banner in AIStudio (`AIStudio.tsx`)
- Add a `videoCreditError` state (`{ message: string, code: string } | null`)
- In the catch block for video errors, detect credit-related error codes and set this state instead of (or in addition to) showing a toast
- Render a dismissible `Alert` banner (amber/red with AlertTriangle icon) at the top of the storyboard area that includes:
  - The specific error message
  - A "Go to Settings" button linking to the AI settings section
  - An X button to dismiss
- The banner persists until the user clicks dismiss

### 4. Extract error code from response (`AIStudio.tsx`)
- When `data?.error` is present, also read `data?.code` before throwing
- Attach the code to the thrown error so the catch block can use it

## Files Modified
- `supabase/functions/generate-video/index.ts` — add `code` field to 402 responses
- `src/components/ai-studio/constants.ts` — update error message mapping
- `src/pages/AIStudio.tsx` — add persistent alert state and banner UI

