
Fix the AI Prompts infinite scroll on the Content Vault page.

Problem
- In `src/pages/ContentVaultCategory.tsx`, the `IntersectionObserver` effect runs only once (`[]` deps).
- On first mount, the sentinel often is not in the DOM yet because resources are still loading and the sentinel is conditionally rendered.
- That means `loadMoreRef.current` is `null`, no observer gets attached, and scrolling to the bottom never increases `visibleCount`.

Implementation
1. Repair the observer setup in `src/pages/ContentVaultCategory.tsx`
   - Change the infinite-scroll wiring so it attaches when the sentinel actually appears, not just on initial mount.
   - Use either:
     - a callback ref for the sentinel, or
     - a `useEffect` that depends on the rendered sentinel state / `filteredResources.length` / `visibleCount`.
   - Disconnect any previous observer before attaching a new one.

2. Make the load behavior safe
   - Only increment `visibleCount` when `visibleCount < filteredResources.length`.
   - Clamp the next value so it never overshoots.
   - Keep the existing reset-to-48 behavior when filters change.

3. Align scroll behavior with this page’s layout
   - Since this page lives inside `ProjectLayout`, verify the observer is watching the correct scroll context.
   - If needed, explicitly set the observer root to the scrollable content container so category-filtered views behave consistently.

4. Verify the full flow
   - Initial load of AI Prompts
   - Selecting a category/tag and scrolling to the bottom
   - Reaching multiple additional batches in a row
   - Ensuring the sentinel disappears once all items are loaded

Files to update
- `src/pages/ContentVaultCategory.tsx`
- Possibly `src/components/layout/ProjectLayout.tsx` only if the observer needs an explicit scroll root hook/id

Expected result
- After selecting a category and reaching the bottom, the next batch of prompt cards loads automatically without needing a refresh or manual action.
