

## Fix: Auto-generated UTM links use `example.com` as base URL

### Problem
In `src/components/campaigns/NewCampaignModal.tsx` line 124, the auto-generate UTM logic hardcodes `const baseUrl = "https://example.com"; // placeholder` when creating links during campaign creation. Every auto-generated link gets `example.com` as its destination.

### Solution
Add a "Base Destination URL" input field to Step 2 (Attribution) of the New Campaign modal. When auto-generate UTM is enabled, the user must provide a real destination URL. Use that URL instead of the hardcoded placeholder.

### Changes

**`src/components/campaigns/NewCampaignModal.tsx`**
1. Add state: `const [baseDestinationUrl, setBaseDestinationUrl] = useState("")`
2. In Step 2 UI (Attribution), when `autoUtm` is checked, show a text input labeled "Base Destination URL" with placeholder `https://yourdomain.com/offer` right below the auto-generate checkbox
3. Add validation: block proceeding to Step 3 if `autoUtm` is enabled but no valid URL is entered
4. Replace line 124 (`const baseUrl = "https://example.com"`) with `const baseUrl = baseDestinationUrl`
5. Reset `baseDestinationUrl` in the `reset()` function

