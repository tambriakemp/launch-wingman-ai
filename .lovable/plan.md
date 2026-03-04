

## Problem

The edge function logs show the video generation polled 39 times (~195 seconds) then the function was **shut down** by the runtime before the video completed. The client sees "Failed to fetch" because the connection was terminated. This is a fundamental architecture issue: MiniMax video generation often takes 3-5+ minutes, which exceeds edge function timeout limits (~300s including cold start overhead).

## Solution: Client-Side Polling

Split the flow into two parts:

1. **Edge function** (`generate-video`): Only **submits** the job to fal.ai, deducts credits, and immediately returns the `requestId`. No polling.

2. **New edge function** (`check-video-status`): Accepts a `requestId`, checks fal.ai status, and returns `{ status, videoUrl }`.

3. **Frontend** (`AIStudio.tsx`): After getting the `requestId`, polls `check-video-status` every 10 seconds from the browser. No edge function timeout risk.

## Changes

### 1. Simplify `generate-video` edge function
- Remove the entire polling loop (lines ~185-250)
- After successful fal.ai queue submission, return `{ requestId }` immediately
- Keep all credit logic and error handling as-is

### 2. Create `check-video-status` edge function
- Accepts `{ requestId }` in body + auth header
- Looks up user's fal.ai key (BYOK) or uses platform key
- Calls `https://queue.fal.run/fal-ai/minimax-video/requests/{requestId}/status`
- If COMPLETED, fetches result and returns `{ status: "completed", videoUrl }`
- If IN_PROGRESS, returns `{ status: "in_progress" }`
- If FAILED, returns `{ status: "failed", error: "..." }`

### 3. Update frontend polling in `AIStudio.tsx`
- After calling `generate-video` and getting `requestId`, enter a client-side polling loop
- Call `check-video-status` every 10 seconds
- Update scene state with progress indicator
- On completion, set `videoUrl`; on failure, set `videoError` with friendly message
- No browser timeout issues since `fetch` calls are short-lived

### 4. Update error constants
- Add messaging for "video is processing" state vs actual failures

