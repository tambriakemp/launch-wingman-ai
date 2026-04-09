

## Plan: Fix two Flux Kontext prompt bugs

### Changes in `supabase/functions/generate-scene-image/index.ts`

**Bug 1 (line 684):** Replace `prompt: fullPrompt,` with a fallback chain so Flux always gets a non-empty prompt:
```typescript
prompt: fullPrompt || contentParts.find((p: any) => p.type === 'text')?.text || prompt,
```

**Bug 2 (line 428):** After the existing `contentParts.push(...)` in the isUpscale branch, add:
```typescript
fullPrompt = "Enhance this image to high quality. Maintain exact details, just increase clarity and resolution.";
```
This ensures `fullPrompt` is set for upscale requests, which otherwise leave it empty.

### Deployment
- Deploy the `generate-scene-image` edge function after the edit.

