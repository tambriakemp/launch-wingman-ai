

## Fix: Email link prefix

The only actual code issue is the Email social link. The URL stored is `hello@launchely.com` without a `mailto:` prefix, so clicking it tries to navigate to it as a web URL.

### Change in `src/pages/LinkInBio.tsx`

In the social links rendering loop, add logic to prefix `mailto:` for email URLs that don't have a protocol:

```tsx
// Before the <a> tag, compute the final href
const href = s.url.includes("@") && !s.url.startsWith("mailto:") 
  ? `mailto:${s.url}` 
  : s.url;
```

Then use `href={href}` instead of `href={s.url}`.

### No other changes needed

The "connection refused" for Instagram/TikTok/etc. is a preview sandbox restriction, not a code issue. These links work correctly on the published site.

