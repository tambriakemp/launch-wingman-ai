import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  resource_url: string;
  resource_type: string;
}

interface ResourceLightboxProps {
  resources: Resource[];
  currentIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ResourceLightbox = ({
  resources,
  currentIndex,
  open,
  onOpenChange,
}: ResourceLightboxProps) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  
  const currentResource = resources[activeIndex];
  
  // Reset active index when opening with a new resource
  useEffect(() => {
    if (open) {
      setActiveIndex(currentIndex);
    }
  }, [open, currentIndex]);

  const goToPrevious = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : resources.length - 1));
  }, [resources.length]);

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev < resources.length - 1 ? prev + 1 : 0));
  }, [resources.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, goToPrevious, goToNext]);

  const handleDownload = async () => {
    if (!currentResource) return;
    
    try {
      const response = await fetch(currentResource.resource_url, { mode: 'cors' });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Extract file extension from URL
      const urlParts = currentResource.resource_url.split('/');
      const filename = urlParts[urlParts.length - 1] || currentResource.title || "download";
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback: create a download link with the original URL
      const a = document.createElement("a");
      a.href = currentResource.resource_url;
      const urlParts = currentResource.resource_url.split('/');
      a.download = urlParts[urlParts.length - 1] || currentResource.title || "download";
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  };

  const isVideo = (url: string) => {
    return /\.(mp4|webm|mov|avi)$/i.test(url);
  };

  if (!currentResource) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-none overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex-1">
            <h2 className="text-white font-medium truncate max-w-md">
              {currentResource.title}
            </h2>
            <p className="text-white/60 text-sm">
              {activeIndex + 1} of {resources.length}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={handleDownload}
            >
              <Download className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="w-full h-full flex items-center justify-center p-12">
          {isVideo(currentResource.resource_url) ? (
            <video
              src={currentResource.resource_url}
              controls
              className="max-w-full max-h-full object-contain"
            />
          ) : isImage(currentResource.resource_url) ? (
            <img
              src={currentResource.resource_url}
              alt={currentResource.title}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="text-white text-center">
              <p className="mb-4">Preview not available for this file type</p>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
            </div>
          )}
        </div>

        {/* Navigation Arrows */}
        {resources.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 text-white hover:bg-black/60"
              onClick={goToPrevious}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 text-white hover:bg-black/60"
              onClick={goToNext}
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
