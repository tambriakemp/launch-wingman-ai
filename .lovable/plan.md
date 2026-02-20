
# Redesign UTM Link Cards with Search

## Overview
Replace the current table-based link list with a card-based layout matching the reference screenshot, and add a search bar to filter links.

## Card Layout (per link)
Each card will display:
- **Title row**: Link label (bold) + campaign badge (top-right)
- **Subtitle**: UTM campaign name below the label
- **Full URL**: Displayed in a dark/muted code-style block
- **Short link**: Shown below the URL block with a link icon, formatted as `/r/{code}`
- **UTM tags**: Source and medium shown as colored badges/chips
- **Footer row**: Click count (with icon) + created date (with calendar icon) on the left; action buttons (copy full URL, copy short link, open link, delete) on the right

## Search
- A search input at the top of the links section, above the cards
- Filters links by label, campaign, source, medium, or full URL (case-insensitive)
- Resets pagination to page 1 when search query changes

## Header
- Shows "All Saved Links" (or folder name) with a count in parentheses, e.g. "All Links (51)"

## Pagination
- Keeps the existing 10 per page limit
- Pagination controls remain at the bottom

## Technical Details

### File Modified: `src/components/marketing-hub/UTMLinkTable.tsx`
- Replace the `<table>` markup with a vertical stack of `Card` components
- Add a `searchQuery` state and a search `<Input>` with a search icon
- Filter `links` by the search query before pagination
- Each card uses the layout described above with existing data fields (`label`, `utm_campaign`, `full_url`, `short_code`, `utm_source`, `utm_medium`, `click_count`, `created_at`)
- Action buttons: copy full URL, copy short link, open in new tab, delete

### File Modified: `src/pages/UTMBuilder.tsx`
- Update the card header to show the link count: `All Saved Links (${links.length})`
