
# Gate AI Features in Sales Copy Builder for Free Users

## Overview

This change adds Pro-only gating to the AI features in the Sales Copy Builder. Free plan users will see the AI buttons greyed out with a crown icon, and clicking them will trigger the upgrade dialog instead of generating content.

---

## What Will Change

| Current State | New State |
|--------------|-----------|
| AI buttons available to all users | AI buttons greyed out for free users |
| No visual indicator of Pro features | Crown icon shown on AI buttons for free users |
| Clicking AI button generates content | Clicking shows upgrade dialog for free users |

---

## Affected Components

The Sales Copy Builder has **two AI features** that need gating in `SectionEditor.tsx`:

1. **"Help me write this"** button - Generates AI writing suggestions
2. **"Generate Examples"** button - Generates headline/copy examples based on formulas

Both are powered by the `generate-sales-copy` edge function.

---

## Implementation Details

### File: `src/components/content/sales-copy/SectionEditor.tsx`

**1. Add Required Imports**

```typescript
import { Crown } from "lucide-react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradeDialog } from "@/components/UpgradeDialog";
```

**2. Add Hook and State**

Inside the component, add:
```typescript
const { isSubscribed, hasAdminAccess } = useFeatureAccess();
const isPro = isSubscribed || hasAdminAccess;
const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
```

**3. Update "Help me write this" Button (Lines ~293-311)**

Current:
```tsx
{section.aiEnabled && (
  <Button
    variant="outline"
    size="sm"
    onClick={handleGenerateAi}
    disabled={isGenerating || isGeneratingExamples}
  >
    {isGenerating ? (
      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
    ) : activeAiPanel === 'suggestions' && aiSuggestions.length > 0 ? (
      <RefreshCw className="w-4 h-4 mr-1.5" />
    ) : (
      <Sparkles className="w-4 h-4 mr-1.5" />
    )}
    {activeAiPanel === 'suggestions' && aiSuggestions.length > 0 ? 'Regenerate' : 'Help me write this'}
  </Button>
)}
```

New:
```tsx
{section.aiEnabled && (
  <Button
    variant="outline"
    size="sm"
    onClick={isPro ? handleGenerateAi : () => setShowUpgradeDialog(true)}
    disabled={isPro ? (isGenerating || isGeneratingExamples) : false}
    className={!isPro ? "opacity-60" : ""}
  >
    {isPro ? (
      isGenerating ? (
        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
      ) : activeAiPanel === 'suggestions' && aiSuggestions.length > 0 ? (
        <RefreshCw className="w-4 h-4 mr-1.5" />
      ) : (
        <Sparkles className="w-4 h-4 mr-1.5" />
      )
    ) : (
      <Crown className="w-4 h-4 mr-1.5 text-primary" />
    )}
    {activeAiPanel === 'suggestions' && aiSuggestions.length > 0 && isPro 
      ? 'Regenerate' 
      : 'Help me write this'}
    {!isPro && <Crown className="w-3 h-3 ml-1.5 text-primary" />}
  </Button>
)}
```

**4. Update "Generate Examples" Button (Lines ~312-328)**

Current:
```tsx
{hasFormulas && (
  <Button
    variant="outline"
    size="sm"
    onClick={handleGenerateExamples}
    disabled={isGeneratingExamples || isGenerating}
  >
    {isGeneratingExamples ? (
      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
    ) : activeAiPanel === 'examples' && examples.length > 0 ? (
      <RefreshCw className="w-4 h-4 mr-1.5" />
    ) : (
      <Sparkles className="w-4 h-4 mr-1.5" />
    )}
    {activeAiPanel === 'examples' && examples.length > 0 ? 'Regenerate Examples' : 'Generate Examples'}
  </Button>
)}
```

New:
```tsx
{hasFormulas && (
  <Button
    variant="outline"
    size="sm"
    onClick={isPro ? handleGenerateExamples : () => setShowUpgradeDialog(true)}
    disabled={isPro ? (isGeneratingExamples || isGenerating) : false}
    className={!isPro ? "opacity-60" : ""}
  >
    {isPro ? (
      isGeneratingExamples ? (
        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
      ) : activeAiPanel === 'examples' && examples.length > 0 ? (
        <RefreshCw className="w-4 h-4 mr-1.5" />
      ) : (
        <Sparkles className="w-4 h-4 mr-1.5" />
      )
    ) : (
      <Crown className="w-4 h-4 mr-1.5 text-primary" />
    )}
    {activeAiPanel === 'examples' && examples.length > 0 && isPro 
      ? 'Regenerate Examples' 
      : 'Generate Examples'}
    {!isPro && <Crown className="w-3 h-3 ml-1.5 text-primary" />}
  </Button>
)}
```

**5. Add Upgrade Dialog at End of Component**

Before the closing `</div>` of the component, add:
```tsx
<UpgradeDialog 
  open={showUpgradeDialog} 
  onOpenChange={setShowUpgradeDialog} 
  feature="AI Writing Assistant" 
/>
```

---

## Visual Appearance for Free Users

```text
┌────────────────────────────────────────────────────┐
│ Your draft                                         │
│ ┌────────────────────────────────────────────────┐ │
│ │                                                │ │
│ │ [Textarea - still fully editable]              │ │
│ │                                                │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ ┌─────────────────────────┐ ┌────────────────────┐ │
│ │ 👑 Help me write this 👑 │ │ 👑 Gen Examples 👑 │ │
│ │ (greyed out - 60% opacity)│ │ (greyed out)      │ │
│ └─────────────────────────┘ └────────────────────┘ │
│                                                    │
│ [Clicking opens Upgrade Dialog]                    │
└────────────────────────────────────────────────────┘
```

---

## Behavior Summary

| User Type | Button Appearance | Click Action |
|-----------|------------------|--------------|
| Free | 60% opacity, Crown icon visible | Opens upgrade dialog |
| Content Vault | 60% opacity, Crown icon visible | Opens upgrade dialog |
| Pro | Normal appearance, Sparkles icon | Generates AI content |
| Admin/Manager | Normal appearance, Sparkles icon | Generates AI content |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/content/sales-copy/SectionEditor.tsx` | Add subscription check, update button rendering, add upgrade dialog |

---

## Technical Notes

- Uses existing `useFeatureAccess` hook (same pattern as other Pro-gated features)
- Uses existing `UpgradeDialog` component for consistent upgrade UX
- Crown icon from `lucide-react` (already used throughout the app)
- No backend changes needed - just frontend gating
- Free users can still manually write content; only AI generation is gated
