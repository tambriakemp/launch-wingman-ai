

## Switching from MiniMax to Kling O3

Kling is available on fal.ai as **Kling O3 Standard** (`fal-ai/kling-video/o3/standard/image-to-video`). It uses the same queue-based API pattern, so the switch is straightforward. Kling O3 offers better identity preservation, 3-15 second duration options, and optional native audio generation.

### Changes Required

#### 1. Update `generate-video` edge function
- Change the submit URL from `fal-ai/minimax-video/image-to-video` to `fal-ai/kling-video/o3/standard/image-to-video`
- Update the request body: keep `image_url` and `prompt`, add `duration: "5"` default, optionally set `generate_audio: false`
- Remove `prompt_optimizer: true` (MiniMax-specific)

#### 2. Update `check-video-status` edge function
- Change the status URL from `fal-ai/minimax-video/requests/{id}/status` to `fal-ai/kling-video/o3/standard/image-to-video/requests/{id}/status`
- Change the result URL from `fal-ai/minimax-video/requests/{id}` to `fal-ai/kling-video/o3/standard/image-to-video/requests/{id}`
- Output schema is the same (`video.url`)

#### 3. No frontend changes needed
The client-side polling logic and UI are model-agnostic -- they just work with `requestId`, `status`, and `videoUrl`.

### Key Differences: Kling O3 vs MiniMax
- Better identity/face preservation from source image
- Configurable duration: 3-15 seconds (vs MiniMax fixed ~6s)
- Optional native audio generation
- Uses the same fal.ai API key (no new secrets needed)

