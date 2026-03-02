

## Reorganize Settings Page with Left-Side Tab Navigation

### Layout Change

Replace the current single-column scrolling list of cards with a two-panel layout:
- **Left side**: Vertical tab list (sticky) with icons and labels
- **Right side**: The cards for the selected tab (same exact card styling, no changes)

On mobile (below 768px), the tabs will stack horizontally at the top (scrollable) instead of a left sidebar, to keep things usable on small screens.

### Tab Structure

| Tab | Icon | Cards Included |
|-----|------|----------------|
| **Profile** | User | Account, Change Password, AI Writing Style, Danger Zone |
| **Billing** | CreditCard | Subscription, AI Settings (usage/credits/keys) |
| **Integrations** | Link2 | Connected Accounts |
| **Projects** | FolderOpen | Manage Projects, Annual Review |
| **Notifications** | Bell | Check-In Preferences, Email Notifications |

*Note: AI Writing Style is placed under Profile (personal preference), and AI Settings under Billing (credits/purchases). If you'd prefer them elsewhere, let me know after approving.*

### What Stays the Same
- Every card keeps its exact current styling, variant, icons, and content
- All existing logic (handlers, queries, state) stays in Settings.tsx
- No new components needed besides extracting tab content into simple render sections

### Technical Approach

**Files modified: 1** -- `src/pages/Settings.tsx` only

The implementation uses Radix Tabs (already installed) with a vertical orientation:

```text
+------------------+--------------------------------+
|  [Profile]       |                                |
|  [Billing]       |   Cards for selected tab       |
|  [Integrations]  |   (same exact card markup)     |
|  [Projects]      |                                |
|  [Notifications] |                                |
+------------------+--------------------------------+
```

- Wrap the main content area in `<Tabs defaultValue="profile" orientation="vertical">`
- Left column: `<TabsList>` styled as a vertical nav with `flex-col`, ~200px wide, sticky positioning
- Right column: One `<TabsContent>` per tab containing the relevant `<motion.div>` card blocks (moved, not changed)
- URL hash support: read `?tab=billing` from search params to allow deep-linking (e.g., after Stripe redirect lands on billing tab)
- The Settings header ("Settings" + subtitle) stays above the tabs layout

### Mobile Behavior
- Below `md` breakpoint: tabs render horizontally in a scrollable row at the top
- Cards stack vertically below, same as current behavior per tab

