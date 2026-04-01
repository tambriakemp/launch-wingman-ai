

## Fix "Generate Reel" Edge Function Failure

### Root cause
The `merge-scene-videos` edge function fails with "Failed to fetch" because:

1. **Missing `config.toml` entry** — The function has no `[functions.merge-scene-videos]` block in `supabase/config.toml`, so it likely deploys with `verify_jwt = true` by default, which can cause request failures.
2. **`getClaims` API issue** — The function uses `supabase.auth.getClaims(token)` which may not be available in the Supabase JS version used (`@supabase/supabase-js@2.57.2`). This could cause the function to crash on startup or during execution.
3. **ffmpeg unavailability** — Edge functions run in Deno Deploy, which does not have `ffmpeg` installed. The function tries to run `Deno.Command("ffmpeg", ...)` which will fail. This is a fundamental architectural problem.

### Fix approach

Since Edge Functions don't have ffmpeg, the reel merge needs to happen **client-side** (as it was originally attempted). The edge function approach won't work without a dedicated server with ffmpeg.

**Option: Revert to client-side merge using Canvas + MediaRecorder, but fix the previous issues:**

1. **`src/pages/AIStudio.tsx`** — Replace the edge function call in `handleCreateReel` with client-side video concatenation:
   - Load each video into a `<video>` element
   - Use Canvas to draw frames and MediaRecorder to capture
   - Set canvas dimensions from `config.aspectRatio` (not from source video metadata)
   - Output as WebM (browser-native), then upload to storage

2. **`supabase/functions/merge-scene-videos/index.ts`** — Remove this function (it can't work without ffmpeg).

3. **Fix orientation** — Use the project's `aspectRatio` setting to determine canvas dimensions rather than reading from the first video.

4. **Fix download format** — Since browsers output WebM from MediaRecorder, name the download accordingly, or use a library like `mp4-mux` for true MP4 output.

5. **Persist the reel** — After client-side merge, upload the blob to storage and save the URL to the project record (same storage upload logic, just done from client via Supabase storage SDK).

### Changes

| File | Change |
|------|--------|
| `src/pages/AIStudio.tsx` | Replace edge function call with client-side Canvas+MediaRecorder merge, proper aspect ratio, upload result to storage |
| `supabase/functions/merge-scene-videos/index.ts` | Delete (ffmpeg not available in edge runtime) |
| `supabase/config.toml` | No changes needed (function removed) |

### Technical details
- Canvas dimensions: `9:16` → 1080×1920, `16:9` → 1920×1080, `1:1` → 1080×1080
- Each video plays sequentially on the canvas; MediaRecorder captures the stream
- After recording completes, upload blob to `ai-studio` bucket under `reels/{userId}/{timestamp}.webm`
- Update `ai_studio_projects.reel_url` with the public URL
- Progress updates at each video boundary

