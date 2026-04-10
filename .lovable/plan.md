

## Plan: Add Video Duration Selector + Front-Load Motion in Prompts

### Problem
1. No user control over video duration — hardcoded to 5 seconds
2. Short videos (3-5s) get weak movement because the AI model "saves" the best motion for the end of the clip

### Solution

**Part 1: Duration Selector in Step 3 Settings**

Add a `videoDuration` field to `AppConfig` (type: `'3' | '5' | '10'`, default `'5'`) and render a 3-option toggle in the Settings section (Step 3) of `StoryboardToolbar.tsx`, placed between "Number of scenes" and "Camera movement".

Files changed:
- `src/components/ai-studio/types.ts` — add `videoDuration: '3' | '5' | '10'` to `AppConfig`
- `src/components/ai-studio/constants.ts` — add `videoDuration: '5'` to `INITIAL_CONFIG`
- `src/components/ai-studio/StoryboardToolbar.tsx` — add duration toggle UI in Step 3

**Part 2: Pass Duration to Edge Function**

Pass `config.videoDuration` through the video generation call and use it in the edge function instead of the hardcoded `"5"`.

Files changed:
- `src/pages/AIStudio.tsx` — add `duration: task.config.videoDuration` to `videoBody`
- `supabase/functions/generate-video/index.ts` — read `duration` from request body, use it for both Kling Direct and fal.ai paths (fallback to `"5"`)

**Part 3: Front-Load Motion in Video Prompts**

Update the storyboard generation prompt instructions to ensure the AI generates video prompts that place the most dynamic, expressive movement at the **beginning** of the clip (first 1-2 seconds). This fixes the issue where the best motion appears only in the last 3-4 seconds.

Changes to the VIDEO PROMPT RULES in `supabase/functions/generate-storyboard/index.ts`:
- Add a **MOTION FRONT-LOADING** directive: "Start with the most dynamic action immediately — the character should already be mid-gesture or beginning a clear movement in frame 1. Do NOT start from a static pose and slowly build up. The first 2 seconds must contain the primary action. For shorter durations (3-5s), compress the full action arc into rapid, confident movements."
- Add duration-awareness: the storyboard prompt will receive the configured duration so prompts scale action density accordingly

Files changed:
- `supabase/functions/generate-storyboard/index.ts` — add front-loading motion rules to both Path A and Path B prompt templates

### Technical Details

- Duration toggle uses the same pill-style UI as the Orientation selector for visual consistency
- The edge function validates duration to only accept `"3"`, `"5"`, or `"10"` — defaults to `"5"` for any invalid value
- Multi-shot mode continues to use per-shot durations from the multi_prompt config (unchanged)
- Storyboard generation receives `videoDuration` so the AI can calibrate prompt density for shorter clips

