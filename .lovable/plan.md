

# Refactor Social Media Bio Builder

## Overview

This refactor simplifies the Social Bio Builder by:
1. Adding a "Generate Bio" button after selecting a formula
2. Greying out platforms that already have a bio (one bio per platform limit)
3. Restoring the formula field format when editing (using stored `field_data`)
4. Keeping the Generate button available in edit mode

---

## Current Issues

| Issue | Current Behavior | Desired Behavior |
|-------|------------------|------------------|
| No Generate button | User fills in fields, bio auto-generates as preview | User clicks "Generate Bio" button after filling fields |
| Platform re-use | User can select platform even if bio exists (silently updates) | Grey out platforms with existing bios, show lock icon |
| Edit mode bypass | Opens simple textarea with final content only | Show original formula fields populated from `field_data` + Generate button |

---

## Detailed Changes

### 1. Grey Out Platforms with Existing Bios

**File:** `src/components/SocialBioBuilder.tsx`

In the platform selection grid (lines 472-496), modify each platform button to:
- Check if `bios.find(b => b.platform === p.id)` exists
- If exists: grey out button, show lock icon, add "Bio exists" tooltip
- Prevent `handlePlatformSelect` from being called

```tsx
{platforms.map((p) => {
  const Icon = p.icon;
  const existingBio = bios.find(b => b.platform === p.id);
  const isDisabled = !!existingBio;
  
  return (
    <button
      key={p.id}
      onClick={() => !isDisabled && handlePlatformSelect(p.id)}
      disabled={isDisabled}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all relative",
        isDisabled 
          ? "opacity-50 cursor-not-allowed border-border bg-muted/30"
          : "hover:border-primary hover:bg-primary/5",
        selectedPlatform === p.id && !isDisabled
          ? "border-primary bg-primary/10"
          : "border-border"
      )}
    >
      {isDisabled && (
        <div className="absolute top-2 right-2">
          <Lock className="w-3 h-3 text-muted-foreground" />
        </div>
      )}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center",
        isDisabled ? "bg-muted/50" : "bg-muted"
      )}>
        <Icon className={cn("w-5 h-5", isDisabled ? "text-muted-foreground" : "text-foreground")} />
      </div>
      <span className={cn("text-sm font-medium", isDisabled ? "text-muted-foreground" : "text-foreground")}>
        {p.name}
      </span>
      <span className="text-xs text-muted-foreground">
        {isDisabled ? "Bio exists" : `${p.maxChars} chars`}
      </span>
    </button>
  );
})}
```

### 2. Add "Generate Bio" Button Flow

**Current Flow:**
1. Select Platform → 2. Select Formula → 3. Fill fields (bio auto-generates in preview) → 4. Save

**New Flow:**
1. Select Platform → 2. Select Formula → 3. Fill fields → 4. Click "Generate Bio" → 5. Review/Edit generated content → 6. Save

**Implementation:**

Add a new state variable:
```tsx
const [isGenerated, setIsGenerated] = useState(false);
```

Modify the content step to have two sub-states:
- **Fields mode**: Show formula fields + "Generate Bio" button
- **Preview mode**: Show generated content (editable) + "Regenerate" + "Save"

```tsx
{step === "content" && (
  <div className="space-y-4">
    {/* Formula Reference Card */}
    {formula && (
      <div className="p-3 rounded-lg border bg-muted/30">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Formula</span>
        </div>
        <p className="text-sm font-medium text-foreground">{formula.name}</p>
        <p className="text-xs text-muted-foreground italic mt-1">{formula.formula}</p>
      </div>
    )}

    {/* Show fields when not yet generated */}
    {!isGenerated && (
      <>
        {formula?.fields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label>{field.label}</Label>
            <Input
              value={fieldData[field.key] || ""}
              onChange={(e) => setFieldData((prev) => ({ ...prev, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
            />
          </div>
        ))}
        
        <Button 
          onClick={() => setIsGenerated(true)} 
          disabled={!hasAllFields}
          className="w-full"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Bio
        </Button>
      </>
    )}

    {/* Show preview when generated */}
    {isGenerated && (
      <>
        <div className="space-y-2">
          <Label>Generated Bio</Label>
          <Textarea
            value={fieldData.finalContent || generatedContent}
            onChange={(e) => setFieldData((prev) => ({ ...prev, finalContent: e.target.value }))}
            rows={4}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <p className={cn("text-xs", isOverLimit ? "text-destructive" : "text-muted-foreground")}>
            {charCount}/{maxChars} characters
          </p>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setFieldData(prev => ({ ...prev, finalContent: undefined }));
              setIsGenerated(false);
            }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Regenerate
          </Button>
        </div>
      </>
    )}
  </div>
)}
```

