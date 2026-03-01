

## Deep Analysis: Why the Character Is Not Staying Consistent

### Root Causes Found

**Bug 1: Stale Closure -- `previewCharacterImage` is NULL when scenes generate**

This is the PRIMARY cause. The queue processor `useEffect` (line 40) depends only on `[queue]`. It reads `previewCharacterImage` from a closure, but that value is captured from the render when the effect was created -- NOT from the latest state.

The flow:
1. User generates preview -- `previewCharacterImage` is set to a base64 data URL
2. User clicks "Generate Storyboard" -- storyboard generates, then `addToQueue(tasks)` is called
3. The `useEffect` fires because `queue` changed, but it captured `previewCharacterImage` from a render BEFORE or DURING the queue update
4. `activePreview` evaluates to `null`, so `previewCharacter: null` is sent
5. Since `activePreview` is falsy, `referenceImage` and `referenceImages` are ALSO sent (the raw selfies) -- defeating the identity gate entirely

**Evidence**: The network request bodies in the logs show NO `previewCharacter` field -- confirming it's `null`/`undefined` at execution time. Meanwhile `environmentImage` IS present, confirming other state vars are captured but the preview specifically is missing (set later in the flow).

**Bug 2: `generatedMedia` is also stale in the closure**

Line 69 reads `generatedMedia` from the closure for locked refs. During the first storyboard run, `generatedMedia` was just initialized to empty defaults (line 258-260), but the closure may capture the pre-initialization state.

**Bug 3: Preview not uploaded to storage**

`generate-character-preview` returns the raw base64 image directly (line 184). Unlike `generate-scene-image` which uploads to Supabase storage and returns a public URL, the preview stays as a massive base64 string. This means:
- Sending it in the request body makes payloads enormous
- If it does get sent, `stripPrefix` on the edge function works correctly (strips `data:image/png;base64,` prefix), but the payload size could cause issues

### Fix Plan

#### 1. Use refs instead of stale closures for critical identity state

Store `previewCharacterImage`, `previewFinalLookImage`, `referenceImage`, `referenceImages`, `environmentImage`, `environmentImages`, and `generatedMedia` in refs that are always current. The `useEffect` will read from refs instead of closures.

**File**: `src/pages/AIStudio.tsx`
- Add `useRef` mirrors for the critical state variables
- Update refs in `useEffect` syncs whenever state changes
- Read from refs inside the queue processor

#### 2. Upload preview to storage for smaller payloads

Modify `generate-character-preview` to upload the generated image to the `ai-studio` storage bucket (same pattern as `generate-scene-image`) and return a public URL instead of raw base64.

**File**: `supabase/functions/generate-character-preview/index.ts`
- Add Supabase client import
- After generating the image, upload to storage
- Return the public URL

#### 3. Handle URL-based previews in the scene generator

Update `generate-scene-image` to handle the `previewCharacter` being a URL (not just base64). If it starts with `https://`, pass it directly as an `image_url` without base64 wrapping.

**File**: `supabase/functions/generate-scene-image/index.ts`
- In the `previewCharacter` handling block, check if it's a URL or base64
- If URL, pass directly: `{ type: "image_url", image_url: { url: previewCharacter } }`
- If base64, strip prefix and wrap as before

### Technical Details

#### Ref-based state access pattern:
```text
// Add refs that mirror critical state
const previewCharacterRef = useRef(previewCharacterImage);
const referenceImageRef = useRef(referenceImage);
// ... etc

// Sync refs whenever state changes
useEffect(() => { previewCharacterRef.current = previewCharacterImage; }, [previewCharacterImage]);
useEffect(() => { referenceImageRef.current = referenceImage; }, [referenceImage]);

// In queue processor, read from refs:
const activePreview = task.step.is_final_look && previewFinalLookRef.current
  ? previewFinalLookRef.current : previewCharacterRef.current;
```

#### Preview upload pattern (matching scene generator):
```text
// In generate-character-preview, after getting imageUrl:
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
// Convert base64 to bytes, upload, return public URL
```

#### URL detection in scene generator:
```text
if (previewCharacter) {
  if (previewCharacter.startsWith('http')) {
    contentParts.push({ type: "image_url", image_url: { url: previewCharacter } });
  } else {
    const clean = stripPrefix(previewCharacter);
    contentParts.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${clean}` } });
  }
}
```

### Files Changed

| File | Change |
|------|--------|
| `src/pages/AIStudio.tsx` | Add refs for critical state; read from refs in queue processor to fix stale closure |
| `supabase/functions/generate-character-preview/index.ts` | Upload preview image to storage; return public URL instead of raw base64 |
| `supabase/functions/generate-scene-image/index.ts` | Handle URL-based `previewCharacter` (not just base64) |

### Why This Will Work

The stale closure is the smoking gun. The network logs prove `previewCharacter` is not being sent. By using refs, the queue processor will always access the CURRENT value of `previewCharacterImage`, which is set before the storyboard generation even starts. Combined with uploading the preview to storage (smaller payloads, reliable URLs), the identity gate will finally function as designed.

