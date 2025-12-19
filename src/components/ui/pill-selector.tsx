import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface PillOption {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface PillSelectorProps {
  options: PillOption[];
  selected: string | string[];
  onChange: (value: string | string[]) => void;
  multiSelect?: boolean;
  disabled?: boolean;
  className?: string;
}

export function PillSelector({
  options,
  selected,
  onChange,
  multiSelect = false,
  disabled = false,
  className,
}: PillSelectorProps) {
  const isSelected = (id: string) => {
    if (multiSelect) {
      return Array.isArray(selected) && selected.includes(id);
    }
    return selected === id;
  };

  const handleClick = (id: string) => {
    if (disabled) return;

    if (multiSelect) {
      const currentSelected = Array.isArray(selected) ? selected : [];
      if (currentSelected.includes(id)) {
        onChange(currentSelected.filter((item) => item !== id));
      } else {
        onChange([...currentSelected, id]);
      }
    } else {
      onChange(id);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const Icon = option.icon;
        const active = isSelected(option.id);

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => handleClick(option.id)}
            disabled={disabled}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              active
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
