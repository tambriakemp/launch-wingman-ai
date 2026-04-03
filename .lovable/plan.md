

## Outfit Swap Tool — New AI Studio Feature

A standalone tool at `/app/ai-studio/outfit-swap` where users upload two images: (1) their character/avatar in an environment, and (2) a reference outfit photo (on a model or flat-lay). The AI replaces only the outfit while keeping the character's face, body, and environment completely locked.

### How it works

1. User uploads a **character photo** (the person in their environment)
2. User uploads an **outfit reference** (photo of outfit on a model, mannequin, or flat-lay like the examples you shared)
3. Optionally types a short instruction (e.g., "only change the shirt", "swap entire outfit")
4. Clicks "Swap Outfit" — calls a new edge function that sends both images to Gemini with a carefully crafted prompt that locks the character identity and environment while transplanting the outfit
5. Result displays side-by-side with the original; user can download or retry

### Files to create/modify

**New files:**
- `src/pages/OutfitSwap.tsx` — Page component with two upload zones (character + outfit reference), optional text instruction, generate button, and result display
- `supabase/functions/swap-outfit/index.ts` — Edge function that receives both image URLs, constructs a prompt emphasizing identity/environment lock + outfit transfer, calls Gemini image generation, uploads result to storage

**Modified files:**
- `src/App.tsx` — Add route `/app/ai-studio/outfit-swap`
- `src/components/ai-studio/types.ts` — No changes needed; this is a standalone tool

### Edge function prompt strategy

The prompt will:
- Place the character image first as the "ground truth" for identity and environment
- Place the outfit reference second with explicit instructions: "Extract ONLY the clothing/outfit from this reference image"
- Emphasize: do NOT change face, hair, skin, body proportions, pose, background, lighting, or environment
- Support partial swaps via the optional user instruction field (e.g., "only change the top")

### UI layout

```text
┌──────────────────────────────────────────┐
│  ← Back to AI Studio    OUTFIT SWAP      │
├──────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐       │
│  │  Character   │  │   Outfit    │       │
│  │   Photo      │  │  Reference  │       │
│  │  (upload)    │  │  (upload)   │       │
│  └─────────────┘  └─────────────┘       │
│                                          │
│  [ Optional instruction text field     ] │
│  [ "Only change the shirt"             ] │
│                                          │
│  [        Swap Outfit ✨        ]        │
│                                          │
│  ┌──────────────────────────────┐       │
│  │        Result Image          │       │
│  │     (download / retry)       │       │
│  └──────────────────────────────┘       │
└──────────────────────────────────────────┘
```

### Technical details

- Both images are uploaded to storage first (using existing `uploadFileToStorage`), then URLs are passed to the edge function — no base64 in payloads
- Uses `google/gemini-3-pro-image-preview` model (same as character preview) for best quality
- Result is uploaded to `ai-studio` bucket under `{userId}/outfit-swap-{timestamp}.png`
- No video, no storyboard, no extra complexity — just a clean single-image transformation tool

