import { FileText, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trackResourceAccess } from "./trackResourceAccess";

interface PopularResourceItemProps {
  id: string;
  title: string;
  categoryName: string;
  resourceType: string;
  resourceUrl: string;
}

const getResourceTypeBadge = (type: string) => {
  switch (type) {
    case 'canva_link':
      return { label: 'Canva', variant: 'secondary' as const };
    case 'document':
      return { label: 'PDF', variant: 'outline' as const };
    case 'google_doc':
      return { label: 'Google Doc', variant: 'secondary' as const };
    case 'video':
      return { label: 'Video', variant: 'secondary' as const };
    default:
      return { label: 'Link', variant: 'outline' as const };
  }
};

export const PopularResourceItem = ({ 
  id,
  title, 
  categoryName, 
  resourceType, 
  resourceUrl,
}: PopularResourceItemProps) => {
  const badge = getResourceTypeBadge(resourceType);
  
  const handleClick = () => {
    // Track access for popularity
    trackResourceAccess(id);
    window.open(resourceUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className="flex items-center justify-between py-3 group cursor-pointer hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors"
      onClick={handleClick}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="p-2 rounded-lg bg-muted shrink-0">
          <FileText className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate">{title}</p>
          <p className="text-sm text-muted-foreground">{categoryName}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={badge.variant} className="text-xs">
          {badge.label}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={(e) => { e.stopPropagation(); handleClick(); }}
        >
          {resourceType === 'document' ? (
            <Download className="h-4 w-4" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
