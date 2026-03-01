

## Fix Identity Anchor Stack Overflow in Edge Function

### Root Cause

The edge function logs show:
```
Failed to fetch identity anchor: RangeError: Maximum call stack size exceeded
```

This occurs at line 96 of `generate-character-preview/index.ts`:
```typescript
const anchorBase64 = btoa(String.fromCharCode(...anchorBytes));
```

The spread operator expands every byte of the image (often 200K+ bytes) as individual arguments to `String.fromCharCode()`. JavaScript engines have a call stack limit of roughly 50K-100K arguments, so this crashes silently. The `catch` block logs the error but continues without the anchor, so the default look generates without any identity reference from the final look -- producing an inconsistent character.

### Fix

Replace the single spread-based `btoa` call with a chunked conversion that processes the byte array in safe batches (e.g., 8192 bytes at a time):

**File: `supabase/functions/generate-character-preview/index.ts` (line 96)**

Replace:
```typescript
const anchorBase64 = btoa(String.fromCharCode(...anchorBytes));
```

With:
```typescript
let binary = '';
const chunkSize = 8192;
for (let i = 0; i < anchorBytes.length; i += chunkSize) {
  binary += String.fromCharCode(...anchorBytes.subarray(i, i + chunkSize));
}
const anchorBase64 = btoa(binary);
```

This processes the bytes in safe 8KB chunks, avoiding the stack overflow while producing identical base64 output.

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/generate-character-preview/index.ts` | Replace line 96 with chunked base64 conversion to fix stack overflow |

### Expected Result

After this fix, the identity anchor image will be successfully fetched and included as a reference when generating the default look. The AI model will receive both the original selfie references AND the already-generated final look image, producing a default look that matches the same person.
