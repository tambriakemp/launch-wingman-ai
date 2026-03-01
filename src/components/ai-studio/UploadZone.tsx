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
        <div className="border-2 border-dashed border-muted rounded-xl p-6 text-center bg-muted/20">
          <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-sm">Upload Disabled</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 cursor-pointer ${
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
          <div className="relative">
            <img
              src={preview}
              alt="Uploaded Reference"
              className="max-h-48 mx-auto rounded-lg shadow-lg object-cover"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="absolute -top-2 -right-2 bg-destructive hover:bg-destructive/80 text-destructive-foreground rounded-full p-1"
              disabled={isProcessing}
            >
              <X className="h-4 w-4" />
            </button>
            <p className="mt-3 text-sm text-muted-foreground font-medium">{title}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-3 bg-muted rounded-full">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div className="text-foreground text-sm">
              <span className="font-semibold text-primary">Click to upload</span> or drag and drop
            </div>
            <p className="text-xs text-muted-foreground">{subtext}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadZone;
