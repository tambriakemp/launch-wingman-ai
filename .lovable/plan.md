

# Feature Gate Social Accounts (Coming Soon for Non-Admins)

## Overview

This change gates Instagram, Facebook, Threads, and TikTok behind a feature switch, showing them as "Coming Soon" for non-admin users while admins retain full access. Pinterest remains available to all users as it's approved for production.

---

## Current State

| Platform | Current Behavior |
|----------|------------------|
| Pinterest | Available to Pro subscribers |
| Instagram | Available to Pro subscribers |
| Facebook | Available to Pro subscribers |
| Threads | Available to Pro subscribers |
| TikTok | Available to Pro subscribers |

---

## New State

| Platform | Admins | Non-Admins |
|----------|--------|------------|
| Pinterest | Full access ✅ | Full access ✅ |
| Instagram | Full access ✅ | Greyed out + "Coming Soon" |
| Facebook | Full access ✅ | Greyed out + "Coming Soon" |
| Threads | Full access ✅ | Greyed out + "Coming Soon" |
| TikTok | Full access ✅ | Greyed out + "Coming Soon" |

---

## Visual Design

For non-admin users, gated platforms will show:
- Greyed out/muted appearance (reduced opacity)
- A "Coming Soon" badge instead of the Connect button
- Disabled interaction on the entire row

```text
┌─────────────────────────────────────────────────────────────────┐
│  [Instagram Icon]  Instagram                     ┌─────────────┐│
│                    Not connected                 │ Coming Soon ││
│                                                  └─────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### File: `src/pages/Settings.tsx`

#### 1. Add a Helper Variable for Gated Platforms

Near the top of the component (after `hasAdminAccess` declaration), add:

```typescript
// Platforms that are gated (not approved for production yet)
// Only admins can access these
const GATED_PLATFORMS = ['instagram', 'facebook', 'threads', 'tiktok'];

// Helper to check if a platform is accessible
const isPlatformAccessible = (platform: string): boolean => {
  // Admins have full access to all platforms
  if (hasAdminAccess) return true;
  // Non-admins only have access to non-gated platforms (pinterest)
  return !GATED_PLATFORMS.includes(platform);
};
```

#### 2. Update Instagram Connection Block (Lines ~1129-1256)

Wrap the entire Instagram section with a conditional styling:

```tsx
{/* Instagram Connection */}
<div className={`flex items-center justify-between p-4 rounded-lg border bg-card ${!isPlatformAccessible('instagram') ? 'opacity-60' : ''}`}>
  <div className="flex items-center gap-3">
    {/* ... existing avatar/icon code ... */}
    <div>
      <div className="flex items-center gap-2">
        <p className="font-medium text-foreground">Instagram</p>
        {!isPlatformAccessible('instagram') && (
          <Badge variant="secondary" className="text-xs">
            Coming Soon
          </Badge>
        )}
      </div>
      {/* ... existing connection status ... */}
    </div>
  </div>
  {/* Replace Connect button logic */}
  {isPlatformAccessible('instagram') ? (
    // Existing connection/disconnect/connect buttons code
    instagramConnection ? (
      /* existing disconnect UI */
    ) : isSubscribed ? (
      /* existing connect button */
    ) : (
      /* existing Pro upgrade button */
    )
  ) : (
    // Coming Soon badge for non-admins
    <Badge variant="outline" className="text-muted-foreground">
      Coming Soon
    </Badge>
  )}
</div>
```

#### 3. Update Facebook Connection Block (Lines ~1258-1375)

Apply same pattern as Instagram.

#### 4. Update Threads Connection Block (Lines ~1377-1455)

Apply same pattern as Instagram.

#### 5. Update TikTok Connection Block (Lines ~1457-1582)

Apply same pattern as Instagram.

---

## Code Changes Summary

The key changes for each gated platform:

1. **Wrapper div styling**: Add conditional `opacity-60` class when not accessible
2. **Platform name**: Add "Coming Soon" badge next to the name
3. **Connect button area**: Replace with static "Coming Soon" badge when not accessible

### Pattern Template

For each gated platform block:

```tsx
<div className={`flex items-center justify-between p-4 rounded-lg border bg-card ${!isPlatformAccessible('PLATFORM_NAME') ? 'opacity-60' : ''}`}>
  <div className="flex items-center gap-3">
    {/* Icon section unchanged */}
    <div>
      <div className="flex items-center gap-2">
        <p className="font-medium text-foreground">Platform Name</p>
        {!isPlatformAccessible('PLATFORM_NAME') && (
          <Badge variant="secondary" className="text-xs">
            Coming Soon
          </Badge>
        )}
      </div>
      {/* Status text */}
      <p className="text-sm text-muted-foreground">Not connected</p>
    </div>
  </div>
  {isPlatformAccessible('PLATFORM_NAME') ? (
    {/* Existing full button/connection logic */}
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      Coming Soon
    </Badge>
  )}
</div>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Settings.tsx` | Add `isPlatformAccessible` helper, update Instagram/Facebook/Threads/TikTok blocks with feature gating |

---

## Behavior Summary

| User Type | Pinterest | Instagram | Facebook | Threads | TikTok |
|-----------|-----------|-----------|----------|---------|--------|
| Free User | Pro button | Coming Soon | Coming Soon | Coming Soon | Coming Soon |
| Pro User | Connect | Coming Soon | Coming Soon | Coming Soon | Coming Soon |
| Content Vault | Pro button | Coming Soon | Coming Soon | Coming Soon | Coming Soon |
| Admin/Manager | Connect | Connect | Connect | Connect | Connect |

---

## Future Considerations

When platforms get approved for production, simply remove them from the `GATED_PLATFORMS` array to enable them for all users.

