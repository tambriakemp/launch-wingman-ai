

## Fix: Remove "Personal" from Default Categories

**Problem**: "Personal" appears as both a default space name and a default category name. It should only be a default space.

### Changes

**File: `src/hooks/usePlannerSpaces.ts`**
- Remove `{ name: "Personal", color: "#0ea572" }` from the `DEFAULT_CATEGORIES` array
- Keep the remaining 3 default categories: Work, Health, Finance

This affects both the auto-created default space flow and the `createSpace` function, since both use `DEFAULT_CATEGORIES` for seeding categories.

