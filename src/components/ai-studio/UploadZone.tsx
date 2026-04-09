import React, { useRef, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { uploadFileToStorage } from './uploadToStorage';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UploadZoneProps {
  onImageSelected: (urlOrBase64: string) => void;
  isProcessing: boolean;
  disabled?: boolean;
  title?: string;
  subtext?: string;
}

const UploadZone: React.FC<UploadZoneProps> = ({
  onImageSelected,
  isProcessing,
  disabled,
  title = "Reference Avatar",
  subtext = "JPG, PNG (max 10MB). Upload your avatar/selfie."
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (disabled || uploading) return;
    setUploading(true);
    try {
      // Show local preview immediately
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // Upload to storage and return URL (no base64 in memory)
      const { data: { user } } = await supabase.auth.getUser();
      const folder = `temp/${user?.id ?? 'anon'}`;
      const url = await uploadFileToStorage(file, folder);
      onImageSelected(url);
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  if (disabled) {
    return (
      <div className="w-full opacity-40 grayscale select-none cursor-not-allowed">
        <div className="border-2 border-dashed border-muted rounded-lg p-3 text-center bg-muted/20">
          <Upload className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-muted-foreground text-xs">Upload Disabled</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-lg p-3 text-center transition-all duration-200 cursor-pointer ${
          preview ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-muted/20'
        }`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDrop={handleDrop}
        onClick={() => !preview && !uploading && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isProcessing || uploading}
        />

        {uploading ? (
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Uploading...</p>
          </div>
        ) : preview ? (
          <div className="relative flex items-center gap-3">
            <img
              src={preview}
              alt="Uploaded Reference"
              className="h-14 w-14 rounded-lg shadow object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-medium text-foreground truncate">{title}</p>
              <p className="text-[10px] text-muted-foreground">Uploaded</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="absolute -top-1 -right-1 bg-destructive hover:bg-destructive/80 text-destructive-foreground rounded-full p-0.5"
              disabled={isProcessing}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg flex-shrink-0">
              <Upload className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs text-foreground">
                <span className="font-semibold text-primary">Click to upload</span> or drag & drop
              </p>
              <p className="text-xs text-muted-foreground">{subtext}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadZone;
