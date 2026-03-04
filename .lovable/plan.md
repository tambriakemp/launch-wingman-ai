

## Current State

The video panel in SceneCard shows the generated video but has **no download or regenerate buttons** when a video exists. The model used is **fal-ai/minimax-video** (MiniMax image-to-video), which does not have strong identity preservation — hence the character changing between scenes.

## Video Model

You're using **MiniMax image-to-video** via fal.ai. This model is known for producing cinematic motion but has weak identity consistency — it treats each frame generation somewhat independently from the source image's facial features. This is a known limitation of most current image-to-video models.

## Plan

### 1. Add Download and Regenerate buttons to the video panel
When a video exists (`media.videoUrl` is set), overlay action buttons similar to the image panel:
- **Download** button — fetches the video URL as a blob and triggers a browser download with a filename like `scene-{n}-video.mp4`
- **Regenerate** button — calls `onGenerateVideo()` to re-queue video generation for that scene

These will be small icon buttons overlaid at the bottom of the video container, matching the existing image panel button style (download/refresh icons).

### 2. File changes
- **`src/components/ai-studio/SceneCard.tsx`**: Add download + regenerate button overlay inside the video panel when `media.videoUrl` exists. Download will use `fetch` + blob + `URL.createObjectURL` pattern to force a file save.

### Technical note on identity consistency
To improve character consistency in videos, the best approach would be to switch to a model with better identity preservation (e.g., Kling or Runway Gen-3), but those would require different API integrations. Within the current MiniMax setup, ensuring the source image has a clear, well-lit face and adding identity-reinforcing language in the video prompt can help marginally.

