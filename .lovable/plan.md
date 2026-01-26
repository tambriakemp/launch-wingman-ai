
## Subscription Tier Dropdown Management for Admin Dashboard

### Problem
Currently, after granting Content Vault access to a user:
1. The "Grant Vault" and "Grant Pro" buttons disappear
2. Only a "Cancel Subscription" button remains
3. Admins cannot upgrade a Content Vault user to Pro, or downgrade a Pro user to Content Vault
4. The cancel button appears for all paid users, even admin-granted free subscriptions

### Solution
Create a new `SubscriptionTierToggle` component similar to `AdminRoleToggle` that provides a dropdown menu for managing user subscription tiers with upgrade/downgrade capabilities.

### Implementation Overview

**New Component: `src/components/admin/SubscriptionTierToggle.tsx`**

A dropdown component that shows:
- Current tier indicator (Free/Vault/Pro badge)
- Dropdown button with tier management options
- Options to upgrade, downgrade, or cancel based on current tier

**Dropdown Options by Current Tier:**

| Current Tier | Available Actions |
|--------------|-------------------|
| Free | Grant Vault, Grant Pro |
| Vault | Upgrade to Pro, Cancel Subscription |
| Pro | Downgrade to Vault, Cancel Subscription |

**Backend Changes: `supabase/functions/admin-manage-subscription/index.ts`**

Add new actions for tier changes:
- `upgrade_to_pro` - Cancel existing Vault subscription, grant Pro
- `downgrade_to_vault` - Cancel existing Pro subscription, grant Vault

---

## Technical Details

### 1. Create New Component: `src/components/admin/SubscriptionTierToggle.tsx`

```typescript
interface SubscriptionTierToggleProps {
  userId: string;
  userEmail: string;
  currentTier: 'free' | 'content_vault' | 'pro';
  stripeSubscriptionId: string | null;
  accessToken: string;
  onTierChanged: () => void;
  disabled?: boolean;
}

type TierAction = 
  | 'grant_content_vault' 
  | 'grant_pro' 
  | 'upgrade_to_pro' 
  | 'downgrade_to_vault' 
  | 'cancel';
```

**Component Features:**
- Uses `DropdownMenu` from Radix UI (same as AdminRoleToggle)
- Shows confirmation dialog before executing actions
- Calls `admin-manage-subscription` edge function
- Displays appropriate icons:
  - Package icon for Vault actions
  - Crown icon for Pro actions  
  - X icon for cancel

**Dropdown Menu Structure:**
```text
[Current Tier Badge] [▼]
├── If Free:
│   ├── Grant Vault Access (Package icon)
│   └── Grant Pro Access (Crown icon)
├── If Vault:
│   ├── Upgrade to Pro (Crown icon)
│   └── Cancel Subscription (X icon, destructive)
└── If Pro:
    ├── Downgrade to Vault (Package icon)
    └── Cancel Subscription (X icon, destructive)
```

### 2. Update Edge Function: `supabase/functions/admin-manage-subscription/index.ts`

Add two new actions:

**`upgrade_to_pro`:**
1. Verify user has Vault subscription
2. Cancel existing Vault subscription
3. Create new Pro subscription (with 100% off coupon)
4. Log action to admin_action_logs

**`downgrade_to_vault`:**
1. Verify user has Pro subscription
2. Cancel existing Pro subscription
3. Create new Vault subscription (with 100% off coupon)
4. Log action to admin_action_logs

### 3. Update AdminDashboard.tsx

**Replace the current subscription action buttons with the new component:**

**Desktop Table (lines 1044-1089):**
Replace the conditional buttons with:
```tsx
<SubscriptionTierToggle
  userId={user.id}
  userEmail={user.email}
  currentTier={user.subscription_status}
  stripeSubscriptionId={user.stripe_subscription_id}
  accessToken={session?.access_token || ''}
  onTierChanged={fetchUsers}
/>
```

**Mobile Card (lines 203-252):**
Replace the conditional buttons with the same `SubscriptionTierToggle` component.

**Update the action types:**
```typescript
// Current:
action: 'cancel' | 'grant_pro' | 'grant_vault';

// New:
action: 'cancel' | 'grant_pro' | 'grant_content_vault' | 'upgrade_to_pro' | 'downgrade_to_vault';
```

### 4. Updated Confirmation Dialog Messages

| Action | Title | Description |
|--------|-------|-------------|
| grant_content_vault | Grant Content Vault Access | Grant free Vault access to {email}? |
| grant_pro | Grant Pro Access | Grant free Pro access to {email}? |
| upgrade_to_pro | Upgrade to Pro | Upgrade {email} from Vault to Pro? This will cancel their current Vault subscription. |
| downgrade_to_vault | Downgrade to Vault | Downgrade {email} from Pro to Vault? This will cancel their current Pro subscription. |
| cancel | Cancel Subscription | Cancel the subscription for {email}? They will lose paid feature access. |

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/admin/SubscriptionTierToggle.tsx` | Create new |
| `supabase/functions/admin-manage-subscription/index.ts` | Add upgrade/downgrade actions |
| `src/pages/AdminDashboard.tsx` | Replace action buttons with new component |

---

## Expected Result

After implementation:
- Each user row will have a subscription tier dropdown (similar to Roles dropdown)
- Free users: Can be granted Vault or Pro access
- Vault users: Can be upgraded to Pro or have subscription cancelled
- Pro users: Can be downgraded to Vault or have subscription cancelled
- All tier changes show confirmation dialogs with clear descriptions
- Actions are logged to admin_action_logs for audit trail
