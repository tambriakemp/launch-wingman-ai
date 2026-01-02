import { ExternalLink, Download, Image as ImageIcon, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ResourceCardProps {
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  resourceUrl: string;
  resourceType: string;
  tags: string[];
  onClick: () => void;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ResourceCard = ({ 
  title, 
  description, 
  coverImageUrl, 
  resourceUrl,
  resourceType, 
  tags,
  onClick,
  isAdmin = false,
  onEdit,
  onDelete,
}: ResourceCardProps) => {
  const isCanvaLink = resourceType === 'canva_link';
  
  // Use resource URL as cover image for images/videos if no cover image specified
  const isMediaResource = /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mov)$/i.test(resourceUrl);
  const displayImageUrl = coverImageUrl || (isMediaResource ? resourceUrl : null);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <Card 
      className="group cursor-pointer overflow-hidden border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
      onClick={onClick}
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
        
        {/* Resource Type Badge */}
        <div className="absolute top-3 right-3">
          <Badge 
            variant="secondary" 
            className="bg-background/90 backdrop-blur-sm text-xs font-medium"
          >
            {isCanvaLink ? (
              <>
                <ExternalLink className="w-3 h-3 mr-1" />
                Canva
              </>
            ) : (
              <>
                <Download className="w-3 h-3 mr-1" />
                Download
              </>
            )}
          </Badge>
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <div className="absolute top-3 left-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              size="icon"
              variant="secondary"
              className="h-7 w-7 bg-background/90 backdrop-blur-sm hover:bg-background"
              onClick={handleEdit}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-7 w-7 bg-background/90 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleDelete}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
            {isCanvaLink ? "Open in Canva" : "Download"}
          </Button>
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
