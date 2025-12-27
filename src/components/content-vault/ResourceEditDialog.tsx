import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  resource_type: string;
  resource_url: string;
  tags: string[];
  subcategory_id: string;
}

interface ResourceEditDialogProps {
  resource: Resource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ResourceEditDialog = ({
  resource,
  open,
  onOpenChange,
}: ResourceEditDialogProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: resource?.title || "",
    description: resource?.description || "",
    resource_url: resource?.resource_url || "",
    cover_image_url: resource?.cover_image_url || "",
    resource_type: resource?.resource_type || "canva_link",
    tags: resource?.tags?.join(", ") || "",
  });

  // Reset form when resource changes
  useState(() => {
    if (resource) {
      setFormData({
        title: resource.title,
        description: resource.description || "",
        resource_url: resource.resource_url,
        cover_image_url: resource.cover_image_url || "",
        resource_type: resource.resource_type,
        tags: resource.tags?.join(", ") || "",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!resource) throw new Error("No resource to update");
      
      const tags = data.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const { error } = await supabase
        .from("content_vault_resources")
        .update({
          title: data.title,
          description: data.description || null,
          resource_url: data.resource_url,
          cover_image_url: data.cover_image_url || null,
          resource_type: data.resource_type,
          tags,
        })
        .eq("id", resource.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-vault-resources"] });
      toast.success("Resource updated successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to update resource: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  // Update form when resource prop changes
  if (resource && formData.title !== resource.title && !updateMutation.isPending) {
    setFormData({
      title: resource.title,
      description: resource.description || "",
      resource_url: resource.resource_url,
      cover_image_url: resource.cover_image_url || "",
      resource_type: resource.resource_type,
      tags: resource.tags?.join(", ") || "",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Resource</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resource_url">Resource URL</Label>
            <Input
              id="resource_url"
              type="url"
              value={formData.resource_url}
              onChange={(e) =>
                setFormData({ ...formData, resource_url: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover_image_url">Cover Image URL</Label>
            <Input
              id="cover_image_url"
              type="url"
              value={formData.cover_image_url}
              onChange={(e) =>
                setFormData({ ...formData, cover_image_url: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resource_type">Resource Type</Label>
            <Input
              id="resource_type"
              value={formData.resource_type}
              onChange={(e) =>
                setFormData({ ...formData, resource_type: e.target.value })
              }
              placeholder="canva_link or download"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              placeholder="launch, instagram, modern"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
