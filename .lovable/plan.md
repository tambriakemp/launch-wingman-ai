

## Fix: Launch Icon Stays Active When Another Section Is Selected

### Problem
The rail icon active state uses this logic:
```
const isActive = isOpen || findActiveSection([section], location.pathname) === section.id;
```

This means a section is highlighted if it's **open** OR if the current route belongs to it. When viewing a Launch route (e.g. `/dashboard`) and clicking "Planner", both show as active — Launch via route match, Planner via `isOpen`.

### Solution
Change the active logic so that when a flyout is explicitly open, only that section is highlighted. The route-based highlight should only apply when no flyout is open (i.e., `openSection` is `null`).

**File: `src/components/layout/ProjectSidebar.tsx`**, line 371:

Change:
```tsx
const isActive = isOpen || findActiveSection([section], location.pathname) === section.id;
```

To:
```tsx
const isActive = openSection
  ? isOpen
  : findActiveSection([section], location.pathname) === section.id;
```

This means:
- If a flyout is open: only the open section is active
- If no flyout is open: the section matching the current route is active

### Files modified
- `src/components/layout/ProjectSidebar.tsx` (1 line)

