import { useState, useRef, useCallback } from "react";
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
import { Loader2, Upload, X, Image as ImageIcon, Clipboard } from "lucide-react";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
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

  // Shared function to process and upload an image file
  const processAndUploadImage = useCallback(async (file: File) => {
    if (!resource) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Determine file extension from mime type
      const mimeToExt: Record<string, string> = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/gif': 'gif',
        'image/webp': 'webp',
      };
      const fileExt = mimeToExt[file.type] || file.name.split('.').pop() || 'png';
      const fileName = `resource-covers/${resource.id}-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('content-media')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('content-media')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, cover_image_url: publicUrl }));
      toast.success('Cover image uploaded');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  }, [resource]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAndUploadImage(file);
  };

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await processAndUploadImage(file);
        }
        break;
      }
    }
  }, [processAndUploadImage]);

  const handleRemoveCover = () => {
    setFormData(prev => ({ ...prev, cover_image_url: "" }));
  };

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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Resource</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cover Image Upload */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div 
              className="aspect-video bg-muted rounded-lg overflow-hidden relative cursor-pointer border-2 border-dashed border-transparent hover:border-primary/50 transition-colors focus:outline-none focus:border-primary"
              tabIndex={0}
              onPaste={handlePaste}
              onClick={() => !formData.cover_image_url && fileInputRef.current?.click()}
            >
              {formData.cover_image_url ? (
                <>
                  <img 
                    src={formData.cover_image_url} 
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCover();
                    }}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-8 h-8" />
                        <Clipboard className="w-6 h-6" />
                      </div>
                      <p className="text-sm">Click to upload or paste an image</p>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {formData.cover_image_url ? "Replace Cover" : "Upload Cover"}
                </>
              )}
            </Button>
          </div>

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
            <Button type="submit" disabled={updateMutation.isPending || isUploading}>
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
