import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, X, Loader2, FileText, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { PdfViewer } from "./PdfViewer";

interface Resource {
  id: string;
  title: string;
  resource_url: string;
  resource_type: string;
  preview_url?: string | null;
}

interface ResourceLightboxProps {
  resources: Resource[];
  currentIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Document type colors
const DOCUMENT_COLORS: Record<string, { bg: string; text: string }> = {
  'pdf': { bg: 'bg-red-500', text: 'PDF' },
  'docx': { bg: 'bg-blue-500', text: 'DOCX' },
  'doc': { bg: 'bg-blue-500', text: 'DOC' },
  'rtf': { bg: 'bg-green-500', text: 'RTF' },
};

export const ResourceLightbox = ({
  resources,
  currentIndex,
  open,
  onOpenChange,
}: ResourceLightboxProps) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [isDownloading, setIsDownloading] = useState(false);
  
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
    if (!currentResource || isDownloading) return;
    
    setIsDownloading(true);
    toast.info("Starting download...");
    
    try {
      const { data, error } = await supabase.functions.invoke('vault-download', {
        body: { url: currentResource.resource_url }
      });

      if (error) throw error;

      // Handle the blob response - data may already be a Blob or need wrapping
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/octet-stream' });
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      
      // Extract filename from URL
      const urlParts = currentResource.resource_url.split('/');
      const filename = decodeURIComponent(urlParts[urlParts.length - 1] || currentResource.title || "download");
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      
      toast.success("Download started!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  };

  const isVideo = (url: string) => {
    return /\.(mp4|webm|mov|avi)$/i.test(url);
  };

  const isDocument = (url: string) => {
    return /\.(pdf|docx|doc|rtf)$/i.test(url);
  };

  const isPdf = (url: string) => {
    return /\.pdf$/i.test(url);
  };

  const getDocumentType = (url: string): string => {
    const match = url.match(/\.(pdf|docx|doc|rtf)$/i);
    return match ? match[1].toLowerCase() : 'pdf';
  };

  // Check if resource has a PDF preview available (either native PDF or converted)
  const hasPdfPreview = (resource: Resource): boolean => {
    return isPdf(resource.resource_url) || !!resource.preview_url;
  };

  // Get the URL to use for PDF preview
  const getPreviewUrl = (resource: Resource): string => {
    if (resource.preview_url) return resource.preview_url;
    return resource.resource_url;
  };

  if (!currentResource) return null;

  const docType = getDocumentType(currentResource.resource_url);
  const docColors = DOCUMENT_COLORS[docType] || DOCUMENT_COLORS['pdf'];
  const canPreviewAsPdf = hasPdfPreview(currentResource);

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
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
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
          ) : canPreviewAsPdf ? (
            // Use PDF.js viewer for PDFs and documents with PDF preview
            <div className="w-full h-full max-w-5xl">
              <PdfViewer 
                url={getPreviewUrl(currentResource)} 
                title={currentResource.title}
              />
            </div>
          ) : isDocument(currentResource.resource_url) ? (
            // Document preview card for non-PDF documents without preview
            <div className="bg-white rounded-xl p-8 max-w-md text-center shadow-2xl">
              <div className="w-20 h-20 mx-auto mb-4 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <FileText className="w-10 h-10 text-slate-500" />
              </div>
              <Badge className={`${docColors.bg} text-white mb-4`}>
                {docColors.text}
              </Badge>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {currentResource.title}
              </h3>
              <p className="text-slate-500 mb-6">
                This document was uploaded before PDF preview was available.
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleDownload} disabled={isDownloading}>
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(currentResource.resource_url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in Browser
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-white text-center">
              <p className="mb-4">Preview not available for this file type</p>
              <Button onClick={handleDownload} disabled={isDownloading}>
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
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
