

## Plan: Taller Cover Images & Better Title Generation

### Problem 1: Cover images too short
The `ResourceCard` uses `aspect-[4/3]` (landscape ratio) for the image container on line 147. This crops tall/portrait AI-generated images significantly.

### Problem 2: Titles use first sentence instead of scene analysis
The title generation prompt (line 128-133 in `parse-prompts-bulk`) sends `p.substring(0, 200)` — just the first 200 chars of each prompt. The system prompt says "capture the essence/subject" but the model likely latches onto the opening text. The prompt needs to instruct the AI to identify the **scene, setting, and subject** rather than summarizing the first sentence. It should follow the existing `SETTING — OUTFIT (ANGLE)` convention.

### Changes

**1. `src/components/content-vault/ResourceCard.tsx` (line 147)**
- Change `aspect-[4/3]` to `aspect-[3/4]` (portrait ratio) — this makes covers significantly taller, showing more of the generated image

**2. `supabase/functions/parse-prompts-bulk/index.ts` (lines 126-134)**
- Rewrite the system prompt to explicitly instruct the model to extract SETTING, OUTFIT, and ANGLE fields and format as `SETTING — OUTFIT (ANGLE)`
- Increase substring from 200 to 500 chars to capture more prompt context (the key fields are often mid-prompt)

### Technical Details

```typescript
// ResourceCard.tsx line 147
<div className="aspect-[3/4] bg-gradient-to-br ...">

// parse-prompts-bulk system prompt
"You generate titles for AI image prompts using the format: 'SETTING — OUTFIT (ANGLE)'. "
+ "Extract the location/setting, the main outfit or clothing item, and the camera angle from each prompt. "
+ "Example: 'Music festival grounds — Sequin crop top (Full Body)'. "
+ "Keep titles concise (4-8 words). Do NOT just repeat the first sentence."

// User message — increase context window
`...${p.substring(0, 500)}...`
```

