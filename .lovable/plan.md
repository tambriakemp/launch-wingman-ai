
# Replace Brand Photos Uploader with Instructional Content

## Overview

This change removes the photo upload functionality from the Brand Photos section and replaces it with helpful instructions guiding users to gather inspirational photos from external resources like Pinterest and Pexels.

---

## Why This Change

- **Preserve storage**: Eliminates the need to store user-uploaded brand photos in the backend
- **Better user experience**: Guides users through a proven process for finding brand-aligned imagery
- **Practical approach**: Encourages users to build a local library of brand photos they can reference

---

## What Will Change

| Current | New |
|---------|-----|
| Upload button in header | Removed |
| File input for multiple image uploads | Removed |
| Empty state with upload prompt | Instructional card with guidance |
| Photo grid with download/delete | Removed |
| Supabase storage integration | Removed |

---

## New Content Structure

The section will display a single instructional card with:

1. **Title**: "Finding Your Brand Photos"
2. **Intro text**: Brief explanation of the purpose
3. **Recommended sites** with links:
   - Pinterest (pinterest.com)
   - Pexels (pexels.com) 
   - Unsplash (unsplash.com)
4. **Search tips**: Encourage using brand-aligned keywords
5. **Storage reminder**: Advice to save photos in a dedicated folder

---

## UI Design

```text
┌─────────────────────────────────────────────────────────────┐
│ 📷 Finding Your Brand Photos                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Gather photos that capture the feeling of your brand.     │
│                                                             │
│   🔍 Where to Find Inspiration                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ • Pinterest - pinterest.com                         │   │
│   │ • Pexels - pexels.com (free stock photos)          │   │
│   │ • Unsplash - unsplash.com (free stock photos)      │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   💡 Tips for Searching                                     │
│   • Use keywords that resonate with your brand              │
│   • Search for colors, moods, or themes                     │
│   • Look for images that feel "you"                         │
│                                                             │
│   📁 Keep It Organized                                      │
│   Download your favorites and save them in a dedicated      │
│   folder on your computer for easy reference.               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### File to Update

`src/components/branding/PhotosSection.tsx`

### Changes

1. **Remove all upload/storage logic**:
   - Remove `useState`, `useRef` for file handling
   - Remove `useQuery` for fetching photos
   - Remove `useMutation` for upload/delete
   - Remove Supabase storage imports and calls
   - Remove file input element

2. **Simplify imports**:
   ```typescript
   // Before: Many imports for upload functionality
   // After: Just icons and Card
   import { Card } from "@/components/ui/card";
   import { Camera, ExternalLink, Search, FolderOpen, Lightbulb } from "lucide-react";
   ```

3. **Simplify props**:
   ```typescript
   // projectId is no longer needed
   const PhotosSection = () => { ... }
   ```

4. **Replace return with instructional content**:
   - A card with helpful text
   - Links to Pinterest, Pexels, Unsplash (opens in new tab)
   - Search tips section
   - Folder organization reminder

---

## Also Update

### `src/pages/project/VisualDirectionTask.tsx`

Remove the `projectId` prop from the PhotosSection component call:

```tsx
// Before
<PhotosSection projectId={projectId!} />

// After
<PhotosSection />
```

---

## Summary

| Item | Action |
|------|--------|
| Upload button | Remove |
| File input | Remove |
| Photo grid | Remove |
| Supabase queries/mutations | Remove |
| Empty state | Replace with instructional content |
| External links | Add (Pinterest, Pexels, Unsplash) |
| Search tips | Add |
| Folder reminder | Add |
