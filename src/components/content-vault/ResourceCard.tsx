import { useState } from "react";
import { ExternalLink, Download, Image as ImageIcon, Loader2, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ResourceCardProps {
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  resourceUrl: string;
  resourceType: string;
  tags: string[];
  onClick: () => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (selected: boolean) => void;
}

export const ResourceCard = ({ 
  title, 
  description, 
  coverImageUrl, 
  resourceUrl,
  resourceType, 
  tags,
  onClick,
  isSelectable = false,
  isSelected = false,
  onSelectionChange,
}: ResourceCardProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const isCanvaLink = resourceType === 'canva_link';
  
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
    if (isCanvaLink) {
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

        {/* Resource Type Badge - Only show for Canva links */}
        {isCanvaLink && (
          <div className="absolute top-3 right-3">
            <Badge 
              variant="secondary" 
              className="bg-background/90 backdrop-blur-sm text-xs font-medium"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Canva
            </Badge>
          </div>
        )}

        {/* Persistent Download Button - Always visible on mobile, hover on desktop */}
        {!isCanvaLink && (
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
            {isCanvaLink ? "Open in Canva" : "Click to preview"}
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
