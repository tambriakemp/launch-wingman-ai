

## Simplify User Table Rows with Edit Detail Page

### Problem
Each user row currently has 7+ icon buttons (activity, edit email/password, view projects, export data, enable/disable, impersonate, subscription toggle, delete) plus inline role toggles and payment badges. It's visually cluttered and hard to scan.

### Solution
Strip the row down to essential info and a clean "Edit" button. Clicking Edit opens a dedicated detail page (`/admin/users/:id`) with all actions organized into clear sections.

### Row columns (simplified)
- Checkbox (for bulk actions)
- User (name + email)
- Status badge (Free/Pro/Vault/Admin/Manager)
- Joined date
- Last Active
- View As button (impersonate — stays inline since it navigates away)
- Edit button (opens detail page)

Remove from row: activity log, edit email/password, projects dialog, export, status toggle, subscription toggle, delete, role toggle, payment source badge.

### New User Detail Page (`/admin/users/:id`)
A full page with sections:

**Header** — User name, email, status badge, payment source badge

**Account** — Update email, generate temp password (existing EditUserDialog content, but inline)

**Subscription** — Current tier, payment info, change tier toggle

**Roles & Access** — Admin/Manager role toggle, Enable/Disable account

**Activity** — Activity log viewer, last active info

**Projects** — Project list (existing UserProjectsDialog content)

**Data & Danger Zone** — Export user data, Delete user

### Files to create/modify

1. **`src/pages/admin/AdminUserDetail.tsx`** (new) — Full detail page composing existing components (EditUserDialog content, AdminRoleToggle, SubscriptionTierToggle, UserStatusToggle, UserProjectsDialog, ExportUserDataDialog, DeleteUserDialog) into card sections instead of dialogs/icon buttons.

2. **`src/pages/AdminDashboard.tsx`** — Strip the Actions column down to just View As + Edit (link to `/admin/users/:id`). Remove payment badge and role toggle from inline display.

3. **`src/App.tsx`** — Add route for `/admin/users/:id`.

