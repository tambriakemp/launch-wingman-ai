
# Fix Impersonation Session State Persistence Bug

## Problem Summary

You're experiencing unexpected user switches where the app shows you logged in as "bre29@cre8visions.com" (Tambria Kemp) instead of your admin account. This happens because:

1. Impersonation state is stored in localStorage (`coach_hub_impersonation`)
2. On app mount, this state is restored without validating the actual Supabase session
3. When the preview refreshes (during Lovable planning), stale localStorage data causes confusion between sessions

## Root Cause

The initialization check on lines 53-61 of `AuthContext.tsx` blindly trusts localStorage:

```typescript
useEffect(() => {
  const impersonationData = localStorage.getItem(IMPERSONATION_KEY);
  if (impersonationData) {
    const { email } = JSON.parse(impersonationData);
    setIsImpersonating(true);             // Sets flag without validation!
    setImpersonatedUserEmail(email);
  }
}, []);
```

This doesn't verify:
- Whether the current Supabase session user matches the impersonated email
- Whether the admin session tokens in localStorage are still valid
- Whether the impersonation data is stale (hours/days old)

---

## Solution

### Part 1: Add Validation to Impersonation State Recovery

When the app mounts and finds impersonation data, validate it against the current session:

```typescript
// Check for existing impersonation on mount - with validation
useEffect(() => {
  const validateImpersonation = async () => {
    const impersonationData = localStorage.getItem(IMPERSONATION_KEY);
    const adminSessionData = localStorage.getItem(ADMIN_SESSION_KEY);
    
    if (!impersonationData || !adminSessionData) {
      // No impersonation data or incomplete - clear everything
      localStorage.removeItem(IMPERSONATION_KEY);
      localStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem(ADMIN_INFO_KEY);
      return;
    }
    
    try {
      const { email, startedAt } = JSON.parse(impersonationData);
      
      // Check if impersonation is stale (older than 4 hours)
      const startTime = new Date(startedAt).getTime();
      const MAX_IMPERSONATION_DURATION = 4 * 60 * 60 * 1000; // 4 hours
      if (Date.now() - startTime > MAX_IMPERSONATION_DURATION) {
        console.warn('[AuthContext] Stale impersonation data detected, clearing...');
        localStorage.removeItem(IMPERSONATION_KEY);
        localStorage.removeItem(ADMIN_SESSION_KEY);
        localStorage.removeItem(ADMIN_INFO_KEY);
        return;
      }
      
      // Get current session
      const { data: sessionData } = await supabase.auth.getSession();
      
      // Validate current session matches impersonated user
      if (sessionData?.session?.user?.email === email) {
        setIsImpersonating(true);
        setImpersonatedUserEmail(email);
      } else {
        // Session doesn't match - clear stale impersonation data
        console.warn('[AuthContext] Impersonation session mismatch, clearing...');
        localStorage.removeItem(IMPERSONATION_KEY);
        localStorage.removeItem(ADMIN_SESSION_KEY);
        localStorage.removeItem(ADMIN_INFO_KEY);
      }
    } catch (err) {
      console.error('[AuthContext] Error validating impersonation:', err);
      // On any error, clear impersonation data
      localStorage.removeItem(IMPERSONATION_KEY);
      localStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem(ADMIN_INFO_KEY);
    }
  };
  
  validateImpersonation();
}, []);
```

### Part 2: Clear Impersonation State on User ID Change

When the auth state changes and the user ID changes unexpectedly, clear impersonation data:

```typescript
// In the onAuthStateChange callback
if (currentUserId.current !== newUserId || !isInitialized.current) {
  currentUserId.current = newUserId;
  setSession(newSession);
  setUser(newSession?.user ?? null);
  
  // If user changed unexpectedly, clear any stale impersonation data
  const impersonationData = localStorage.getItem(IMPERSONATION_KEY);
  if (impersonationData && newSession?.user) {
    const { email } = JSON.parse(impersonationData);
    if (newSession.user.email !== email) {
      // Current user doesn't match impersonation - clear it
      console.warn('[AuthContext] User changed, clearing impersonation state');
      localStorage.removeItem(IMPERSONATION_KEY);
      localStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem(ADMIN_INFO_KEY);
      setIsImpersonating(false);
      setImpersonatedUserEmail(null);
    }
  }
}
```

### Part 3: Add Session Expiry Check for Admin Recovery

When attempting to restore admin session, verify the tokens are still valid:

```typescript
const stopImpersonation = async () => {
  try {
    const adminSessionData = localStorage.getItem(ADMIN_SESSION_KEY);
    
    if (!adminSessionData) {
      toast.error('No admin session to return to');
      // Clean up all impersonation data
      localStorage.removeItem(IMPERSONATION_KEY);
      localStorage.removeItem(ADMIN_INFO_KEY);
      setIsImpersonating(false);
      setImpersonatedUserEmail(null);
      await signOut();
      return;
    }

    const { access_token, refresh_token } = JSON.parse(adminSessionData);
    
    // Try to restore the admin session
    await supabase.auth.signOut();
    
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error || !data.session) {
      // Admin session expired - need to re-login
      console.warn('[AuthContext] Admin session expired');
      toast.error('Your admin session has expired. Please log in again.');
      localStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem(IMPERSONATION_KEY);
      localStorage.removeItem(ADMIN_INFO_KEY);
      setIsImpersonating(false);
      setImpersonatedUserEmail(null);
      navigate('/auth');
      return;
    }
    
    // Success - clear impersonation data
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(ADMIN_INFO_KEY);
    localStorage.removeItem(IMPERSONATION_KEY);
    setIsImpersonating(false);
    setImpersonatedUserEmail(null);

    toast.success('Returned to admin account');
    navigate('/admin');
  } catch (error) {
    // ... existing error handling
  }
};
```

---

## Immediate Fix for Your Current Session

Before the code fix is applied, you can manually clear the stale impersonation data by running this in your browser's Developer Console:

```javascript
localStorage.removeItem('coach_hub_impersonation');
localStorage.removeItem('coach_hub_admin_session');
localStorage.removeItem('coach_hub_admin_info');
location.reload();
```

---

## Files to Update

| File | Changes |
|------|---------|
| `src/contexts/AuthContext.tsx` | 1) Add validation to impersonation recovery on mount 2) Clear stale impersonation on user ID change 3) Better error handling in stopImpersonation |

---

## Summary of Fixes

| Issue | Fix |
|-------|-----|
| Impersonation state blindly trusted from localStorage | Validate current session email matches impersonated email |
| No expiry on impersonation data | Add 4-hour max duration check |
| User ID change doesn't clear impersonation | Detect mismatch and clear state |
| Admin session recovery doesn't handle expired tokens | Check setSession result and handle gracefully |
| Incomplete cleanup on errors | Ensure all 3 localStorage keys are cleared together |
