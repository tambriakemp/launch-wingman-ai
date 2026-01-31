import { ArrowRight, Pencil, LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CategoryCardProps {
  name: string;
  icon: LucideIcon;
  iconColor: string;
  onClick: () => void;
  showEditButton?: boolean;
  onEditClick?: () => void;
}

export const CategoryCard = ({ 
  name, 
  icon: Icon,
  iconColor,
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
      className="group cursor-pointer border border-border hover:border-primary/30 transition-all duration-200 p-4 relative"
      onClick={onClick}
    >
      {/* Edit Button for Admin/Manager */}
      {showEditButton && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 z-10 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleEditClick}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      )}

      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg bg-muted`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <span className="font-semibold text-foreground">{name}</span>
      </div>
      
      <div className="text-sm text-muted-foreground flex items-center gap-1 pl-12 group-hover:text-primary transition-colors">
        View Resources <ArrowRight className="w-4 h-4" />
      </div>
    </Card>
  );
};
