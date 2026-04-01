

## Combine Scene Videos into a Single Reel

### Summary
Add a "Create Reel" button that stitches all generated scene videos into one continuous video. This requires a new edge function that uses ffmpeg to concatenate the video URLs, and a UI button to trigger it.

### Approach

**New edge function: `supabase/functions/merge-scene-videos/index.ts`**
- Accepts an array of video URLs (ordered by scene number) + userId
- Downloads each video to temp storage
- Uses ffmpeg (via Deno subprocess) to concatenate them using the concat demuxer
- Uploads the merged MP4 to the `ai-studio` storage bucket under `reels/{userId}/{timestamp}.mp4`
- Returns the public URL of the merged video
- Auth: standard JWT + BYOK personal API key support (same pattern as other functions)

**`src/pages/AIStudio.tsx`**
- Add a "Create Reel" button in the toolbar area (visible when 2+ scenes have videos)
- Add state: `isMergingVideos`, `mergedReelUrl`
- On click: collect all `generatedMedia[i].videoUrl` values in scene order, call the edge function
- On success: show a dialog/toast with download link and inline video preview

**`src/components/ai-studio/StoryboardToolbar.tsx`** (or inline on the page)
- Add the "Create Reel" button near the existing action buttons
- Disable when videos are still generating or fewer than 2 scenes have videos

**`supabase/functions/ai-studio-api/index.ts`**
- Add `merge_videos` to the valid actions list and proxy config

### Technical details

The edge function approach:
1. Download each video URL to `/tmp/` in the Deno runtime
2. Write a concat list file: `file '/tmp/vid0.mp4'\nfile '/tmp/vid1.mp4'...`
3. Run ffmpeg: `ffmpeg -f concat -safe 0 -i list.txt -c copy output.mp4` (stream copy, no re-encoding for speed)
4. If videos have different codecs/resolutions, fall back to re-encoding: `ffmpeg -f concat -safe 0 -i list.txt -c:v libx264 -preset fast output.mp4`
5. Upload merged file to storage bucket, return public URL

Edge function runtime consideration: Deno Deploy (Supabase Edge Functions) does NOT have ffmpeg available. So instead, we use **fal.ai's ffmpeg endpoint** or handle it client-side using a WebAssembly ffmpeg library (`@ffmpeg/ffmpeg`).

**Revised approach — client-side merge using ffmpeg.wasm:**
- Install `@ffmpeg/ffmpeg` and `@ffmpeg/util` 
- When user clicks "Create Reel", load ffmpeg.wasm in the browser
- Fetch each video as a blob, write to ffmpeg's virtual filesystem
- Run concat command in-browser
- Output merged MP4 as a downloadable blob
- This avoids needing server-side ffmpeg and keeps it simple

### Changes

| File | What |
|------|------|
| `src/pages/AIStudio.tsx` | Add "Create Reel" button, merge logic using ffmpeg.wasm, download handler |
| `package.json` | Add `@ffmpeg/ffmpeg` and `@ffmpeg/util` dependencies |

### UX Flow
1. User generates storyboard and scene videos as normal
2. When 2+ scenes have videos, a "Create Reel" button appears (Film icon + label)
3. Click triggers client-side video concatenation with a progress indicator
4. On completion, a download dialog appears with the merged MP4 and inline preview
5. User can download or dismiss

