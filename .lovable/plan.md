

## Plan: Add Text Overlay Editor for Scene Images

### What it does
Adds a draggable text overlay feature to scene card images — similar to Instagram Stories text. Users can add, position, style, and delete text blocks on top of generated images. When downloading (single or bulk), the text is burned into the exported image.

### UI Flow
1. A new **Type (T)** icon button appears in the image panel's icon stack (below the Edit Prompts icon)
2. Clicking it opens a **Text Overlay Editor** modal showing the image full-size with existing text overlays
3. User clicks "Add Text" to create a new draggable text block on the image
4. Each text block can be: dragged anywhere, edited inline, resized (font size), styled (bold, color, background), and deleted (X button)
5. Clicking "Done" saves the overlays to state and closes the modal

### New Component: `TextOverlayEditor.tsx`
- Full-screen modal with the scene image as background
- State: array of `TextOverlay` objects per scene (`{ id, text, x, y, fontSize, fontWeight, color, bgColor }`)
- Drag implementation: `onMouseDown`/`onTouchStart` with pointer tracking, positions stored as percentage of image dimensions for resolution independence
- Toolbar at top: "Add Text" button, font size slider, color picker, bold toggle, background toggle
- Each text block: editable `contentEditable` div, drag handle, delete button

### Data Model (in-memory only, no DB)
```typescript
interface TextOverlay {
  id: string;
  text: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  color: string;
  bgColor: string | null; // null = transparent, string = white/black box
}
```

- Stored in `AIStudio.tsx` as `textOverlays: Record<number, TextOverlay[]>` alongside `generatedMedia`
- Persisted with project save (added to the saved JSON)

### Download with Text Baked In
- Create a utility `renderImageWithOverlays(imageUrl, overlays, aspectRatio): Promise<Blob>` using an offscreen `<canvas>`
- Draws image, then renders each text overlay at the correct position/style
- Used by: single image download (`SceneCard`), "Download All Assets" (`handleDownloadAll`), and the reel flow

### Files to Create
- `src/components/ai-studio/TextOverlayEditor.tsx` — modal editor component
- `src/components/ai-studio/renderImageWithOverlays.ts` — canvas rendering utility

### Files to Modify
- `src/components/ai-studio/types.ts` — add `TextOverlay` interface
- `src/components/ai-studio/SceneCard.tsx` — add Type icon button, pass overlays, open editor, use baked image for download
- `src/pages/AIStudio.tsx` — add `textOverlays` state, pass to SceneCard, use `renderImageWithOverlays` in `handleDownloadAll`

### Technical Details
- Drag uses percentage-based positioning so overlays scale correctly regardless of display vs export size
- Canvas export renders at original image resolution for crisp downloads
- Text blocks default to white text with semi-transparent black background (Instagram Stories style, matching the reference screenshots)
- The text overlay state is separate from `generatedMedia` so regenerating an image preserves existing overlays

