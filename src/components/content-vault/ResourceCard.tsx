import { useState } from "react";
import { ExternalLink, Download, Image as ImageIcon, Loader2, Check, Pencil, Eye, FileText, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackResourceAccess } from "./trackResourceAccess";

interface ResourceCardProps {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
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
  const isCanvaLink = resourceType === 'canva_link';
  const isAiPrompt = resourceType === 'ai_prompt';
  const isDocument = resourceType === 'document' || /\.(pdf|docx|doc|rtf)$/i.test(resourceUrl);
  const docType = getDocumentType(resourceUrl);
  const hasMissingPreview = isMissingPreview(resourceUrl, previewUrl);
  
  // Use resource URL as cover image for images/videos if no cover image specified
  const isMediaResource = /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mov)$/i.test(resourceUrl);
  const displayImageUrl = coverImageUrl || (isMediaResource ? resourceUrl : null);

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
    if (isAiPrompt) {
      onClick();
    } else if (isCanvaLink) {
      // Track Canva link access for popularity
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
      <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800/50 dark:to-slate-900/50 relative overflow-hidden">
        {displayImageUrl ? (
          <img 
            src={displayImageUrl} 
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
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
        <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{title}</h3>
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
    </Card>
  );
};
