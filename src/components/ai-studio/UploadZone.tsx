import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';

interface UploadZoneProps {
  onImageSelected: (base64: string) => void;
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        const base64Data = result.split(',')[1];
        onImageSelected(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        const base64Data = result.split(',')[1];
        onImageSelected(base64Data);
      };
      reader.readAsDataURL(file);
    }
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
        onDrop={handleDrop}
        onClick={() => !preview && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isProcessing}
        />

        {preview ? (
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
              <p className="text-[10px] text-muted-foreground">{subtext}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadZone;
