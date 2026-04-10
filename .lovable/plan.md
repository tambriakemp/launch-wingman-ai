

# Fix: Video Status Polling Uses Wrong Response URL

## Problem
The `generate-video` function submits to `fal-ai/kling-video/o3/pro/image-to-video`, but fal.ai returns `response_url` and `status_url` with a base path (`fal-ai/kling-video`). When `check-video-status` fetches the completed result from this wrong URL, fal.ai returns a 422 validation error, causing an infinite polling loop.

## Fix

### File: `supabase/functions/generate-video/index.ts`
- **Always construct** `statusUrl` and `responseUrl` using the full endpoint path, ignoring fal.ai's returned URLs:
```typescript
const statusUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}/status`;
const responseUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}`;
```

### File: `supabase/functions/check-video-status/index.ts`
- Add a safety measure: if the result fetch returns a 422, treat it as `failed` with a descriptive error instead of returning `in_progress` (which causes infinite retry).

### File: `supabase/functions/generate-video/index.ts` (additional)
- Pass the `endpoint` string along with `requestId`, `statusUrl`, and `responseUrl` in the response so that `check-video-status` has the correct context if URLs ever need reconstruction.

## Scope
- Two edge functions modified: `generate-video` and `check-video-status`
- Auto-deployed after save

