import { useState, useEffect, useCallback } from "react";
import { ExternalLink, Download, Image as ImageIcon, Loader2, Check, Pencil, Eye, FileText, AlertTriangle, Copy, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackResourceAccess } from "./trackResourceAccess";

interface ResourceCardProps {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  coverImageFit?: string;
  resourceUrl: string;
  previewUrl?: string | null;
  resourceType: string;
  tags: string[];
  onClick: () => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (selected: boolean) => void;
  isAdmin?: boolean;
  onEdit?: () => void;
}

// Document type badge colors
const DOCUMENT_BADGE_COLORS: Record<string, string> = {
  'pdf': 'bg-red-500 hover:bg-red-600',
  'docx': 'bg-blue-500 hover:bg-blue-600',
  'doc': 'bg-blue-500 hover:bg-blue-600',
  'rtf': 'bg-green-500 hover:bg-green-600',
};

const getDocumentType = (url: string): string | null => {
  const match = url.match(/\.(pdf|docx|doc|rtf)$/i);
  return match ? match[1].toLowerCase() : null;
};

// Check if a non-PDF document is missing its preview
const isMissingPreview = (resourceUrl: string, previewUrl: string | null | undefined): boolean => {
  const docType = getDocumentType(resourceUrl);
  // Only non-PDF documents need a preview_url
  if (!docType || docType === 'pdf') return false;
  return !previewUrl;
};