### 3. Restore Formula Fields When Editing

**Current Issue:**
```tsx
const handleEdit = (bio: SocialBio) => {
  setEditingBio(bio);
  setSelectedPlatform(bio.platform);
  setSelectedFormula(bio.formula);
  setFieldData({ finalContent: bio.content }); // Only stores final content!
  setStep("content");
  setIsAddMode(true);
};
```

**Fix:** The database stores original `field_data`, so we can restore it:

```tsx
const handleEdit = async (bio: SocialBio) => {
  // Fetch the full bio with field_data from the database
  const { data } = await supabase
    .from("social_bios")
    .select("field_data")
    .eq("id", bio.id)
    .single();
  
  const storedFieldData = (data?.field_data as Record<string, string>) || {};
  
  setEditingBio(bio);
  setSelectedPlatform(bio.platform);
  setSelectedFormula(bio.formula);
  // Restore original field data AND the final content
  setFieldData({
    ...storedFieldData,
    finalContent: bio.content,
  });
  setIsGenerated(true); // Show in "generated" mode since bio already exists
  setStep("content");
  setIsAddMode(true);
};
```

**Better Approach:** Since we already fetch bios with all data, we can update the query to include `field_data`:

Update the bios query (lines 211-228):
```tsx
const { data: bios = [], isLoading } = useQuery({
  queryKey: ["social-bios", projectId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("social_bios")
      .select("*")
      .eq("project_id", projectId);

    if (error) throw error;
    return (data || []).map((item) => ({
      id: item.id,
      platform: item.platform,
      formula: item.formula_id,
      content: item.bio_content,
      fieldData: item.field_data as Record<string, string>, // Add this
    }));
  },
  enabled: !!projectId,
});
```

Update SocialBio interface:
```tsx
interface SocialBio {
  id: string;
  platform: string;
  formula: string;
  content: string;
  fieldData?: Record<string, string>; // Add this
}
```

Then `handleEdit` becomes:
```tsx
const handleEdit = (bio: SocialBio) => {
  setEditingBio(bio);
  setSelectedPlatform(bio.platform);
  setSelectedFormula(bio.formula);
  setFieldData({
    ...bio.fieldData, // Restore original fields
    finalContent: bio.content,
  });
  setIsGenerated(true); // Already generated
  setStep("content");
  setIsAddMode(true);
};
```

### 4. Update Save Logic

The save logic needs to use `finalContent` when generated, or build from fields:

```tsx
const handleSave = () => {
  if (!selectedPlatform || !selectedFormula) {
    toast.error("Please complete all steps");
    return;
  }

  // Use finalContent if edited, otherwise build from formula
  const content = fieldData.finalContent || formula?.build(fieldData) || "";
  
  if (!content.trim()) {
    toast.error("Please fill in the bio content");
    return;
  }

  // ... rest of save logic
};
```

### 5. Reset `isGenerated` State

Update `resetForm` to include the new state:
```tsx
const resetForm = () => {
  setIsAddMode(false);
  setStep("platform");
  setSelectedPlatform(null);
  setSelectedFormula(null);
  setFieldData({});
  setEditingBio(null);
  setIsGenerated(false); // Add this
};
```

---

## UI Flow Comparison

### Creating New Bio

```text
CURRENT:
[Platform] → [Formula] → [Fields + Live Preview] → [Save]

NEW:
[Platform (grayed if exists)] → [Formula] → [Fields] → [Generate Bio] → [Editable Preview] → [Save]
```

### Editing Existing Bio

```text
CURRENT:
Opens with simple textarea (final content only)

NEW:
Opens with:
- Formula reference card at top
- Original fields populated (editable)
- "Generate Bio" regenerates from fields
- Or edit the preview directly
- Save
```

---

## Files to Update

| File | Changes |
|------|---------|
| `src/components/SocialBioBuilder.tsx` | All changes described above |

---

## Summary of Changes

1. **Add `isGenerated` state** - Track whether bio has been generated
2. **Update `SocialBio` interface** - Include `fieldData` from database
3. **Update bios query** - Fetch and map `field_data` 
4. **Grey out platforms with existing bios** - Add disabled state + lock icon
5. **Split content step** - Fields mode vs Preview mode
6. **Add Generate Bio button** - Triggers transition to preview
7. **Add Regenerate button** - Goes back to fields mode
8. **Fix handleEdit** - Restore fieldData from bio + set isGenerated=true
9. **Update resetForm** - Reset isGenerated state
10. **Validate hasAllFields** - Only enable Generate button when required fields are filled

