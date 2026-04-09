

## Plan: Remove Action and Detail fields from prompt modal

### Change
Remove the Action (`a_roll`) and Detail (`close_up_details`) editable fields and their associated state/effects from the prompt modal in `SceneCard.tsx`.

### File: `src/components/ai-studio/SceneCard.tsx`
- Remove state variables: `isEditingAction`, `editedAction`, `isEditingDetail`, `editedDetail`
- Remove corresponding `useEffect` hooks for `step.a_roll` and `step.close_up_details`
- Remove the Action/Detail grid section from the modal (the `grid-cols-2` block)
- Keep: Script/Voiceover, Image Prompt, Video Prompt sections
- Remove `onUpdateAction` and `onUpdateDetail` props from the interface (and any parent usage)

