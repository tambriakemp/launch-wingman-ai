

## Plan: Move prompts into overlay modal on image/video panels

### What changes

Currently, the SceneCard shows Script, Action, Detail, and AI Prompts (image + video) as stacked sections below the image/video previews. This takes up significant vertical space.

**New behavior:**
- Remove the "Script & Details" and "View AI Prompts" sections from below the previews
- Add a small floating icon button (e.g. `FileText` or `SlidersHorizontal`) as an overlay on the bottom-right of the image panel
- Clicking it opens a Dialog modal containing all 5 editable fields: Script, Action, Detail, Image Prompt, Video Prompt — each with the existing edit/save/cancel functionality

### File changes

| File | Change |
|------|--------|
| `src/components/ai-studio/SceneCard.tsx` | Remove lines 280-381 (the Script/Details/Prompts sections below previews). Add a small overlay icon button on the image panel. On click, open a Dialog with all prompt fields inside, reusing the existing `EditableField` component and prompt editing logic. |

### UI detail
- Icon: `FileText` from lucide-react, positioned as a small overlay button (similar style to Download/Regenerate buttons) on the image preview
- Modal: Uses the existing `Dialog` component with `DialogContent`, `DialogHeader`, `DialogTitle`
- Inside modal: All 5 fields (Script, Action, Detail, Image Prompt, Video Prompt) with their existing edit/save/cancel behavior, laid out vertically with spacing

