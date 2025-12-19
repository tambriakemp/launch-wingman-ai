import { Label } from "@/components/ui/label";
import { PillSelector, PillOption } from "@/components/ui/pill-selector";
import { MessageSquare, FileText, Heart, Crown } from "lucide-react";

export type TransformationStyle = 'short' | 'practical' | 'aspirational' | 'authority';

interface StyleSelectorProps {
  selectedStyle: TransformationStyle;
  onChange: (style: TransformationStyle) => void;
  disabled?: boolean;
}

const STYLE_OPTIONS: PillOption[] = [
  { id: 'short', label: 'Short & Punchy', icon: MessageSquare },
  { id: 'practical', label: 'Clear & Practical', icon: FileText },
  { id: 'aspirational', label: 'Aspirational', icon: Heart },
  { id: 'authority', label: 'Authority', icon: Crown },
];

export const StyleSelector = ({ selectedStyle, onChange, disabled }: StyleSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Choose Style</Label>
      <PillSelector
        options={STYLE_OPTIONS}
        selected={selectedStyle}
        onChange={(value) => onChange(value as TransformationStyle)}
        disabled={disabled}
      />
    </div>
  );
};
