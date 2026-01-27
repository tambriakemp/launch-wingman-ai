
# Fix Offer Stack Data Persistence Issues

## Problem Summary
Your offer configurations aren't persisting correctly due to three interrelated bugs:

1. **Removed slots come back** - When you remove an offer slot (like the upsell), it's only removed from the screen but not saved to the database. When you return, the old slots reappear.

2. **Configured data shows as "Not configured"** - The system uses strict matching logic that expects saved offers to have exactly the same slot types as the funnel template. If you've removed or added slots, it ignores your saved data and recreates empty defaults.

3. **Intermittent behavior** - Sometimes refreshing brings data back because of race conditions between data loading and initialization logic.

---

## Technical Root Causes

### Issue 1: Removal Not Persisted
In `OfferStackBuilder.tsx`, the `handleRemoveOffer` function only updates local state but never saves to the database:

```typescript
// Current (broken):
const handleRemoveOffer = (index: number) => {
  const newOffers = offers.filter((_, i) => i !== index);
  onChange(newOffers);  // Only updates local state
  setActiveOfferIndex(null);
  // Missing: onSaveNow?.(newOffers) to persist
};
```

### Issue 2: Strict Slot Matching Overwrites Data
In `OfferSnapshotTask.tsx`, the initialization logic (lines 289-293) requires an exact match between saved slot types and expected slot types:

```typescript
const hasMatchingOffers = 
  expectedSlotTypes.length === existingSlotTypes.length &&
  expectedSlotTypes.every(type => existingSlotTypes.includes(type)) &&
  existingSlotTypes.every(type => expectedSlotTypes.includes(type));
```

If the user has removed or added slots, this check fails and the system creates blank defaults instead of using saved data.

---

## Solution

### Fix 1: Persist Slot Removals
Update `handleRemoveOffer` in `OfferStackBuilder.tsx` to also trigger a database save:

```typescript
const handleRemoveOffer = (index: number) => {
  const newOffers = offers.filter((_, i) => i !== index);
  onChange(newOffers);
  setActiveOfferIndex(null);
  void onSaveNow?.(newOffers); // ADD: Persist removal to database
};
```

### Fix 2: Use Flexible Loading Logic
Change the initialization logic in `OfferSnapshotTask.tsx` to:
1. Load any saved offers for this funnel type (regardless of slot structure)
2. Only create fresh defaults if there are truly no saved offers

```typescript
// Replace strict matching with flexible loading:
if (existingOffers && existingOffers.length > 0) {
  // Load whatever was saved - trust the user's modifications
  const loadedOffers: OfferSlotData[] = existingOffers.map(o => ({
    id: o.id,
    slotType: o.slot_type || "core",
    title: o.title || '',
    description: o.description || '',
    offerType: o.offer_type || '',
    price: o.price?.toString() || '',
    priceType: o.price_type || 'one-time',
    isConfigured: !!(o.offer_type?.trim()),
    isSkipped: false,
  }));
  setOffers(loadedOffers);
} else {
  // No saved offers at all - create defaults for this funnel type
  const defaultOffers = funnelConfig.offerSlots.map(...);
  setOffers(defaultOffers);
}
```

### Fix 3: Add Query Invalidation After Removal
Ensure the offers query is invalidated after any save operation so that reloading shows fresh data:

```typescript
const handleRemoveOffer = async (index: number) => {
  const newOffers = offers.filter((_, i) => i !== index);
  onChange(newOffers);
  setActiveOfferIndex(null);
  await onSaveNow?.(newOffers);
  // Invalidate to ensure fresh data on next load
  queryClient.invalidateQueries({ queryKey: ["offers", projectId, selectedFunnelType] });
};
```

---

## Files to Update

| File | Change |
|------|--------|
| `src/components/funnel/OfferStackBuilder.tsx` | Add `onSaveNow?.(newOffers)` to `handleRemoveOffer` |
| `src/pages/project/OfferSnapshotTask.tsx` | Change initialization to trust saved offers instead of requiring exact slot match |

---

## Testing Checklist
After implementation:
1. Configure an offer (select type, add title) → Save → Leave page → Return → Verify data persists
2. Remove an optional slot → Save for Later → Return → Verify slot stays removed
3. Add a custom slot → Configure it → Leave → Return → Verify it persists
4. Refresh the page mid-configuration → Verify data isn't lost

---

## Risk Assessment
**Low risk** - These changes only affect how offer data is saved and loaded, and make the behavior more predictable by trusting user-saved data rather than overwriting it with defaults.
