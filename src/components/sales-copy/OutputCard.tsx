import { useState } from "react";
import { Copy, Check, Star, ThumbsUp, ThumbsDown, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface OutputCardProps {
  content: string;
  onSelect: () => void;
  onEdit: (newContent: string) => void;
  isSelected?: boolean;
  isRecommended?: boolean;
  timestamp?: string;
}

export const OutputCard = ({
  content,
  onSelect,
  onEdit,
  isSelected = false,
  isRecommended = false,
  timestamp,
}: OutputCardProps) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    onEdit(editContent);
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        "group relative p-4 border rounded-lg transition-all hover:border-primary/50 cursor-pointer",
        isSelected && "border-primary bg-primary/5 ring-1 ring-primary/20"
      )}
      onClick={() => !isEditing && onSelect()}
    >
      {/* Top action bar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-6 w-6", isSelected && "text-primary")}
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            <Star className={cn("h-3.5 w-3.5", isSelected && "fill-primary")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
              setEditContent(content);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isRecommended && (
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
              Recommended
            </span>
          )}
          {timestamp && <span>{timestamp}</span>}
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            className="text-sm"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveEdit}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-relaxed">{content}</p>
      )}

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
    </div>
  );
};
