

## Script-to-Talking-Head Video Pipeline

### Summary
Create a standalone edge function that chains ElevenLabs TTS and HeyGen's video generation API into a single call. You send a script, voice ID, and image URL — it returns a HeyGen video generation task you can poll for the result.

### Pipeline flow
```text
POST /functions/v1/generate-talking-head
  ├─ 1. Call ElevenLabs TTS → get MP3 audio
  ├─ 2. Upload audio to ai-studio storage bucket → get public URL
  └─ 3. Call HeyGen "create video" API with image URL + audio URL
       └─ Return HeyGen video_id for polling
```

### Changes

#### 1. Add HeyGen API key as a secret
Use the `add_secret` tool to store `HEYGEN_API_KEY`. You'll paste your key when prompted.

#### 2. New edge function: `supabase/functions/generate-talking-head/index.ts`
- Accepts JWT or personal API key auth (same pattern as other functions)
- Request body:
  ```json
  {
    "script": "Hello, welcome to my channel...",
    "voiceId": "FGY2WhTYpPnrIDTdsKH5",
    "imageUrl": "https://...",
    "aspectRatio": "9:16"
  }
  ```
- **Step 1**: Call ElevenLabs TTS (`/v1/text-to-speech/{voiceId}`) with the script → get audio buffer
- **Step 2**: Upload audio buffer to `ai-studio` storage as `talking-head/{userId}/{timestamp}.mp3` → get public URL
- **Step 3**: Call HeyGen API v2 (`POST https://api.heygen.com/v2/video/generate`) with:
  - The image URL as the avatar photo
  - The audio URL as the voice input
  - Aspect ratio
- **Step 4**: Return `{ videoId, status }` — HeyGen video generation is async

#### 3. New edge function: `supabase/functions/check-heygen-status/index.ts`
- Accepts `{ videoId }` in the request body
- Calls HeyGen's status endpoint (`GET https://api.heygen.com/v1/video_status.get?video_id={id}`)
- Returns `{ status, videoUrl, error }` — `videoUrl` is populated once complete

### Usage
```bash
# Step 1: Generate
curl -X POST ".../functions/v1/generate-talking-head" \
  -H "Authorization: Bearer lw_sk_..." \
  -H "Content-Type: application/json" \
  -d '{
    "script": "Welcome to my channel...",
    "voiceId": "FGY2WhTYpPnrIDTdsKH5",
    "imageUrl": "https://example.com/photo.jpg"
  }'
# Returns: { "videoId": "abc123" }

# Step 2: Poll status
curl -X POST ".../functions/v1/check-heygen-status" \
  -H "Authorization: Bearer lw_sk_..." \
  -H "Content-Type: application/json" \
  -d '{ "videoId": "abc123" }'
# Returns: { "status": "completed", "videoUrl": "https://..." }
```

### Technical details
- Auth: Supports both JWT and `lw_sk_` personal API keys (reuses the same pattern from `ai-studio-api`)
- ElevenLabs voice ID defaults to Laura if not provided
- Audio is stored temporarily in the `ai-studio` bucket so HeyGen can fetch it via URL
- HeyGen video generation is async (typically 2-5 minutes) — poll with the status function
- No new database tables needed

