import { cn } from "@/lib/utils";
import type { ContentType } from "./ContentTab";

interface ContentTypeFilterProps {
  selected: ContentType;
  onChange: (type: ContentType) => void;
}

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "general", label: "General posts" },
  { value: "stories", label: "Stories / prompts" },
  { value: "offer", label: "Offer explanation" },
  { value: "behind-the-scenes", label: "Behind-the-scenes" },
];

export const ContentTypeFilter = ({
  selected,
  onChange,
}: ContentTypeFilterProps) => {
  return (
    <div className="flex flex-wrap gap-1.5">
      {CONTENT_TYPES.map((type) => (
        <button
          key={type.value}
          onClick={() => onChange(type.value)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
            selected === type.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          )}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
};
