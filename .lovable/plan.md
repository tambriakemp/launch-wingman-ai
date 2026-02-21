
# UTM Link Card Updates

## Changes to `src/components/marketing-hub/UTMLinkTable.tsx`

### 1. Clickable links auto-copy to clipboard
- Make the full URL block clickable -- clicking it copies the full URL and shows a toast
- Make the short link clickable -- clicking it copies the short link and shows a toast
- Add `cursor-pointer hover:opacity-80` styles to both for visual feedback

### 2. Remove UTM tag badges
- Delete the entire "UTM tags" section (the `utm_source` and `utm_medium` badge row)

### 3. Fix short link domain
- Change the `getShortUrl` function to use `https://launchely.com/r/{code}` instead of the Lovable preview URL
- This is a hardcoded domain swap (no longer uses `publishedUrl` prop for short links)

### 4. Add "Short" label and bordered container for short link
- Add a `"Short"` text label before the short link
- Wrap the short link in a bordered container (`border rounded-md px-3 py-2`) matching the style of the full URL block above it

### 5. Add border around the full URL block
- The full URL block already has a background (`bg-muted/50`); add a visible `border` to match the screenshot style

## Changes to `src/pages/UTMBuilder.tsx`
- Update `PUBLISHED_URL` constant to `https://launchely.com` so any other references also use the correct domain

## Summary of visual result per card
- **Title row**: Label + campaign badge (unchanged)
- **Full URL**: Bordered block, clickable to copy
- **Short link**: "Short" label + bordered block showing `launchely.com/r/{code}`, clickable to copy
- **Footer**: Click count, date, open/delete buttons (copy buttons removed since clicking the links handles copying)
