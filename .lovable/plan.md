

## Fix Video Generation Error Visibility in AI Studio

### Problem
Two issues cause silent/unhelpful video failures:

1. **Edge function loses error detail**: When fal.ai returns a 403 (exhausted balance), the edge function logs the detail but throws only `fal.ai error: 403`. The actual reason ("Exhausted balance") is lost.

2. **No toast notification on failure**: Image generation errors trigger toasts in some flows, but the queue processor (lines 201-211 in AIStudio.tsx) only sets `videoError` on the scene card state -- no toast is shown. The SceneCard shows a red "Video Failed" overlay but without the reason why.

3. **Error mapping gaps**: `getUserFriendlyErrorMessage` handles 402 and 429 but not 403 or "exhausted balance" patterns from fal.ai.

### Changes

**1. `supabase/functions/generate-video/index.ts`**
- When fal.ai returns an error, parse the JSON body and include the `detail` message in the thrown error
- Change from `throw new Error(\`fal.ai error: ${submitResponse.status}\`)` to include the actual error detail (e.g., "Exhausted balance")
- Map fal.ai "Exhausted balance" / "locked" errors to a 402 response with a clear message like "Platform video generation balance exhausted. Please use your own fal.ai API key or try again later."

**2. `src/components/ai-studio/constants.ts`**
- Add pattern matching for `403`, `locked`, `exhausted balance`, and `platform.*balance` in `getUserFriendlyErrorMessage`
- These should map to a credits-related message directing users to add their own API key or purchase credits

**3. `src/pages/AIStudio.tsx`**
- In the queue processor catch block (around line 201), add a toast notification when a video generation fails, showing the friendly error message
- This ensures users see a prominent notification even if they've scrolled away from the failed scene

**4. `src/components/ai-studio/SceneCard.tsx`**
- Display the actual `media.videoError` message text in the red error overlay instead of just "Video Failed"
- Truncate long messages to keep the UI clean

### Technical Details

The edge function currently does:
```
throw new Error(`fal.ai error: ${submitResponse.status}`);
```

It will be changed to parse and forward the error detail:
```
const errJson = JSON.parse(errText);
const detail = errJson?.detail || `HTTP ${submitResponse.status}`;
// Return 402 for balance issues, 500 otherwise
```

The catch block in AIStudio.tsx will add:
```
if (task.type === 'generate_video') {
  toast({ title: "Video Failed", description: friendlyMsg, variant: "destructive" });
}
```

### Files Modified
- `supabase/functions/generate-video/index.ts`
- `src/components/ai-studio/constants.ts`
- `src/pages/AIStudio.tsx`
- `src/components/ai-studio/SceneCard.tsx`
