import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Upload, Loader2, X } from "lucide-react";

interface CategoryEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: {
    id: string;
    name: string;
    cover_image_url: string | null;
  };
}

export const CategoryEditDialog = ({ open, onOpenChange, category }: CategoryEditDialogProps) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(category.cover_image_url);

  const updateMutation = useMutation({
    mutationFn: async (coverImageUrl: string | null) => {
      const { error } = await supabase
        .from('content_vault_categories')
        .update({ cover_image_url: coverImageUrl })
        .eq('id', category.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-vault-categories'] });
      toast.success('Category cover updated');
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error updating category:', error);
      toast.error('Failed to update category cover');
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `category-covers/${category.id}-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('content-media')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('content-media')
        .getPublicUrl(fileName);

      setPreviewUrl(publicUrl);
      await updateMutation.mutateAsync(publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveCover = async () => {
    setPreviewUrl(null);
    await updateMutation.mutateAsync(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Category Cover</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload a cover image for <strong>{category.name}</strong>
          </p>

          {/* Preview */}
          <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden relative">
            {previewUrl ? (
              <>
                <img 
                  src={previewUrl} 
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={handleRemoveCover}
                  disabled={isUploading || updateMutation.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-16 h-16 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || updateMutation.isPending}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload New Cover
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
