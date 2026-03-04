import { useState } from "react";
import { Copy, Check, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  tags: string[];
}

export const PromptModal = ({
  open,
  onOpenChange,
  title,
  description,
  coverImageUrl,
  tags,
}: PromptModalProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!description) return;
    try {
      await navigator.clipboard.writeText(description);
      setCopied(true);
      toast.success("Prompt copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy prompt");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {/* Cover Image */}
        {coverImageUrl ? (
          <div className="aspect-[4/3] w-full overflow-hidden rounded-t-lg">
            <img
              src={coverImageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-[4/3] w-full bg-muted flex items-center justify-center rounded-t-lg">
            <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
          </div>
        )}

        <div className="p-6 pt-2">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl">{title}</DialogTitle>
            <DialogDescription className="sr-only">AI prompt details</DialogDescription>
          </DialogHeader>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Prompt Text */}
          {description && (
            <div className="bg-muted rounded-lg p-4 mb-4">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {description}
              </p>
            </div>
          )}

          {/* Copy Button */}
          <Button onClick={handleCopy} className="w-full" disabled={!description}>
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Prompt
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
