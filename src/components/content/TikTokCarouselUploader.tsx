import { useState, useRef, useCallback } from "react";
import { Upload, X, Image, Loader2, GripVertical, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface TikTokCarouselUploaderProps {
  photoUrls: string[];
  onPhotosChange: (urls: string[]) => void;
  projectId: string;
  maxPhotos?: number;
  disabled?: boolean;
}

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB per image for TikTok

export function TikTokCarouselUploader({
  photoUrls,
  onPhotosChange,
  projectId,
  maxPhotos = 35,
  disabled = false,
}: TikTokCarouselUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return `${file.name}: Only JPEG, PNG, and WebP images are supported`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File size must be less than 20MB`;
    }
    return null;
  };

  const uploadFiles = async (files: File[]) => {
    const remainingSlots = maxPhotos - photoUrls.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    const errors: string[] = [];
    const validFiles: File[] = [];

    for (const file of filesToUpload) {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadingCount(validFiles.length);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to upload media");
        return;
      }

      const uploadedUrls: string[] = [];

      for (const file of validFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${projectId}/tiktok-carousel/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("content-media")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("content-media")
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      if (uploadedUrls.length > 0) {
        onPhotosChange([...photoUrls, ...uploadedUrls]);
        toast.success(`${uploadedUrls.length} photo${uploadedUrls.length > 1 ? "s" : ""} uploaded`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload photos");
    } finally {
      setIsUploading(false);
      setUploadingCount(0);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        uploadFiles(files);
      }
    },
    [photoUrls, projectId, disabled]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      uploadFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePhoto = async (index: number) => {
    const urlToRemove = photoUrls[index];
    
    // Try to delete from storage
    try {
      const urlParts = urlToRemove.split("/content-media/");
      if (urlParts[1]) {
        await supabase.storage.from("content-media").remove([urlParts[1]]);
      }
    } catch (err) {
      console.error("Failed to delete file:", err);
    }

    const newUrls = photoUrls.filter((_, i) => i !== index);
    onPhotosChange(newUrls);
  };

  const handleReorder = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(photoUrls);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onPhotosChange(items);
  };

  const canAddMore = photoUrls.length < maxPhotos;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Photos ({photoUrls.length}/{maxPhotos})
        </label>
        {photoUrls.length > 1 && (
          <span className="text-xs text-muted-foreground">
            Drag to reorder • First image is cover
          </span>
        )}
      </div>

      {/* Photo Grid with Drag and Drop */}
      {photoUrls.length > 0 && (
        <DragDropContext onDragEnd={handleReorder}>
          <Droppable droppableId="photos" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
                style={{ scrollbarWidth: 'thin' }}
              >
                {photoUrls.map((url, index) => (
                  <Draggable
                    key={url}
                    draggableId={url}
                    index={index}
                    isDragDisabled={disabled}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "relative group w-24 h-32 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0",
                          index === 0 ? "border-primary" : "border-border",
                          snapshot.isDragging && "shadow-lg ring-2 ring-primary"
                        )}
                      >
                        <img
                          src={url}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Cover badge */}
                        {index === 0 && (
                          <div className="absolute top-0.5 left-0.5 bg-primary text-primary-foreground text-[10px] px-1 rounded">
                            Cover
                          </div>
                        )}

                        {/* Drag handle */}
                        <div
                          {...provided.dragHandleProps}
                          className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors cursor-grab"
                        >
                          <GripVertical className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        {/* Remove button */}
                        {!disabled && (
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute top-0.5 right-0.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}

                {/* Add more button */}
                {canAddMore && !disabled && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className={cn(
                      "w-24 h-32 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 transition-colors flex-shrink-0",
                      isUploading
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-primary hover:bg-muted/50 cursor-pointer"
                    )}
                  >
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Plus className="w-5 h-5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">Add</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Upload area when no photos */}
      {photoUrls.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-all",
            disabled
              ? "opacity-50 cursor-not-allowed border-border"
              : isDragging
              ? "border-primary bg-primary/5 cursor-pointer"
              : "border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Uploading {uploadingCount} photo{uploadingCount > 1 ? "s" : ""}...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Drop photos here or click to upload
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Up to {maxPhotos} photos • JPEG, PNG, WebP • Max 20MB each
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
        multiple
        disabled={disabled}
      />
    </div>
  );
}
