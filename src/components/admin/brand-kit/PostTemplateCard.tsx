import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostTemplateCardProps {
  id: string;
  name: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}

export const PostTemplateCard = ({
  id,
  name,
  description,
  isSelected,
  onClick
}: PostTemplateCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-lg border transition-all",
        "hover:border-primary/50 hover:bg-accent/50",
        isSelected 
          ? "border-primary bg-primary/10 ring-1 ring-primary" 
          : "border-border"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">{name}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {isSelected && (
          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <Check className="h-3 w-3 text-primary-foreground" />
          </div>
        )}
      </div>
    </button>
  );
};