

# Reorder Planner Tabs & Default to Calendar

## Change

In `src/pages/Planner.tsx`:
- Change `<Tabs defaultValue="list">` to `<Tabs defaultValue="calendar">`
- Reorder the `TabsTrigger` elements: Calendar first, then List, then Board
- Reorder the `TabsContent` elements to match

