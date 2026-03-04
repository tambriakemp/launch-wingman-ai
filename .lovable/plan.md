

## Plan: Drag-and-Drop Cover Upload + Optional Resource URL

### Changes to `src/components/content-vault/ResourceEditDialog.tsx`

**1. Add drag-and-drop to cover image area**
- Add `onDragOver`, `onDragEnter`, `onDragLeave`, `onDrop` handlers to the cover image `div` (around line 405)
- `onDrop`: extract `e.dataTransfer.files[0]`, call existing `processAndUploadImage(file)`
- Add a `isDragging` state to show visual feedback (highlight border) when dragging over
- Update the placeholder text to say "Click, paste, or drag an image"

**2. Make Resource URL not required**
- Remove `required` from the Resource URL `<Input>` (around line 565)
- In `handleSubmit`/`updateMutation`, allow empty `resource_url` (set to `'#'` or empty string if blank)

### Files to modify
- `src/components/content-vault/ResourceEditDialog.tsx`

