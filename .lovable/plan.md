

## Remove "No funnel configured" Fallback

### What changes
Remove the empty-state card shown when no funnel is selected in the asset checklist area (lines 715-722 in `src/components/TasksBoard.tsx`). Instead, simply don't render the `AssetChecklist` at all when there's no funnel type.

### File: `src/components/TasksBoard.tsx`

Replace the conditional block (lines 707-723):
```tsx
{currentFunnelType ? (
  <AssetChecklist ... />
) : (
  <div className="flex flex-col items-center ...">
    ...No funnel configured...
  </div>
)}
```

With:
```tsx
{currentFunnelType && (
  <AssetChecklist
    funnelType={currentFunnelType}
    offers={offers}
    completedAssets={completedAssets}
    onToggleAsset={handleToggleAsset}
  />
)}
```

One file, one change.

