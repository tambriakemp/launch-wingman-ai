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
  coverImageFit?: string;
  tags: string[];
}

/** Renders description text with basic formatting: bullets, bold, paragraphs */
const FormattedDescription = ({ text }: { text: string }) => {
  // Split into paragraph blocks by double newlines
  const blocks = text.split(/\n\n+/);

  return (
    <div className="space-y-3">
      {blocks.map((block, blockIdx) => {
        const lines = block.split("\n");

        // Check if this block is a bullet list
        const isList = lines.every(
          (l) => /^[-•*]\s/.test(l.trim()) || l.trim() === ""
        );

        if (isList) {
          const items = lines
            .map((l) => l.trim())
            .filter((l) => l.length > 0)
            .map((l) => l.replace(/^[-•*]\s+/, ""));
          return (
            <ul key={blockIdx} className="list-disc list-inside space-y-1">
              {items.map((item, i) => (
                <li key={i} className="text-sm text-foreground leading-relaxed">
                  <RichInline text={item} />
                </li>
              ))}
            </ul>
          );
        }

        // Regular paragraph (preserve single line breaks)
        return (
          <p key={blockIdx} className="text-sm text-foreground leading-relaxed">
            {lines.map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                <RichInline text={line} />
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
};

/** Renders inline bold (**text**) */
const RichInline = ({ text }: { text: string }) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

export const PromptModal = ({
  open,
  onOpenChange,
  title,
  description,
  coverImageUrl,
  coverImageFit = 'cover',
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
              className={`w-full h-full ${coverImageFit === 'contain' ? 'object-contain bg-muted/50' : 'object-cover'}`}
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
              <FormattedDescription text={description} />
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
