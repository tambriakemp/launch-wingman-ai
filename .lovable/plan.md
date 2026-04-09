

## Plan: Hyper-realistic video generation improvements

### Problem
The current video prompts instruct "subtle 3-second motion" which produces slow, lifeless clips. The Kling API call uses only basic parameters — missing `negative_prompt`, `cfg_scale`, and the Pro endpoint that produces higher quality output.

### Changes

**1. Always use Kling O3 Pro endpoint** (`generate-video/index.ts`)
- Switch from Standard to Pro for ALL generations (not just character-bind). Pro produces significantly sharper, more realistic output.
- The endpoint changes from `fal-ai/kling-video/o3/standard/image-to-video` to `fal-ai/kling-video/o3/pro/image-to-video`.

**2. Add negative_prompt and cfg_scale** (`generate-video/index.ts`)
- Add `negative_prompt`: `"blur, distortion, low quality, shaky camera, jitter, plastic skin, wax figure, uncanny valley, oversmoothed, airbrushed, doll-like, low resolution, grainy, noisy, morphing artifacts, face warping, limb distortion"` 
- Add `cfg_scale`: `0.7` (higher adherence to prompt while allowing natural motion)

**3. Upgrade video prompt instructions in storyboard generator** (`generate-storyboard/index.ts`)
- Replace the current "subtle 3-second motion" instructions with guidance for natural, human-paced movement:
  - Specify realistic motion speed (not slow-motion unless intentional)
  - Include skin/environment realism directives in video prompts
  - Add breathing motion, natural weight shifts, realistic hair physics
  - Instruct prompts to describe specific micro-movements (blinking, breathing, slight posture shifts) rather than vague "subtle motion"

Current video prompt rules (lines 335-341, 389-393) will be replaced with:

```
VIDEO PROMPT RULES (CRITICAL):
- video_prompt describes NATURAL REAL-TIME motion (not slow motion) from the SAME camera angle
- Include micro-realism: natural blinking, subtle breathing chest movement, weight shifts, micro-expressions
- Skin must look alive: describe light catching pores, natural skin sheen, realistic subsurface scattering
- Environment must feel real: describe ambient movement (leaves, fabric draping, steam, light flicker)
- Motion pacing: real human speed — not cinematic slow-mo unless explicitly requested
- Hair physics: natural strand movement, not frozen or floating
- If back/side facing, KEEP that angle — do NOT rotate character to face camera
- Example: "She tilts her head naturally while speaking, subtle smile forming, hair catches the light as it shifts, chest rises with a breath, background city traffic moves at normal speed"
```

**4. Increase default duration to 10s** (`generate-video/index.ts`)
- Change default single-prompt duration from `"5"` to `"10"` — 5 seconds often feels too short and forces unnaturally compressed motion.

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/generate-video/index.ts` | Always use Pro endpoint, add negative_prompt + cfg_scale, default 10s duration |
| `supabase/functions/generate-storyboard/index.ts` | Upgrade video prompt rules for hyper-realistic, natural-paced motion |

### Impact
- Pro endpoint costs ~2x Standard per generation (same credit deduction, higher fal.ai cost)
- Higher quality output: sharper skin, better motion fidelity, less blur/shake
- Videos will feel more "real person filmed on phone" vs "AI slow-motion"

