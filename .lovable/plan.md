

## Three Changes to AI Studio

### 1. Add Timing Note to "Generate Storyboard" Button

Add a subtle helper text below the "Generate Storyboard" button that reads: "Generation can take 1-5 minutes. Please be patient."

**File:** `src/pages/AIStudio.tsx` (lines 790-806)

### 2. Add "Single Scene Only" Instruction to Scene Image Prompt

The collage/split-image issue comes from the AI model interpreting prompts loosely. Add an explicit instruction to the scene generation prompt telling the model to produce exactly ONE single-frame photograph -- no collages, grids, split screens, or multiple panels.

**File:** `supabase/functions/generate-scene-image/index.ts`
- In both the EDIT MODE prompt (~line 211) and the GENERATE FROM SCRATCH prompt (~line 229), prepend:
  `"OUTPUT: Generate exactly ONE single photograph. Do NOT create collages, grids, split-screen images, or multiple panels."`

### 3. Add Scene Count Selector to Settings Popover

Add a "Number of Scenes" dropdown in the Settings popover (between Camera Movement and Script). Options: "Auto (let AI decide)" plus 3 through 15. Store the value in `AppConfig` as `sceneCount` (number or null for auto).

**Files:**
- `src/components/ai-studio/types.ts` -- add `sceneCount?: number | null` to `AppConfig`
- `src/components/ai-studio/constants.ts` -- add `sceneCount: null` to `INITIAL_CONFIG`
- `src/components/ai-studio/StoryboardToolbar.tsx` -- add scene count selector in the Settings popover after Camera Movement
- `supabase/functions/generate-storyboard/index.ts` -- use `config.sceneCount` to dynamically set the step count in the system prompt. If null/undefined, keep current "13 to 15" language. If a number is set, instruct the AI to generate exactly that many steps and adapt the narrative to fit a shorter/longer format. Update the GRWM narrative arc split proportionally (e.g., for 8 scenes: Part 1 = scenes 1-5, Part 2 = scenes 6-8).

### Technical Detail

**Storyboard prompt adjustment logic** (`generate-storyboard/index.ts`):
```
const sceneCount = config.sceneCount;
const sceneInstruction = sceneCount
  ? `Generate exactly ${sceneCount} steps. Adapt the narrative pacing to fit ${sceneCount} scenes.`
  : `Generate 13 to 15 steps.`;
```

For GRWM with a custom scene count, the narrative arc split becomes:
```
const splitPoint = Math.ceil(sceneCount * 0.6);
// PART 1: steps 1-splitPoint, PART 2: steps splitPoint+1 to sceneCount
```

