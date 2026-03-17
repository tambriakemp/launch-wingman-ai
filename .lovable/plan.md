

## Fix: Allow Repeat Email Submissions on Link in Bio

### Problem
Two issues prevent the tag from being reapplied on a second submission:

1. **Frontend blocks resubmission**: Once `submitState` is set to `"success"`, the submit button is disabled (`disabled={submitState !== "idle"}`), and the form never resets. The user literally cannot submit again.

2. **Backend tag attach is idempotent**: SureContact's `/contacts/{uuid}/tags/attach` likely returns success but doesn't "re-trigger" anything if the tag is already attached. To force a re-application, we need to **detach then reattach** the tag.

### Changes

**`src/pages/LinkInBio.tsx`**
- After showing the success message for ~3 seconds, reset `submitState` back to `"idle"` and clear the email input so the user can submit again.

**`supabase/functions/linkinbio-subscribe/index.ts`**
- Before attaching the `link-in-bio` tag, first call `POST /contacts/{contactUuid}/tags/detach` with `{ tag_uuids: [tagUuid] }` to remove it, then reattach. This ensures the tag event fires fresh in SureContact even for existing contacts.

### Summary of Steps
1. Add a detach-then-attach pattern for the tag in the edge function
2. Reset the frontend form state after a short delay so repeat submissions are possible

