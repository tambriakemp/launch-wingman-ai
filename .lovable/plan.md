

## Remove Duplicate "Final Look" Section

The GRWM "Final Look (Reveal Outfit)" controls are duplicated -- they appear in both the **Look** popover and the **Settings** popover. Both write to the same config fields (`finalLookType`, `finalLook`, `finalLookAdditionalInfo`), so they're fully redundant.

### Decision

Keep it under **Look** (where outfit/styling options live) and remove it from **Settings** (which focuses on mode, camera, topic, and script).

### Change

**File: `src/components/ai-studio/StoryboardToolbar.tsx`**

Remove the GRWM "Final Look" block from the Settings popover (the block that checks `config.vlogCategory === 'Get Ready With Me'` and renders the `finalLookType` select + custom outfit input, located after the vlog topic textarea in Settings). The identical block in the Look popover remains untouched.

