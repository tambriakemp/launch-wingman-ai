

## Fix Reel Orientation — Fill Instead of Letterbox

### Problem
The reel merger uses aspect-**fit** scaling (`Math.min`), which places landscape source videos inside a portrait canvas with large black bars. Even though the aspect ratio fix was applied to image generation, existing videos were generated before the fix and remain landscape. The reel looks wrong because of the letterboxing.

### Solution
Two changes:

1. **Use aspect-fill (crop) instead of aspect-fit (letterbox)** in the reel Canvas renderer — change `Math.min` to `Math.max` so each video fills the entire canvas, cropping overflow rather than showing black bars. This makes the reel look correct regardless of source video orientation.

2. **Add audio tracks to the reel** — Currently `vid.muted = true` means the reel has no audio. The MediaRecorder stream only captures the canvas video. To include audio, we'd need to mix audio tracks into the stream. This is a separate concern — keep muted for now.

### Changes

**`src/pages/AIStudio.tsx`** (line ~605)

Change the scaling from aspect-fit to aspect-fill:
```js
// Before (aspect-fit — black bars)
const scale = Math.min(dims.w / vid.videoWidth, dims.h / vid.videoHeight);

// After (aspect-fill — crop to fill)
const scale = Math.max(dims.w / vid.videoWidth, dims.h / vid.videoHeight);
```

This single-line change ensures landscape videos fill the portrait canvas (cropping sides) instead of floating in the middle with black bars.

### Result
Landscape source videos will be center-cropped to fill the portrait frame. Once the user regenerates images with the new aspect ratio fix, the cropping will be minimal or none.

