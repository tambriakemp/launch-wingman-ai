

## Fix: Social link navigation issues

### Bug Found: YouTube link is broken by `mailto:` logic

Looking at the live site HTML, I confirmed the YouTube link renders as:
```
href="mailto:https://youtube.com/@launchely/"
```

The current logic applies `mailto:` to any URL containing `@`:
```tsx
const href = s.url.includes("@") && !s.url.startsWith("mailto:") ? `mailto:${s.url}` : s.url;
```

YouTube's URL `https://youtube.com/@launchely/` contains `@` (the handle format), so it gets incorrectly wrapped in `mailto:`.

### Fix

Change the `mailto:` detection to only apply when the URL has no protocol prefix (`://`). This correctly handles `hello@launchely.com` while leaving `https://youtube.com/@launchely/` alone.

**File:** `src/pages/LinkInBio.tsx` (line 245)

```tsx
// Before (broken)
const href = s.url.includes("@") && !s.url.startsWith("mailto:") ? `mailto:${s.url}` : s.url;

// After (fixed)
const href = s.url.includes("@") && !s.url.includes("://") && !s.url.startsWith("mailto:") 
  ? `mailto:${s.url}` 
  : s.url;
```

### About Instagram / other social links

For Instagram and some other platforms showing `ERR_BLOCKED_BY_RESPONSE`: these sites send security headers (`X-Frame-Options`, `Cross-Origin-Opener-Policy`) that can block navigation in certain contexts. This is platform behavior, not a code bug. After publishing and testing in a clean browser tab, if Instagram still blocks, the workaround is minimal -- the link itself is correct (`https://www.instagram.com/launchely/`).

