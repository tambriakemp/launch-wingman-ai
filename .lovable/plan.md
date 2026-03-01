

## Natural Behavior Guardrails for Scene Generation

### Problem
When generating bathroom scenes, the character faces the camera unnaturally (e.g., applying makeup toward the viewer) instead of behaving as a person naturally would in that space (facing the mirror, looking at their reflection, etc.).

### Solution
Add **scene-aware behavior prompts** that detect keywords in the scene description (like "bathroom", "vanity", "mirror", "kitchen", "closet") and inject contextually appropriate posing/behavior instructions. This ensures characters interact with the environment realistically.

### Changes

**Files modified:**
- `supabase/functions/generate-scene-image/index.ts`
- `supabase/functions/generate-character-preview/index.ts`

### How It Works

A shared helper function maps scene keywords to natural behavior instructions:

| Scene Keywords | Injected Behavior Prompt |
|---|---|
| bathroom, vanity, mirror, restroom | "The subject is facing the mirror, viewing their own reflection. Camera captures from behind or to the side. Natural bathroom behavior — adjusting hair, examining reflection, applying product while looking in the mirror, NOT at the camera." |
| kitchen, cooking, stove, counter | "The subject is naturally engaged with the kitchen environment — looking at what they're doing, interacting with surfaces/appliances. NOT posing for the camera." |
| closet, wardrobe, dressing room | "The subject is browsing or selecting clothing, looking at garments or their reflection in a closet/dressing mirror. Natural getting-ready behavior." |
| gym, workout, fitness | "The subject is mid-activity or naturally resting between sets. Engaged with equipment or their form, not posing at the camera." |
| office, desk, workspace | "The subject is naturally engaged with their work environment — looking at a screen, writing, or in thought. Candid, not posed." |

For any scene with environment references, a general instruction is also added: "The subject should interact naturally with the environment. Pose and gaze should reflect realistic behavior for the setting, not direct-to-camera posing."

### Technical Detail

A `getSceneBehaviorPrompt(sceneDescription: string): string` function is added to both edge functions. It checks the lowercase scene/prompt text against keyword arrays and returns the matching behavior instruction (or a general one if environment images are present). This string is appended to the main prompt before sending to the AI.

In `generate-scene-image`, the `prompt` variable (scene description) is checked. In `generate-character-preview`, the environment context is checked when environment images are provided.

