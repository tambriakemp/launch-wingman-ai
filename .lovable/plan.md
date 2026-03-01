

## Improving Character Consistency Across Scenes

### The Problem

Right now, the system sends a **single reference photo** (or the character preview) to the AI for each scene. The AI generates each scene independently, so there's no guarantee of:
- Same face, body type, and skin tone across scenes
- Contextually correct behavior (heels in a bathroom, splashing water unrealistically)
- Outfit consistency matching the scene description (pajamas + heels mismatch)

Standard text-to-image models like Gemini are fundamentally limited at identity preservation -- they interpret the reference loosely rather than treating it as a hard constraint.

### Proposed Solution: Multi-Reference Character Anchoring

Instead of relying on a single reference photo, we strengthen consistency through **multiple complementary strategies**:

---

### 1. Use the Character Preview as the Primary Anchor (not the raw upload)

Currently, both the raw `referenceImage` AND `previewCharacter` are sometimes sent. The character preview is already styled (correct hair, makeup, outfit) so it should be the **sole** character reference when available, with the raw upload only used as fallback.

**Change**: In `generate-scene-image`, when `previewCharacter` exists, do NOT also send `referenceImage`. Currently both can end up in the content parts, confusing the model with two different-looking versions of the "same" person.

---

### 2. Chain Previously Generated Images as References

The most effective consistency technique: feed the AI its own previous output alongside the new prompt. The first successfully generated scene already becomes an `outfitAnchorUrl`. We extend this to also serve as a **character anchor**.

**Change**: Rename/expand `outfitAnchorUrl` to `anchorImageUrl` and explicitly instruct the prompt: "The person in this reference image IS the character. Replicate their exact face, body type, hair, and skin tone. Only change the pose and setting."

---

### 3. Stronger Identity Preservation Prompts

The current prompt says "maintain visual consistency" which is too weak. We need explicit, forceful identity language.

**Change**: Replace generic consistency instructions with:
- "This is the SAME person across all images. Match their exact facial structure, skin tone, body proportions, and hair texture."
- "Do NOT change the character's appearance, age, or body type between scenes."

---

### 4. Scene-Prompt Validation Guard

The "heels in bathroom with pajamas" issue is a prompt conflict -- the scene description says "front door, kicks off shoes" but the environment is a bathroom. The AI tries to reconcile both and produces nonsense.

**Change**: Add a prompt guard in the edge function that detects environment/scene mismatches. When the scene prompt mentions a location (e.g., "front door") but the environment images show a different location (e.g., bathroom), prioritize the scene prompt's location context and add: "Ignore the background reference for this scene -- use the described setting instead."

---

### 5. Multiple Reference Photos (Optional Enhancement)

Allowing users to upload 2-3 reference photos of the same person (different angles -- face front, profile, full body) would significantly help the AI understand the character's 3D appearance. This is the approach used by specialized face-preservation systems.

**Change**: Expand `SavedCharacter` to support up to 3 reference images. All are sent as character references with the instruction: "These images all show the SAME person from different angles. Use all of them to accurately reproduce this person's appearance."

---

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/generate-scene-image/index.ts` | Stronger identity prompts; use preview as sole character ref; expand anchor to cover character identity; add scene/environment mismatch guard |
| `supabase/functions/generate-character-preview/index.ts` | Stronger identity preservation language |
| `src/pages/AIStudio.tsx` | Pass anchor as character+outfit reference (rename `outfitAnchorUrl` to `anchorImageUrl`) |
| `src/components/ai-studio/SavedCharacter.tsx` | Support uploading up to 3 reference images (face, profile, full body) |
| `src/components/ai-studio/StudioSetup.tsx` | Pass multiple reference images array |

---

### Priority Order

1. **Strongest identity prompts** -- immediate improvement, no UI changes
2. **Use preview as sole anchor** -- stop sending conflicting references
3. **Chain previous outputs as character anchors** -- biggest consistency gain
4. **Scene/environment mismatch guard** -- prevents contextual errors
5. **Multi-photo references** -- optional but significant quality boost

---

### Technical Notes

- The multi-photo approach adds ~2-3 more image tokens per request but stays well within API limits
- Scene/environment mismatch detection uses simple keyword matching (same approach as behavior guardrails)
- The anchor chaining is already partially implemented via `outfitAnchorUrl` -- we just expand its role and strengthen the prompt around it

