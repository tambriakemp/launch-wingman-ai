import { Card, CardContent } from "@/components/ui/card";
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
    description: 'Perfect for social bios and hooks',
    example: '"I help busy pros get focused in 21 days."',
    icon: MessageSquare,
  },
  {
    id: 'practical' as const,
    name: 'Clear & Practical',
    description: 'Ideal for sales pages and landing pages',
    example: '"I help... overcome... so they can achieve..."',
    icon: FileText,
  },
  {
    id: 'aspirational' as const,
    name: 'Aspirational & Emotional',
    description: 'Great for branding and about sections',
    example: '"Transform from... to become..."',
    icon: Heart,
  },
  {
    id: 'authority' as const,
    name: 'Authority-Driven',
    description: 'Best for premium and high-ticket offers',
    example: '"The proven system for elite..."',
    icon: Crown,
  },
];

export const StyleSelector = ({ selectedStyle, onChange, disabled }: StyleSelectorProps) => {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Choose Your Style</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {STYLES.map((style) => {
          const Icon = style.icon;
          const isSelected = selectedStyle === style.id;
          
          return (
            <button
              key={style.id}
              onClick={() => !disabled && onChange(style.id)}
              disabled={disabled}
              className={cn(
                "relative p-4 rounded-lg border-2 text-left transition-all",
                "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{style.name}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {style.description}
                  </p>
                  <p className="text-xs italic text-muted-foreground/70 mt-1.5 truncate">
                    {style.example}
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
