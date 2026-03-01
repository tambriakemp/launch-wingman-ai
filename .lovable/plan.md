

## Save All Aesthetic & Setup Fields in Saved Looks

### Problem
The Saved Looks feature only persists a subset of the configuration fields (outfit, hair, makeup, nails, aspect ratio, camera movement). Fields like vlog category, vlog topic, creation mode, script, product description, and skin complexion custom value are NOT saved or restored when loading a look.

### Fix
Expand the `LOOK_KEYS` array in `SavedLooks.tsx` to include every field from `AppConfig`. This is a single-file change -- just updating the constant array. Since settings are stored as flexible JSON, no database migration is needed.

### Fields Being Added

| Field | What it controls |
|---|---|
| `vlogCategory` | Category (e.g., "Get Ready With Me") |
| `vlogTopic` | Topic text |
| `creationMode` | Vlog vs UGC |
| `useOwnScript` | Whether user provided their own script |
| `userScript` | The actual script text |
| `ugcPrompt` | UGC marketing prompt |
| `avatarDescription` | Text description of avatar |
| `productDescription` | Product being featured |
| `useProductAsHair` | Product-as-hair toggle |
| `matchFace` | Face matching toggle |
| `matchSkin` | Skin matching toggle |
| `customSkinComplexion` | Custom skin complexion text (was missing -- bug) |

### File Changed

**`src/components/ai-studio/SavedLooks.tsx`** -- Update `LOOK_KEYS` to include all `AppConfig` fields:

```typescript
const LOOK_KEYS = [
  'vlogCategory', 'vlogTopic', 'creationMode',
  'useOwnScript', 'userScript', 'ugcPrompt',
  'avatarDescription', 'productDescription', 'useProductAsHair',
  'exactMatch', 'matchFace', 'matchSkin',
  'aspectRatio', 'cameraMovement',
  'outfitType', 'outfitDetails', 'outfitAdditionalInfo',
  'finalLookType', 'finalLook', 'finalLookAdditionalInfo',
  'hairstyle', 'customHairstyle',
  'makeup', 'customMakeup',
  'skinComplexion', 'customSkinComplexion', 'skinUndertone',
  'nailStyle', 'customNailStyle',
] as const;
```

### Backward Compatibility
Previously saved looks will still load fine -- they simply won't have the new fields, so those will remain at their current values (the `...prev` spread in `handleLoad` preserves existing state for any missing keys).

