

## Replace FFmpeg with CloudConvert for WebM→MP4 Conversion

### Why
The edge function runtime doesn't have `ffmpeg` installed, so the current approach fails. You already have a `CLOUDCONVERT_API_KEY` secret configured — CloudConvert's API can handle WebM→MP4 conversion reliably.

### How CloudConvert works
1. **Create a job** with 3 tasks: `import/url` (fetch the WebM), `convert` (WebM→MP4), `export/url` (get a download link)
2. **Poll** the job until it's `finished`
3. **Download** the resulting MP4 from the export URL
4. **Upload** to Supabase storage

### Changes

**`supabase/functions/convert-video/index.ts`** — Full rewrite

Replace the ffmpeg-based logic with CloudConvert API calls:

```
1. Read inputUrl, outputPath from request body
2. Create CloudConvert job:
   POST https://api.cloudconvert.com/v2/jobs
   {
     tasks: {
       "import-webm": { operation: "import/url", url: inputUrl },
       "convert-to-mp4": {
         operation: "convert",
         input: "import-webm",
         output_format: "mp4",
         video_codec: "x264",
         fps: 30
       },
       "export-result": {
         operation: "export/url",
         input: "convert-to-mp4"
       }
     }
   }
3. Poll GET /v2/jobs/{id} every 3 seconds until status === "finished" (timeout after 120s)
4. Extract the export URL from the finished job's export task
5. Fetch the MP4 data from the export URL
6. Upload to Supabase storage at outputPath
7. Return the public URL
```

No changes needed in `AIStudio.tsx` — the edge function's interface (request/response) stays the same.

### Summary

| File | Change |
|------|--------|
| `supabase/functions/convert-video/index.ts` | Replace ffmpeg with CloudConvert API |

