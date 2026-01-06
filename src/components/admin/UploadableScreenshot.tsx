import { useState, useRef, useEffect } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface UploadableScreenshotProps {
  screenshotKey: string;
  alt: string;
  className?: string;
}

const BUCKET_NAME = "admin-docs";

export function UploadableScreenshot({
  screenshotKey,
  alt,
  className,
}: UploadableScreenshotProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing screenshot on mount
  useEffect(() => {
    const loadExistingImage = async () => {
      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(`screenshots/${screenshotKey}.png`);
      
      // Check if the image actually exists by trying to fetch it
      try {
        const response = await fetch(data.publicUrl, { method: "HEAD" });
        if (response.ok) {
          setImageUrl(data.publicUrl);
        }
      } catch {
        // Image doesn't exist yet
      }
    };

    loadExistingImage();
  }, [screenshotKey]);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      const filePath = `screenshots/${screenshotKey}.png`;

      // Delete existing file if it exists
      await supabase.storage.from(BUCKET_NAME).remove([filePath]);

      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      // Add timestamp to bust cache
      setImageUrl(`${data.publicUrl}?t=${Date.now()}`);
      toast.success("Screenshot uploaded");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload screenshot");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      const filePath = `screenshots/${screenshotKey}.png`;
      await supabase.storage.from(BUCKET_NAME).remove([filePath]);
      setImageUrl(null);
      toast.success("Screenshot removed");
    } catch (err) {
      console.error("Remove error:", err);
      toast.error("Failed to remove screenshot");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleUpload(file);
    }
  };

  if (imageUrl) {
    return (
      <div
        className={cn("relative group rounded-lg overflow-hidden border border-border", className)}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-auto object-cover"
        />
        {isHovering && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-1" />
              Replace
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRemove}
            >
              <X className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsHovering(true);
      }}
      onDragLeave={() => setIsHovering(false)}
      onClick={() => fileInputRef.current?.click()}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
        isHovering
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
        className
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
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
            <ImageIcon className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">{alt}</p>
            <p className="text-xs text-muted-foreground">
              Click or drag to upload screenshot
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
