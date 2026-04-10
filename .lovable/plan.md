

# Plan: Context-Aware Video Prompts

## Problem
Video prompts are currently generic micro-realism instructions (blinking, breathing, hair physics) but lack awareness of **what's actually in the scene** — the props, surroundings, surfaces, and spatial context. This causes the AI to hallucinate nonsensical actions (e.g., handing an envelope to nobody, opening a prop that should stay closed).

## Solution
Enhance the `VIDEO PROMPT RULES` section in the storyboard generation prompt (both Path A and Path B) to require **scene-grounded, prop-aware, spatially logical** video motion descriptions.

## File: `supabase/functions/generate-storyboard/index.ts`

### Changes to VIDEO PROMPT RULES (both Path A ~line 335 and Path B ~line 394)

Add these new rules to the existing video prompt instructions:

1. **Scene Grounding Rule** — The video_prompt MUST reference every visible prop, surface, and environmental element from the image_prompt. Motion must interact logically with these elements (e.g., if holding an envelope near a counter, she places it on the counter or taps it lightly — never hands it to empty air).

2. **Prop Continuity Rule** — Any object the character holds or touches must have a clear, completed action arc. No mid-gesture abandonment. If she's holding something, describe what she does with it through the full 10 seconds (sets it down, tucks it away, continues holding it naturally).

3. **Spatial Awareness Rule** — Describe motion relative to nearby surfaces, furniture, walls, or other people visible in the scene. The character should interact with their environment, not move through empty space. If alone, movements stay self-contained (adjusting clothing, shifting weight, looking around the space).

4. **No Phantom Interactions Rule** — NEVER describe the character interacting with people, objects, or surfaces that are NOT described in the image_prompt. If the character is alone, all gestures must be self-directed or directed at visible objects/environment.

5. **Action Completeness Rule** — Each video_prompt must describe a full micro-narrative: a beginning state (matching the still image), a natural transition, and a settled end state. Example: "She looks down at the envelope in her hand, runs her thumb along the edge, then tucks it under her arm and takes a relaxed step forward, scanning the room."

### Updated Example
Replace the current generic example with scene-specific ones:
- Holding prop: "She glances down at the envelope, tilts it slightly to read the front, then lowers it to her side with a soft exhale, weight shifting to her left foot, ambient cafe noise in background"
- At a counter: "She sets the coffee cup on the marble counter with a soft clink, fingertips lingering on the rim, then leans back slightly, eyes drifting to the window, natural breathing visible"

## Scope
- **One file modified**: `supabase/functions/generate-storyboard/index.ts`
- **Two sections updated**: Path A video prompt rules (~line 335) and Path B video prompt rules (~line 394)
- Edge function will auto-deploy

