

## Use Scene 1 as Anchor in All Modes — Remove Lock Icons

### What changes
Make the "Scene 1 anchor" pattern (currently carousel-only) work for **all** creation modes. Scene 1's generated image becomes the identity reference for scenes 2+. The manual lock icons become unnecessary and are removed entirely.

### Changes

**`src/pages/AIStudio.tsx`** (~lines 154–173)
- Remove the `isCarousel` check — always use Scene 1's image as `anchorImageUrl` for scenes 2+ (with the same re-queue logic if Scene 1 isn't ready yet)
- Remove the `lockedRefs` collection block (lines 144–152) since locks are no longer used
- Keep the `activePreview` fallback for Scene 1 itself (character preview as anchor)

**`src/components/ai-studio/SceneCard.tsx`** (~lines 150–182)
- Remove the three lock buttons (Character, Outfit, Environment) and their tooltip wrappers entirely
- Remove the `onToggleLock` prop
- Remove `User`, `ShoppingBag`, `Landmark` icon imports if unused elsewhere

**`src/components/ai-studio/StudioStoryboard.tsx`**
- Remove `onToggleLock` prop and its pass-through to `SceneCard`

**`src/components/ai-studio/types.ts`**
- Remove `lockedCharacter`, `lockedOutfit`, `lockedEnvironment` from `GeneratedMedia`

**`src/components/ai-studio/constants.ts`**
- Remove the three locked fields from the default media object

**`src/components/ai-studio/StudioHelp.tsx`**
- Replace the "Consistency Locks" help section with a note explaining Scene 1 automatically anchors identity for all subsequent scenes

**`src/pages/AIStudio.tsx`** (other references)
- Clean up all remaining references to `lockedCharacter/lockedOutfit/lockedEnvironment` in toggle handler, batch delete reset, project save/load logic

### Result
Simpler UI with no lock icons. Visual consistency is automatic — Scene 1 sets the look, all other scenes inherit it.

