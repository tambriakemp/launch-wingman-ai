import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface BulkTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: Set<string>;
  allTags: string[];
  resources: { id: string; tags: string[] }[];
}

export const BulkTagDialog = ({
  open,
  onOpenChange,
  selectedIds,
  allTags,
  resources,
}: BulkTagDialogProps) => {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed]);
      setNewTag("");
    }
  };

  // Tags currently used by the selected resources
  const selectedResourceTags = (() => {
    const tags = new Set<string>();
    resources
      .filter((r) => selectedIds.has(r.id))
      .forEach((r) => r.tags?.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  })();

  const handleApply = async () => {
    if (selectedTags.length === 0) {
      toast.error("Select at least one tag");
      return;
    }
    setIsProcessing(true);

    try {
      const ids = Array.from(selectedIds);
      const selected = resources.filter((r) => ids.includes(r.id));

      for (const resource of selected) {
        const currentTags = resource.tags || [];
        let newTags: string[];

        if (mode === "add") {
          const tagSet = new Set([...currentTags, ...selectedTags]);
          newTags = Array.from(tagSet);
        } else {
          newTags = currentTags.filter((t) => !selectedTags.includes(t));
        }

        const { error } = await supabase
          .from("content_vault_resources")
          .update({ tags: newTags })
          .eq("id", resource.id);

        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["content-vault-resources"] });
      toast.success(
        `${mode === "add" ? "Added" : "Removed"} ${selectedTags.length} tag(s) ${mode === "add" ? "to" : "from"} ${ids.length} resources`
      );
      setSelectedTags([]);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update tags");
    } finally {
      setIsProcessing(false);
    }
  };

  const displayTags = mode === "remove" ? selectedResourceTags : allTags;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk {mode === "add" ? "Add" : "Remove"} Tags</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <Button
              variant={mode === "add" ? "default" : "outline"}
              size="sm"
              onClick={() => { setMode("add"); setSelectedTags([]); }}
            >
              Add Tags
            </Button>
            <Button
              variant={mode === "remove" ? "default" : "outline"}
              size="sm"
              onClick={() => { setMode("remove"); setSelectedTags([]); }}
            >
              Remove Tags
            </Button>
          </div>

          {/* Custom tag input (add mode only) */}
          {mode === "add" && (
            <div className="flex gap-2">
              <Input
                placeholder="Type a new tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTag())}
                className="flex-1"
              />
              <Button size="sm" variant="outline" onClick={addCustomTag} disabled={!newTag.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Tag list */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              {mode === "add" ? "Existing tags (click to select)" : "Tags on selected resources"}
            </Label>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
              {displayTags.length === 0 ? (
                <p className="text-xs text-muted-foreground">No tags available</p>
              ) : (
                displayTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                    {selectedTags.includes(tag) && <X className="w-3 h-3 ml-1" />}
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Selected preview */}
          {selectedTags.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Will {mode} <span className="font-medium text-foreground">{selectedTags.join(", ")}</span>{" "}
              {mode === "add" ? "to" : "from"} {selectedIds.size} resources
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={isProcessing || selectedTags.length === 0}>
            {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === "add" ? "Add" : "Remove"} Tags
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
