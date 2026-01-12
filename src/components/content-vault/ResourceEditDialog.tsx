import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { extractVideoThumbnail } from "@/lib/videoThumbnail";
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
import { Loader2, Upload, X, Image as ImageIcon, Clipboard, Wand2, Film, Sparkles, Star } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  resource_type: string;
  resource_url: string;
  preview_url: string | null;
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
  const [isFetchingThumbnail, setIsFetchingThumbnail] = useState(false);
  const [isGeneratingVideoThumbnail, setIsGeneratingVideoThumbnail] = useState(false);
  const [isRenamingWithAI, setIsRenamingWithAI] = useState(false);
  const [isSettingCategoryThumbnail, setIsSettingCategoryThumbnail] = useState(false);
  const [formData, setFormData] = useState({
    title: resource?.title || "",
    description: resource?.description || "",
    resource_url: resource?.resource_url || "",
    preview_url: resource?.preview_url || "",
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
        preview_url: resource.preview_url || "",
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
          preview_url: data.preview_url || null,
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

  // Fetch thumbnail from Canva preview URL
  const fetchCanvaThumbnail = useCallback(async () => {
    const previewUrl = formData.preview_url;
    if (!previewUrl || !previewUrl.includes('canva.com')) {
      toast.error('Please enter a valid Canva preview URL first');
      return;
    }

    setIsFetchingThumbnail(true);

    try {
      const { data, error } = await supabase.functions.invoke('extract-canva-thumbnail', {
        body: { url: previewUrl },
      });

      if (error) throw error;

      if (data?.thumbnailUrl) {
        setFormData(prev => ({ ...prev, cover_image_url: data.thumbnailUrl }));
        toast.success('Thumbnail extracted from Canva');
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Error fetching Canva thumbnail:', error);
      toast.error('Failed to fetch thumbnail from Canva');
    } finally {
      setIsFetchingThumbnail(false);
    }
  }, [formData.preview_url]);

  // Generate thumbnail from video
  const generateVideoThumbnail = useCallback(async () => {
    if (!resource) return;
    
    const resourceUrl = formData.resource_url;
    if (!resourceUrl) {
      toast.error('No resource URL to generate thumbnail from');
      return;
    }

    // Check if it's a video
    const isVideo = /\.(mp4|mov|webm|avi)$/i.test(resourceUrl) || formData.resource_type === 'video';
    if (!isVideo) {
      toast.error('This resource is not a video');
      return;
    }

    setIsGeneratingVideoThumbnail(true);

    try {
      const { blob } = await extractVideoThumbnail(resourceUrl, 'middle', 400);
      
      // Upload the thumbnail
      const fileName = `resource-covers/${resource.id}-video-thumb-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('content-media')
        .upload(fileName, blob, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('content-media')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, cover_image_url: publicUrl }));
      toast.success('Video thumbnail generated!');
    } catch (error: any) {
      console.error('Error generating video thumbnail:', error);
      toast.error(error.message || 'Failed to generate video thumbnail');
    } finally {
      setIsGeneratingVideoThumbnail(false);
    }
  }, [resource, formData.resource_url, formData.resource_type]);

  // AI rename for photos/images
  const renameWithAI = useCallback(async () => {
    if (!resource) return;
    
    const coverUrl = formData.cover_image_url;
    if (!coverUrl) {
      toast.error('No cover image to analyze');
      return;
    }

    setIsRenamingWithAI(true);

    try {
      const { data, error } = await supabase.functions.invoke('rename-vault-videos', {
        body: { 
          singleResourceId: resource.id,
          previewOnly: false 
        },
      });

      if (error) throw error;

      if (data?.previews?.[0]?.newTitle) {
        setFormData(prev => ({ ...prev, title: data.previews[0].newTitle }));
        toast.success('Title generated with AI!');
      } else if (data?.error) {
        toast.error(data.error);
      } else {
        toast.info('No new title was generated');
      }
    } catch (error: any) {
      console.error('Error renaming with AI:', error);
      toast.error(error.message || 'Failed to generate title with AI');
    } finally {
      setIsRenamingWithAI(false);
    }
  }, [resource, formData.cover_image_url]);

  // Set as category thumbnail (controls the main Content Vault category card image)
  const setAsCategoryThumbnail = useCallback(async () => {
    if (!resource) return;

    const candidateUrl =
      formData.cover_image_url ||
      formData.preview_url ||
      ((formData.resource_type === "image" || formData.resource_type === "photo")
        ? formData.resource_url
        : "");

    if (!candidateUrl) {
      toast.error("Add a cover image (or preview URL) to set a category thumbnail");
      return;
    }

    setIsSettingCategoryThumbnail(true);

    try {
      // First, get the category_id from the subcategory
      const { data: subcategory, error: subError } = await supabase
        .from("content_vault_subcategories")
        .select("category_id")
        .eq("id", resource.subcategory_id)
        .single();

      if (subError) throw subError;

      // Update the category's cover_image_url
      const { error: updateError } = await supabase
        .from("content_vault_categories")
        .update({ cover_image_url: candidateUrl })
        .eq("id", subcategory.category_id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({
        queryKey: ["content-vault-categories-with-counts"],
      });
      toast.success("Category thumbnail updated!");
    } catch (error: any) {
      console.error("Error setting category thumbnail:", error);
      toast.error(error.message || "Failed to set category thumbnail");
    } finally {
      setIsSettingCategoryThumbnail(false);
    }
  }, [resource, formData.cover_image_url, formData.preview_url, formData.resource_type, formData.resource_url, queryClient]);

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
      preview_url: resource.preview_url || "",
      cover_image_url: resource.cover_image_url || "",
      resource_type: resource.resource_type,
      tags: resource.tags?.join(", ") || "",
    });
  }

  const isCanvaPreviewUrl = formData.preview_url?.includes('canva.com');
  const isVideoResource = /\.(mp4|mov|webm|avi)$/i.test(formData.resource_url) || formData.resource_type === 'video';
  const categoryThumbnailCandidateUrl =
    formData.cover_image_url ||
    formData.preview_url ||
    ((formData.resource_type === 'image' || formData.resource_type === 'photo') ? formData.resource_url : '');
  const canSetCategoryThumbnail = Boolean(categoryThumbnailCandidateUrl);
  const isProcessing = isUploading || isFetchingThumbnail || isGeneratingVideoThumbnail || isRenamingWithAI || isSettingCategoryThumbnail;

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
                    disabled={isProcessing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <p className="text-sm">
                        {isFetchingThumbnail ? 'Fetching from Canva...' : 
                         isGeneratingVideoThumbnail ? 'Generating video thumbnail...' :
                         isRenamingWithAI ? 'AI analyzing...' : 'Uploading...'}
                      </p>
                    </>
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
              disabled={isProcessing}
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

            {/* Video thumbnail generation button */}
            {isVideoResource && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={generateVideoThumbnail}
                disabled={isProcessing}
              >
                {isGeneratingVideoThumbnail ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Film className="h-4 w-4 mr-2" />
                    Generate Video Thumbnail
                  </>
                )}
              </Button>
            )}

            {/* Use as category thumbnail button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={setAsCategoryThumbnail}
              disabled={isProcessing || !canSetCategoryThumbnail}
              title={
                canSetCategoryThumbnail
                  ? "Use this resource as the main category thumbnail"
                  : "Add a cover image (or ensure this is an image resource) to enable"
              }
            >
              {isSettingCategoryThumbnail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting...
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 mr-2" />
                  Use as Main Category Thumbnail
                </>
              )}
            </Button>
            {!canSetCategoryThumbnail && (
              <p className="text-xs text-muted-foreground">
                Tip: upload a cover image first (or set Resource Type to “image”).
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <div className="flex gap-2">
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={renameWithAI}
                disabled={!formData.cover_image_url || isProcessing}
                title="Generate title with AI"
              >
                {isRenamingWithAI ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Click the sparkle icon to generate a title from the cover image using AI
            </p>
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
            <Label htmlFor="preview_url">Preview URL (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="preview_url"
                type="url"
                value={formData.preview_url}
                onChange={(e) =>
                  setFormData({ ...formData, preview_url: e.target.value })
                }
                placeholder="Canva watch/preview link"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={fetchCanvaThumbnail}
                disabled={!isCanvaPreviewUrl || isFetchingThumbnail || isUploading}
                title="Fetch thumbnail from Canva"
              >
                {isFetchingThumbnail ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Paste a Canva preview link and click the wand to auto-fetch the thumbnail
            </p>
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
              onClick={setAsCategoryThumbnail}
              disabled={isProcessing || !canSetCategoryThumbnail}
              title={
                canSetCategoryThumbnail
                  ? "Use this resource as the main category thumbnail"
                  : "Add a cover image (or set Resource Type to image) to enable"
              }
            >
              <Star className="w-4 h-4 mr-2" />
              Set Category Thumbnail
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending || isProcessing}>
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
