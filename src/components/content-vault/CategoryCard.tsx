import { ArrowRight, Image as ImageIcon, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CategoryCardProps {
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  resourceCount?: number;
  onClick: () => void;
  showEditButton?: boolean;
  onEditClick?: () => void;
}

export const CategoryCard = ({ 
  name, 
  description, 
  coverImageUrl,
  resourceCount,
  onClick,
  showEditButton,
  onEditClick,
}: CategoryCardProps) => {
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditClick?.();
  };

  return (
    <Card 
      className="group cursor-pointer overflow-hidden border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg relative"
      onClick={onClick}
    >
      {/* Edit Button for Admin/Manager */}
      {showEditButton && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 z-10 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleEditClick}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}

      {/* Cover Image */}
      <div className="aspect-[4/3] bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 relative overflow-hidden">
        {coverImageUrl ? (
          <img 
            src={coverImageUrl} 
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-16 h-16 text-amber-300 dark:text-amber-700" />
          </div>
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-lg text-foreground">{name}</h3>
          {typeof resourceCount === 'number' && (
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {resourceCount}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {description || "Resource Library"}
        </p>
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-0 h-auto text-primary hover:text-primary/80 group-hover:translate-x-1 transition-transform"
        >
          View Resources <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
};
