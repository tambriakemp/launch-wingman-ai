

## Plan: Enhance prop/object continuity logic in storyboard generation

### Problem
The current "NARRATIVE COHERENCE" prompt block tells the AI to persist props naturally, but the instruction is too passive — it says "persist or set down" without explicitly requiring the AI to think about **when props should be removed**. The result is the character holding a martini glass in every single scene, including ones where it makes no sense (e.g., lying in bed).

### Solution
Strengthen the storyboard generation prompt with an explicit **Prop Lifecycle** directive that forces the AI to plan prop entrances and exits scene-by-scene.

### Changes

**File: `supabase/functions/generate-storyboard/index.ts`**

Replace the current `NARRATIVE COHERENCE` block (~lines 295-300) with a more explicit version:

```text
NARRATIVE COHERENCE (CRITICAL):
- Each scene must flow logically from the previous one — tell a cohesive mini-story with a clear arc
- Avoid jarring environment jumps — transitions between locations must feel organic
- The final scene should feel like a natural conclusion to the sequence

PROP & OBJECT LIFECYCLE (CRITICAL):
- Before writing image prompts, list every handheld prop visible in Scene 1 (drink, phone, bag, food, etc.)
- For EACH prop, decide in which scene it is naturally set down, finished, or left behind — most props should NOT persist beyond 2-3 scenes
- A drink should be sipped and set down, a phone pocketed, a bag placed on a surface — show the transition
- NEVER carry a prop into a scene where it would be contextually absurd (e.g., cocktail glass in bed, gym weights at dinner)
- Detail shots (extreme close-up, flat-lay) are ideal moments to show a prop being set down or left behind
- If the character changes location, assume all handheld props from the previous location are left behind unless explicitly carried
- The image_prompt for each scene must explicitly state what the character is holding — if nothing, write "hands empty" or describe a natural hand position (resting, gesturing, touching hair, etc.)
```

Also add to the **IMAGE PROMPT FORMAT** section (after line 319, the ACTION/POSE line):

```text
4. HANDS/PROPS: [explicitly state what is in each hand — or "hands free, [natural pose]"]
```

This forces the model to make a conscious decision about props for every single scene rather than defaulting to repeating whatever was in scene 1.

### Technical notes
- Single file change in the edge function
- No database or frontend changes needed
- The fix works by making prop state an explicit required field in the structured output, rather than relying on implicit narrative reasoning