export const ResourceCard = ({ 
  id,
  title, 
  description, 
  coverImageUrl,
  coverImageFit = 'cover',
  resourceUrl,
  previewUrl,
  resourceType, 
  tags,
  onClick,
  isSelectable = false,
  isSelected = false,
  onSelectionChange,
  isAdmin = false,
  onEdit,
}: ResourceCardProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const isCanvaLink = resourceType === 'canva_link';
  const isAiPrompt = resourceType === 'image_prompt' || resourceType === 'video_prompt';
  const isDocument = resourceType === 'document' || /\.(pdf|docx|doc|rtf)$/i.test(resourceUrl);
  const docType = getDocumentType(resourceUrl);
  const hasMissingPreview = isMissingPreview(resourceUrl, previewUrl);
  
  // Use resource URL as cover image for images/videos if no cover image specified
  const isMediaResource = /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mov)$/i.test(resourceUrl);
  const displayImageUrl = coverImageUrl || (isMediaResource ? resourceUrl : null);

  useEffect(() => {
    setImageLoaded(false);
  }, [displayImageUrl]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isDownloading) return;
    
    setIsDownloading(true);
    toast.info("Starting download...");
    
    try {
      const { data, error } = await supabase.functions.invoke('vault-download', {
        body: { url: resourceUrl }
      });

      if (error) throw error;

      // Handle the blob response - data may already be a Blob or need wrapping
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/octet-stream' });
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      
      // Extract filename from URL
      const urlParts = resourceUrl.split('/');
      const filename = decodeURIComponent(urlParts[urlParts.length - 1] || title || "download");
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

  const handleCardClick = () => {
    if (showImagePreview) return;
    if (isAiPrompt) {
      onClick();
    } else if (isCanvaLink) {
      trackResourceAccess(id);
      window.open(resourceUrl, '_blank');
    } else {
      onClick();
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card 
      className={`group cursor-pointer overflow-hidden border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg ${isSelected ? 'ring-2 ring-primary border-primary' : ''}`}
      onClick={handleCardClick}
    >
      {/* Cover Image */}
      <div className="aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800/50 dark:to-slate-900/50 relative overflow-hidden">
        {displayImageUrl ? (
          <div className="relative w-full h-full">
            {!imageLoaded && (
              <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
            )}
            <img 
              src={displayImageUrl} 
              alt={title}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full group-hover:scale-105 transition-all duration-500 ${
                coverImageFit === 'contain' ? 'object-contain bg-muted/50' : 'object-cover'
              } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          </div>
        ) : isDocument ? (
          // Document placeholder
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
            <FileText className="w-16 h-16 text-slate-400 mb-2" />
            {docType && (
              <Badge className={`${DOCUMENT_BADGE_COLORS[docType] || 'bg-slate-500'} text-white text-xs font-bold`}>
                {docType.toUpperCase()}
              </Badge>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Selection Checkbox for Admin */}
        {isSelectable && (
          <div 
            className="absolute top-3 left-3 z-10"
            onClick={handleCheckboxClick}
          >
            <div 
              className={`h-6 w-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${
                isSelected 
                  ? 'bg-primary border-primary' 
                  : 'bg-background/90 border-border hover:border-primary/50'
              }`}
              onClick={() => onSelectionChange?.(!isSelected)}
            >
              {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
            </div>
          </div>
        )}

        {/* Resource Type Badge - For Canva links */}
        {isCanvaLink && (
          <div className="absolute top-3 right-3">
            <Badge 
              className="bg-[#7B2FF2] hover:bg-[#6B24D9] text-white text-xs font-semibold shadow-lg border-0 px-2.5 py-1"
            >
              <ExternalLink className="w-3 h-3 mr-1.5" />
              Canva
            </Badge>
          </div>
        )}

        {/* Document Type Badge - For documents with cover images */}
        {isDocument && docType && displayImageUrl && (
          <div className="absolute top-3 right-3">
            <Badge 
              className={`${DOCUMENT_BADGE_COLORS[docType] || 'bg-slate-500'} text-white text-xs font-bold shadow-lg border-0`}
            >
              {docType.toUpperCase()}
            </Badge>
          </div>
        )}

        {/* Prompt Type Badge */}
        {isAiPrompt && (
          <div className="absolute top-3 right-3">
            <Badge 
              className={`${resourceType === 'video_prompt' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white text-xs font-semibold shadow-lg border-0 px-2.5 py-1`}
            >
              {resourceType === 'video_prompt' ? 'Video' : 'Image'}
            </Badge>
          </div>
        )}

        {/* Missing Preview Warning - Admin only */}
        {isAdmin && hasMissingPreview && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute top-3 left-3 z-10">
                  <div className="h-7 w-7 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
                    <AlertTriangle className="w-4 h-4 text-white" />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Missing PDF preview - needs reprocessing</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Admin Edit Button - Always visible */}
        {isAdmin && onEdit && (
          <Button 
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="absolute bottom-3 left-3 h-10 w-10 rounded-full bg-black/70 text-white hover:bg-black/90 shadow-lg backdrop-blur-sm border border-white/20"
          >
            <Pencil className="w-5 h-5" />
          </Button>
        )}

        {/* Preview Button for Canva resources with preview URL - Always visible */}
        {isCanvaLink && previewUrl && (
          <Button 
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              window.open(previewUrl, '_blank');
            }}
            className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-black/70 text-white hover:bg-black/90 shadow-lg backdrop-blur-sm border border-white/20"
          >
            <Eye className="w-5 h-5" />
          </Button>
        )}

        {/* Image Preview Button for AI Prompts with cover image */}
        {isAiPrompt && displayImageUrl && (
          <Button 
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setShowImagePreview(true);
            }}
            className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-black/70 text-white hover:bg-black/90 shadow-lg backdrop-blur-sm border border-white/20"
          >
            <Eye className="w-5 h-5" />
          </Button>
        )}

        {/* Persistent Download Button - Always visible on mobile, hover on desktop */}
        {!isCanvaLink && !isAiPrompt && (
          <Button 
            size="icon"
            onClick={handleDownload}
            disabled={isDownloading}
            className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-black/70 text-white hover:bg-black/90 shadow-lg backdrop-blur-sm border border-white/20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300"
          >
            {isDownloading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
          </Button>
        )}

        {/* Hover Overlay for desktop */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
          <span className="text-white text-sm font-medium">
            {isAiPrompt ? "View prompt" : isCanvaLink ? "Open in Canva" : isDocument ? "Preview document" : "Click to preview"}
          </span>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{title}</h3>
          {isAiPrompt && description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(description);
                      toast.success("Prompt copied!");
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p className="text-xs">Copy prompt</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{description}</p>
        )}
        
        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag) => (
              <Badge 
                key={tag} 
                variant="outline" 
                className="text-xs font-normal text-muted-foreground"
              >
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge 
                variant="outline" 
                className="text-xs font-normal text-muted-foreground"
              >
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      {/* Image Preview Modal for AI Prompts */}
      {showImagePreview && displayImageUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md cursor-zoom-out"
          onClick={() => setShowImagePreview(false)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-muted-foreground z-[110]"
            onClick={() => setShowImagePreview(false)}
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={displayImageUrl}
            alt={title}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </Card>
  );
};
