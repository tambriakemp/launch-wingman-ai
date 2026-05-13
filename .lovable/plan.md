## Goal

Make the app feel like a native app on mobile/native shells by preventing pinch-to-zoom, double-tap zoom, and the iOS auto-zoom that happens when focusing input fields.

## Changes

### 1. `index.html` — viewport meta tag
Update the viewport meta to disable user scaling:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```
This blocks pinch zoom and double-tap zoom on iOS/Android.

### 2. `src/index.css` — prevent iOS focus zoom + extra gesture hardening
iOS Safari auto-zooms into any `<input>`, `<textarea>`, or `<select>` whose computed font-size is below 16px. Add a global rule that bumps form-control font-size to at least 16px on small screens, while keeping the desktop visual unchanged:

```css
@media (max-width: 768px) {
  input:not([type="checkbox"]):not([type="radio"]),
  textarea,
  select,
  [contenteditable="true"] {
    font-size: 16px !important;
  }
}

/* Block double-tap zoom & gesture zoom across the app */
html, body {
  touch-action: pan-x pan-y;
  -webkit-text-size-adjust: 100%;
}
```

Also add a tiny global JS guard (in `src/main.tsx`) to swallow iOS Safari's `gesturestart` event — the only reliable way to fully kill pinch zoom on iOS Safari, which ignores `user-scalable=no` in some versions:

```ts
document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("dblclick", (e) => e.preventDefault(), { passive: false });
```

### 3. Scope
- Applies globally (mobile web + native Capacitor + AppMySite WebView). The 16px font rule is gated by `max-width: 768px` so desktop typography is untouched.
- No changes to existing components, drawers, or task editing flows.

## Files to edit
- `index.html` — viewport meta
- `src/index.css` — font-size floor + touch-action rules
- `src/main.tsx` — gesturestart/dblclick guards

## Notes / trade-offs
- `user-scalable=no` reduces accessibility (users can't pinch-to-zoom for readability). This is the explicit ask to make it feel like an app, and matches the behavior of native apps.
- The 16px floor on inputs may make form fields slightly larger on mobile than today — this is required to stop iOS focus-zoom; there is no other reliable workaround.
