

## Rename "AI Studio" → "AI Avatar Studio"

### Scope
Update all user-facing labels, headings, and descriptions that say "AI Studio" to "AI Avatar Studio". Route paths (`/app/ai-studio`) and internal IDs stay unchanged — only display text changes.

### Files to modify

1. **`src/components/layout/ProjectSidebar.tsx`** — sidebar label `"AI Studio"` → `"AI Avatar Studio"`

2. **`src/pages/AIStudioDashboard.tsx`** — page heading `"AI Studio"` → `"AI Avatar Studio"`

3. **`src/components/landing/screenshots/AIStudioMockup.tsx`** — mockup heading `"AI Studio"` → `"AI Avatar Studio"`

4. **`src/pages/Checkout.tsx`** — feature list item `"AI Studio"` → `"AI Avatar Studio"`

5. **`src/pages/AITwinFormula.tsx`** — multiple marketing copy references (~6 occurrences): `"Launchely AI Studio"` → `"Launchely AI Avatar Studio"`, `"AI Studio"` → `"AI Avatar Studio"`

6. **`src/components/admin/FeatureUsageHeatmap.tsx`** — category labels `"AI Studio"` → `"AI Avatar Studio"`

No route changes, no database changes, no logic changes — purely text renaming.

