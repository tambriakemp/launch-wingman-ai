

# Fix: Slow Movement in Generated Videos

## Problem
The generated videos have unnaturally slow character movement. Two factors contribute:
1. **`cfg_scale: 0.7`** — This is very low, meaning the model loosely follows the prompt and defaults to its own tendencies (often slow, cinematic motion). Increasing it will make it respect movement instructions more closely.
2. **Prompt language** — Words like "subtle", "gentle", "slight", "soft" throughout the video prompt rules encourage minimal, slow motion. The storyboard prompts need to emphasize **normal human-speed, purposeful movement**.
3. **Negative prompt already says "slow motion"** — Good, but the positive prompt guidance overpowers it with soft/subtle language.

## Changes

### File: `supabase/functions/generate-video/index.ts`
- Change `cfg_scale` from `0.7` to `0.5` — Kling's cfg_scale is inverted from typical diffusion models; lower values actually give the model MORE freedom. We should keep 0.7 or raise slightly. Actually for Kling, cfg_scale controls prompt adherence where higher = stricter. Raise to `0.9` so movement instructions are followed more faithfully.
- Add to the negative prompt: `"sluggish, slow pace, frozen pose, statue-like, minimal movement"`

### File: `supabase/functions/generate-storyboard/index.ts` (both Path A ~line 335 and Path B ~line 404)
Update the VIDEO PROMPT RULES to emphasize real-time human speed:
- Replace phrases like "subtle breathing", "gentle hair movement", "slight head tilt" with more dynamic language: "visible breathing", "hair sways naturally", "turns her head"
- Add explicit pacing instruction: **"Movement must match real human speed — a person walks, gestures, shifts weight, and interacts with objects at normal everyday pace. NOT slow-motion, NOT cinematic float, NOT underwater-feeling. Think candid iPhone video of a real person."**
- Update the examples to show more dynamic, normal-speed actions instead of overly gentle/subtle ones

## Scope
- Two files modified: `generate-video/index.ts` and `generate-storyboard/index.ts`
- Auto-deployed after save

