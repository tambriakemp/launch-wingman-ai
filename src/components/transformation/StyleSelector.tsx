import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { MessageSquare, FileText, Heart, Crown } from "lucide-react";

export type TransformationStyle = 'short' | 'practical' | 'aspirational' | 'authority';

interface StyleSelectorProps {
  selectedStyle: TransformationStyle;
  onChange: (style: TransformationStyle) => void;
  disabled?: boolean;
}

const STYLES = [
  {
    id: 'short' as const,
    name: 'Short & Punchy',
    description: 'Social bios',
    icon: MessageSquare,
  },
  {
    id: 'practical' as const,
    name: 'Clear & Practical',
    description: 'Sales pages',
    icon: FileText,
  },
  {
    id: 'aspirational' as const,
    name: 'Aspirational',
    description: 'Branding',
    icon: Heart,
  },
  {
    id: 'authority' as const,
    name: 'Authority',
    description: 'Premium offers',
    icon: Crown,
  },
];

export const StyleSelector = ({ selectedStyle, onChange, disabled }: StyleSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Choose Style</Label>
      <div className="grid grid-cols-2 gap-2">
        {STYLES.map((style) => {
          const Icon = style.icon;
          const isSelected = selectedStyle === style.id;
          
          return (
            <button
              key={style.id}
              onClick={() => !disabled && onChange(style.id)}
              disabled={disabled}
              className={cn(
                "relative p-3 rounded-lg border-2 text-left transition-all",
                "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-xs">{style.name}</span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {style.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};