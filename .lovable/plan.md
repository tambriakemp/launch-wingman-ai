

## Improving Vlog Scene Flow and Consistency

### Problems Found

**1. Parallel Generation Defeats Anchoring**
The biggest issue: when a storyboard is generated, ALL 13-15 scenes are queued simultaneously (`Promise.all`). The anchor image system (which feeds the first generated scene back as a reference) only works if Scene 1 finishes before Scene 2 starts. Since they all fire at once, most scenes never see an anchor -- they each generate independently.

**2. No Scene-to-Scene Context in Prompts**
Each `image_prompt` is generated in isolation. The AI doesn't know what happened in the previous scene or what comes next, so there's no visual narrative flow (e.g., a character walking through a door in Scene 3 should connect to arriving in a room in Scene 4).

**3. Storyboard Prompts Lack Flow Instructions**
The storyboard generation prompt asks for individual scene prompts but doesn't instruct the AI to create visual continuity cues -- matching lighting, time of day progression, spatial consistency between adjacent scenes.

**4. Environment Label Not Passed to Scene Generator**
The `detectSceneLocationMismatch` guard in the edge function accepts an `environmentLabel` parameter, but the client never sends it, so the mismatch detection never actually fires.

---

### Proposed Changes

#### 1. Sequential Scene Generation with Anchoring (Biggest Impact)

Change the queue processor to generate scenes **sequentially** (one at a time) instead of in parallel. Each scene waits for the previous one to finish, then uses it as the anchor reference.

**File**: `src/pages/AIStudio.tsx`
- Modify the queue processor's `Promise.all` to process tasks one-by-one in a `for` loop
- After each scene completes, update `generatedMedia` state so the next scene can read the latest anchor
- This ensures every scene after Scene 1 gets a real anchor image

#### 2. Add Scene Context to Image Prompts

Inject previous/next scene descriptions into each image prompt so the AI understands narrative flow.

**File**: `supabase/functions/generate-scene-image/index.ts`
- Accept new optional fields: `previousScenePrompt`, `nextScenePrompt`, `sceneNumber`, `totalScenes`
- Add to the prompt: "Previous scene: [description]. Maintain visual continuity -- same lighting, time of day, and spatial context."

**File**: `src/pages/AIStudio.tsx`
- When building queue items, include `previousScenePrompt` and `nextScenePrompt` from adjacent storyboard steps

#### 3. Strengthen Storyboard Generation with Flow Instructions

Tell the storyboard AI to build visual continuity into the prompts it generates.

**File**: `supabase/functions/generate-storyboard/index.ts`
- Add to system prompt: "Each image_prompt must reference the previous scene's ending state. Include lighting progression (morning to evening if applicable). Ensure spatial continuity -- if the character leaves one room, the next scene should show them entering the connected space."
- Add instruction: "Include transition cues in each image_prompt (e.g., 'continuing from the hallway into the kitchen')."

#### 4. Pass Environment Label for Mismatch Detection

**File**: `src/pages/AIStudio.tsx`
- Pass the selected environment group's label when invoking `generate-scene-image`
- This activates the existing mismatch guard that's currently dormant

---

### Files Changed

| File | Change |
|------|--------|
| `src/pages/AIStudio.tsx` | Sequential queue processing; pass scene context (prev/next prompts) and environment label to edge function |
| `supabase/functions/generate-scene-image/index.ts` | Accept and use scene context fields for continuity prompts |
| `supabase/functions/generate-storyboard/index.ts` | Add flow/continuity instructions to storyboard generation prompt |

### Priority

1. **Sequential generation** -- ensures anchoring actually works (currently broken due to parallel execution)
2. **Storyboard flow instructions** -- makes the AI generate prompts that naturally connect
3. **Scene context injection** -- reinforces continuity at render time
4. **Environment label passthrough** -- activates existing mismatch guard

### Trade-off

Sequential generation will be **slower** (scenes generate one-by-one instead of all at once), but the consistency improvement is significant. Users will see scenes appear progressively, which actually feels more natural -- like watching the storyboard build itself.
