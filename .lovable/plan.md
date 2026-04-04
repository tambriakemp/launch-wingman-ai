

## Swap Category and Dates Fields in Task Panel

Swap the order of the two fields in Row 2 of the property grid so **Dates** appears on the left and **Category** on the right.

### Change

**`src/components/planner/PlannerTaskDialog.tsx`** — In the `{/* Row 2: Category + Dates */}` section (around lines 477–520), move the Dates `<PropertyRow>` before the Category `<PropertyRow>` within the `grid-cols-2` div. Update the comment to reflect the new order.

