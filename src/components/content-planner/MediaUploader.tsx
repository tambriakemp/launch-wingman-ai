import { useState, useRef, useCallback } from "react";
import { Upload, X, Image, Film, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MediaUploaderProps {
  mediaUrl: string | null;
  mediaType: string | null;
  onMediaChange: (url: string | null, type: string | null) => void;
  projectId: string;
}

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function MediaUploader({
  mediaUrl,
  mediaType,
  onMediaChange,
  projectId,
}: MediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
    const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return "Please upload an image (JPEG, PNG, GIF, WebP) or video (MP4, MOV, WebM)";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 50MB";
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${projectId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("content-media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("content-media")
        .getPublicUrl(fileName);

      const type = ACCEPTED_IMAGE_TYPES.includes(file.type) ? "image" : "video";
      onMediaChange(publicUrl, type);
      toast.success("Media uploaded successfully");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload media");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        uploadFile(file);
      }
    },
    [projectId]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const removeMedia = async () => {
    if (mediaUrl) {
      // Extract file path from URL for deletion
      try {
        const urlParts = mediaUrl.split("/content-media/");
        if (urlParts[1]) {
          await supabase.storage.from("content-media").remove([urlParts[1]]);
        }
      } catch (err) {
        console.error("Failed to delete file:", err);
      }
    }
    onMediaChange(null, null);
  };

  if (mediaUrl) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/50">
        {/* Compact thumbnail */}
        <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted shrink-0">
          {mediaType === "video" ? (
            <video
              src={mediaUrl}
              className="w-full h-full object-cover"
              muted
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Uploaded media"
              className="w-full h-full object-cover"
            />
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {mediaType === "video" ? (
              <Film className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Image className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">
              {mediaType === "video" ? "Video" : "Image"} uploaded
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            View in preview section below
          </p>
        </div>
        
        {/* Remove button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          onClick={removeMedia}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/50"
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={[...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES].join(",")}
        onChange={handleFileSelect}
        className="hidden"
      />

      {isUploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Uploading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Upload className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">
              Drop image or video here
            </p>
            <p className="text-xs text-muted-foreground">
              or click to upload (max 50MB)
            </p>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Image className="w-3 h-3" />
              JPG, PNG, GIF, WebP
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Film className="w-3 h-3" />
              MP4, MOV, WebM
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
